# ZY-12-05 · ZC 商城商品

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 用 ZC 兑换头像框 / 主题皮肤 / 复活卡 / 双倍 XP 卡 / 解锁单课
**So that** 我的虚拟币有用武之地，提升留存。

## 上下文
- `zhiyu.shop_items(id, sku, type, price_coins, payload jsonb, status, stock?)`
- type 枚举：`avatar_frame / theme_skin / freeze_card / xp_double / single_lesson_unlock`
- 兑换写 `zhiyu.user_inventory`
- payload 描述效果（如 xp_double 写 `{ multiplier: 2, hours: 24 }`）

## 数据模型
```sql
create table zhiyu.shop_items (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  type text not null,
  price_coins int not null,
  payload jsonb not null,
  status text default 'active',
  stock int                              -- null = unlimited
);
create table zhiyu.user_inventory (
  user_id uuid not null,
  item_id uuid not null references zhiyu.shop_items(id) on delete cascade,
  payload jsonb,
  expires_at timestamptz,
  acquired_at timestamptz default now(),
  primary key (user_id, item_id, acquired_at)
);
```

## Acceptance Criteria
- [ ] `GET /api/v1/shop/items?type` 列表
- [ ] `POST /api/v1/shop/redeem` { sku, idem_key } 走 spend API
- [ ] 5 类商品种子数据
- [ ] 库存校验（stock 非空时）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run shop
```

## DoD
- [ ] 5 类型可兑
- [ ] 库存生效

## 依赖
- 上游：ZY-12-03
- 下游：ZY-12-06
