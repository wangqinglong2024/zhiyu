# ZY-03-05 · 设置 / 多端会话管理

> Epic：E03 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 在设置页查看正在登录的设备并一键登出某台 / 全部
**So that** 账号被盗时能快速止损。

## 上下文
- supabase-auth 默认每个 refresh_token 即一个 session；通过 GoTrue admin API 列出 / 撤销。
- 自建 `zhiyu.user_settings`（theme / locale / push_enabled / email_marketing_opt_in / tts_voice / a11y_motion）。
- 一键登出全设备 → 撤销所有 refresh + 写 audit_log。

## 数据模型
```sql
create table zhiyu.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'system',
  locale text default 'en',
  push_enabled boolean default true,
  email_marketing_opt_in boolean default false,
  tts_voice text default 'female-1',
  a11y_reduced_motion boolean default false,
  updated_at timestamptz default now()
);
```

## Acceptance Criteria
- [ ] `GET/PATCH /api/v1/me/settings`
- [ ] `GET /api/v1/me/sessions` 列出所有 session（device / ip / last_active）
- [ ] `DELETE /api/v1/me/sessions/:id` 单台登出
- [ ] `DELETE /api/v1/me/sessions` 全部登出（保留当前？给参数 `keepCurrent`）
- [ ] FE `/me/settings`、`/me/security` 两页

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run me.settings me.sessions
```
- MCP Puppeteer：开两浏览器登录 → 一台登出另一台 → 另一台 401

## DoD
- [ ] 单端 / 全端登出生效
- [ ] settings 持久化跨设备

## 不做
- 通知推送实际推送（v1.5）

## 依赖
- 上游：ZY-03-01..03
- 下游：ZY-02-03 / 通知系统
