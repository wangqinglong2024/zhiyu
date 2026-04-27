# 14 · 后台发现中国单任务索引

## 覆盖裁决

- 本目录覆盖 `AD-FR-006` 中 DC 类目/文章/句子 CRUD，以及通用批量发布、撤回、复制、版本历史、预览。
- 本目录同时承接 `AD-FR-008` 审校工作台中 DC 内容的母语审校流转。
- 所有写操作必须写入 `admin_audit_logs`，并遵守前台 `DC-FR-010` 的未登录前 3 类目访问模型。

| 任务 | 文件 | 覆盖 PRD / 验收 |
|---|---|---|
| ADC-01 | [ADC-01-admin-route-list.md](./ADC-01-admin-route-list.md) | `AD-FR-006` DC 后台路由与列表 |
| ADC-02 | [ADC-02-category-management.md](./ADC-02-category-management.md) | `AD-FR-006` 类目 CRUD、访问模型可见性 |
| ADC-03 | [ADC-03-article-editor.md](./ADC-03-article-editor.md) | `AD-FR-006` 文章编辑、版本草稿 |
| ADC-04 | [ADC-04-sentence-editor.md](./ADC-04-sentence-editor.md) | `AD-FR-006` 句子 CRUD、4 语翻译、音频 |
| ADC-05 | [ADC-05-boundary-redline.md](./ADC-05-boundary-redline.md) | `DC-NFR-005`、内容边界/红线 |
| ADC-06 | [ADC-06-publish-version-preview.md](./ADC-06-publish-version-preview.md) | 批量发布/撤回/复制/版本/预览 |
| ADC-07 | [ADC-07-review-workflow.md](./ADC-07-review-workflow.md) | `AD-FR-008` 审校流转、母语审校 |
| ADC-08 | [ADC-08-seed-import.md](./ADC-08-seed-import.md) | `AD-FR-007` 手动导入、统一 JSON Schema |
| ADC-09 | [ADC-09-access-model-visibility.md](./ADC-09-access-model-visibility.md) | `DC-FR-010` 访问模型可视化 |
| ADC-10 | [ADC-10-end-to-end-validation.md](./ADC-10-end-to-end-validation.md) | `DC-AC-001~014`、前后台闭环验收 |