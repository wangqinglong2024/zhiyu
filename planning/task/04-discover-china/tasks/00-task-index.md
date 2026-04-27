# 04 · 发现中国单任务索引

## 覆盖裁决

- 本目录以 `planning/prds/02-discover-china/` 为产品需求源，以 `planning/rules.md` 的 Docker-only、自托管 Supabase、无外部 CDN/SaaS 规则为更高优先级工程约束。
- PRD 中历史写法如“CDN”统一落地为本地 nginx/cache header/Service Worker；不得接外部 CDN。
- 12 类目名称、顺序、匿名开放范围以 `content/china/00-index.md` 为内容源：前 3 类目是中国历史、中国美食、名胜风光。

| 任务 | 文件 | 覆盖 PRD / 验收 |
|---|---|---|
| DC-01 | [DC-01-category-seed.md](./DC-01-category-seed.md) | `DC-FR-001`、`DC-AC-001`、12 类目源数据 |
| DC-02 | [DC-02-discover-home.md](./DC-02-discover-home.md) | `DC-FR-001`、`DC-AC-001`、首页响应式 |
| DC-03 | [DC-03-category-list.md](./DC-03-category-list.md) | `DC-FR-002`、`DC-AC-002` |
| DC-04 | [DC-04-article-reader.md](./DC-04-article-reader.md) | `DC-FR-003`、`DC-AC-003` |
| DC-05 | [DC-05-article-sentence-model.md](./DC-05-article-sentence-model.md) | 数据模型 1.2/1.3、公开 API 2.1 |
| DC-06 | [DC-06-sentence-interactions.md](./DC-06-sentence-interactions.md) | `DC-FR-004`、`DC-AC-003`、`DC-NFR-003` |
| DC-07 | [DC-07-reading-progress.md](./DC-07-reading-progress.md) | `DC-FR-005`、`DC-AC-004` |
| DC-08 | [DC-08-completion-stats.md](./DC-08-completion-stats.md) | `DC-FR-005`、`DC-FR-015`、`DC-AC-004`、`DC-AC-013` |
| DC-09 | [DC-09-favorites.md](./DC-09-favorites.md) | `DC-FR-006`、`DC-AC-005` |
| DC-10 | [DC-10-notes.md](./DC-10-notes.md) | `DC-FR-007`、`DC-AC-005` |
| DC-11 | [DC-11-ratings.md](./DC-11-ratings.md) | `DC-FR-008`、`DC-AC-008` |
| DC-12 | [DC-12-share-card.md](./DC-12-share-card.md) | `DC-FR-009`、`DC-AC-009` |
| DC-13 | [DC-13-anonymous-category-gate.md](./DC-13-anonymous-category-gate.md) | `DC-FR-010`、`DC-AC-006`、`DC-NFR-004` |
| DC-14 | [DC-14-anonymous-risk-events.md](./DC-14-anonymous-risk-events.md) | `DC-FR-010` 状态记录、`DC-NFR-006` |
| DC-15 | [DC-15-search.md](./DC-15-search.md) | `DC-FR-011`、`DC-AC-007`、搜索门禁一致性 |
| DC-16 | [DC-16-related-articles.md](./DC-16-related-articles.md) | `DC-FR-012`、`DC-AC-010` |
| DC-17 | [DC-17-locale-switching.md](./DC-17-locale-switching.md) | `DC-FR-013`、`DC-AC-011` |
| DC-18 | [DC-18-hsk-difficulty.md](./DC-18-hsk-difficulty.md) | `DC-FR-014`、`DC-AC-012` |
| DC-19 | [DC-19-cache-prewarm.md](./DC-19-cache-prewarm.md) | `DC-FR-016`、`DC-AC-014`、缓存门禁一致性 |
| DC-20 | [DC-20-seo.md](./DC-20-seo.md) | `DC-NFR-002`、多语 URL、SEO 门禁一致性 |
| DC-21 | [DC-21-admin-integration.md](./DC-21-admin-integration.md) | `AD-FR-006`、内容流 生产→发布 |
| DC-22 | [DC-22-content-boundaries.md](./DC-22-content-boundaries.md) | `DC-NFR-005`、内容红线 |
| DC-23 | [DC-23-seed-minimum-data.md](./DC-23-seed-minimum-data.md) | `planning/rules.md` §11 dev seed |
| DC-24 | [DC-24-seed-import-schema.md](./DC-24-seed-import-schema.md) | 统一 seed JSON Schema、幂等导入 |
| DC-25 | [DC-25-nfr-security-a11y-observability.md](./DC-25-nfr-security-a11y-observability.md) | `DC-NFR-001/003/004/006` |
| DC-26 | [DC-26-w0-content-launch-gate.md](./DC-26-w0-content-launch-gate.md) | W0 内容验收：600 篇、审校、4 语、TTS |