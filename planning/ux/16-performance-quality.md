# 16 · 性能与质量（Performance & Quality）

## 一、性能预算

### 1.1 加载指标（应用端 PWA）
| 指标 | 目标 |
|---|---|
| FCP First Contentful Paint | < 1.5s |
| LCP Largest Contentful Paint | < 2.5s |
| TTI Time to Interactive | < 3.5s |
| CLS Cumulative Layout Shift | < 0.1 |
| INP Interaction to Next Paint | < 200ms |
| Total JS (gzip) 首屏 | < 200KB |
| Total CSS (gzip) | < 50KB |
| Total Images 首屏 | < 500KB |
| 字体（首屏 critical） | < 100KB |

### 1.2 加载指标（后台）
- 较应用端宽松：FCP < 2s, TTI < 5s
- 关键页 < 3s

### 1.3 运行时
| 场景 | 目标 |
|---|---|
| 路由切换 | < 300ms |
| 列表滚动 | 60fps |
| 游戏帧率 | 60fps（中端） |
| 表单提交反馈 | < 100ms |
| 搜索响应 | < 500ms (debounce 300ms) |

### 1.4 资源
| 资源 | 限额 |
|---|---|
| 单图（cover） | < 200KB |
| 单音频（句子） | < 50KB |
| 单 Lottie | < 100KB |
| 单游戏首屏 | < 5MB |
| 字体（按语言） | < 500KB |

## 二、加载策略

### 2.1 代码分割
- 路由级 lazy + Suspense
- 大组件 lazy（编辑器 / 图表）
- vendor 分包（react / tanstack / pixi）

### 2.2 预加载
- 关键路由 preload
- 字体 preload
- Hero 图 preload
- 下一页 prefetch

### 2.3 资源加载
- 图片 lazy + IntersectionObserver
- 音频 metadata only，播放时加载
- 视频 poster + 点击加载

### 2.4 缓存
- Service Worker 缓存
- 应用 Shell 长缓存
- API 响应 Cache-Control + SWR
- 图片 / 音频 长缓存 (CDN)

## 三、PWA 离线

### 3.1 离线策略
- App Shell：cache-first
- 静态资源：cache-first
- 学习内容（已下载）：cache-first
- API 请求：network-first + 缓存
- 用户数据：仅在线

### 3.2 离线下载
- 用户主动下载课程 / 文章
- 本地 IndexedDB 存储
- 显示已下载标记

### 3.3 离线 UI
- Banner 提示
- 不可用功能 disable
- 已缓存内容正常显示

## 四、监控与可观测性

### 4.1 前端监控
- Web Vitals 上报
- 错误边界 + Sentry
- 性能 timing
- 用户行为埋点（PostHog）

### 4.2 关键事件
- 注册 / 登录
- 课程开始 / 完成
- 游戏开始 / 结束
- 付费事件
- 客服会话

### 4.3 后台
- API 响应时间
- 错误率
- 数据库慢查询
- 工厂任务成功率

## 五、SEO

### 5.1 SSR / SSG
- 营销页 SSG（Vite SSG / Astro，可选）
- 主应用 SPA + Meta tag

### 5.2 Meta
- title / description / og / twitter
- canonical
- hreflang

### 5.3 结构化数据
- Article schema
- Course schema
- Game schema (待标准)

### 5.4 Sitemap
- 自动生成
- 提交搜索引擎

## 六、安全

### 6.1 HTTPS
- 强制 HTTPS
- HSTS

### 6.2 CSP
```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://*.cloudflare.com https://*.r2.dev;
media-src 'self' https://*.r2.dev;
connect-src 'self' https://api.zhiyu.io wss://api.zhiyu.io;
frame-ancestors 'none';
```

### 6.3 其他
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy 限制

### 6.4 OWASP Top 10
- 全部检查清单
- DAST + SAST 扫描

## 七、测试

### 7.1 单测
- Vitest
- 覆盖率目标 80%（核心模块 95%）

### 7.2 组件测试
- React Testing Library
- Storybook + Interaction Tests

### 7.3 E2E
- Playwright
- 关键路径：注册、付费、学习、游戏
- 跨浏览器（Chrome / Safari / Firefox）

### 7.4 视觉回归
- Chromatic / Percy
- 关键组件 + 关键页

### 7.5 性能测试
- Lighthouse CI
- 阈值：Performance 90+, A11y 95+, BP 90+, SEO 90+

### 7.6 a11y
- axe-core CI
- 手动 VoiceOver / TalkBack

## 八、CI / CD

### 8.1 流水线
- PR：lint + type + test + build
- Main：deploy preview
- Release：deploy prod

### 8.2 检查
- TypeScript strict
- ESLint
- Prettier
- Stylelint
- 包大小变化报警

## 九、版本管理

### 9.1 版本号
- semver: major.minor.patch
- 应用 v1.0.0 起

### 9.2 升级提示
- PWA 检测新版本
- Toast 提示用户刷新
- 强制升级（破坏性更新）

## 十、错误处理

### 10.1 ErrorBoundary
- 全局 + 路由级
- 上报 Sentry
- 用户友好 fallback

### 10.2 网络错误
- 重试（指数退避）
- 超时（10s 默认）
- 离线检测

### 10.3 异常上报
- Sentry 自动捕获
- 用户主动反馈

## 十一、性能优化清单

- [ ] 路由级代码分割
- [ ] 图片 lazy + WebP
- [ ] 字体 preload + display swap
- [ ] vendor 分包
- [ ] Tree-shaking 检查
- [ ] 移除未使用 CSS（PurgeCSS）
- [ ] Lighthouse 90+
- [ ] Core Web Vitals 全绿
- [ ] 包大小预算 CI

## 十二、质量门禁

PR 必须通过：
- ✅ TS 类型检查
- ✅ ESLint
- ✅ 单测覆盖率不下降
- ✅ E2E 关键路径通过
- ✅ Lighthouse 不下降
- ✅ 包大小不增加 > 5%
- ✅ a11y 检查通过
- ✅ 视觉回归人工审

## 十三、检查清单

- [ ] 核心 Web Vitals 全部达标
- [ ] PWA 可安装可离线
- [ ] 主流设备 60fps
- [ ] CSP 策略生效
- [ ] 监控覆盖关键路径
- [ ] CI/CD 全自动
- [ ] 错误率 < 0.5%
