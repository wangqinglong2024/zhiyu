# ZY-02-07 · Storybook 内部站点（容器内）

> Epic：E02 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 设计师 / 开发者
**I want** 在 docker 内运行 Storybook 浏览所有组件
**So that** 可视化验收 + 自动 a11y + 视觉回归基础。

## 上下文
- Storybook 跑在 `system/packages/ui` 的 dev server，端口 6100（仅内网，nginx 不暴露公网；通过 SSH 转发或临时 docker port 映射访问）。
- 不接 Chromatic（SaaS 禁用）；视觉回归用本地 puppeteer 截图 + 手动 review。
- 故事覆盖：所有 ZY-02-05 / 06 组件 + 颜色板 + 排版表 + 间距示例。

## Acceptance Criteria
- [ ] `pnpm --filter @zhiyu/ui storybook` 容器内启动 :6100
- [ ] 所有组件 ≥ 1 故事 + variant 矩阵
- [ ] addon-a11y / addon-controls / addon-themes（亮暗切换）启用
- [ ] `pnpm --filter @zhiyu/ui storybook:build` 输出静态 `storybook-static/`
- [ ] 静态站点可通过 `docker compose exec zhiyu-app-fe http-server packages/ui/storybook-static -p 6100 -a 0.0.0.0` 临时托管

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/ui storybook:build
```
- MCP Puppeteer：访问 `http://115.159.109.23:6100`（启临时映射后），逐故事截图

## DoD
- [ ] 全组件可见，亮暗切换正常
- [ ] a11y addon 0 critical violations
- [ ] **不**部署到 Chromatic / Vercel

## 不做
- 视觉自动回归（v1.5 评估）
- 公网托管（不开放）

## 依赖
- 上游：ZY-02-05 / 06
- 下游：UX 验收
