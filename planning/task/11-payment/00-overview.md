# 11 · 支付与权益任务清单

## 来源覆盖

- PRD：`planning/prds/10-payment/01-functional-requirements.md`、`02-data-model-api.md`。
- 最高裁决：`planning/rules.md` 与 `planning/spec/02-tech-stack.md` 的 PaymentAdapter dummy/fake。

## 冲突裁决

- PY PRD 中的真实外部 Checkout/Webhook 句子仅作为业务契约来源，本期实现 `PaymentAdapter` dummy/fake checkout 与 fake webhook，不接真实外部支付。
- 来源句：`planning/spec/02-tech-stack.md` 写明“支付 | PaymentAdapter | dummy（直接成功）| Paddle / 微信支付。”

## 任务清单

- [ ] PY-01 建立 `billing_plans`、`orders`、`user_subscriptions`、`webhook_events`；`provider` 在 dev 写 fake/dummy 映射，保留未来扩展字段。来源句：`planning/prds/10-payment/02-data-model-api.md` DDL 定义这些表。
- [ ] PY-02 建立 `PaymentAdapter` 接口：createCheckout、verifyWebhook、parseEvent、refund、cancelSubscription；dummy 实现直接返回成功。来源句：`planning/spec/02-tech-stack.md` “PaymentAdapter | dummy（直接成功）”。
- [ ] PY-03 实现定价页 `/pricing`：月/半年/年/单段/9 段全包、推荐高亮、USD only。来源句：`PY-FR-001`。
- [ ] PY-04 实现 CR 付费墙弹窗 4 选项和“查看完整定价”链接。来源句：`PY-FR-002`。
- [ ] PY-05 实现订单创建 pre-checkout：计划 → pending order → fake checkout_url。来源句：`PY-FR-004` 写明“前端选计划 → POST /api/orders/create → 后端创订单 pending”。
- [ ] PY-06 实现 fake checkout 回跳：把订单标 paid，触发权益、分销、邮件 adapter。来源句：`PY-FR-005` 写明 Webhook “更新 orders + 更新 subscriptions + 解锁权限 + 触发分销佣金”。
- [ ] PY-07 实现 webhook_events 幂等去重与 fake event 重放保护。来源句：`PY-FR-005` 写明“幂等：以 event_id 去重存 webhook_events 表”。
- [ ] PY-08 实现权益解锁：月/半年/年写 `user_subscriptions`，单段/9 段写 `user_stage_purchases`。来源句：`PY-FR-006` 与 `planning/prds/10-payment/02-data-model-api.md` “解锁规则”。
- [ ] PY-09 实现取消订阅：取消后服务至 expires_at，不立即停服，发取消邮件 adapter。来源句：`PY-FR-007`。
- [ ] PY-10 实现续订：fake webhook 成功延长，失败进入 7 天宽限。来源句：`PY-FR-008`。
- [ ] PY-11 实现升级/月转年补差价占位，降级不支持。来源句：`PY-FR-009`。
- [ ] PY-12 实现退款申请：7 天内自动批准、7 天后转后台人工、退款成功撤销权益与反向分销佣金。来源句：`PY-FR-010`。
- [ ] PY-13 实现订单/发票列表与详情，invoice_url 可用 fake PDF/占位 URL。来源句：`PY-FR-011`。
- [ ] PY-14 实现 `payment.provider` feature flag，但 dev 只允许 fake/dummy 激活；历史真实 provider 仅保留未来字段。来源句：`PY-FR-012` 与 `planning/rules.md` “本期不集成任何外部托管 SaaS”。
- [ ] PY-15 实现半年 $12 促销 banner 可下架，订单标 promo。来源句：`PY-FR-013`。
- [ ] PY-16 实现续费失败重试状态、通知、客服联系任务，发送由 EmailAdapter fake 记录。来源句：`PY-FR-014`。
- [ ] PY-17 后台订单管理支持列表、筛选、退款、发票导出、webhook 历史。来源句：`AD-FR-004`。

## 验收与测试

- [ ] PY-T01 用户从付费墙选择单段 → fake checkout → 权益解锁 → 课程可计完成。来源句：`PY-FR-006`。
- [ ] PY-T02 fake webhook 重放不会重复解锁或重复分销。来源句：`PY-FR-005` 幂等要求。
- [ ] PY-T03 退款后权益撤销并反向分销。来源句：`PY-FR-010`。
