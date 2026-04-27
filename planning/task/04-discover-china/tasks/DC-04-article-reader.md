# DC-04 · 实现文章详情句子级阅读页

## PRD 原文引用

- `DC-FR-003`：“`/discover/:category_slug/:article_slug` 句子级展示。”
- `DC-FR-003`：“句子列表（中文 + 拼音 + 母语 + 音频按钮）。”
- `DC-FR-003`：“末尾 CTA（\"想系统学？试试 [系统课程]\"）。”

## 需求落实

- 页面：`/discover/:category_slug/:article_slug`。
- 组件：ArticleReaderPage、SentenceReader、KeyPointPanel、ModuleCtaCard。
- API：`GET /api/discover/articles/:slug`。
- 数据表：`content_articles`、`content_sentences`。
- 状态逻辑：权限由文章所属类目决定；阅读页隐藏 TabBar，保留沉浸 Header。
- 路由解析：页面必须使用 `category_slug + article_slug` 定位文章，避免 `content_articles` 仅类目内唯一 slug 时误读。
- 元信息：类目、HSK 难度、字数、阅读时长、收藏数、评分均按 PRD 显示。
- 内容：句子级中文、拼音、母语翻译、音频按钮、文末 3-5 条关键点与跨模块 CTA 完整显示。

## 不明确 / 风险

- 风险：内容目录要求跨模块入口，但 PRD 只写课程 CTA。
- 处理：文末 CTA 支持课程、游戏、小说、相关类目四种卡片，按文章 tags 配置。

## 技术假设

- 句子组件复用于 NV 章节页，但 DC 先提供基础能力。

## 最终验收清单

- [ ] 标题（中/母语）、元信息、封面、句子、关键点、CTA 完整显示。
- [ ] 句子顺序稳定，缺音频时显示文字模式。
- [ ] 第 4-12 类目文章未登录不可读，登录可读。
- [ ] 未登录受限文章 API 返回 401 + `code=discover_category_login_required`，不得返回句子正文或音频 URL。
- [ ] 文末跨模块入口不少于 1 个。