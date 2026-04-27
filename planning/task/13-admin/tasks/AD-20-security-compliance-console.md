# AD-20 · 实现安全与合规控制台

## PRD / 任务来源

- `planning/task/18-security-compliance/00-overview.md`：security_events、blocked_entities、HMAC nonce、红线词、合规状态。
- `AD-FR-012`：所有后台写操作记录审计。

## 需求落实

- 页面：`/admin/security`、`/admin/compliance`。
- 组件：SecurityEventTable、BlocklistManager、RedLineRulePanel、ComplianceChecklist、SecurityDiffViewer。
- API：`GET /admin/api/security/events`、`POST /admin/api/security/blocklist`、`POST /admin/api/security/red-line-rules`、`GET /admin/api/compliance/status`。
- 数据表：`security_events`、`blocked_entities`、`red_line_dictionary`、`admin_audit_logs`。
- 状态逻辑：viewer 只读；admin 可封禁/解封/更新规则；所有写操作强制二次确认并审计。

## 不明确 / 风险

- 风险：安全事件中可能包含 IP、UA、nonce、token 摘要等敏感数据。
- 处理：列表默认脱敏，详情仅 admin 可见，导出需二次确认。

## 最终验收清单

- [ ] security_events 可筛选、搜索、导出。
- [ ] blocklist 新增/解除均写 admin_audit_logs。
- [ ] 红线词规则版本可查看并回滚。
- [ ] 合规文档 4 语状态可见。