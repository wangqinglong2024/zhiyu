# 16 · 性能与质量

## 一、性能预算

| 指标 | 应用端目标 | 后台目标 |
|---|---:|---:|
| FCP | < 1.8s | < 2.0s |
| LCP | < 2.5s | < 3.0s |
| TTI | < 3.5s | < 5.0s |
| CLS | < 0.1 | < 0.1 |
| INP | < 200ms | < 250ms |
| 首屏 JS gzip | < 200KB | 按路由分包 |
| 首屏 CSS gzip | < 50KB | < 80KB |

游戏：首次画布 ≤ 800ms，中端机 60fps，首屏资源 ≤ 5MB。

## 二、加载策略

- 路由级 code split。
- 编辑器、图表、PixiJS 游戏按需加载。
- 图片 lazy + srcset + WebP/AVIF。
- 音频 metadata only，播放时加载。
- 字体当前语言 + 中文子集优先，自托管加载。

## 三、缓存与离线

- App Shell：Service Worker cache-first。
- 静态资源：本地 nginx/cache header + SW。
- API：按业务设置 network-first 或 SWR。
- 用户数据写操作仅在线。
- 已下载内容使用 IndexedDB，并明确离线标记。

## 四、观测

- 前端错误：POST `/api/v1/_telemetry/error` 写自建 `error_events`。
- 产品事件：POST `/api/v1/_telemetry/events` 写自建 `events`。
- Web Vitals：写自建事件表，不接外部分析 SaaS。
- 后端：pino JSON、request_id、Prometheus 格式 `/metrics`，仅内网访问。

## 五、SEO

- 主应用 SPA + 动态 meta。
- Discover China 文章输出 title/description/og/canonical/hreflang/Article JSON-LD。
- 受限类目未登录可见范围不得泄露正文。
- sitemap 本地脚本生成，多语言分文件。

## 六、安全头

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  connect-src 'self' ws: wss:;
  frame-ancestors 'none';
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

若未来引入外部 provider，必须先更新 `planning/rules.md` 与安全白名单。

## 七、本地质量验证

全部验证在 Docker/dev 环境完成：
- TypeScript strict。
- ESLint/Prettier。
- Vitest + React Testing Library。
- Storybook 本地 stories 与 interaction tests。
- axe-core 本地 a11y。
- Lighthouse 本地报告。
- MCP Puppeteer 对 `http://115.159.109.23:3100` 与 `:4100` 做 E2E/截图 smoke。
- 本地视觉截图基线，不使用云视觉回归服务。

## 八、质量门禁

- 无 Sentry/PostHog/BrowserStack/远程云测试依赖。
- Docker compose 可启动。
- 核心路由 smoke 通过。
- a11y ≥ 95。
- 首屏包体与 Web Vitals 达标。
- UI 4 语 key 完整。
- Discover China 访问门禁、音频代理、SEO 不泄露受限内容。

## 九、验收

- [ ] 性能报告、a11y 报告、E2E smoke 均可本地生成。
- [ ] CSP 与安全头生效。
- [ ] 自建事件/错误上报可查。
- [ ] 无外部托管 SaaS 作为 v1 必需路径。