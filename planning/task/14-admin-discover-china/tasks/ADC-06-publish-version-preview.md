# ADC-06 · 实现发布、撤回、复制、版本与预览

## PRD 原文引用

- `AD-FR-006`：“通用功能：批量发布 / 撤回 / 复制 / 版本历史 / 预览。”
- `planning/ux/11-screens-admin.md`：“操作：保存草稿 / 提交审校 / 发布 / 删除 / 复制 / 历史版本。”

## 需求落实

- 页面：文章列表、文章编辑器。
- 组件：BulkActionToolbar、VersionHistoryDrawer、PreviewPane。
- API：publish/unpublish/duplicate/version endpoints。
- 数据表：`content_articles`、`content_sentences`、content_versions、admin_audit_logs。
- 状态逻辑：发布只允许 approved 或 admin override；撤回后前台不可见。
- 副作用：发布/撤回/恢复版本必须刷新本地缓存版本、sitemap、搜索索引和推荐候选。
- 预览：未发布预览只能后台鉴权或短期 token 访问；token 过期后返回 401，不得被搜索引擎收录。
- Token：预览 token 默认 TTL 15 分钟，单次内容版本绑定，可手动撤销；发布/撤回/版本恢复时旧 token 立即失效。

## 不明确 / 风险

- 风险：预览未发布内容可能泄露。
- 处理：预览 URL 必须后台鉴权或短期 token。

## 技术假设

- 版本快照包含文章和句子 JSON。

## 最终验收清单

- [ ] 单篇/批量发布与撤回可用。
- [ ] 复制生成 draft 且 slug 需重新确认。
- [ ] 版本历史可查看并恢复。
- [ ] 未发布预览不能被匿名访问。
- [ ] 撤回后前台、搜索、sitemap、缓存、推荐均不可再访问该正文。
- [ ] 发布、撤回、复制、版本恢复全部写审计。
- [ ] 预览 token 过期、撤销、版本变更、匿名访问四种场景均返回不可读。