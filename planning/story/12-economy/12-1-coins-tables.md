# ZY-12-01 · ZhiCoin 表与账本

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** 一套强一致的虚拟币（ZhiCoin / ZC）账本
**So that** 所有获取与消耗可追溯、不可篡改、对账无差错。

## 上下文
- 双表：`wallets`（用户余额）+ `coin_ledger`（流水，append-only）
- 使用 Postgres 行锁 + 事务，避免并发超扣
- 不引入区块链 / 第三方 ledger 服务

## 数据模型
```sql
create table zhiyu.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  total_earned bigint not null default 0,
  total_spent bigint not null default 0,
  updated_at timestamptz default now()
);

create table zhiyu.coin_ledger (
  id bigserial primary key,
  user_id uuid not null,
  delta bigint not null,                -- + 入账 / - 出账
  type text not null,                   -- 'earn:checkin' | 'spend:chapter' | 'recharge' | 'refund' | 'admin_adjust'
  ref_type text,                        -- 'lesson' | 'chapter' | 'order' ...
  ref_id text,
  balance_after bigint not null,
  meta jsonb,
  created_at timestamptz default now()
);
create index on zhiyu.coin_ledger (user_id, created_at desc);
```
- RLS：余额 / 流水仅本人可读；写入仅服务端。

## Acceptance Criteria
- [ ] migrations + drizzle schema
- [ ] BE 工具 `LedgerService.transact(userId, delta, type, ref?, meta?)` 事务安全
- [ ] 单测并发：200 并发各扣 1 → 最终余额准确
- [ ] 拒绝负余额（balance check + 应用层判断）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run ledger.concurrency
```

## DoD
- [ ] 并发测试通过
- [ ] RLS 通过

## 依赖
- 上游：ZY-01-05
- 下游：ZY-12-02..08
