# ZY-05-01 · PWA Manifest + Service Worker（无外部 SaaS）

> Epic：E05 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 在手机/桌面浏览器可安装 ZhiYu，离线时仍能浏览已访问内容
**So that** 用户像原生 app 一样使用，并降低弱网体验损耗。

## 上下文
- 工具：vite-plugin-pwa（workbox 内嵌，无外部服务）。
- 4 语对应 4 套图标 / 启动屏；统一 manifest，name = "ZhiYu"。
- 缓存策略：HTML stale-while-revalidate；JS/CSS cache-first（带 hash）；API 短期 nettwork-first 5s 超时回缓存；图片 cache-first 30 天。
- 不向外部 SaaS 推 push（无 OneSignal）；推送占位接 ZY-05-06。

## Acceptance Criteria
- [ ] manifest.webmanifest + 6 尺寸 icon + maskable + Apple touch icon
- [ ] sw.js 注册 + 升级提示 UI（"新版本已就绪，刷新"）
- [ ] 4 个缓存策略生效，可在 DevTools Application 验证
- [ ] Lighthouse PWA 100
- [ ] 离线访问已访问页面成功

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web build
```
- MCP Puppeteer：访问首页 → 断网 → 刷新仍可见

## DoD
- [ ] 安装提示出现（Chrome/Edge）
- [ ] 离线刷新可见
- [ ] iOS 添加到主屏幕图标正确

## 不做
- WebPush 真实推送
- Background Sync 高级功能

## 依赖
- 上游：ZY-02 / ZY-04
