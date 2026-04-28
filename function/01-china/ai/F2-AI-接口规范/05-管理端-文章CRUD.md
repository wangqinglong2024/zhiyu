# 管理端：文章 CRUD

> 路径前缀：`/admin/v1/china`
> 权限：所有接口要求 `role = admin`（401/403 不再每个接口重复列出，错误码统一附后）。

---

## A2 · 类目下文章列表（分页）

**对应需求中的操作**：F2-用户 §一 · 管理端「点击某个卡片后，进入类目下的文章（带分页）」

**方法**：GET
**路径**：`/admin/v1/china/categories/:code/articles`

**请求参数**：

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `code` | path | string | ✅ | 类目编码 `01..12` |
| `page` | query | int | ❌ | 默认 1 |
| `page_size` | query | int | ❌ | 默认 20，上限 100 |
| `status` | query | string | ❌ | `draft` / `published` / `all`（默认） |
| `q` | query | string | ❌ | 模糊搜索：`ILIKE %q%` 匹配文章 `code` **OR** `title_pinyin` **OR** `title_i18n.{zh,en,vi,th,id}` 5 语言全部 **OR** 句子 `pinyin/content_{zh,en,vi,th,id}` 5 语言（PM 答 F3-Q1：管理端搜全 5 语言）；长度 1–60，空串忽略 |
| `sort` | query | string | ❌ | 默认 `-updated_at`；白名单 `updated_at`、`created_at`、`published_at`；越界返 40002 |

**成功响应 200**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "category": { "code":"01", "name_i18n": { "zh":"中国历史","en":"..." } },
    "summary": { "total": 42, "draft": 4, "published": 38 },
    "items": [
      {
        "id": "1a2b...",
        "code": "A7K2P9X3M4QR",
        "title_pinyin": "qín shǐ huáng tǒng yī liù guó",
        "title_i18n":   { "zh":"秦始皇统一六国","en":"...","vi":"...","th":"...","id":"..." },
        "status": "published",
        "sentence_count": 3,
        "published_at": "2026-04-20T10:00:00+08:00",
        "updated_at":   "2026-04-20T10:00:00+08:00",
        "updated_by":   { "id":"u-1","display_name":"admin01" }
      }
    ],
    "pagination": { "page":1,"page_size":20,"total":42,"total_pages":3,"has_next":true }
  }
}
```

> `code`（文章 12 位编码）在列表中**直接显示**（PM 答 Q7）。
> `summary.total` 即"当前类目的文章总数"（F2 §一·管理端要求）。

---

## A3 · 文章详情（不含句子）

**方法**：GET
**路径**：`/admin/v1/china/articles/:id`

> 句子单独走 A9 分页，避免大文章一次性返回数千句。

**成功响应 200**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "1a2b...",
    "code": "A7K2P9X3M4QR",
    "category": { "code":"01", "name_i18n": { "zh":"中国历史","en":"..." } },
    "title_pinyin": "qín shǐ huáng tǒng yī liù guó",
    "title_i18n":   { "zh":"秦始皇统一六国","en":"...","vi":"...","th":"...","id":"..." },
    "status": "published",
    "sentence_count": 3,
    "published_at": "2026-04-20T10:00:00+08:00",
    "created_at":   "2026-04-15T08:00:00+08:00",
    "updated_at":   "2026-04-20T10:00:00+08:00",
    "created_by": { "id":"u-1","display_name":"admin01" },
    "updated_by": { "id":"u-1","display_name":"admin01" }
  }
}
```

---

## A4 · 新建文章

**方法**：POST
**路径**：`/admin/v1/china/articles`

**业务校验**：
- `category_id` 必须存在。
- 5 语言 `title_i18n` 全部非空 ≤ 40。
- `code` 由后端 RPC `fn_gen_article_code()` 生成，**不接受前端传入**。
- 新建状态强制 `draft`，前端不传 `status`。

**请求体**：

```json
{
  "category_id":  "0a8b...",
  "title_pinyin": "qín shǐ huáng tǒng yī liù guó",
  "title_i18n":   { "zh":"...","en":"...","vi":"...","th":"...","id":"..." }
}
```

**成功响应 201**：返回与 A3 相同结构（`status='draft'`，`sentence_count=0`）。

**错误场景**（追加）：

