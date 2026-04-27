# DC-25 · 实现非功能、安全、可访问性与可观测性验收闭环

## PRD 原文引用

- `DC-NFR-001`：“类目列表 LCP < 2s；单篇 LCP < 2.5s；音频加载 < 500ms。”
- `DC-NFR-003`：“WCAG 2.1 AA；键盘可达；屏幕阅读器测试通过；颜色对比度 ≥ 4.5:1。”
- `DC-NFR-004`：“未登录访问限流；内容水印；音频签名 URL；CSP 头正确。”
- `DC-NFR-006`：“阅读 / 完读 / 收藏 / 分享事件埋点；文章 view_count 准确；错误率 < 0.1%。”

## 需求落实

- 页面：DC 首页、类目列表页、文章详情页、搜索页、分享入口。
- 组件：A11yAuditChecklist、TelemetryEventClient、SignedAudioUrlResolver。
- API：`/api/v1/events`、`/api/v1/_telemetry/error`、DC 公开 API 限流、音频访问 proxy 与 CSP 响应头。
- 数据表：`events`、`security_events`、`content_articles.view_count`。
- 状态逻辑：所有可访问性、安全和埋点要求必须在 Docker dev 环境内用 MCP Puppeteer 或容器内测试复现。
- 限流数值：`GET /api/discover/categories` 为 60/min/IP；`GET /api/discover/categories/:slug/articles` 为 30/min/IP；`GET /api/discover/articles/*` 为 30/min/IP；progress 为 1/2s/user；favorite/share 为 10/min/user；note 为 5/min/user。

## 不明确 / 风险

- 风险：PRD 中“CDN 命中”是历史表述，违反本期无外部 CDN 规则时会误导实施。
- 处理：验收统一改为“本地 nginx/cache header/SW 命中”。开放类目音频可共享缓存；受限类目音频必须通过应用层 proxy 鉴权后进入用户私有缓存。

## 技术假设

- 禁用 Sentry/PostHog 等外部 SaaS；错误上报和行为分析均写自建接口与表。
- 内容水印使用服务端插入的零宽字符或等价不可见标记，不能破坏中文、拼音、翻译显示。

## 最终验收清单

- [ ] Docker dev 下类目列表 LCP < 2s，文章页 LCP < 2.5s，音频首包或可播放态 < 500ms（本地缓存命中）。
- [ ] 首页、列表、文章页、搜索页通过键盘导航、ARIA label、屏幕阅读器和 4.5:1 对比度检查。
- [ ] 未登录访问受限类目被限流与门禁拦截，CSP 头存在且不放开危险源。
- [ ] 音频 URL 不暴露永久可抓取地址，受限类目音频只能经鉴权 proxy 访问，不能被匿名直连或共享缓存命中。
- [ ] 阅读、完读、收藏、分享、搜索、登录引导事件写入 `events`，错误写入本地遥测接口。
- [ ] `content_articles.view_count` 在真实阅读访问时准确增加，后台预览和爬虫探测不污染统计。
- [ ] PRD 中每个公开/登录 API 的限流数值有配置、测试和超限响应码。