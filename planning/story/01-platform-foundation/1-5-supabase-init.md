# ZY-01-05 · Supabase 接入与 schema 初始化

> Epic：E01 · 估算：M · 状态：ready-for-dev
>
> 顶层约束：[planning/00-rules.md](../../00-rules.md) §3（Supabase 全功能优先）

## User Story
**As a** 后端开发
**I want** 启动时自动创建 `dev_zhiyu` schema 并跑迁移
**So that** 后续所有业务表落在隔离 schema，且不污染 supabase 系统表

## 上下文
- Supabase 自托管已运行（容器 `supabase-db` / `supabase-kong` / `supabase-auth` / ...）
- DB 密码已在 `.env`：`POSTGRES_PASSWORD=root1234`
- Schema 命名：`dev_zhiyu` / `stg_zhiyu` / `public`(prod)
- 老 TCM schema 已 drop，public 干净

## Acceptance Criteria
- [ ] BE 用 `@supabase/supabase-js` 连接：
  - 服务端：`SUPABASE_URL=http://supabase-kong:8000` + `SUPABASE_SERVICE_ROLE_KEY`
  - 前端：`VITE_SUPABASE_URL=http://115.159.109.23:8000` + `SUPABASE_ANON_KEY`
- [ ] Drizzle 配置：
  - `drizzle.config.ts` 指向 `DATABASE_URL=postgres://postgres:root1234@supabase-db:5432/postgres?search_path=dev_zhiyu`
  - 迁移目录：`apps/api/drizzle/migrations/`
- [ ] BE 启动时执行 `pnpm db:migrate`：
  1. `CREATE SCHEMA IF NOT EXISTS dev_zhiyu`
  2. 跑迁移
  3. 失败 → 容器 unhealthy
- [ ] 首个迁移文件：`0001_init_meta.sql` 创建表 `dev_zhiyu._meta(id serial pk, version text, applied_at timestamptz default now())`
- [ ] BE 暴露 `GET /api/v1/_db/check`：返回 `{ schema, _meta_rows, supabase_kong_ok }`
- [ ] FE 暴露调试页 `/_debug/supabase`：用 anon key 调 `from('_meta').select('*')`，显示行数（仅 dev 编译）
- [ ] BE 调 supabase admin API `auth.admin.listUsers()` 在 `/_db/check` 中也确认 0 行

## 技术参考
- env.md §3
- spec/02 §四
- spec/05（数据模型，本 story 仅落 _meta）

## 测试方法
```bash
docker compose run --rm zhiyu-app-be pnpm db:migrate
curl -fsS http://115.159.109.23:8100/api/v1/_db/check | jq
# 期待：{ "schema": "dev_zhiyu", "_meta_rows": 0, "supabase_kong_ok": true, "auth_users": 0 }
```

MCP Puppeteer：访问 `http://115.159.109.23:3100/_debug/supabase`，截图含 "rows: 0"。

## DoD
- [ ] 测试方法全通过
- [ ] supabase Studio (`https://supabase.ideas.top`) 内可见 `dev_zhiyu` schema 与 `_meta` 表
- [ ] 重启容器幂等（不重复创建）
