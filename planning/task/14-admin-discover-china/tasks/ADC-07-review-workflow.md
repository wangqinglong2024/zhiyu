# ADC-07 · 实现 DC 审校流转

## PRD 原文引用

- `AD-FR-008`：“工作流：to_review / in_review / approved / rejected / requested_changes。”
- `planning/prds/02-discover-china/02-data-model-api.md` 内容流：“母语审校通过 → status='published' + published_at。”

## 需求落实

- 页面：`/admin/content/review` 的 DC 队列。
- 组件：ReviewQueue、ArticleReviewPanel、SentenceDiffViewer。
- API：review approve/reject/request-changes。
- 数据表：`content_review_workflow`、`content_articles`、content_versions、admin_audit_logs。
- 状态逻辑：submit_review 后进入 to_review；approved 才可发布。
- 多语审校：en/vi/th/id 按 language 生成 review item；必需语种全部 approved 后才允许发布。
- 审校责任：reviewer 不能直接改源，只能提交批注、建议或打回；editor/admin 按建议修改源。

## 不明确 / 风险

- 风险：多语审校是否需每种语言独立通过。
- 处理：v1 支持按 language 建 review item，全部必需语言通过后允许发布。

## 技术假设

- reviewer 不能直接修改源，只能提交批注或修改建议。

## 最终验收清单

- [ ] DC 草稿可提交审校。
- [ ] reviewer 可通过/打回/要求修改。
- [ ] 审校状态影响发布按钮可用性。
- [ ] 审校动作写审计。
- [ ] 4 个目标语种均有通过记录或明确 needs_translation 阻断状态。