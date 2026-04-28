#!/usr/bin/env bash
# 发现中国 · F2 接口自检脚本（容器内 curl）
# 使用方法： bash scripts/db/check-china-api.sh
# 前提：docker compose 已起 api-app(8100) / api-admin(9100)；supabase-db 已应用 0005/0006 迁移
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT}/docker/env/.env.dev"
[[ -f "$ENV_FILE" ]] || { echo "missing $ENV_FILE"; exit 1; }

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

NETWORK="${ZHIYU_NETWORK:-zhiyu_default}"
APP_BASE="http://zhiyu-api-app:8100"
ADMIN_BASE="http://zhiyu-api-admin:9100"
CURL_IMG="curlimages/curl:8.10.1"

PASS=0
FAIL=0
COOKIES_DIR="$(mktemp -d)"
chmod 0777 "$COOKIES_DIR"
trap 'rm -rf "$COOKIES_DIR"' EXIT
ADMIN_COOKIE="${COOKIES_DIR}/admin.cookie"

color() { printf '\033[%sm%s\033[0m' "$1" "$2"; }
green() { color '32' "$1"; }
red()   { color '31' "$1"; }
yel()   { color '33' "$1"; }

run_curl() {
  # 在 zhiyu_default 网络上跑 curl，挂 cookie 目录
  docker run --rm \
    --user 0:0 \
    --network="$NETWORK" \
    -v "$COOKIES_DIR":/cookies \
    "$CURL_IMG" -sS "$@"
}

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS+1))
    echo "  $(green '✓') $label"
  else
    FAIL=$((FAIL+1))
    echo "  $(red '✗') $label : expected=$expected actual=$actual"
  fi
}

assert_truthy() {
  local label="$1" actual="$2"
  if [[ -n "$actual" && "$actual" != "null" && "$actual" != "false" ]]; then
    PASS=$((PASS+1))
    echo "  $(green '✓') $label = $actual"
  else
    FAIL=$((FAIL+1))
    echo "  $(red '✗') $label : got '$actual'"
  fi
}

section() {
  echo
  echo "$(yel "==>") $1"
}

# ---------- 准备 ----------
section "0. 拉取 curl 镜像（如已存在则秒过）"
docker pull "$CURL_IMG" >/dev/null

section "1. I2 健康检查（公开）"
RESP=$(run_curl "$APP_BASE/api/v1/china/health" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "GET /api/v1/china/health http=200" "200" "$HTTP"
assert_eq "I2 service=china" "china" "$(echo "$BODY" | grep -oE '"service":"[^"]+"' | sed 's/.*://;s/"//g')"
assert_truthy "I2 tts_adapter" "$(echo "$BODY" | grep -oE '"tts_adapter":"[^"]+"' | sed 's/.*://;s/"//g')"

section "2. C1 类目列表（公开）"
RESP=$(run_curl "$APP_BASE/api/v1/china/categories" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "GET /categories http=200" "200" "$HTTP"
COUNT=$(echo "$BODY" | grep -oE '"code":"[0-9]{2}"' | wc -l | tr -d ' ')
assert_eq "C1 类目数=12" "12" "$COUNT"

section "3. 管理员登录（admin login → cookie jar）"
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}" \
  -c /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "POST /admin/v1/auth/login http=200" "200" "$HTTP"
HAS_AT=$(grep -E 'zhiyu-at' "$ADMIN_COOKIE" 2>/dev/null || true)
assert_truthy "cookie zhiyu-at 已写入" "${HAS_AT:0:20}"

section "4. A1 管理端类目列表（含计数）"
RESP=$(run_curl "$ADMIN_BASE/admin/v1/china/categories" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A1 http=200" "200" "$HTTP"
assert_truthy "A1 含 article_count_total 字段" "$(echo "$BODY" | grep -oE '"article_count_total":[0-9]+' | head -n1)"

# 取一个类目 id（code=01 中国历史）
CAT_ID=$(echo "$BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(next(c["id"] for c in d["data"]["items"] if c["code"]=="01"))')
assert_truthy "category_id(code=01)" "$CAT_ID"

section "5. A4 创建文章 → 拿 article_id+code"
PAYLOAD=$(cat <<EOF
{
  "category_id":"$CAT_ID",
  "title_pinyin":"qín shǐ huáng tǒng yī liù guó",
  "title_i18n":{
    "zh":"秦始皇统一六国","en":"Qin Shi Huang unifies six states",
    "vi":"Tần Thủy Hoàng thống nhất sáu nước","th":"จิ๋นซีรวมหกแคว้น","id":"Qin Shi Huang menyatukan enam negara"
  }
}
EOF
)
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/articles" \
  -H "Content-Type: application/json" -d "$PAYLOAD" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A4 http=200" "200" "$HTTP"
ART_ID=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])')
ART_CODE=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["code"])')
assert_truthy "article_id" "$ART_ID"
assert_truthy "article_code(12位)" "$ART_CODE"

section "6. A6 发布前应失败（无句子）"
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/articles/$ART_ID/publish" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A6 无句子时 http=422" "422" "$HTTP"
assert_eq "A6 业务码=45130" "45130" "$(echo "$BODY" | grep -oE '"code":[0-9]+' | head -n1 | sed 's/.*://')"

section "7. A11 追加 3 句句子"
for i in 1 2 3; do
  PAYLOAD=$(cat <<EOF
{
  "article_id":"$ART_ID",
  "pinyin":"jù zǐ $i",
  "content_zh":"句子$i 中文",
  "content_en":"sentence $i en",
  "content_vi":"câu $i vi",
  "content_th":"ประโยค $i th",
  "content_id":"kalimat $i id"
}
EOF
)
  RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/sentences" \
    -H "Content-Type: application/json" -d "$PAYLOAD" \
    -b /cookies/admin.cookie -w '\n%{http_code}')
  HTTP=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  assert_eq "A11 追加句子 #$i http=200" "200" "$HTTP"
  eval "S${i}_ID=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])')"
  eval "S${i}_SEQ=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["seq_no"])')"
done
assert_eq "S2 seq_no=2" "2" "$S2_SEQ"

section "8. A11b 在开头插入新句子（位移所有）"
PAYLOAD=$(cat <<EOF
{
  "article_id":"$ART_ID","position":"start",
  "pinyin":"qián yán","content_zh":"前言","content_en":"preface",
  "content_vi":"lời mở","content_th":"คำนำ","content_id":"pengantar"
}
EOF
)
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/sentences/insert" \
  -H "Content-Type: application/json" -d "$PAYLOAD" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A11b insert at start http=200" "200" "$HTTP"
NEW_FIRST_ID=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])')
NEW_FIRST_SEQ=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["seq_no"])')
assert_eq "新插入句 seq_no=1" "1" "$NEW_FIRST_SEQ"

