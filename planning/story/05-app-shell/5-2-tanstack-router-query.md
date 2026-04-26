# ZY-05-02 · TanStack Router + Query 接入

> Epic：E05 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 前端开发者
**I want** TanStack Router（文件路由）+ TanStack Query（数据缓存）作为 SPA 默认基础设施
**So that** 路由 / 数据 / loader 标准化，SSR 不需要、PWA 友好。

## 上下文
- 物理：`system/apps/web/src/routes/` 文件即路由；自动生成 `routeTree.gen.ts`。
- Query：默认 `staleTime: 30s`，全局 retry 1 次；Mutation 失败 toast。
- 鉴权 loader：未登录访问受保护路由 → redirect `/signin?next=...`。
- 错误边界 + Suspense fallback 用 ZY-02-06 Skeleton。

## Acceptance Criteria
- [ ] `apps/web` 路由迁移到 TanStack Router；首页 + signin + 设置页可达
- [ ] Devtools 在 dev 启用
- [ ] Query 全局 client + persister（IndexedDB）：离线复用
- [ ] 路由 loader 类型推导链路通

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run router
```
- MCP Puppeteer：未登录访问 `/me` → 跳 `/signin`

## DoD
- [ ] 路由 + 数据缓存正常
- [ ] 离线 query 可见

## 不做
- 完整业务页面（散在各 epic）

## 依赖
- 上游：ZY-02 / ZY-03
