# ZY-12-08 · 经济规则配置 + 反作弊

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 运营 / 风控
**I want** 在后台修改经济规则（每条 delta / cap）和监控异常账户
**So that** 平衡经济、扼杀刷币。

## 上下文
- 规则修改写 `zhiyu.coin_rules` + 写 audit_log；运行时 cache 60s 失效。
- 反作弊指标：单日 ledger 行数、单 IP 多账号、单设备多账号、短时大额、订阅 vs 收益异常比。
- 触发风控：标记 `wallets.flagged=true`，所有 earn 暂停审核。

## 数据模型补充
```sql
alter table zhiyu.wallets add column flagged boolean default false;
alter table zhiyu.wallets add column flag_reason text;

create table zhiyu.fraud_signals (
  id bigserial primary key,
  user_id uuid not null,
  type text not null,
  severity smallint default 1,
  meta jsonb,
  created_at timestamptz default now()
);
```

## Acceptance Criteria
- [ ] admin `/admin/economy/rules` 编辑界面（接 ZY-17-08）
- [ ] BullMQ cron 每 10 min 扫异常 → 写 fraud_signals + 阈值触发 flag
- [ ] flagged 用户 earn 拒绝 / 提示申诉
- [ ] 申诉接口（联客服 ZY-15）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-worker pnpm vitest run fraud
```

## DoD
- [ ] 风控可见且可解封
- [ ] 规则修改即时生效

## 依赖
- 上游：ZY-12-01..07 / ZY-17 / ZY-19-06
