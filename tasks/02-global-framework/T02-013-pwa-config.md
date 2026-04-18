# T02-013: PWA 配置 — manifest + Service Worker + 离线缓存

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现知语 Zhiyu 的 PWA（Progressive Web App）配置。包含：manifest.json 配置（应用名称/图标/主题色/启动画面）、Service Worker 注册与缓存策略（App Shell Cache First + 内容 Network First）、安装引导 Banner（第 2 次访问 ≥3 分钟触发）、版本更新提示 Banner。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/08-pwa.md` — PWA 完整需求
  - §一: manifest.json 配置（standalone 模式、竖屏锁定）
  - §二: Service Worker 缓存策略（分层缓存）
  - §三: 安装引导（第 2 次访问 + 停留 ≥3 分钟触发）
  - §四: 版本更新提示（检测到新版本 → 顶部 Banner "有新版本可用" + 更新按钮）
- 设计规范: `grules/01-rules.md` §一 — Cosmic Refraction 色彩（主题色 Rose #f43f5e）
- 关联任务: T02-012（布局组件就绪）→ 本任务 → T02-014（集成验证）

## 技术方案

### manifest.json

```json
{
  "name": "知语 Zhiyu - 探索中华之美",
  "short_name": "知语 Zhiyu",
  "description": "Learn Chinese through China's culture, history, and stories",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#f43f5e",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["education", "lifestyle"]
}
```

### Service Worker 缓存策略

| 资源类型 | 策略 | 说明 |
|---------|------|------|
| App Shell（HTML/CSS/JS） | Cache First | 优先缓存，后台更新 |
| 字体文件 | Cache First | 长期缓存 |
| 图片资源 | Cache First | 缓存 max 200 条 + LRU 淘汰 |
| API 数据（语言包等） | Stale While Revalidate | 先返回缓存，后台更新 |
| API 数据（用户数据） | Network First | 优先网络，离线回退缓存 |
| CDN 第三方资源 | Cache First | 长期缓存 |

### 安装引导 Banner

```
触发条件: 
  1. 非首次访问（localStorage 记录访问次数 ≥ 2）
  2. 本次停留 ≥ 3 分钟
  3. 浏览器支持 PWA 安装（beforeinstallprompt 事件）
  4. 用户未曾点击"不再提示"

Banner 设计:
  - 位置: 页面底部上方（Tab Bar 之上）
  - 样式: 毛玻璃面板 + Rose 色安装按钮
  - 内容: App 图标 + "添加知语到主屏幕" + 安装按钮 + 关闭按钮
  - 关闭后 7 天内不再提示
```

### 版本更新 Banner

```
检测方式: Service Worker 检测到新版本（registration.waiting）
Banner 设计:
  - 位置: 页面顶部（safe-area 下方）
  - 样式: Sky 色背景
  - 内容: "有新版本可用" + "立即更新" 按钮
  - 点击更新: skipWaiting() + 页面 reload
```

### 组件架构

```
frontend/src/features/pwa/
├── components/
│   ├── InstallBanner.tsx          # 安装引导 Banner
│   └── UpdateBanner.tsx           # 版本更新 Banner
├── hooks/
│   ├── use-pwa-install.ts         # 安装状态 + beforeinstallprompt
│   └── use-sw-update.ts           # Service Worker 更新检测
├── sw/
│   └── service-worker.ts          # Service Worker 主文件
├── types.ts
└── index.ts
```

## 范围（做什么）

- 实现 `manifest.json` 完整配置
- 创建应用图标占位（各尺寸 placeholder）
- 实现 Service Worker（5 种缓存策略）
- 实现 Service Worker 注册逻辑
- 实现 `InstallBanner` 安装引导组件
- 实现 `usePwaInstall` Hook（访问次数 + 停留时间 + beforeinstallprompt）
- 实现 `UpdateBanner` 版本更新提示
- 实现 `useSwUpdate` Hook（SW 更新检测）
- `index.html` 添加 PWA 相关 meta 标签

## 边界（不做什么）

- 不实现应用图标设计（使用占位图标）
- 不实现启动画面自定义动画
- 不实现后台同步（Background Sync）
- 不实现推送通知的 SW 处理（T02-009 已实现）

## 涉及文件

- 新建: `frontend/public/manifest.json`
- 新建: `frontend/public/icons/`（各尺寸占位图标）
- 新建: `frontend/src/features/pwa/sw/service-worker.ts`
- 新建: `frontend/src/features/pwa/components/InstallBanner.tsx`
- 新建: `frontend/src/features/pwa/components/UpdateBanner.tsx`
- 新建: `frontend/src/features/pwa/hooks/use-pwa-install.ts`
- 新建: `frontend/src/features/pwa/hooks/use-sw-update.ts`
- 新建: `frontend/src/features/pwa/types.ts`
- 新建: `frontend/src/features/pwa/index.ts`
- 修改: `frontend/index.html`（manifest link + apple-touch-icon + theme-color meta）
- 修改: `frontend/src/App.tsx`（挂载 InstallBanner + UpdateBanner）

## 依赖

- 前置: T02-012（布局组件就绪，Banner 依赖布局定位）
- 后续: T02-014（集成验证 PWA 功能）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 浏览器访问应用  
   **WHEN** 检查 Application → Manifest (DevTools)  
   **THEN** manifest.json 正确加载，显示应用名称/图标/主题色

2. **GIVEN** 首次访问应用  
   **WHEN** 浏览页面  
   **THEN** 不显示安装引导 Banner

3. **GIVEN** 第 2 次访问 + 停留超过 3 分钟  
   **WHEN** 浏览器支持 PWA  
   **THEN** 显示安装引导 Banner（毛玻璃面板 + Rose 安装按钮）

4. **GIVEN** 安装 Banner 显示  
   **WHEN** 点击"安装"  
   **THEN** 触发浏览器原生安装弹窗

5. **GIVEN** 安装 Banner 显示  
   **WHEN** 点击关闭按钮  
   **THEN** Banner 消失，7 天内不再提示

6. **GIVEN** Service Worker 已注册  
   **WHEN** 离线访问已缓存页面  
   **THEN** App Shell 正常显示（缓存的 HTML/CSS/JS）

7. **GIVEN** 新版本 Service Worker 就绪  
   **WHEN** 检测到 registration.waiting  
   **THEN** 顶部显示更新 Banner "有新版本可用"

8. **GIVEN** 更新 Banner 显示  
   **WHEN** 点击"立即更新"  
   **THEN** skipWaiting() + 页面刷新加载新版本

9. **GIVEN** Lighthouse PWA 审计  
   **WHEN** 运行 Lighthouse  
   **THEN** 可安装性检查通过

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 访问前端
4. DevTools → Application → Manifest 验证
5. DevTools → Application → Service Workers 验证注册
6. 模拟离线 → 验证缓存命中
7. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] manifest.json 正确加载
- [ ] Service Worker 成功注册
- [ ] App Shell 缓存正确
- [ ] 离线可访问缓存页面
- [ ] InstallBanner 触发条件正确
- [ ] UpdateBanner 渲染正确
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-013-pwa-config.md`

## 自检重点

- [ ] 安全：Service Worker 仅在 HTTPS 或 localhost 注册
- [ ] 安全：缓存策略不缓存包含 token 的 API 响应
- [ ] 性能：缓存大小限制 + LRU 淘汰
- [ ] 兼容：Safari PWA 差异处理（standalone 行为不同）
- [ ] 用户体验：安装引导时机合理，不打扰新用户
