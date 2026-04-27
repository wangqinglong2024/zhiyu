# DC-05 · 建立文章与句子数据模型

## PRD 原文引用

- `planning/prds/02-discover-china/02-data-model-api.md` 定义 `content_articles` 字段：title、summary、cover、hsk_level、word_count、key_points、status、rating 等。
- 同文件定义 `content_sentences` 字段：`zh`、`pinyin`、`pinyin_tones`、`translations`、`audio`、`hsk_level`、`key_point`。

## 需求落实

- 页面：无直接页面，支撑列表、阅读页、后台编辑器。
- 组件：无。
- API：`GET /api/discover/articles/:slug`、后台文章/句子 CRUD。
- 数据表：`content_articles`、`content_sentences`。
- 状态逻辑：文章 status 为 draft/review/published/archived；句子必须 exactly one parent。
- 多语字段：`title_translations`、`summary`、`key_points`、`content_sentences.translations` 固定覆盖 en/vi/th/id，缺失时由 DC-17 的回退规则处理。
- 搜索索引：文章标题/摘要与句子中文必须建立 FTS/trigram 可用索引，供 DC-15 使用。

## 不明确 / 风险

- 风险：`content_sentences` 复用 CR/NV，迁移顺序需避免引用尚未创建的 lesson/chapter 表。
- 处理：按基础平台数据模型统一迁移，或分阶段添加外键。

## 技术假设

- JSONB 插入需按项目 Drizzle gotcha 使用 raw postgres-json 写入，避免 jsonb 被写成字符串。

## 最终验收清单

- [ ] 两张表迁移成功，索引和唯一约束生效。
- [ ] 文章 slug 在类目内唯一。
- [ ] 句子父级约束阻止一条句子同时属于多个模块。
- [ ] JSONB 字段写入后 `jsonb_typeof(...) != 'string'`，避免 translations/key_points 被双重编码。
- [ ] published 文章可被前台 API 查询。