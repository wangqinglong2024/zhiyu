# ADC-01 · 建立 DC 后台路由与列表

## PRD 原文引用

- `AD-FR-006`：“DC：类目 + 文章 + 句子 CRUD。”
- `planning/ux/11-screens-admin.md`：“内容管理 - 文章 `/admin/content/articles`。”

## 需求落实

- 页面：`/admin/content/articles`。
- 组件：AdminDiscoverArticleTable、ArticleStatusBadge、ContentFilterBar。
- API：`GET /admin/api/content/discover/articles`。
- 数据表：`content_articles`、`content_categories`、`admin_audit_logs`。
- 状态逻辑：支持 draft/review/published/archived；editor/admin 可写，viewer 只读。
- 权限：reviewer 可进入审校入口但不能从列表直接修改源内容；viewer 不显示写操作按钮。
- 筛选：类目、状态、HSK、作者、更新时间、审校状态、匿名开放状态。

## 不明确 / 风险

- 风险：路径叫 articles，可能误以为只服务 DC。
- 处理：后台面包屑显示“内容管理 > 发现中国 > 文章”。

## 技术假设

- DC 文章列表筛选包含类目、状态、难度、作者、日期。

## 最终验收清单

- [ ] 列表分页、搜索、筛选可用。
- [ ] editor/admin 可进入编辑，viewer 只读。
- [ ] reviewer 只能进入审校流转，不能编辑源内容。
- [ ] 列表展示类目、状态、HSK、作者、更新时间。
- [ ] API P95 < 500ms。