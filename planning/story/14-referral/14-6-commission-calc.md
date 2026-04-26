# ZY-14-06 · 佣金计算

> Epic：E14 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 推荐人
**I want** 当我推荐的用户首次充值 / 订阅 / 续费时按规则获得佣金
**So that** 我有持续推荐的动力。

## 上下文
- **PRD 强制：分销佣金一律以知语币 ZC 入账，不发现金、不提现**（见 `prds/09-referral/01-functional-requirements.md` RF-FR-006/008 与 [00-rules.md](../../00-rules.md) §11/§14）。本 story 全部口径与之对齐，删除任何"现金"措辞。
- 规则（dev 默认）：
  - 邀请注册 + 7 日内完成 1 课 → 推荐人 +20 ZC（child +10 ZC）
  - 被邀首次订阅 / 续费 → L1 推荐人 +`round(order_amount_usd × 100 × 0.20)` ZC + 额外 50 ZC 奖励
  - 被邀首次充值（任何订单） ≥ $10 → L1 +`round(order_amount_usd × 100 × 0.20)` ZC + 30 ZC
  - L2（祖父级）：取 L1 同公式的 50% 即 `round(order_amount_usd × 100 × 0.10)` ZC
  - 6 月内同被邀人重复订阅可重复触发，但 50/30 ZC 奖励只发首次
- 所有 commissions 行写 pending；ZY-14-07 cron 14 天后升 confirmed → 调 economy.issue 发币（source=`referral_commission`）
- 与订单 status=paid 联动；订单退款 → commission 行 reversed，已 issued 的走 coins_ledger 负数扣除（允许 owed=true）

## Acceptance Criteria
- [ ] CommissionEngine.onOrderPaid(order) hook
- [ ] CommissionEngine.onUserActive(user) hook（首课）
- [ ] 单测：四规则 + L2 公式全覆盖；断言所有 ledger 行 amount 为整数 ZC，不存在 cash/usd 字段
- [ ] 重复事件幂等（`(provider, external_order_id)` 唯一约束 + commission `(order_id, level)` 唯一）
- [ ] 退款链路：order.refunded → commission.reversed → coins_ledger 负数（接 ZY-14-09 风控同步冻结）
- [ ] grep 自检：`grep -RE "现金|cash|withdraw|提现" packages/referral/src/` 必须为空

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run commission.calc
```

## DoD
- [ ] 4 规则准确
- [ ] 幂等
- [ ] 与 PRD `RF-FR-006/007/008` 措辞 100% 一致（ZC 出账，无现金）
- [ ] 与 ZY-14-09 反作弊冻结互通（确认刷子 → commission 全部 reversed + 钱包冻结）

## 依赖
- 上游：ZY-14-05 / ZY-13-04 / ZY-12
- 下游：ZY-14-07（cron）/ ZY-14-09（反作弊）/ ZY-17-09（admin 订单/分销）
