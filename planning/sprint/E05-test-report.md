# E05 · App Shell — 浏览器测试与冒烟报告

> 日期：2026-04-26 · 环境：`http://115.159.109.23:3100`（zhiyu-app-fe）/ `:8100`（zhiyu-app-be）
> 工具：MCP Puppeteer（headless Chrome over HTTP）+ curl

## 端点冒烟（curl）
| # | 探测 | 期望 | 结果 |
|---|---|---|---|
| 1 | `GET /` | 200 + HTML | ✅ 200 |
| 2 | `GET /manifest.webmanifest` | 含 name/theme/icons | ✅ name=`Zhiyu · 知语` theme=`#e11d48` icons=3 |
| 3 | `GET /sw.js` | 200 + JS | ✅ 200 |
| 4 | `GET /offline.html` | 200 | ✅ 200 |
| 5 | `GET /icons/zhiyu-192.svg` | 200 | ✅ 200 |
| 6 | `GET /api/v1/search?q=hsk` | grouped | ✅ total=4，命中 course/lesson |
| 7 | `GET /api/v1/notifications` | 401 | ✅ HTTP 401 unauthenticated |
| 8 | CSS 中 `Inter-Variable.woff2` 引用 | 0 | ✅ 0（**E01-E04 字体 404 已修复**）|
| 9 | `GET /play` SPA fallback | 200 | ✅ 200 |
| 10 | `GET /me` SPA fallback | 200 | ✅ 200 |
| 11 | Admin `:4100/` | 200 | ✅ 200 |

## 浏览器交互（MCP Puppeteer）

### ZY-05-01 PWA Manifest + SW
- `<link rel="manifest">`：✅ 存在
- 离线页：`/offline.html` 200 + 双语副本
- SW 注册：⚠️ 在公网 HTTP 站点 + headless 环境无法注册（浏览器要求 HTTPS / localhost）。`sw.js` 资产构建正确，生产 HTTPS 反代后即可工作。

### ZY-05-02 Router + Query
- 受保护路由：`GET /me` → URL 重定向至 `/signin?next=%2Fme` ✅
- 未登录态下其他路径无 401 噪声
- TanStack Router code-based 配置加载、路由切换全部正常

### ZY-05-03 BottomNav + TopBar
- 桌面（1280×800）：左侧 SideNav + 顶栏搜索按钮含 ⌘K 提示，右侧通知/币/语言/主题菜单全部渲染
- 移动（390×812）：BottomNav 玻璃浮动导航 5 项可见、Discover 高亮、安全区已留
- 点击 `tab-courses` → 路径切换至 `/learn`，渲染 `[data-testid="learn-page"]` ✅

### ZY-05-04 全站搜索 modal
- 点击顶栏搜索按钮打开命令面板（`[data-testid="command-palette"]`）
- 输入 `hsk` 200ms 后返回分组结果：Courses 2 条 + Lessons 2 条 ✅
- 推荐入口、最近搜索、键盘快捷键 `⌘K`/`Ctrl+K` + `Escape` 已接入

### ZY-05-05 Discover 首页
- Hero / 持续学习 / 推荐课程横向滚动 / 文章三栏 全部渲染
- 600ms Skeleton → 数据切换平滑（`Skeleton` 组件占位）
- 中英混排无乱码（系统字体 fallback 生效）

### ZY-05-06 通知中心
- 顶栏铃铛按钮 + badge 占位组件挂载
- 未登录用户列表为空（按设计跳过 `/api/v1/notifications` 401 后静默）
- Supabase realtime 频道 `notif:user:<uid>` 在登录后由 `useEffect` 订阅；`/api/v1/notifications/_demo` 用于触发演示
- 端到端 realtime 双窗口测试需登录态，留给 E03 集成测试套件

## 已知遗留
- **HTTP 环境下 Service Worker 不注册**：仅生产 HTTPS 可启用 PWA 运行时缓存与离线兜底。功能上构建产物已就绪。
- **搜索后端为 fixture**：`/api/v1/search` 当前返回 13 条静态种子；待 ZY-06-06 接入 Postgres FTS 时切换。
- **`/me` 直接 `<a>` 跳转**：旧 me.tsx 内部仍用 `window.history.pushState`，与 TanStack Router 兼容（监听 popstate），但导航闪烁。E06 时统一为 `<Link>`。
