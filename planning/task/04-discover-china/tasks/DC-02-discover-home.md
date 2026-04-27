# DC-02 · 实现 `/discover` 12 类目首页

## PRD 原文引用

- `DC-FR-001`：“展示 12 类目卡片，每张卡片显示类目名（母语）、封面图、文章总数、最近 3 篇标题。”
- `planning/prds/02-discover-china/03-acceptance-criteria.md`：“12 类目卡片正确渲染。”

## 需求落实

- 页面：`/discover`。
- 组件：DiscoverHomePage、DiscoverCategoryGrid、DiscoverCategoryCard、LoginRequiredBadge。
- API：`GET /api/discover/categories`。
- 数据表：`content_categories`、`content_articles`。
- 状态逻辑：未登录时第 4-12 类目卡片可见但进入受限；登录后全部可进入。
- 卡片字段：母语类目名、封面图、文章总数、已读数（登录态）、最近 3 篇已发布文章标题、匿名开放/需登录状态。
- 缓存口径：类目首页可用本地 nginx/cache header/SW 预取 1h，不允许接外部 CDN。

## 不明确 / 风险

- 风险：卡片“最近 3 篇标题”在文章不足时为空。
- 处理：显示类目描述与“内容准备中”，不伪造文章。

## 技术假设

- 首页不做小说聚合；小说入口通过跨模块卡或独立 `/novels` 处理。

## 最终验收清单

- [ ] 桌面/移动端均显示 12 类目。
- [ ] 母语切换后类目名和描述实时更新。
- [ ] 每张卡片显示文章总数与最近 3 篇标题；登录态额外显示已读数。
- [ ] 未登录点击前 3 类目进入列表，点击第 4-12 类目弹登录引导。
- [ ] 登录后点击任一类目进入列表。
- [ ] 首页响应式、键盘可达，且首屏性能满足 `DC-NFR-001`。