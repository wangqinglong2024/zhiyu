# ZY-05-06 · 通知中心 + Supabase Realtime

> Epic：E05 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 实时收到通知（系统 / 学习提醒 / 客服回复 / 订单状态）
**So that** 不错过关键事件，无需手动刷新。

## 上下文
- supabase-realtime broadcast；通道 `notif:user:<uid>`。
- `zhiyu.notifications` 表落库，FE 既订阅 broadcast 又拉取历史列表。
- 类型：`system / learning / order / cs / referral`，带 read 状态。
- **禁止** Socket.io / Pusher / OneSignal。

## 数据模型
```sql
create table zhiyu.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title_key text not null,           -- i18n key
  body_key text,
  data jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index on zhiyu.notifications (user_id, created_at desc);
```

## Acceptance Criteria
- [ ] BE 工具 `notify(userId, type, titleKey, bodyKey?, data?)` 写表 + broadcast
- [ ] FE 顶栏铃铛 badge 实时更新；下拉列表 + "全部已读" + 类型筛选
- [ ] 失去连接自动重连（exponential backoff）
- [ ] 离线积累的通知重连后回拉

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run notif
```
- MCP Puppeteer：开两窗口；窗口 A 触发动作 → 窗口 B 实时显示

## DoD
- [ ] 实时延迟 ≤ 1s
- [ ] 不引入 Socket.io

## 不做
- WebPush / 邮件推送（v1.5）

## 依赖
- 上游：ZY-01-05 / ZY-02-06
- 下游：业务事件普遍调用
