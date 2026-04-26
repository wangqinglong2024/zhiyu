# ZY-03-01 · profiles 表与 RLS

> Epic：E03 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 后端工程师
**I want** supabase `zhiyu.profiles` 表与对应 RLS 策略
**So that** 用户注册后即拥有可读写的个人资料行，且不可越权访问他人数据。

## 上下文
- 自托管 Supabase；schema：`zhiyu`。
- profiles 与 `auth.users` 1:1，`id` = `auth.users.id`。
- 通过 supabase-auth `on_auth_user_created` trigger 自动 insert profile。

## 数据模型
```sql
create table zhiyu.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (length(username) between 3 and 20),
  display_name text,
  avatar_url text,
  locale text default 'en',
  bio text,
  hsk_self_level smallint default 0,   -- 0..6
  goal text,                            -- travel/business/heritage/exam
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on zhiyu.profiles (locale);
```
- RLS：`for select using (true)`（公开读 username/avatar）；`for update using (auth.uid() = id)`。
- trigger：`handle_new_user` insert profile + 默认 username = 'user_' || substr(id, 1, 8)。

## Acceptance Criteria
- [ ] migration 文件在 `system/apps/api/drizzle/migrations/`
- [ ] RLS 启用 + 4 条策略（select/insert/update/delete）
- [ ] trigger 存在并跑通
- [ ] supabase-studio 可见表与策略
- [ ] drizzle schema 同步：`system/packages/sdk/src/db/profiles.ts`

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm drizzle-kit migrate
docker compose exec zhiyu-app-be pnpm vitest run profiles.rls
```
- 集成测试：用 anon key 尝试 update 他人 profile 必须失败

## DoD
- [ ] migrate 成功；策略正确
- [ ] 注册新用户后 profiles 自动出现新行

## 不做
- Avatar 上传（属 ZY-03-04）
- 设置面板 UI（属 ZY-03-05）

## 依赖
- 上游：ZY-01-05（supabase init）
- 下游：ZY-03-02 / 04 / 05
