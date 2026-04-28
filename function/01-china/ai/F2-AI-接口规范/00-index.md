# F2-AI：接口规范 · 索引

> **功能**：发现中国（Discover China）
> **来源**：[../../prd/F2-用户-操作与业务逻辑.md](../../prd/F2-用户-操作与业务逻辑.md)（PM 在主对话中以正文形式提供）+ [../F1-AI-数据模型规范/](../F1-AI-数据模型规范/)
> **遵循规范**：[../../../../grules/G1-架构与技术规范/04-API接口规范.md](../../../../grules/G1-架构与技术规范/04-API接口规范.md)
> **基础路径**：C 端 `/api/v1`、管理端 `/admin/v1`
> **拆分原则**：按"应用端 / 管理端 / 横切"分组，每文件 ≤ 1200 行。

---

## 子文件导航

| # | 文件 | 内容 |
|---|------|------|
| 总览 | [00-index.md](./00-index.md) | 全部接口一览表（本文件） |
| 应用端 | [01-应用端-类目与文章浏览.md](./01-应用端-类目与文章浏览.md) | 12 类目卡片、文章列表、文章详情（句子） |
| 应用端 | [02-应用端-TTS与朗读.md](./02-应用端-TTS与朗读.md) | 句子 TTS 触发与缓存命中、全文朗读编排 |
| 应用端 | [03-应用端-学习进度.md](./03-应用端-学习进度.md) | 用户阅读进度上报与读取（跨域字段约定） |
| 管理端 | [04-管理端-类目.md](./04-管理端-类目.md) | 12 类目只读列表（卡片） |
| 管理端 | [05-管理端-文章CRUD.md](./05-管理端-文章CRUD.md) | 文章列表/详情/新增/编辑/发布/下架/删除 |
| 管理端 | [06-管理端-句子CRUD.md](./06-管理端-句子CRUD.md) | 句子列表/新增（开头/结尾/中间）/编辑/删除/重排 |
| 横切 | [07-AI补充接口.md](./07-AI补充接口.md) | TTS 上游 Mock、音频确认回调、内部健康检查 |
| 横切 | [08-并发与冲突处理.md](./08-并发与冲突处理.md) | 多管理员同时编辑：以最后保存为准 + 提示 |
| 横切 | [09-错误码登记.md](./09-错误码登记.md) | 本功能新增的 `CHINA_*` 错误码集中登记 |
| — | [10-待确认问题清单.md](./10-待确认问题清单.md) | F2 + F3 反向补丁封板清单 |
| 管理端 | [11-管理端-全局搜索.md](./11-管理端-全局搜索.md) | A15 全局搜索（文章 + 句子聚合，PM 答 F3-Q2） |

---

## 全部接口一览

### 应用端（C 端，`/api/v1`）

| # | 名称 | 方法 | 路径 | 权限 | 对应需求 |
|---|------|------|------|------|---------|
| C1 | 列出 12 类目 | GET | `/api/v1/china/categories` | 公开 | F2 §一·应用端「12 个类目卡片」 |
| C2 | 列出某类目下已发布文章 | GET | `/api/v1/china/categories/:code/articles` | 分级公开¹ | F2 §一·应用端「类目下文章列表」 |
| C3 | 文章详情（含全部已发布句子） | GET | `/api/v1/china/articles/:code` | 分级公开¹ | F2 §一·应用端「逐句查看文章」 |
| C4 | 触发/获取句子 TTS（首次生成或命中缓存） | POST | `/api/v1/china/sentences/:id/audio` | 公开 | F2 §一·应用端「朗读」 |
| C5 | 全文朗读清单 | GET | `/api/v1/china/articles/:code/audio-playlist` | 分级公开¹ | F2 §一·应用端「全文朗读」 |
| C6 | 上报阅读进度 | PUT | `/api/v1/china/articles/:code/progress` | 登录用户 | F2 §一·应用端「逐句查看 + 进度」 |
| C7 | 读取阅读进度 | GET | `/api/v1/china/articles/:code/progress` | 登录用户 | 同上 |

> ¹ 分级公开（PM 答 F2-Q11）：类目 `01..03` 完全公开；`04..12` 必须登录，未登录返回 401 并带 `redirect_to=/login`。

### 管理端（`/admin/v1`）

