# 管理端：句子 CRUD

> 路径前缀：`/admin/v1/china`
> 通用 401/403 同 [05-管理端-文章CRUD.md](./05-管理端-文章CRUD.md)。
> **关键约定**：所有"删除/插入/重排"操作完成后由 RPC 自动调用 `fn_resequence_sentences(article_id)`，保证 `seq_no` 连续无空洞，**并清空对应句子的音频缓存**（PM 答 Q8）。

---

## A9 · 句子列表（分页）

**对应需求中的操作**：F2-用户 §一 · 管理端「文章下的句子（句子带分页）」

**方法**：GET
**路径**：`/admin/v1/china/articles/:id/sentences`

**请求参数**：

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | path | uuid | ✅ | 文章 UUID |
| `page` | query | int | ❌ | 默认 1 |
| `page_size` | query | int | ❌ | 默认 20，上限 100 |
| `q` | query | string | ❌ | 模糊搜索：`ILIKE %q%` 匹配 `pinyin` **OR** `content_{zh,en,vi,th,id}` 5 语言（PM 答 F3-Q1）；长度 1–60，空串忽略 |
| `sort` | query | string | ❌ | 默认 `seq_no`（升序）；只允许 `seq_no` / `-seq_no`；越界返 40002 |

**成功响应 200**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "article": {
      "id": "1a2b...",
      "code": "A7K2P9X3M4QR",
      "title_i18n": { "zh":"秦始皇统一六国","en":"..." },
      "status": "published"
    },
    "summary": {
      "total_sentences": 3
    },
    "items": [
      {
        "id": "5b7c...",
        "seq_no": 1,
        "seq_label": "0001",
        "pinyin": "gōng yuán qián 221 nián , qín wáng yíng zhèng wán chéng tǒng yī dà yè .",
        "content": {
          "zh":"...","en":"...","vi":"...","th":"...","id":"..."
        },
        "audio": {
          "status": "ready",
          "url":    "https://storage.zhiyu.app/china-tts/A7K2P9X3M4QR/0001.mp3",
          "duration_ms": 4820,
          "provider": "azure",
          "voice": "zh-CN-XiaoxiaoNeural",
          "generated_at": "2026-04-28T10:00:00+08:00",
          "error": null
        },
        "updated_at": "2026-04-20T10:00:00+08:00",
        "updated_by": { "id":"u-1","display_name":"admin01" }
      }
    ],
    "pagination": { "page":1,"page_size":20,"total":3,"total_pages":1,"has_next":false }
  }
}
```

> `summary.total_sentences`：当前文章句子总数（PM 答 F3-Q3：是句子条数/卡片数，不是字符数）。

---

## A10 · 句子详情

**方法**：GET
**路径**：`/admin/v1/china/sentences/:id`

**成功响应 200**：返回单条句子（结构同 A9 `items[*]`）。

---

## A11 · 新建句子（开头/结尾/中间）

**对应需求中的操作**：F2-用户 §一 · 管理端「在开头、结尾或某个句子中间，添加一个句子」

**方法**：POST
**路径**：`/admin/v1/china/articles/:id/sentences`

**业务校验**：
- 文章必须存在且 `deleted_at IS NULL`。
- 5 语言 `content_*` 全部非空且 ≤ 400；`pinyin` 必填 ≤ 600。
- 插入位置三选一：`position=start` / `position=end`（默认）/ `position=after` 且 `after_seq_no` 必填。

**请求体**：

```json
{
  "position": "after",
  "after_seq_no": 2,
  "pinyin": "...",
  "content": {
    "zh":"...","en":"...","vi":"...","th":"...","id":"..."
  }
}
```

**实现**（事务内）：
1. 调用 `fn_insert_sentence_at(article_id, position, after_seq_no, payload)`：
   - `start` → 插入到当前最小 seq 之前；
   - `end` → 末尾追加；
   - `after` → 在指定 seq 后插入。
2. 立即调用 `fn_resequence_sentences(article_id)` 重排，使 seq_no 连续。
3. 受影响句子（包括新插入的）`audio_status` 全部归零为 `pending`，`audio_url_zh` 清空（音频缓存键随 seq 变化失效，PM 答 Q8）。
4. **进度副作用**（PM 答 F3-Q4/Q12）：
   - `position='end'` → **不清** 进度（末尾追加不影响已读 seq_no）。
   - `position='start' | 'after'` → 调用 `fn_clear_progress_by_article(article_id)` 清空所有用户对该文章的 `learning_progress`（因为已有句子 seq_no 全部位移）。

**成功响应 201**：返回新插入的句子（含分配后的最终 `seq_no`）+ `affected_sentence_ids`（受重排影响的所有句子 id 列表，前端据此刷新音频按钮态）。

```json
{
  "code": 0, "message": "ok",
  "data": {
    "sentence": { "id":"new-...", "seq_no": 3, "...": "..." },
    "affected_sentence_ids": [ "new-...", "old-seq3-id", "old-seq4-id" ]
  }
}
```

**错误场景**：

| HTTP | code | 触发条件 |
|------|------|---------|
| 400 | `CHINA_SENTENCE_PINYIN_LEN` / `CHINA_SENTENCE_CONTENT_*_LEN` | 字段长度违规 |
| 400 | 40001 | `position=after` 时 `after_seq_no` 缺失或不存在 |
| 404 | 40400 | 文章不存在 |
| 409 | `CHINA_SENTENCE_SEQ_OVERFLOW` | 句子总数已 9999 |

---

## A12 · 编辑句子

**方法**：PATCH
**路径**：`/admin/v1/china/sentences/:id`

**业务校验**：
- 字段长度同 A11。
- `seq_no` **不可改**（要改顺序请走 A14）。
- 当 `content_zh` 发生变化时，**清空音频缓存**（`audio_url_zh=null, audio_status='pending'`）；其他语言变化不影响中文 TTS。
- 拼音变化：仅影响展示，不动音频。

**请求体**（任一字段可缺，部分更新）：

```json
{
  "pinyin": "...",
  "content": {
    "zh":"...", "en":"..."
  }
}
```

**成功响应 200**：返回更新后的句子。

**副作用**：
- 若 `content_zh` 改变，且原 `audio_status='ready'`，新音频按钮变为可点击（pending）。
- 触发应用端文章详情缓存失效。

---

## A13 · 删除句子（软删 + 自动重排）

**方法**：DELETE
**路径**：`/admin/v1/china/sentences/:id`

**业务校验**：
- 句子必须存在且 `deleted_at IS NULL`。
- 文章 `published` 状态下删除句子允许，但若删完所有句子，应用端会立即看不到任何句子；建议前端在删除最后一句时弹确认。

**实现**：
1. `UPDATE china_sentences SET deleted_at=now() WHERE id=:id`。
2. 调用 `fn_resequence_sentences(article_id)`，剩余句子 seq_no 从 1 起重排，全部 `audio_status='pending'`、`audio_url_zh=null`（PM 答 Q8）。
3. 调用 `fn_clear_progress_by_article(article_id)` 清空所有用户对该文章的 `learning_progress`（PM 答 F3-Q4/Q12：删除导致重排，进度需重置）。

**成功响应 200**：

```json
{
  "code": 0, "message":"ok",
  "data": {
    "deleted_sentence_id": "5b7c...",
    "affected_sentence_ids": [ "rest-1-id", "rest-2-id" ]
  }
}
```

**错误场景**：

| HTTP | code | 触发条件 |
|------|------|---------|
| 404 | 40400 | 句子不存在或已被删除 |

---

## A14 · 批量重排句子

**方法**：POST
**路径**：`/admin/v1/china/articles/:id/sentences:reorder`

**业务校验**：
- `ordered_ids` 长度 = 该文章 `deleted_at IS NULL` 的句子总数。
- 元素必须是该文章下的句子 id（多/缺/重复均报错）。

**请求体**：

```json
{
  "ordered_ids": [ "id-A", "id-B", "id-C", "id-D" ]
}
```

**实现**：调用 `fn_reorder_sentences(article_id, ordered_ids[])`，按数组顺序重写 `seq_no=1..N`，**所有句子音频缓存清空**（同 A13 副作用）；**并调用 `fn_clear_progress_by_article(article_id)` 清空所有用户对该文章的 `learning_progress`**（PM 答 F3-Q4/Q12）。

**成功响应 200**：

```json
{
  "code": 0, "message":"ok",
  "data": {
    "article_id": "1a2b...",
    "items": [
      { "id":"id-A","seq_no":1 },
      { "id":"id-B","seq_no":2 },
      { "id":"id-C","seq_no":3 },
      { "id":"id-D","seq_no":4 }
    ]
  }
}
```

**错误场景**：

| HTTP | code | 触发条件 |
|------|------|---------|
| 400 | `CHINA_REORDER_IDS_MISMATCH` | 列表与该文章句子集合不匹配 |
| 404 | 40400 | 文章不存在 |