| HTTP | code | 触发条件 | 错误信息 |
|------|------|---------|---------|
| 400 | `CHINA_ARTICLE_TITLE_I18N_MISSING` | 5 语言键缺失 | 请补全 5 种语言的文章标题 |
| 400 | `CHINA_ARTICLE_TITLE_TOO_LONG` | 任一语言 > 40 | 文章标题最多 40 字 |
| 404 | `CHINA_ARTICLE_CATEGORY_NOT_FOUND` | 类目不存在 | 类目不存在 |

---

## A5 · 编辑文章基本信息

**方法**：PATCH
**路径**：`/admin/v1/china/articles/:id`

**业务校验**：
- 仅允许更新 `title_pinyin`、`title_i18n`、`category_id`；`code`、`status` 不可改。
- 已发布文章被编辑后**保持 published**（不强制回 draft）；变更通过缓存失效在应用端下次请求生效（PM 在 §三「变更后应用端刷新时生效」）。
- 并发：最后保存为准（详见 [08-并发与冲突处理.md](./08-并发与冲突处理.md)）。

**请求体**（部分字段可缺）：

```json
{
  "title_pinyin": "qín shǐ huáng tǒng yī liù guó",
  "title_i18n":   { "zh":"...","en":"...","vi":"...","th":"...","id":"..." },
  "category_id":  "0a8b..."
}
```

**成功响应 200**：与 A3 相同结构。

---

## A6 · 发布文章

**对应需求中的操作**：F1 §二「点击发布」

**方法**：POST
**路径**：`/admin/v1/china/articles/:id/publish`

**业务校验**（在 `fn_publish_article(p_article_id)` 内）：
1. 文章必须 `status='draft'` 且 `deleted_at IS NULL`。
2. `title_i18n` 5 语言全在且每个 1–40。
3. `sentence_count >= 1`。
4. 每条句子 `pinyin`、`content_zh/en/vi/th/id` 全部非空且 ≤ 400/600。

**请求体**：空。

**成功响应 200**：返回更新后的文章对象（含 `status='published'`、`published_at=now()`）。

**错误场景**：

| HTTP | code | 触发条件 |
|------|------|---------|
| 409 | `CHINA_ARTICLE_STATUS_CONFLICT` | 文章已是 `published` |
| 422 | `CHINA_ARTICLE_PUBLISH_NO_SENTENCES` | 没有句子 |
| 422 | `CHINA_ARTICLE_PUBLISH_INCOMPLETE_TRANSLATION` | 任一句子缺多语言或拼音 |

**副作用**：写审计日志；触发应用端列表缓存按 `category_id` 失效。

---

## A7 · 下架文章

**方法**：POST
**路径**：`/admin/v1/china/articles/:id/unpublish`

**业务校验**：文章必须 `status='published'` 且 `deleted_at IS NULL`，否则 409。

**请求体**：空。

**成功响应 200**：返回更新后的文章对象（`status='draft'`、`published_at=null`）。

**副作用**：
1. 审计日志；
2. 缓存失效；
3. **清空所有用户对该文章的 `learning_progress`**（PM 答 Q5）。

---

## A8 · 删除文章（软删）

**方法**：DELETE
**路径**：`/admin/v1/china/articles/:id`

**业务校验**：文章必须 `deleted_at IS NULL`；不限状态（草稿/已发布都可删）。

**行为**：
- `UPDATE china_articles SET deleted_at=now(), status='draft', published_at=null WHERE id=:id`。
- 若原本 `status='published'`，同 A7 一并清空进度。
- **不支持恢复**（PM 答 Q9）；30 天后由 `cron_china_purge_soft_deleted` 物理删除（CASCADE 清句子）。

**成功响应 204**（无 body）。

**错误场景**：

| HTTP | code | 触发条件 |
|------|------|---------|
| 404 | 40400 | 文章已被删除或不存在 |

---

## 通用错误（管理端所有接口）

| HTTP | code | 触发条件 | 错误信息 |
|------|------|---------|---------|
| 401 | 40100 | 未登录或 token 失效 | 请先登录 |
| 403 | 40300 | 非管理员 | 无权访问后台 |
| 400 | 40001 | 参数 schema 校验失败 | 见 `errors[]` 字段明细 |
| 500 | 50000 | 服务器异常 | 服务器错误，请稍后重试 |
