# ADC-04 · 实现句子级编辑器

## PRD 原文引用

- `planning/ux/11-screens-admin.md`：“句子级编辑：句子 / 拼音 / 翻译（5 种语言）/ 音频。”
- `planning/prds/02-discover-china/02-data-model-api.md` 定义 `content_sentences` 字段。

## 需求落实

- 页面：文章编辑器内句子 tab。
- 组件：SentenceTableEditor、SentenceBulkImport、AudioPreviewButton。
- API：`PATCH /admin/api/content/discover/articles/:id/sentences`。
- 数据表：`content_sentences`、admin_audit_logs。
- 状态逻辑：句子顺序可拖拽；保存时重算 sequence_number。
- 语种：v1 只存 zh 原文 + en/vi/th/id 四种翻译；UX 中“5 种语言”按“中文原文 + 4 语翻译”解释。
- 校验：每句必须有 `zh`、`pinyin`、`translations`；缺 pinyin_tones 或 audio 时标记待补，不阻塞草稿但阻塞 W0 内容上线门槛。

## 不明确 / 风险

- 风险：翻译语种 PRD 写 4 语，UX 写 5 种语言。
- 处理：v1 存 zh 原文 + en/vi/th/id 四种翻译；中文不是 translation 语种。

## 技术假设

- 音频 URL 本期可为 TTS mock 占位。

## 最终验收清单

- [ ] 可新增/删除/排序句子。
- [ ] 每句含 zh、pinyin、pinyin_tones、translations、audio。
- [ ] 缺翻译句子标记 needs_translation。
- [ ] 保存后前台顺序一致。
- [ ] 句子保存、删除、排序、批量导入均写入 `admin_audit_logs`。