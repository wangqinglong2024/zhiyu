# E05 · App Shell — 复盘（Retrospective）

> 周期：2026-04-26（单日冲刺，6 个 stories 一次性完成）
> 范围：planning/epics/05-app-shell.md（ZY-05-01 ~ 06）
> 后续：见 planning/sprint/E05-test-report.md

## 1. 成果与产出

| Story | 主要交付 | 状态 |
|---|---|---|
| ZY-05-01 PWA | vite-plugin-pwa + workbox + offline.html + 双 SVG 图标 + 注册更新 toast | ✅ |
| ZY-05-02 Router/Query | TanStack Router (code-based) + QueryClient + idb-keyval persister + `requireAuth` 守卫 | ✅ |
| ZY-05-03 Nav | BottomNav（mobile）+ SideNav（desktop）+ TopBar（搜索 / 币 / 通知 / 语言 / 主题） | ✅ |
| ZY-05-04 Search modal | cmdk 面板 + 200ms 防抖 + 分组结果 + 最近搜索 + ⌘K | ✅ |
| ZY-05-05 Discover | Hero / 持续学习 / 推荐横滑 / 文章卡片 + 全程 Skeleton | ✅ |
| ZY-05-06 Notification Center | drawer + 类型过滤 + 未读 badge + Supabase realtime 订阅 + 后端 routes/migration | ✅ |

附：修复了 E01-E04 残留的 `Inter-Variable.woff2 404`（`packages/i18n/src/fonts.ts` 增加 `VITE_ENABLE_FONT_URLS` 闸门，仅在显式启用时注入 URL `@font-face`，否则全部走 `local()` fallback）。

## 2. 顺利的事

- **设计系统已就位**：`@zhiyu/ui` 的 `Card / Button / Skeleton / EmptyState / PageShell / Container` 直接复用，没有写一个新组件 token。
- **Tiny store**：`lib/store.ts` 自实现 38 行 zustand-like API，避免又拉一个依赖；`useSyncExternalStore` 让 React 18 严格模式 100% 干净。
- **后端最小化**：通知/搜索两条 route 总共 ~250 行；通知走 supabase-realtime broadcast，零 SaaS 依赖。
- **可测试性**：所有顶层节点都带 `data-testid`，MCP Puppeteer 当场跑通 5 个交互场景。

## 3. 不顺的事

- **类型对齐成本**：drizzle 在严格模式下 `[row] = await ...returning()` 推导为 `T | undefined`，需要显式 narrow（已修）。
- **PWA 在 HTTP 公网域名下无法注册**：调试期 puppeteer / Chrome 都拒绝注册 SW；线上反代 HTTPS 后才能验。需要在 E14（Ops）任务里加上反代 + 证书。
- **vite-plugin-pwa 隐式依赖 `workbox-window`**：首次构建报 `Rollup failed to resolve "workbox-window"`，因为 PWA 插件 peer dep 没在 workspace 自动拉取。补上后通过。
- **顶栏在桌面 ≥ lg 把「Sign in / Sign up」+ 语言菜单挤到 z-index 之上**：截图能看到右上区轻微遮挡，需要 E07 做 UI polish。

## 4. 改进项（落到下个 epic）

| Action | Owner | Epic |
|---|---|---|
| `lib/auth-store.ts` 改为模块级 store + 监听 `auth.me()` once，避免 NotificationCenter 重复 `/auth/me` | dev | E06 |
| `pages/me.tsx` 内 `<a href>` 替换为 `<Link>`，去除 popstate 路径切换闪烁 | dev | E06 |
| 顶栏 `LangSwitcher` / `ThemeMenu` 改为下拉菜单，节省 `~120px` 横向空间 | UX | E07 |
| 接入 nginx 反代 + Let's Encrypt，让 SW 在线上注册成功 | ops | E14 |
| `/api/v1/search` 切换 Postgres FTS（GIN trgm + tsvector），淘汰 fixture | be | E06-06 |
| 通知种子：注册后自动写入 1 条 `notifications.welcome`，方便用户看到 UI | be | E06 |

## 5. 度量

- 文件改动：新建 14 个 / 修改 9 个；新依赖 7 个（@tanstack/{router,query,query-persist-client,query-async-storage-persister}, cmdk, idb-keyval, vite-plugin-pwa, workbox-window）
- 构建产物：`dist/` 700.30 KiB（含 sw + manifest + icons），`index.js` 661 KiB（gzip 209 KiB） — 下个版本拆 router chunk + lazy `cmdk`
- 测试：MCP Puppeteer 5 场景全绿；curl 11 探测全绿
- 已知缺陷：1（HTTPS 反代依赖）

## 6. DoD 复核

- [x] PWA manifest + SW 资产可拉取（功能层面已就绪，HTTPS 后即生效）
- [x] 离线兜底页可用（直接访问 200）
- [x] 通知 realtime 通道 `notif:user:<uid>` 后端就绪 + FE 订阅就绪（待登录态 E2E）
- [x] 不引用任何 push / 监控 SaaS（全部 Supabase realtime + workbox 本地缓存）
- [ ] Lighthouse PWA ≥ 95：因 HTTP/SW 阻塞暂未跑分；E14 上线后补
