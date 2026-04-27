# 13 · 管理后台任务清单

## 来源覆盖

- PRD：`planning/prds/12-admin/01-functional-requirements.md`、`02-data-model-api.md`。
- UX：`planning/ux/11-screens-admin.md`。

## 任务清单

- [ ] AD-01 建立 `admin_users`、`admin_audit_logs`、`feature_flags`、`admin_announcements`、`content_review_workflow`。来源句：`planning/prds/12-admin/02-data-model-api.md` DDL 定义这些表。
- [ ] AD-02 实现角色权限：admin/editor/reviewer/cs/viewer。来源句：`planning/prds/12-admin/01-functional-requirements.md` 角色表。
- [ ] AD-03 实现后台登录：邮箱密码 + TOTP 强制 2FA、失败 5 次锁 30min、可选 IP 白名单。来源句：`AD-FR-001`。
- [ ] AD-04 实现 Dashboard KPI：DAU/WAU/MAU/订单数/GMV/Churn/NPS/客服未接、7/30/90 天趋势、异常告警。来源句：`AD-FR-002`。
- [ ] AD-05 实现用户管理列表/详情/冻结/解冻/重置密码/强制下线/加扣币/模拟登录并审计。来源句：`AD-FR-003`。
- [ ] AD-06 实现订单管理：列表筛选、≥7 天人工退款、发票导出、webhook 历史。来源句：`AD-FR-004`。
- [ ] AD-07 实现知语币账本后台：发行/消耗/余额统计、可疑账户、手动调整必填理由+审计。来源句：`AD-FR-005`。
- [ ] AD-08 实现 4 模块内容管理：DC 类目/文章/句子、CR 树、GM 配置/词包、NV 小说/章节。来源句：`AD-FR-006`。
- [ ] AD-09 内容管理支持批量发布、撤回、复制、版本历史、预览。来源句：`AD-FR-006` “通用功能”。
- [ ] AD-10 内容工厂页 v1 只提供“v1.5 即将上线”占位和 CSV/YAML 手动导入入口。来源句：`AD-FR-007`。
- [ ] AD-11 实现审校工作台：状态流、原文/AI 译/人工编辑对比、母语评分、备注、历史版本。来源句：`AD-FR-008`。
- [ ] AD-12 实现客服工作台：待接、当前会话、历史搜索、快捷回复模板。来源句：`AD-FR-009`。
- [ ] AD-13 实现分销报告：ZC 佣金、无提现审核、反作弊告警、冻结。来源句：`AD-FR-010`。
- [ ] AD-14 实现 Feature Flags：payment.provider、promo.banner、game.live 等，支持按用户/国家/Persona 灰度；dev 真实外部 provider 不启用。来源句：`AD-FR-011`。
- [ ] AD-15 所有后台写操作写 `admin_audit_logs`，含 actor/action/resource/before/after/ip/ua/timestamp，7 年保留。来源句：`AD-FR-012`。
- [ ] AD-16 实现导出：用户列表、订单、收益 CSV/Excel，大批量异步。来源句：`AD-FR-013`。
- [ ] AD-17 实现通知/公告：多语 banner、邮件群发给订阅用户、推送 v1.5 占位。来源句：`AD-FR-014`。
- [ ] AD-18 后台 UX 按 Linear/Stripe 风格、桌面优先、亮/暗主题、移动响应。来源句：`planning/prds/12-admin/01-functional-requirements.md` “UX”章节。
- [ ] AD-19 API 前缀统一 `/admin/api`，中间件按 role claim 拦截。来源句：`planning/prds/12-admin/02-data-model-api.md` “API（管理后台专属，路径前缀 /admin/api）”与“鉴权”。

## 验收与测试

- [ ] AD-T01 admin 登录后可访问全部；viewer 只读；cs 只能客服与用户基本信息。来源句：角色权限表。
- [ ] AD-T02 任一写操作都产生审计日志，可按 actor/resource 查询。来源句：`AD-FR-012`。
- [ ] AD-T03 列表 P95 <500ms、详情 <800ms、操作 <1s。来源句：`planning/prds/12-admin/02-data-model-api.md` “性能”。
