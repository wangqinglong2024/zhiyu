# ZY-12-04 · 充值流程（PaymentAdapter + fake）

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 选择充值档位（如 10 / 50 / 100 / 500 / 1000 ZC）并完成支付
**So that** 当 ZC 不够时能快速补充。

## 上下文
- 复用 ZY-13-02 PaymentAdapter（fake 实现：直接成功），dev 环境不连真实支付
- 充值订单复用 ZY-13-01 orders 表，类型 `recharge`
- 成功后写 ledger `recharge` + 提示完成

## Acceptance Criteria
- [ ] `POST /api/v1/economy/recharge` { sku } 创建订单 + 调 adapter.checkout
- [ ] webhook fake：成功后写 ledger
- [ ] FE 充值页 + 5 档卡片 + 支付状态轮询
- [ ] 国家 / 货币本地化（接 ZY-04-02）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run economy.recharge
```
- MCP Puppeteer：选 100 ZC → fake 支付成功 → 余额 +100

## DoD
- [ ] fake 闭环
- [ ] 余额准确

## 依赖
- 上游：ZY-12-01 / ZY-13-02
