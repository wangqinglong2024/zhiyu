# ZY-13-06 · 财务对账 / 退款流程

> Epic：E13 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 财务 / 客服
**I want** 后台查所有订单、按日对账、处理退款工单
**So that** 资金流可见、退款流程合规。

## 上下文
- 对账：daily cron 聚合 orders 按 currency / provider / status 写 `zhiyu.daily_revenue`
- 退款：客服在 admin 发起 → 调 PaymentAdapter.refund → 成功后写 orders.status=refunded + 撤销 entitlement
- 审计 log 必填（接 ZY-18-04）

## Acceptance Criteria
- [ ] daily_revenue 聚合表 + cron
- [ ] admin `/admin/finance` 列表 + 筛选 + 导出 CSV
- [ ] 退款工单工作流：申请 → 审核 → 执行 → 完成 / 拒绝
- [ ] 退款触发 entitlement 撤回 + 通知用户
- [ ] 异常订单（webhook 丢失）查询入口

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-worker pnpm vitest run reconciliation refund
```

## DoD
- [ ] 对账数 = orders 实数
- [ ] 退款闭环 + 审计

## 依赖
- 上游：ZY-13-01..05 / ZY-17 / ZY-18-04
