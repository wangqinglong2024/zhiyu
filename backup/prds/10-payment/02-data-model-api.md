> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 10.2 · 支付 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,              -- 'monthly','half_year','annual','single_stage','nine_pack'
  name_translations JSONB,
  price_usd DECIMAL(10,2) NOT NULL,
  duration_days INT,                      -- NULL for permanent
  type TEXT NOT NULL CHECK (type IN ('subscription','one_time')),
  paddle_product_id TEXT,
  lemonsqueezy_product_id TEXT,
  is_promo BOOLEAN DEFAULT FALSE,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_code TEXT NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  provider TEXT NOT NULL CHECK (provider IN ('paddle','lemonsqueezy')),
  external_order_id TEXT,
  external_subscription_id TEXT,
  status TEXT DEFAULT 'pending',          -- pending/paid/refunded/failed/canceled
  meta JSONB,                             -- {stage_id, track_id} for single_stage / nine_pack
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount_usd DECIMAL(10,2),
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_external ON orders(provider, external_order_id);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_subscription_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',           -- active/canceled/expired/grace_period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,        -- 实际到期（含宽限）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_user_active ON user_subscriptions(user_id, status, expires_at);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  UNIQUE(provider, event_id)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON orders FOR SELECT USING (user_id = auth.uid());
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_subscriptions USING (user_id = auth.uid());
```

## API

### 用户
- `GET /api/billing/plans` — 公开计划列表（含促销）
- `POST /api/billing/checkout/create` — `{plan_code, meta?}` → `{order_id, checkout_url}`
- `GET /api/me/orders?page=`
- `GET /api/me/orders/:id`
- `GET /api/me/subscription` — 当前订阅
- `POST /api/me/subscription/cancel`
- `POST /api/me/orders/:id/refund-request` — `{reason}`

### Webhook
- `POST /webhooks/paddle` — Paddle 推送
- `POST /webhooks/lemonsqueezy`

### 内部
- `paymentService.handleWebhook(provider, payload, signature)`：
  - 验签
  - 幂等检查 webhook_events
  - 路由到对应处理器
  - 触发：解锁 / 分销佣金 / 邮件通知

## Paddle Webhook 处理

```typescript
async function handlePaddleEvent(event) {
  // 1. 验签
  if (!verifyPaddleSignature(event)) throw new Error('invalid signature');

  // 2. 幂等
  const exists = await db.query('SELECT 1 FROM webhook_events WHERE provider=paddle AND event_id=$1', [event.id]);
  if (exists) return;
  await db.insert('webhook_events', { provider: 'paddle', event_id: event.id, ... });

  // 3. 路由
  switch (event.event_type) {
    case 'transaction.completed':
      await markOrderPaid(event.data);
      await unlockEntitlements(event.data);
      await triggerReferralCommission(event.data);
      await sendOrderEmail(event.data);
      break;
    case 'subscription.canceled':
      await markSubscriptionCanceled(event.data);
      break;
    case 'subscription.updated':
      await updateSubscriptionPeriod(event.data);
      break;
    case 'transaction.refunded':
      await processRefund(event.data);
      await reverseEntitlements(event.data);
      await reverseReferralCommission(event.data);
      break;
  }

  await markEventProcessed(event.id);
}
```

## 解锁规则

| 计划 | 写表 | expires_at |
|---|---|---|
| 月 | user_subscriptions | now + 30d |
| 半年 | user_subscriptions | now + 180d |
| 年 | user_subscriptions | now + 365d |
| 单段 | user_stage_purchases (single_stage) | NULL |
| 9 段 | user_stage_purchases (nine_pack) | NULL |

## 性能
- 订单创建 P95 < 500ms
- Webhook 处理 P95 < 1s
- Webhook 失败重试（Paddle 自带，本地最多重试 3 次）