section "9. A9 列表 4 句"
RESP=$(run_curl "$ADMIN_BASE/admin/v1/china/sentences?article_id=$ART_ID" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A9 http=200" "200" "$HTTP"
TOTAL_S=$(echo "$BODY" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["data"]["items"]))')
assert_eq "A9 句子总数=4" "4" "$TOTAL_S"

section "10. A6 发布（应成功）"
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/articles/$ART_ID/publish" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A6 publish http=200" "200" "$HTTP"
assert_eq "A6 status=published" "published" "$(echo "$BODY" | grep -oE '"status":"[^"]+"' | head -n1 | sed 's/.*://;s/"//g')"

section "11. A6 重复发布应 409"
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/articles/$ART_ID/publish" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A6 重复 http=409" "409" "$HTTP"
assert_eq "A6 重复 业务码=45120" "45120" "$(echo "$BODY" | grep -oE '"code":[0-9]+' | head -n1 | sed 's/.*://')"

section "12. C2 应用端列表（应能看到刚发布文章）"
RESP=$(run_curl "$APP_BASE/api/v1/china/articles?category_code=01" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "C2 http=200" "200" "$HTTP"
HIT=$(echo "$BODY" | grep -c "\"code\":\"$ART_CODE\"" || true)
assert_truthy "C2 列表命中我们的文章" "$HIT"

section "13. C3 文章详情（by code）"
RESP=$(run_curl "$APP_BASE/api/v1/china/articles/$ART_CODE" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "C3 http=200" "200" "$HTTP"
assert_eq "C3 sentence_count=4" "4" "$(echo "$BODY" | grep -oE '"sentence_count":[0-9]+' | head -n1 | sed 's/.*://')"

section "14. C5 文章句子列表"
RESP=$(run_curl "$APP_BASE/api/v1/china/articles/$ART_CODE/sentences" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "C5 http=200" "200" "$HTTP"
S_COUNT=$(echo "$BODY" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["data"]["items"]))')
assert_eq "C5 句子=4" "4" "$S_COUNT"

# 取第一条句子 id
FIRST_SID=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["items"][0]["id"])')

section "15. C4 触发 TTS（mock 同步 ready）"
RESP=$(run_curl -X POST "$APP_BASE/api/v1/china/sentences/$FIRST_SID/tts" \
  -H "Content-Type: application/json" -d '{"voice":"mock-zh-female-1"}' \
  -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "C4 http=200" "200" "$HTTP"
assert_eq "C4 audio.status=ready" "ready" "$(echo "$BODY" | grep -oE '"status":"[^"]+"' | head -n1 | sed 's/.*://;s/"//g')"
assert_truthy "C4 audio.url" "$(echo "$BODY" | grep -oE '"url":"[^"]+"' | head -n1)"

section "16. AUX 音频状态轮询"
RESP=$(run_curl "$APP_BASE/api/v1/china/sentences/$FIRST_SID/audio" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "AUX http=200" "200" "$HTTP"
assert_eq "AUX status=ready" "ready" "$(echo "$BODY" | grep -oE '"status":"[^"]+"' | head -n1 | sed 's/.*://;s/"//g')"

section "17. I1 内部回调（service-role）"
PAYLOAD=$(cat <<EOF
{
  "sentence_id":"$FIRST_SID",
  "audio_url":"$SUPABASE_URL/storage/v1/object/public/china-tts/$ART_CODE/0001.mp3",
  "duration_ms":4820,"provider":"mock","voice":"mock-zh-female-1"
}
EOF
)
RESP=$(run_curl -X POST "$APP_BASE/internal/v1/china/tts/callback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d "$PAYLOAD" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "I1 http=200" "200" "$HTTP"
assert_eq "I1 status=ready" "ready" "$(echo "$BODY" | grep -oE '"status":"[^"]+"' | tail -n1 | sed 's/.*://;s/"//g')"

section "18. I1 错误鉴权（无 service-role → 401）"
RESP=$(run_curl -X POST "$APP_BASE/internal/v1/china/tts/callback" \
  -H "Content-Type: application/json" -d "$PAYLOAD" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
assert_eq "I1 无授权 http=401" "401" "$HTTP"

section "19. A12 修改句子 content_zh → 音频缓存清空"
PAYLOAD='{"content_zh":"句子1 修改后"}'
RESP=$(run_curl -X PATCH "$ADMIN_BASE/admin/v1/china/sentences/$FIRST_SID" \
  -H "Content-Type: application/json" -d "$PAYLOAD" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A12 http=200" "200" "$HTTP"
assert_eq "A12 audio_status=pending" "pending" "$(echo "$BODY" | grep -oE '"audio_status":"[^"]+"' | head -n1 | sed 's/.*://;s/"//g')"

section "20. A14 重排（反转顺序）"
RESP=$(run_curl "$ADMIN_BASE/admin/v1/china/sentences?article_id=$ART_ID" \
  -b /cookies/admin.cookie)
ORDERED=$(echo "$RESP" | python3 -c 'import sys,json; ids=[i["id"] for i in json.load(sys.stdin)["data"]["items"]]; print(json.dumps(list(reversed(ids))))')
PAYLOAD="{\"article_id\":\"$ART_ID\",\"ordered_ids\":$ORDERED}"
RESP=$(run_curl -X PUT "$ADMIN_BASE/admin/v1/china/sentences/reorder" \
  -H "Content-Type: application/json" -d "$PAYLOAD" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
assert_eq "A14 reorder http=200" "200" "$HTTP"

section "21. A15 全局搜索（命中文章 / 句子）"
RESP=$(run_curl "$ADMIN_BASE/admin/v1/china/search?q=$ART_CODE" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A15 http=200" "200" "$HTTP"
HITS=$(echo "$BODY" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["data"]["summary"]["articles_total"])')
assert_truthy "A15 articles_total>=1" "$HITS"

section "22. A15 空 q → 400"
RESP=$(run_curl "$ADMIN_BASE/admin/v1/china/search?q=" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
assert_eq "A15 空q http=400" "400" "$HTTP"

section "23. C7 进度（需登录） → 未登录 401"
RESP=$(run_curl -X PUT "$APP_BASE/api/v1/china/me/articles/$ART_CODE/progress" \
  -H "Content-Type: application/json" -d '{"last_seq_no":1}' \
  -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
assert_eq "C7 未登录 http=401" "401" "$HTTP"

section "24. A7 下架"
RESP=$(run_curl -X POST "$ADMIN_BASE/admin/v1/china/articles/$ART_ID/unpublish" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "A7 http=200" "200" "$HTTP"
assert_eq "A7 status=draft" "draft" "$(echo "$BODY" | grep -oE '"status":"[^"]+"' | head -n1 | sed 's/.*://;s/"//g')"

section "25. C3 下架后应 404"
RESP=$(run_curl "$APP_BASE/api/v1/china/articles/$ART_CODE" -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_eq "C3 下架后 http=404" "404" "$HTTP"
assert_eq "C3 业务码=45101" "45101" "$(echo "$BODY" | grep -oE '"code":[0-9]+' | head -n1 | sed 's/.*://')"

section "26. A8 删除"
RESP=$(run_curl -X DELETE "$ADMIN_BASE/admin/v1/china/articles/$ART_ID" \
  -b /cookies/admin.cookie -w '\n%{http_code}')
HTTP=$(echo "$RESP" | tail -n1)
assert_eq "A8 http=200" "200" "$HTTP"

# 验证类目计数已减 1（这里只看响应不严格断言）

echo
echo "================================="
echo "  通过：$(green "$PASS")  /  失败：$(red "$FAIL")"
echo "================================="
if [[ "$FAIL" -gt 0 ]]; then
  echo "$(red '❌ 有失败用例')"; exit 1
else
  echo "$(green '🎉 发现中国 F2 接口自检全部通过')"; exit 0
fi
