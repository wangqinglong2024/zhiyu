# ACR-06 · 课程权限与跨级购买配置

## PRD 原文引用

- `04-data-model-api.md` §3：权限算法；备注“购买不检查 prerequisite_stage”。
- `01-structure-content.md` §4.2：“允许跨级购买任意轨道任意阶段。”（UI 展示统一称“主题”）
- `AD-FR-003`：“操作：冻结 / 解冻 / 重置密码 / 强制下线 / 加币 / 扣币 / 模拟登录”。

## 需求落实

- 页面：`/admin/users/:id/courses-permissions`（用户详情子页）。
- 组件：UserPermissionMatrix（4 主题 × 12 阶段矩阵）、ManualGrantModal、GrantReasonInput、SubscriptionInfoCard、PurchaseHistoryTable。
- API：
  - `GET /admin/api/users/:id/course-permissions` 返回完整 4 × 12 矩阵 + 来源 reason。
  - `POST /admin/api/users/:id/course-permissions/grant` Body `{stage_id, reason, expires_at?}` 写 `user_stage_purchases` purchase_type=`manual_grant`。
  - `DELETE /admin/api/users/:id/course-permissions/:purchase_id`。
  - `GET /admin/api/users/:id/orders?context=courses`。

## 状态逻辑

- 矩阵单元颜色：绿(已授)、黄(会员含)、灰(未授)。
- manual_grant 必填 reason；reason 写入 audit_log。
- 撤销 manual_grant 立即失效权限缓存。

## 不明确 / 风险

- 风险：管理员误授大量权限导致收入损失。
- 处理：单次 grant 上限 12 阶段；超出需 admin 二次审批。

## 技术假设

- 矩阵列出 4 主题 × 12 阶段共 48 单元，移动端折叠为列表。

## 最终验收清单

- [ ] 用户详情页可看 4 × 12 权限矩阵。
- [ ] 手动授权立即在前台生效（< 5s）。
- [ ] 撤销授权立即失效。
- [ ] reason 写 audit_logs。
- [ ] 单次 > 12 grant 触发二次审批。
