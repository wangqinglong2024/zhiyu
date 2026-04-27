# DC-13 · 实现未登录前 3 类目访问门禁

## PRD 原文引用

- `DC-FR-010`：“未登录访客仅可进入前 3 个类目：中国历史、中国美食、名胜风光。”
- `content/china/00-index.md`：“未登录访客 | 只能浏览前 3 个类目（中国历史、中国美食、名胜风光）。”
- `content/china/00-index.md`：“登录用户 | 可浏览全部 12 个类目的全部内容（免费）。”

## 需求落实

- 页面：`/discover`、`/discover/:category_slug`、`/discover/:category_slug/:article_slug`。
- 组件：DiscoverAccessGate、RegisterPromptModal。
- API：所有 DC 公开 API 进入前校验 category anonymous visibility。
- 数据表：`content_categories`。
- 状态逻辑：未登录开放前 3 类目；第 4-12 类目列表和文章均拦截；登录后全部放行。
- API 契约：未登录访问第 4-12 类目列表或文章返回 401 + `code=discover_category_login_required`；响应体不得包含正文、句子、音频签名 URL。
- 中央守卫：搜索、相关推荐、SEO、sitemap、缓存预热、分享卡片、后台预览都必须复用同一访问模型判断。

## 不明确 / 风险

- 风险：旧 PRD/任务曾写“DC 前 3 篇”。
- 处理：本任务按内容区规则和用户裁决改为“前 3 类目”，不再实现按篇计数。

## 技术假设

- category seed 增加 `anonymous_visible` 或以 display_order <= 3 推导。

## 最终验收清单

- [ ] 未登录可读历史/美食/名胜文章。
- [ ] 未登录访问传统节日文章返回登录引导。
- [ ] 登录后访问 12 类目任意文章均 200。
- [ ] 不存在“读 3 篇后扣完额度”的逻辑。
- [ ] 直接调用公开 API、刷新缓存 URL、从搜索结果点击受限文章均不能绕过门禁。