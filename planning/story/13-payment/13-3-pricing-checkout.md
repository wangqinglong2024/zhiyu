# ZY-13-03 · 价格页 + Checkout

> Epic：E13 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 一目了然的价格页 + 顺畅的支付跳转
**So that** 选 plan → 支付 → 解锁一气呵成。

## 上下文
- 路由：`/pricing`（4 sub plans + FAQ + 对比表）
- 选 plan → `/checkout?plan=sub_monthly` → 调 `/api/v1/payment/checkout` 创订单 → 跳 fake-checkout
- 优惠券输入框 → 调 `/api/v1/coupons/validate`
- 4 语；价格按 lng / 区域显示

## Acceptance Criteria
- [ ] 价格页 4 plan 卡 + 推荐 badge + 对比表 + FAQ accordion
- [ ] checkout 页：plan 摘要 + 优惠券 + 总计 + 同意条款 checkbox + 支付按钮
- [ ] BE `POST /api/v1/payment/checkout` { plan_id, coupon? } → 创 orders + 返 redirectUrl
- [ ] 失败状态明确（卡片红边 + i18n msg）
- [ ] 跳转后保持 query 状态以便回退

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run pricing.checkout
```
- MCP Puppeteer：完整下单 → fake 成功 → entitlement 出现

## DoD
- [ ] 端到端通
- [ ] 4 语视觉验

## 依赖
- 上游：ZY-13-01 / 02
