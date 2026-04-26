# ZY-02-06 · 反馈与布局组件（Toast / Banner / EmptyState / Skeleton / Grid）

> Epic：E02 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 前端开发者
**I want** 一组反馈型与布局型组件
**So that** 业务可以快速实现成功 / 错误 / 加载 / 空态等通用交互，无需各自实现。

## 上下文
- 反馈型基于 sonner（Toast）+ 自封装 Banner / Alert / Confirm。
- 布局型：`Stack` / `HStack` / `VStack` / `Grid` / `Container` / `PageShell`（页脚顶占位 + 主区滚动）。
- 与 ZY-02-05 解耦：不依赖于其内部实现细节。

## Acceptance Criteria
- [ ] `Toast` 全局 Provider（`<Toaster />`）+ 命令式 `toast.success/error/info/loading`
- [ ] `Banner`（页面顶部条）/ `Alert`（块内提示）/ `Confirm`（命令式 promise）
- [ ] `EmptyState`：插图 + 标题 + 描述 + 主操作 slot；4 种插图（首次 / 无结果 / 错误 / 完成）
- [ ] `Skeleton` 骨架（rect / circle / line + shimmer 动效，遵循 motion tokens）
- [ ] 布局组件：`Stack/HStack/VStack`、`Grid`（fluid / fixed cols）、`Container`（断点最大宽）、`PageShell`（顶 nav + 主滚动 + 底 nav 4 区）
- [ ] 全部 SSR-safe（Vite SSR 试跑）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/ui test
```
- 视觉：MCP Puppeteer 跑 Storybook 截图比对

## DoD
- [ ] 命令式 API 类型完整
- [ ] EmptyState 插图为 SVG inline，无外部 CDN

## 不做
- 复杂表单（v1.5）
- 拖拽 / 树组件（按需加）

## 依赖
- 上游：ZY-02-01 / 02 / 05
- 下游：ZY-05 / 业务页面普遍使用
