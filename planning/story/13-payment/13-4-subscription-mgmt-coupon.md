# ZY-13-04 · 订阅管理 + 优惠券

> Epic：E13 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 订阅用户
**I want** 在「我」查看订阅、续期、取消、更换 plan，并能输入优惠券
**So that** 我清楚自己被收什么、何时到期、如何取消。

## 上下文
- 取消 = 标记到期不续，不立即失效；返还策略由运营定（本期默认无返）
- 优惠券 `zhiyu.coupons(code, type, value, scope, max_uses, used_count, expires_at)`
- 优惠券类型：`pct_off | flat_off | first_month_free | free_days`

## 数据模型补充
```sql
create table zhiyu.coupons (
  code text primary key,
  type text not null,
  value int not null,
  scope text default 'subscription',
  max_uses int,
  used_count int default 0,
  expires_at timestamptz,
  status text default 'active'
);
create table zhiyu.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text not null,
  status text default 'active',          -- active | cancelled | past_due | expired
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now()
);
create index on zhiyu.subscriptions (user_id, status);
```

## Acceptance Criteria
- [ ] migration + drizzle schema
- [ ] `GET /api/v1/me/subscription`
- [ ] `POST /api/v1/me/subscription/cancel` / `resume` / `change-plan`
- [ ] `POST /api/v1/coupons/validate` 校验
- [ ] FE `/me/subscription` 页

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run subscription coupon
```

## DoD
- [ ] 取消 + 恢复 + 换 plan 三路径通
- [ ] 优惠券生效 / 过期判断正确

## 依赖
- 上游：ZY-13-01..03
- 下游：ZY-13-05
