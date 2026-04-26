# ZY-13-05 · 续费与宽限期

> Epic：E13 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 订阅用户
**I want** 自动续费、失败有 3 天宽限再失效、到期前邮件提醒
**So that** 不会因为银行卡临时拒付而立即失去权益。

## 上下文
- BullMQ daily cron：扫即将到期 / 已到期订阅
- 续费失败 → 状态 `past_due` + 通知 + 3 天后未补 → `expired` 移除 entitlement
- EmailAdapter (fake) 在 D-7 / D-3 / D-1 / D0 各发一次

## Acceptance Criteria
- [ ] cron job 注册（worker 容器）
- [ ] 状态切换：active → past_due（D0 失败） → expired（D+3 未补）
- [ ] entitlement 在 expired 时间点移除（job 处理）
- [ ] 通知 + 邮件提醒触发记录
- [ ] FE 在 past_due 显示醒目 banner

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-worker pnpm vitest run renewal
```
- 手动跑 `pnpm worker:run subscription:tick` 验证

## DoD
- [ ] 状态流转正确
- [ ] 3 天宽限生效

## 依赖
- 上游：ZY-13-04 / ZY-05-06 / ZY-19-06
