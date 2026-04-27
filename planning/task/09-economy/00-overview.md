# 09 · 知语币经济任务清单

## 来源覆盖

- PRD：`planning/prds/08-economy/01-functional-requirements.md`、`02-data-model-api.md`。
- 关联：注册赠币、课程奖励、分销佣金、streak freeze、商店。

## 任务清单

- [ ] EC-01 建立 `coin_wallets`、`coin_ledger`、`coin_checkin_log`、`store_items`、`user_inventory` 并启用 RLS。来源句：`planning/prds/08-economy/02-data-model-api.md` DDL 定义这些表。
- [ ] EC-02 实现 `coinService.grant` 与 `coinService.spend`，事务写账本和余额，所有调用必须带 idempotency_key。来源句：同文件写明“所有调用必须带 idempotency_key（重复发放保护）”。
- [ ] EC-03 邮箱验证后注册赠 100 ZC，一次性。来源句：`EC-FR-001` 写明“验证邮箱后 +100 ZC（一次）”。
- [ ] EC-04 实现每日签到 `/me/checkin`，1-10 概率分布、7 天 +20、30 天 +40。来源句：`EC-FR-002`。
- [ ] EC-05 签到与学习 streak 分开计数，中断 streak 不影响签到。来源句：`EC-FR-002` 写明“中断 streak 不影响签到（独立计数）”。
- [ ] EC-06 实现学习任务奖励：完节小测 1-3 ZC、章测 10、阶段考 40。来源句：`EC-FR-003` 表格。
- [ ] EC-07 实现账本页 `/me/coins`，余额 + 流水、类型/金额/时间/来源、分页 50/页。来源句：`EC-FR-007`。
- [ ] EC-08 实现商店 `/store`，消耗品/装饰/限定，购买二次确认。来源句：`EC-FR-008`。
- [ ] EC-09 实现商品购买、库存、装备、streak freeze 消耗。来源句：`planning/prds/08-economy/02-data-model-api.md` API 列出 store、inventory、freeze use。
- [ ] EC-10 实现防作弊：同 IP/同设备多账号刷币限流检测、异常 issuance 告警、冻结用户暂停发放。来源句：`EC-FR-009`。
- [ ] EC-11 实现 400 ZC 兑换月会员作为系统赠送会员机制，不开放现金购买。来源句：`EC-FR-010` 写明“可用 ZC 兑换月会员（400 ZC = 1 月）”。
- [ ] EC-12 实现年发行上限 50,000 ZC，超限拒绝并告警。来源句：`planning/prds/08-economy/02-data-model-api.md` “业务规则”写明“yearly_issued + amount > 50000 → 拒绝并告警”。
- [ ] EC-13 后台支持全局发行/消耗/余额统计、可疑账户、手动调整必填理由+审计。来源句：`AD-FR-005`。
- [ ] EC-14 按铁律提供 seed：shop_items ≥12、签到奖励表覆盖 7 天、用户钱包余额与流水。来源句：`planning/rules.md` 写明“EC | shop_items ≥ 12；签到奖励表 7 天；至少 5 个用户钱包余额与流水”。

## 验收与测试

- [ ] EC-T01 注册验证后只发一次 100 ZC，重复回调不重复发。来源句：`EC-FR-001` 与 idempotency_key 规则。
- [ ] EC-T02 连续签到 7 天产生额外 +20，账本完整。来源句：`EC-FR-002`。
- [ ] EC-T03 余额冻结用户 grant/spend 全拒。来源句：`planning/prds/08-economy/02-data-model-api.md` 写明“is_frozen=true 时 grant / spend 全拒”。
