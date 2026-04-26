# ZY-04-03 · 按语言加载字体（分语种 chunk）

> Epic：E04 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 切换到 zh / ar 时才加载对应字体
**So that** 我的语言不需要的字体不浪费带宽。

## 上下文
- ZY-02-04 已自托管字体；本故事补"按 lng 决定 link rel=preload"逻辑。
- Vite 动态 import font css chunk；CSS `@font-face` 拆分到 `<lang>.css`。
- chunk 加载 race condition：先 fallback 系统字体，字体到位后立即 swap。

## Acceptance Criteria
- [ ] FE 切换 lng → 自动加载对应字体 chunk（一次后缓存）
- [ ] 首屏只加载 default lng 字体；其它懒加
- [ ] CLS（Cumulative Layout Shift）≤ 0.05
- [ ] aria 通知 lng 切换（屏幕阅读器）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web build
```
- MCP Puppeteer + Lighthouse：切换 lng 跑性能测试

## DoD
- [ ] CLS 达标
- [ ] zh→en 不重复加载

## 依赖
- 上游：ZY-02-04 / ZY-04-01
