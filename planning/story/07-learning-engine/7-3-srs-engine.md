# ZY-07-03 · SRS 间隔重复引擎（SM-2 简化）

> Epic：E07 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 系统按"间隔重复"算法在合适时间复习我学过的字词
**So that** 长期记忆保留率提升，少做无效重复。

## 上下文
- 算法：SM-2 简化 4 档（再来 / 难 / 良好 / 容易）；每张卡有 `interval / ease / due_at`。
- 卡片来源：lesson 完成自动入卡 + 生词本（接 ZY-06-04）+ 错题本（接 ZY-07-04）。
- 每日上限：默认 30 张新 + 200 复习，可在设置调整。

## 数据模型
```sql
create table zhiyu.srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  word text not null,
  source text,                          -- 'lesson:<id>' | 'fav' | 'mistake'
  interval_days numeric default 0,
  ease numeric default 2.5,
  due_at date default current_date,
  reps int default 0,
  lapses int default 0,
  unique (user_id, word)
);
create index on zhiyu.srs_cards (user_id, due_at);
```

## Acceptance Criteria
- [ ] BE `SRS.review(cardId, grade)` 更新 interval/ease/due_at
- [ ] `GET /api/v1/srs/queue?limit=` 返回今日队列
- [ ] FE 复习页（卡片翻面 + 4 按钮）
- [ ] 每日完成提醒 → 通知（接 ZY-05-06）
- [ ] 单测覆盖算法边界

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run srs
```
- MCP Puppeteer：完成 10 张 → next due 正确

## DoD
- [ ] 算法单测全绿
- [ ] 队列 ≤ 200ms

## 依赖
- 上游：ZY-06-04 / ZY-07-02
- 下游：ZY-07-04 / 07
