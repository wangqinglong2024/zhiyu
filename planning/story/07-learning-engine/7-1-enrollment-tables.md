# ZY-07-01 · 学习选课 / 报名表

> Epic：E07 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 报名一门课程后系统记录我的进度与节奏
**So that** 我能从任意设备继续，并看到自己的成长曲线。

## 上下文
- 课程结构（接 ZY-08）：课程 → 模块 → 课时 → 步骤（10-step）。
- 报名 = 在 `enrollments` 表创建一行；首次免费章节自动报名，付费章节需 entitlement（接 ZY-13）。
- 一个用户对一门课只一行 enrollment（unique），重置进度 = 软删 + 新建。

## 数据模型
```sql
create table zhiyu.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id uuid not null,
  status text default 'active',          -- active | paused | completed | reset
  current_lesson_id uuid,
  progress_percent numeric(5,2) default 0,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  unique (user_id, course_id, status) deferrable initially deferred
);
create index on zhiyu.enrollments (user_id, status);

create table zhiyu.lesson_progress (
  user_id uuid not null,
  lesson_id uuid not null,
  step_index smallint not null,           -- 0..9
  status text default 'in_progress',      -- in_progress | done | skipped
  score numeric(5,2),
  attempts int default 0,
  updated_at timestamptz default now(),
  primary key (user_id, lesson_id, step_index)
);
```

## Acceptance Criteria
- [ ] migrations + drizzle schema
- [ ] `POST /api/v1/courses/:id/enroll` + 已报名幂等
- [ ] `GET /api/v1/me/enrollments`
- [ ] `POST /api/v1/me/enrollments/:id/reset`
- [ ] RLS：仅本人可见

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run enrollment
```

## DoD
- [ ] 幂等 + 重置正确
- [ ] RLS 通过

## 依赖
- 上游：ZY-08-01
- 下游：ZY-07-02..07
