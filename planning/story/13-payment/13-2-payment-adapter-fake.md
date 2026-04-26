# ZY-13-02 · PaymentAdapter 接口 + fake 实现

> Epic：E13 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** 一个稳定的 PaymentAdapter 抽象 + 默认 fake 实现
**So that** dev 环境不依赖任何外部支付供应商，未来切真实供应商无需改业务代码。

## 上下文
- 接口：`checkout({ orderId, amountCents, currency, metadata }) → { redirectUrl?, providerOrderId }`、`refund(orderId, reason) → ok`、`verifyWebhook(req) → event` 三方法。
- fake 实现：checkout 返回 `redirectUrl=/fake-checkout/:orderId`；用户点确认 → 直接 POST 模拟 webhook。
- 真实供应商（paddle/wechat/...）由用户后续自行接入，不在本期实施。
- **禁止**导入 `@paddle/paddle-node-sdk` / `stripe` / `@lemonsqueezy/lemonsqueezy.js`。

## Acceptance Criteria
- [ ] interface `PaymentAdapter` 在 `system/packages/sdk/src/payments/`
- [ ] `FakePaymentAdapter` 实现 + 路由 `/fake-checkout/:orderId` （仅 dev 启用）
- [ ] webhook 验签支持自定义 secret（fake 用 HMAC-SHA256）
- [ ] BE 启动若缺真实 key 自动回落 fake
- [ ] eslint 规则：禁止从业务文件 import 第三方支付包

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run payment.adapter
```
- MCP Puppeteer：跳到 fake-checkout → 点确认 → 订单变 paid

## DoD
- [ ] 三方法实现 + 单测全绿
- [ ] eslint 阻止禁用包导入

## 依赖
- 上游：ZY-13-01
- 下游：ZY-13-03..06
