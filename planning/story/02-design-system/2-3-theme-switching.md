# ZY-02-03 · 主题切换（亮 / 暗 / 跟随系统）

> Epic：E02 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 在头像菜单切换亮 / 暗 / 跟随系统主题
**So that** 在任何环境下视觉舒适，并跨设备记住偏好（登录后同步）。

## 上下文
- 未登录：偏好存 `localStorage:theme`。
- 登录后：同步 supabase `zhiyu.user_settings.theme` 字段（接 ZY-03-04 用户设置）。
- 默认 `system`，监听 `prefers-color-scheme` 媒体查询。
- 切换不刷新页面，无闪烁（FOUC 避免：HTML 顶端内联脚本提前注入 `data-theme`）。

## Acceptance Criteria
- [ ] `apps/web` / `apps/admin` `index.html` 头部内联 inline script 提前读 storage 注入 `data-theme`
- [ ] `<ThemeMenu>` 组件：3 选项 + 当前态高亮
- [ ] 切换调用 `applyTheme()`（来自 @zhiyu/tokens），同时 PATCH `/api/v1/me/settings`（登录态）
- [ ] 监听 `matchMedia('(prefers-color-scheme: dark)')` change，`system` 模式实时跟随
- [ ] 0 ms FOUC（视觉不闪），通过 Lighthouse 校验

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run theme
```
- MCP Puppeteer：未登录切换 → 刷新仍生效；登录切换 → 另一浏览器登录后同步

## DoD
- [ ] FOUC 测试通过
- [ ] 登录态跨设备同步生效
- [ ] iOS PWA 模式下亦能跟随系统

## 不做
- user_settings 表（属 ZY-03-04）
- 高对比度模式（v1.5 评估）

## 依赖
- 上游：ZY-02-01 / ZY-02-02
- 下游：ZY-05 app shell
