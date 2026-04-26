# ZY-08-01 · 课程 / 课时 / 步骤 schema 与规约

> Epic：E08 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** 课程 / 模块 / 课时 / 步骤的清晰 schema 与 step payload 合约
**So that** 内容与引擎稳定演进，编辑器与前端组件能对齐。

## 上下文
- 12 个学习赛道（daily / business / hsk / kids / pinyin / scenarios / culture / xianxia / ecommerce / factory / song / chengyu）每个 12 stage × 12 lesson。
- 课时有 10 步骤；每步骤 type 决定 payload schema。
- step type 枚举：`intro / vocab / sentence / pinyin / listen / speak / read / write / practice / quiz`。

## 数据模型
```sql
create table zhiyu.courses (
  id uuid primary key default gen_random_uuid(),
  track text not null,                  -- daily/business/...
  stage smallint not null,              -- 1..12
  display_order int default 0,
  cover_url text,
  level smallint default 1,
  is_free boolean default false,
  status text default 'draft',
  unique (track, stage)
);
create table zhiyu.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references zhiyu.courses(id) on delete cascade,
  display_order int not null,
  steps jsonb not null,                 -- 数组：每元素 {type, payload}
  is_free boolean default false,
  status text default 'draft'
);
create index on zhiyu.lessons (course_id, display_order);
```

## Acceptance Criteria
- [ ] migrations + drizzle schema
- [ ] step payload zod schemas（10 type）+ 校验工具 `validateLessonSteps()`
- [ ] 种子：每 track 至少 1 stage × 1 lesson 完整可跑
- [ ] admin 创建/更新 lesson 服务端校验 zod

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run lesson.schema
```

## DoD
- [ ] 10 schema 全单测
- [ ] 种子可跑

## 依赖
- 上游：ZY-04-04 / ZY-07-02
- 下游：ZY-08-02..06
