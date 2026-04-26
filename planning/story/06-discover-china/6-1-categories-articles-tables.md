# ZY-06-01 · 文化分类与文章表

> Epic：E06 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** 中国文化文章的分类与正文表
**So that** 发现频道（历史 / 美食 / 山川 / 节庆 / 艺术 / 戏曲 / 文学 / 成语 / 哲学 / 现代 / 趣味汉语 / 神话）有数据可读。

## 上下文
- 12 个分类与 `china/` 文件夹一一对应。
- 文章正文走 `i18n.content_translations`（接 ZY-04-04），表本身仅存元信息（封面 / 难度 / 阅读时长 / 词条标签）。
- 文章 ↔ 词条多对多（接 ZY-06-04）。

## 数据模型
```sql
create table zhiyu.categories (
  id text primary key,                  -- 'history' | 'cuisine' | ...
  display_order int default 0,
  cover_url text,
  status text default 'published'
);

create table zhiyu.articles (
  id uuid primary key default gen_random_uuid(),
  category_id text references zhiyu.categories(id),
  slug text unique not null,
  cover_url text,
  read_minutes int,
  difficulty smallint default 1,        -- 1..5 (HSK ref)
  status text default 'draft',           -- draft | published | archived
  published_at timestamptz,
  view_count bigint default 0,
  created_at timestamptz default now()
);
create index on zhiyu.articles (category_id, status, published_at desc);
```
- RLS：published 公开读；草稿仅作者/编辑可读。

## Acceptance Criteria
- [ ] migrations + drizzle schema
- [ ] 种子 12 分类 + 每分类 ≥ 3 文章占位
- [ ] RLS 启用
- [ ] admin / FE 都能 list

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm drizzle-kit migrate
docker compose exec zhiyu-app-be pnpm vitest run articles.tables
```

## DoD
- [ ] 12 分类齐
- [ ] 草稿不可被 anon 读到

## 不做
- 编辑器（属 ZY-17）
- 评论（v1.5）

## 依赖
- 上游：ZY-01-05 / ZY-04-04
- 下游：ZY-06-02..06
