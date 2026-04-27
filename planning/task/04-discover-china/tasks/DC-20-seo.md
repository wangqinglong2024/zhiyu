# DC-20 · 实现 SEO 与多语 URL

## PRD 原文引用

- `planning/prds/02-discover-china/01-functional-requirements.md` SEO 段：“每篇文章独立 URL。”
- 同段：“title / description / og 图 母语。”
- 同段：“JSON-LD（Article schema）。”
- 同段：“4 语种独立 URL（`/vi/discover/...`, `/th/...`, `/id/...`, `/en/...`）。”

## 需求落实

- 页面：DC 文章详情页、类目页。
- 组件：SeoHead、ArticleJsonLd、SitemapGenerator。
- API：`GET /sitemap.xml` 或构建/运行时 sitemap 生成。
- 数据表：`content_articles`、`content_categories`。
- 状态逻辑：只收录 published 且可公开访问的 URL；受限类目也可收录登录落地页但不得泄露正文。
- Meta：每篇已发布文章必须有 4 语 title、description、og 图、canonical、hreflang。
- JSON-LD：开放类目可输出 Article schema；受限类目不得输出 articleBody 或句子正文，只能输出安全 metadata 与登录引导。
- CSR 风险：如果全局前端为 CSR，必须由服务端或预渲染管线输出可抓取 meta/JSON-LD。

## 不明确 / 风险

- 风险：PWA/CSR 不利于 SEO。
- 处理：至少输出可抓取 meta 与 sitemap；SSR/预渲染如全局架构另定则跟随。

## 技术假设

- slug 使用小写 kebab-case，不暴露内部 UUID。

## 最终验收清单

- [ ] 每篇文章有稳定独立 URL。
- [ ] 4 语 meta 正确。
- [ ] JSON-LD Article 校验通过。
- [ ] sitemap 只包含已发布内容。
- [ ] 受限类目的 SEO、sitemap、og、JSON-LD 不泄露正文、句子、音频 URL。
- [ ] `/vi/`、`/th/`、`/id/`、`/en/` hreflang 互链正确。