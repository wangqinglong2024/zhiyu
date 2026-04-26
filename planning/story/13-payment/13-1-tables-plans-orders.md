# ZY-13-01 · plans / orders / entitlements 表

> Epic：E13 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** 订阅计划 / 订单 / 授权（entitlement）三层数据模型
**So that** 支付/续费/退款/单项购买都能映射到清晰的"用户可用什么"。

## 上下文
- 计划：周/月/季/年 + 单课 + 充值 SKU；货币按地区，但本期 dev 仅 USD/CNY 占位。
- 订单：状态机 `pending → paid → refunded | failed | cancelled`。
- entitlement：当前生效授权（subscription = 一行带 expires_at；single = 一行带 product_id 永久）。
- 不接 Paddle / Stripe / LemonSqueezy SDK；走 ZY-13-02 PaymentAdapter。

## 数据模型
```sql
create table zhiyu.plans (
  id text primary key,                  -- 'sub_monthly' | 'sub_yearly' | 'sku_lesson_<id>' | 'sku_zc_100'
  type text not null,                   -- 'subscription' | 'one_time'
  amount_cents int not null,
  currency text not null default 'USD',
  interval text,                        -- null for one_time
  display_order int default 0,
  status text default 'active',
  meta jsonb
);
create table zhiyu.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text not null references zhiyu.plans(id),
  amount_cents int not null,
  currency text not null,
  status text not null default 'pending',
  payment_provider text,                -- 'fake' | 'paddle' | 'wechat' ...
  provider_order_id text,
  coupon_id text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz default now()
);
create table zhiyu.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,                   -- 'subscription' | 'lesson' | 'novel_chapter_pack'
  ref_id text,
  expires_at timestamptz,
  source_order_id uuid references zhiyu.orders(id),
  created_at timestamptz default now()
);
create index on zhiyu.entitlements (user_id, type);
```

## Acceptance Criteria
- [ ] migrations + drizzle schema
- [ ] 种子：4 sub plans + 5 充值 SKU
- [ ] 状态机校验函数
- [ ] RLS：本人 entitlements 可读

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm drizzle-kit migrate
docker compose exec zhiyu-app-be pnpm vitest run payment.tables
```

## DoD
- [ ] 三表齐 + 种子
- [ ] 状态机单测

## 依赖
- 上游：ZY-01-05
- 下游：ZY-13-02..06
