# ZY-08-06 · 完课庆祝 + 付费墙

> Epic：E08 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 完成 lesson 时有视觉反馈，遇到付费章节看到清晰的解锁选项
**So that** 学习有正反馈，付费转化路径明确。

## 上下文
- 完课 → 全屏粒子 + XP 增加动画 + "继续 / 复习 / 分享" 三按钮。
- 付费墙：未购买且 lesson.is_free=false → 渲染 paywall 卡（plan 列表 + 单课购买 + 用 ZC 购买）。
- entitlement 检查：BE 拦截 + FE 提前判断（接 ZY-13）。

## Acceptance Criteria
- [ ] 完课庆祝组件（lottie / 粒子）
- [ ] paywall 组件 + 三种解锁路径（订阅 / 单买 / ZC 兑换）
- [ ] 后端 `GET /api/v1/me/entitlements` 列出
- [ ] 分享按钮调原生 share API
- [ ] 4 语文案

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run paywall
```
- MCP Puppeteer：未购付费 lesson → 看到 paywall

## DoD
- [ ] 三路径全可点
- [ ] 庆祝动画在低端机不卡

## 依赖
- 上游：ZY-08-04 / ZY-13 / ZY-12
