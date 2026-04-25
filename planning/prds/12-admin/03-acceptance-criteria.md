# 12.3 · 管理后台 · 验收准则

## 功能
- [ ] AD-AC-001：登录强制 2FA
- [ ] AD-AC-002：5 次失败锁 30min
- [ ] AD-AC-003：Dashboard KPI 准确
- [ ] AD-AC-004：用户搜索 / 详情 / 操作（冻结 / 加币 / 模拟登录）
- [ ] AD-AC-005：订单退款
- [ ] AD-AC-006：知语币账本可手调（审计）
- [ ] AD-AC-007：4 模块内容 CRUD + 发布
- [ ] AD-AC-008：内容工厂占位页可访问；CSV/YAML 导入工具可用（v1.5 接入调度 / 重跑）
- [ ] AD-AC-009：审校工作台流转
- [ ] AD-AC-010：客服工作台 IM
- [ ] AD-AC-011：分销报表准确（ZC 单位）；不提供提现审核页
- [ ] AD-AC-012：feature flags 灰度
- [ ] AD-AC-013：审计日志全覆盖
- [ ] AD-AC-014：导出 CSV
- [ ] AD-AC-015：站内公告 + 邮件群发

## 非功能
- [ ] 列表 P95 < 500ms
- [ ] RBAC 严格（reviewer 不能改源）
- [ ] 审计 100% 覆盖写操作
- [ ] IP 白名单可选

## 测试用例
1. admin 改密码 → 写 audit_log（before/after 脱敏）
2. editor 试图改 admin role → 403
3. reviewer 试图改文章正文 → 403（仅可标 reject）
4. cs 看不到订单详情（除非自己授权）
5. 退款 ≥ 7 天 → 必须 admin 审批
6. flag 改 payment.provider → 立即生效
7. 公告群发 vi 用户 → 仅 vi 用户收到
