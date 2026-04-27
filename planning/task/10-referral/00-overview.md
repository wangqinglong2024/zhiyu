# 10 · 分销任务清单

## 来源覆盖

- PRD：`planning/prds/09-referral/01-functional-requirements.md`、`02-data-model-api.md`。
- 关联：支付订单、知语币发放、后台分销报告、安全设备指纹。

## 任务清单

- [ ] RF-01 建立 `referral_codes`、`referral_relations`、`referral_commissions`、`referral_exchanges` 并启用 RLS。来源句：`planning/prds/09-referral/02-data-model-api.md` DDL 定义这些表。
- [ ] RF-02 注册用户自动生成 6 位无歧义邀请码，系统生成不可改，但不单独展示给被邀请人。来源句：`RF-FR-001` 与 DDL 注释写明“系统生成不可改”。
- [ ] RF-03 分享链接只展示完整 URL，不返回纯 code 字段。来源句：`planning/prds/09-referral/02-data-model-api.md` 注意项写明“不提供单独返回原始邀请码字符串的 API”。
- [ ] RF-04 实现分享渠道：复制链接、多语文案、QR 海报、WhatsApp/Line/Zalo/Facebook 直分享。来源句：`RF-FR-002`。
- [ ] RF-05 实现邀请落地页 `/r/:code`，30 天 cookie/设备指纹缓存、展示邀请人头像和文案、记录转化埋点。来源句：`RF-FR-003`。
- [ ] RF-06 实现绑定上级：cookie ref → referral_relations，查 L1/L2，设备相同拒绑，同 IP 聚集标可疑。来源句：`RF-FR-004` 与“邀请关系绑定逻辑”。
- [ ] RF-07 注册即有效推荐 `is_effective=true`。来源句：`RF-FR-005` 写明“被推荐人成功注册即记为有效推荐”。
- [ ] RF-08 订单成功后计算两级佣金，L1 和 L2 均为订单金额 USD ×100×20%。来源句：`RF-FR-006`。
- [ ] RF-09 佣金先 pending，14 天后 confirmed 并调用 economy.issue 入账知语币。来源句：`RF-FR-007`。
- [ ] RF-10 退款反向处理：pending reversed；confirmed/issued 写负数 coin ledger，可形成 owed。来源句：`RF-FR-007` 与 `planning/prds/09-referral/02-data-model-api.md` “退款处理”。
- [ ] RF-11 不提供现金提现，佣金 confirmed 后自动入账知语币，仅站内消费。来源句：`RF-FR-008` 写明“不提供现金提现接口”。
- [ ] RF-12 实现 `/me/referral` 仪表板：累计/待确认/已发放、L1/L2、30 天曲线、链接/海报、脱敏列表。来源句：`RF-FR-009`。
- [ ] RF-13 实现反作弊：设备相同拒绑、IP/时段聚集、异常行为复审、刷子冻结佣金+封号+通知。来源句：`RF-FR-011`。
- [ ] RF-14 后台分销报告展示总佣金、待确认、已发放、无提现审核、反作弊告警与冻结。来源句：`AD-FR-010`。
- [ ] RF-15 实现 daily cron `confirmCommissions`。来源句：`planning/prds/09-referral/02-data-model-api.md` 内部调用列出 `referralService.confirmCommissions()`。

## 验收与测试

- [ ] RF-T01 A 邀请 B、B 邀请 C、C 付费，A/B 佣金分别入 pending。来源句：`RF-FR-006` 两级佣金规则。
- [ ] RF-T02 14 天确认期模拟后佣金自动入 coin ledger。来源句：`RF-FR-007`。
- [ ] RF-T03 同设备自推拒绑并写安全事件/告警。来源句：`RF-FR-004` 与 `RF-FR-011`。
