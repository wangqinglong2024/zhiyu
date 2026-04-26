# ZY-05-05 · 发现 / 学习首屏骨架与 SSR-Lite

> Epic：E05 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 首屏即时看到内容骨架，不要白屏
**So that** TTI 体感快，弱网下也能立刻感知。

## 上下文
- 不上 SSR；改用 SSR-lite：构建期生成发现首页 / 课程 list 静态 HTML 片段（vite plugin 自定义），运行时注水。
- 骨架占位用 ZY-02-06 Skeleton。
- 关键资源 preload：default lng 字体 + 首屏 hero 图（webp + lqip）。

## Acceptance Criteria
- [ ] 构建期生成 4 语 × 2 路由（`/`、`/courses`）静态 HTML 注入
- [ ] LCP ≤ 2.5s，FCP ≤ 1.5s（4G 节流）
- [ ] 骨架 → 数据 swap 平滑无跳动
- [ ] 不阻塞 SW 注册

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web build
```
- MCP Puppeteer + Lighthouse：4G slow 跑性能

## DoD
- [ ] 性能指标达标
- [ ] 4 语首屏均验证

## 不做
- 全站 SSR / SSG（v1.5）

## 依赖
- 上游：ZY-05-02 / ZY-02-06
