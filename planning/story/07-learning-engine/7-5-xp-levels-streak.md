# ZY-07-05 · 经验值 / 等级 / 连续打卡

> Epic：E07 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 每日学习累计 XP 升级、保持连续打卡
**So that** 我有持续的成长可视化与坚持动机。

## 上下文
- XP 规则：完成 lesson +X、SRS 复习 +Y、文章读完 +Z、首次每日打卡 +K（详细在 ZY-12-02 规则配置）。
- 等级表：Lv = floor(sqrt(xp / 100))（简化）。
- streak：每日 0:00 (`Asia/Shanghai`) 滚动；保留补卡券（"复活卡" 接 ZY-12 商品）。
- 启动期"双倍 XP"开关由 feature flag 控制（接 ZY-20-04）。

## 数据模型
```sql
create table zhiyu.user_progression (
  user_id uuid primary key,
  xp bigint default 0,
  level int default 0,
  streak_current int default 0,
  streak_max int default 0,
  last_active_date date,
  freeze_count int default 0
);
create table zhiyu.xp_log (
  id bigserial primary key,
  user_id uuid not null,
  delta int not null,
  source text not null,
  meta jsonb,
  created_at timestamptz default now()
);
create index on zhiyu.xp_log (user_id, created_at desc);
```

## Acceptance Criteria
- [ ] BE 工具 `awardXp(userId, amount, source, meta?)`
- [ ] streak 滚动逻辑 + 漏卡 → 自动消耗 freeze 补卡
- [ ] 升级触发通知 + 弹窗（可选）
- [ ] FE：dashboard 卡片显示 XP 进度环 / 等级 / 连续天数
- [ ] feature flag 双倍 XP 生效

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run xp.streak
```

## DoD
- [ ] 升级通知触发
- [ ] streak 跨日测试通过

## 依赖
- 上游：ZY-07-02
- 下游：ZY-07-07 / ZY-12-02
