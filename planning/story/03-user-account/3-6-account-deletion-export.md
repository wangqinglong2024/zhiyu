# ZY-03-06 · 账号注销与数据导出（GDPR）

> Epic：E03 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 一键导出我的全部数据，并在我决定后销户（30 天可撤销）
**So that** 满足 GDPR / 个保法对数据主体权利的要求。

## 上下文
- 注销分两阶段：标记 `pending_delete`（30 天宽限）→ 物理删 / 匿名化。
- 导出：BullMQ job → 拼装 JSON / CSV → 上传 supabase-storage → 邮件 fake link 24h 有效。
- 删除策略：profiles 物理删；学习记录匿名（user_id → 'anonymized-<hash>'）；订单 / 财务记录保留（合规）。

## Acceptance Criteria
- [ ] `POST /api/v1/me/export` 入队 → 生成 zip → 返回下载 url
- [ ] `POST /api/v1/me/delete` 标记 pending_delete + 立刻冻结登录
- [ ] `POST /api/v1/me/delete/cancel` 30 天内可撤销
- [ ] BullMQ cron 每日扫 pending_delete > 30d → 执行
- [ ] FE `/me/security/data` 提供导出 / 注销入口 + 二次确认 + 阅读条款 checkbox

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-worker pnpm vitest run me.export me.delete
```

## DoD
- [ ] 导出 zip 完整且可下载
- [ ] 注销 30 天后 profiles 真正消失
- [ ] 财务记录不丢失

## 不做
- 部分数据导出 / 选择性遗忘（v1.5）

## 依赖
- 上游：ZY-03-01..05 / ZY-18-04
- 下游：合规清单 ZY-20-06
