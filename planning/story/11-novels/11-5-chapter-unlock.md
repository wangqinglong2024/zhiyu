# ZY-11-05 · 章节解锁（ZC 单章 / VIP 全开 / 自动订阅扣费）

> Epic：E11 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 读者
**I want** 用 ZC 单章解锁、用 VIP 一键全部解锁，或开启自动订阅顺序解锁后续章
**So that** 不被付费打断阅读节奏。

## 上下文
- 解锁记录表 `zhiyu.chapter_unlocks(user_id, chapter_id, source, created_at)`，主键复合。
- VIP 期内全部章节有效；过期不退。
- 自动订阅 = 用户在阅读器开开关 → BE 在每次进入未购章节时自动尝试 ZC 扣费（接 ZY-12-03 spend），失败 → 引导充值。

## 数据模型
```sql
create table zhiyu.chapter_unlocks (
  user_id uuid not null,
  chapter_id uuid not null references zhiyu.chapters(id) on delete cascade,
  source text not null,                 -- 'zc' | 'vip' | 'auto' | 'gift'
  cost_coins int default 0,
  created_at timestamptz default now(),
  primary key (user_id, chapter_id)
);
create table zhiyu.novel_auto_subs (
  user_id uuid not null,
  novel_id uuid not null,
  enabled boolean default true,
  primary key (user_id, novel_id)
);
```

## Acceptance Criteria
- [ ] `POST /api/v1/chapters/:id/unlock` { source } 校验 + 扣费 + 写表
- [ ] VIP 用户 = 自动通过（无需扣费）
- [ ] auto_subs 开关接口 + 阅读器 UI
- [ ] 失败 → i18n 错误 + 引导充值

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run chapter.unlock
```

## DoD
- [ ] 三种解锁方式正确
- [ ] 自动订阅扣费失败可恢复

## 依赖
- 上游：ZY-12-03 / ZY-13
