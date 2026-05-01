# 管理端：KP 与题目 CRUD

> 内容生产侧的 KP / Question 管理。所有写操作需 `content_admin+`，单题重生需 `ai_operator+`。

---

## A5 · KP 列表

**方法**：GET
**路径**：`/admin/v1/course/kps`
**权限**：`readonly+`

**请求参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `track` | enum | 5 主题 |
| `stage_id` / `chapter_id` / `lesson_id` | uuid | 联动筛选 |
| `kp_type` | enum | 7 类 |
| `status` | enum | 内容审核状态 |
| `is_published` | bool | — |
| `created_by_ai` | bool | true=AI 生成；false=人工新建 |
| `q` | string | 模糊匹配 `title_zh / kp_code` |
| `page` / `page_size` | int | — |
| `sort` | enum | 白名单 `created_at/updated_at/kp_code` |

**响应 200**：

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "kp_id": "<uuid>",
        "kp_code": "kp_ec_word_000123",
        "kp_type": "word",
        "track": "ec",
        "title_zh": "你好",
        "translation_summary_i18n": { "vi":"xin chào","en":"hello", ... },
        "status": "approved",
        "is_published": true,
        "linked_lessons_count": 2,
        "questions_count": 8,
        "created_at": "...",
        "ai_job_id": "<uuid|null>"
      }
    ],
    "pagination": { "page":1, "page_size":20, "total":520 }
  }
}
```

---

## A6 · KP 详情

**方法**：GET
**路径**：`/admin/v1/course/kps/:id`
**权限**：`readonly+`

**响应 200**：完整 `content` jsonb + `media` + 关联 `linked_lessons` 列表 + `version` 历史（最近 5 条）+ 关联 `questions` 简表。

---

## A7 · 新建 KP（人工）

**方法**：POST
**路径**：`/admin/v1/course/kps`
**权限**：`content_admin+`

**请求体**：

```json
{
  "kp_type": "word",
  "track": "ec",
  "title_zh": "你好",
  "content": {
    "word_zh": "你好",
    "pinyin": "nǐ hǎo",
    "pos": "感叹词",
    "translation_i18n": { "vi":"xin chào","th":"...","id":"...","en":"hello" },
    "examples": [...]
  }
}
```

**业务校验**：
- `content` 必须匹配 `kp_type` schema（[F1-09 §5](../F1-AI-数据模型规范/09-校验规则汇总.md)）
- 自动生成 `kp_code`（[F1-10 §2](../F1-AI-数据模型规范/10-编号生成规则.md)）
- `status='draft'`

**响应 201**：返回新建对象。

---

## A8 · 编辑 KP

**方法**：PATCH
**路径**：`/admin/v1/course/kps/:id`
**权限**：`content_admin+`

**业务校验**：
- 仅当 `status ∈ {draft, rejected}` 直接更新原行；
- 当 `status ∈ {reviewing, approved}` 且字段属"内容字段"（`content / title_zh / media`）时，**派生新版本**：原行不动，复制为新行 + `version+=1`，旧行 `status='archived'`，新行 `status='draft'`，由审核流再走一遍
- 结构性字段（`is_published / kp_type`）直接拒绝（`409 COURSE_FIELD_IMMUTABLE`）

**请求体**：仅传变更字段。

**响应 200**：

```json
{ "code": 0, "data": { "kp_id":"<uuid>", "version": 3, "branched_from": "<old_id|null>" } }
```

**编辑冲突**：详见 [10-并发与冲突处理.md](./10-并发与冲突处理.md)；本接口要求 header `If-Match: <updated_at>`，不一致返 `409 COURSE_STALE_VERSION`。

---

## A9 · 软删 KP

**方法**：DELETE
**路径**：`/admin/v1/course/kps/:id`
**权限**：`content_admin+`

**业务校验**：仍被任何 lesson 引用 → `409 COURSE_KP_STILL_REFERENCED`（前端先解绑）

**响应 200**：`{ "code":0, "data": { "soft_deleted": true } }`

---

## A10 · 题目列表

**方法**：GET
**路径**：`/admin/v1/course/questions`
**权限**：`readonly+`

**请求参数**（同 A5 风格）：`kp_id / track / q_type / status / is_published / created_by_ai / q (模糊 q_code+stem_zh) / page / sort`。

**响应 200**：与 A5 类似，含 `q_code / q_type / kp_id / kp_title_zh / status / wrong_rate（最近 30 天，便于发现"问题题"）`。

---

## A11 · 题目详情

**方法**：GET
**路径**：`/admin/v1/course/questions/:id`

**响应 200**：完整 `payload` jsonb + `correct_answer` + `explanation_i18n` + `media` + 关联 KP 摘要 + `version` 历史 + 最近 7 天作答统计 (`accuracy / count`)。

---

## A12 · 编辑题目

**方法**：PATCH
**路径**：`/admin/v1/course/questions/:id`
**权限**：`content_admin+`

**业务校验**：
- `payload` 必须匹配 `q_type` schema
- 派生版本逻辑同 A8
- `correct_answer` 修改时，前端必须二次确认（影响历史正确率统计）

---

## A13 · 单题重生

**方法**：POST
**路径**：`/admin/v1/course/questions/:id:regen`
**权限**：`ai_operator+`

**请求体**：

```json
{
  "prompt_id": "<uuid|null>",      // null=用 scope 当前 active
  "model": "gpt-5-pro",            // 可选，覆盖默认
  "extra_instructions": "请使用更口语化的表达"
}
```

**副作用**：
- 创建一个 `course_ai_generation_jobs` 行（`job_type='regen_single'`，`idempotency_key=q_<id>_<rand>`）
- 该 job 运行完后**派生新版本** Question：原行 `archived`，新行 `draft`
- 原 KP 引用自动指向新版本

**响应 202**：

```json
{ "code": 0, "data": { "job_id": "<uuid>", "status": "queued" } }
```

前端轮询 [A18 AI Job 详情](./06-管理端-AI工作台.md) 取结果。

---

## A14 · 软删题目

**方法**：DELETE
**路径**：`/admin/v1/course/questions/:id`
**权限**：`content_admin+`

**业务校验**：题被流水（course_user_answers）引用即可软删；物理清理由 cron 在 30 天后处理。

---

## 共通错误

| HTTP | code | 触发 |
|------|------|------|
| 400 | `COURSE_KP_CONTENT_SCHEMA_MISMATCH` | content 不匹配 kp_type |
| 400 | `COURSE_PAYLOAD_SCHEMA_MISMATCH` | payload 不匹配 q_type |
| 401 | 40101 | 未登录 |
| 403 | `COURSE_ADMIN_ONLY` | 角色不足 |
| 404 | 40400 | 实体不存在 |
| 409 | `COURSE_STALE_VERSION` | 编辑冲突（最后保存为准 + 提示） |
| 409 | `COURSE_KP_STILL_REFERENCED` | KP 仍被节绑定 |
| 409 | `COURSE_FIELD_IMMUTABLE` | 不可改字段 |