| # | 名称 | 方法 | 路径 | 权限 | 对应需求 |
|---|------|------|------|------|---------|
| A1 | 列出 12 类目（卡片） | GET | `/admin/v1/china/categories` | 管理员 | F2 §一·管理端「12 类目卡片」 |
| A2 | 类目下文章列表（分页） | GET | `/admin/v1/china/categories/:code/articles` | 管理员 | F2 §一·管理端「文章带分页」 |
| A3 | 文章详情（不含句子） | GET | `/admin/v1/china/articles/:id` | 管理员 | 编辑页顶部基本信息 |
| A4 | 新建文章 | POST | `/admin/v1/china/articles` | 管理员 | 文章新增 |
| A5 | 编辑文章基本信息 | PATCH | `/admin/v1/china/articles/:id` | 管理员 | 文章编辑 |
| A6 | 发布文章 | POST | `/admin/v1/china/articles/:id/publish` | 管理员 | F1 §二「点击发布」 |
| A7 | 下架文章 | POST | `/admin/v1/china/articles/:id/unpublish` | 管理员 | F1 §二「点击下架」 |
| A8 | 删除文章（软删） | DELETE | `/admin/v1/china/articles/:id` | 管理员 | 文章删除 |
| A9 | 句子列表（分页） | GET | `/admin/v1/china/articles/:id/sentences` | 管理员 | F2 §一·管理端「句子带分页」 |
| A10 | 句子详情 | GET | `/admin/v1/china/sentences/:id` | 管理员 | 编辑面板 |
| A11 | 新建句子（开头/结尾/中间） | POST | `/admin/v1/china/articles/:id/sentences` | 管理员 | F2 §一·管理端「添加句子」 |
| A12 | 编辑句子（5 语言 + 拼音） | PATCH | `/admin/v1/china/sentences/:id` | 管理员 | 句子编辑 |
| A13 | 删除句子（软删 + 自动重排） | DELETE | `/admin/v1/china/sentences/:id` | 管理员 | F1 答 Q8 |
| A14 | 批量重排句子 | POST | `/admin/v1/china/articles/:id/sentences:reorder` | 管理员 | F1 答 Q8 |
| A15 | 全局搜索（文章 + 句子聚合） | GET | `/admin/v1/china/search` | 管理员 | PM 答 F3-Q2 |

### 横切（内部 / 集成）

| # | 名称 | 方法 | 路径 | 权限 | 用途 |
|---|------|------|------|------|------|
| I1 | TTS Mock 内部回调 | POST | `/internal/v1/china/tts/callback` | service-role | 见 [07-AI补充接口.md](./07-AI补充接口.md) |
| I2 | 健康检查 | GET | `/api/v1/china/health` | 公开 | 标准 200 |

---

## 全局约定（本功能内）

- `code` 字段：路径中的 `:code` 指 **业务编码**（类目 `01..12`、文章 12 位）；`:id` 指 UUID。优先用 `code` 暴露给 C 端（更短更稳）。
- 多语言文案：响应中 `name_i18n / description_i18n / title_i18n` 一律下发**完整 5 语言对象**；前端按 `Accept-Language` 自行取键。
- 时间字段：`*_at` 全部 ISO-8601 带时区。
- 列表统一返回结构遵循 [G1 §3.2](../../../../grules/G1-架构与技术规范/04-API接口规范.md)；分页 `page` / `page_size`。
- 写接口（管理端）一律 `Authorization: Bearer <admin token>`，由 `apps/api-admin` 上的中间件校验角色 = `admin`。
- 编辑冲突策略：**最后保存为准**（PM 答 F2 §四），详见 [08-并发与冲突处理.md](./08-并发与冲突处理.md)。
- **统一响应封装**（G1-04 §3.1/3.2）：所有响应（含错误）均由 Hono 中间件在最外层注入 `request_id`（UUID v4，从入站 `X-Request-Id` 或 gateway 生成）+ `server_time`（ISO-8601 +08:00）。本文件示例为简洁起见省略这两项，**实现时由统一中间件保证存在**。
- **排序白名单越界**（G1-04 §3.4）：所有 `sort` 字段非白名单值统一返 `40002 SORT_FIELD_NOT_ALLOWED`，前端不展示具体字段，提示「排序方式不支持」。
- **限流**（G1-04 §六）：默认 IP 60/分、用户 120/分；本域 C4 单独 IP 20/分（缓存命中不计入），A15 单独用户 30/分（避免拖库）。
