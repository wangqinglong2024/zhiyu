# ZY-09-10 · 游戏分析与排行榜

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 玩家
**I want** 看全球 / 好友 / 本周排行榜，自己分数实时更新
**So that** 我有动力反复挑战。

## 上下文
- `zhiyu.game_runs(id, user_id, game_id, score, duration_ms, meta jsonb, created_at)`
- `zhiyu.leaderboards(game_id, scope, period_start, period_end, ranks jsonb, refreshed_at)` 缓存当周 / 当月 top 100
- BullMQ cron 每 5 min 重算 + 写缓存
- realtime broadcast `lb:<game_id>` 推前 100 变化
- 反作弊：分数上限校验 + 提交频率（与 ZY-12-08 风控联动）

## 数据模型
```sql
create table zhiyu.game_runs (
  id bigserial primary key,
  user_id uuid not null,
  game_id text not null,
  score int not null,
  duration_ms int not null,
  meta jsonb,
  created_at timestamptz default now()
);
create index on zhiyu.game_runs (game_id, score desc, created_at);
create table zhiyu.leaderboards (
  game_id text not null,
  scope text not null,                    -- 'all' | 'week' | 'month'
  period_start timestamptz,
  period_end timestamptz,
  ranks jsonb not null,
  refreshed_at timestamptz default now(),
  primary key (game_id, scope, period_start)
);
```

## Acceptance Criteria
- [ ] migrations + drizzle
- [ ] `POST /api/v1/games/:id/runs`
- [ ] `GET /api/v1/games/:id/leaderboard?scope=week`
- [ ] cron 重算
- [ ] FE 排行榜组件 + 自我位置高亮
- [ ] 上传分数错误格式 → 拒绝（zod）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run leaderboard
docker compose exec zhiyu-worker pnpm vitest run leaderboard.cron
```

## DoD
- [ ] 三 scope 可查
- [ ] realtime 推送通

## 依赖
- 上游：ZY-09-01..09 / ZY-05-06 / ZY-12-08
