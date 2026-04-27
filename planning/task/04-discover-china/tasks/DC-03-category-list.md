# DC-03 · 实现类目列表 `/discover/:category_slug`

## PRD 原文引用

- `DC-FR-002`：“展示该类目所有文章，按发布时间倒序，分页 20/页。”
- `DC-FR-002`：“筛选：HSK 难度（HSK 1 / 2-3 / 4-5 / 6+）、长度（短 / 中 / 长）。”

## 需求落实

- 页面：`/discover/:category_slug`。
- 组件：DiscoverCategoryPage、ArticleList、ArticleFilterBar、Pagination。
- API：`GET /api/discover/categories/:slug/articles?page=&limit=&hsk_level=&length=&sort=`。
- 数据表：`content_categories`、`content_articles`。
- 状态逻辑：未登录访问第 4-12 类目列表返回登录引导；已登录正常分页。
- 排序：默认 `latest`，支持 `popular`；仅返回 `status='published'` 的文章。
- API 门禁：未登录访问第 4-12 类目列表返回 401 + `code=discover_category_login_required`，前端显示注册免费解锁弹层。

## 不明确 / 风险

- 风险：长度标准未给出数值边界。
- 处理：按 DC 内容生产规则设短篇 300-500、中篇 500-1000、长篇 1000-2000。

## 技术假设

- 列表页不返回句子正文，只返回摘要和元信息。

## 最终验收清单

- [ ] 分页默认 20/页，最大 50。
- [ ] HSK 与长度筛选可组合。
- [ ] 最新 / 热门排序生效且只包含已发布文章。
- [ ] 未登录访问开放类目列表正常，受限类目显示登录引导。
- [ ] 空状态显示类目描述与返回入口。