# ZY-11-01 · 小说 / 章节 schema 与公开 API

> Epic：E11 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** 小说与章节的标准化 schema 与对外 API
**So that** 阅读端 / 后台 / 推荐都能稳定消费。

## 上下文
- 12 大类型对应 `novels/01-12-*.md` 文件夹种子。
- 每章可设 `is_free` 或要求消耗 ZC / 订阅。
- 章节正文走 ZY-04-04 翻译表（按需多语；本期至少 zh + en）。
- 阅读统计：每章 `view_count`，按日聚合。

## 数据模型
```sql
create table zhiyu.novels (
  id uuid primary key default gen_random_uuid(),
  genre text not null,                  -- urban-romance / xianxia / ...
  slug text unique,
  cover_url text,
  status text default 'ongoing',         -- ongoing | finished | dropped
  total_chapters int default 0,
  free_chapters int default 3,
  word_count bigint default 0,
  rating_avg numeric(3,2) default 0,
  view_count bigint default 0,
  published_at timestamptz default now()
);
create table zhiyu.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references zhiyu.novels(id) on delete cascade,
  chapter_no int not null,
  title text,
  word_count int,
  is_free boolean default false,
  cost_coins int default 5,
  status text default 'published',
  unique (novel_id, chapter_no)
);
create index on zhiyu.chapters (novel_id, chapter_no);
```

## Acceptance Criteria
- [ ] migrations + drizzle schema
- [ ] `GET /api/v1/novels?genre&sort&cursor&lng`
- [ ] `GET /api/v1/novels/:id` / `:id/chapters`
- [ ] `GET /api/v1/chapters/:id` （未授权返 402，授权返正文）
- [ ] OpenAPI 描述

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run novels.api
```

## DoD
- [ ] 列表 + 详情 + 章节正文 三接口通
- [ ] 未授权 402

## 依赖
- 上游：ZY-04-04 / ZY-12 / ZY-13
- 下游：ZY-11-02..06
