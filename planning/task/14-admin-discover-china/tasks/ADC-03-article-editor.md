# ADC-03 · 实现 DC 文章编辑器

## PRD 原文引用

- `planning/ux/11-screens-admin.md`：“双栏：左侧编辑（Markdown / WYSIWYG），右侧预览。”
- 同段：“字段：标题 / 类目 / HSK / 摘要 / 封面 / 标签。”

## 需求落实

- 页面：`/admin/content/articles/:id/edit`。
- 组件：ArticleEditorForm、ArticlePreviewPane、AutosaveIndicator。
- API：`POST/PATCH /admin/api/content/discover/articles`。
- 数据表：`content_articles`、content_versions、admin_audit_logs。
- 状态逻辑：自动保存 draft；发布必须走校验/审校。
- 字段：标题 zh + en/vi/th/id、摘要 en/vi/th/id、类目、HSK、封面、标签、key_points、status、published_at。
- 预览：右侧预览只能使用后台鉴权上下文，不生成匿名可访问未发布 URL。

## 不明确 / 风险

- 风险：Markdown/WYSIWYG 双模式容易产生结构不一致。
- 处理：最终存储以结构化字段 + 句子列表为准，正文展示由句子生成。

## 技术假设

- key_points 使用 JSONB，写入时避免双重编码。

## 最终验收清单

- [ ] 可编辑标题、摘要、封面、标签、HSK、类目。
- [ ] 自动保存每 30s。
- [ ] 右侧预览接近前台阅读页。
- [ ] 保存/发布写审计。
- [ ] JSONB 字段保存后仍为 object/array，不被写成字符串。