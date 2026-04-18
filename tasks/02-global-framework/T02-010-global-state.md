# T02-010: 全局状态管理 — 用户/语言/主题 + 全局 Loading/Error

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现知语 Zhiyu 全局状态管理层，整合用户认证状态、语言偏好、主题偏好为统一的 AppContext；实现 7 种全局状态（Loading/FirstLoad/Empty/Error/Partial/Offline/Success）的统一处理组件，包括 Skeleton 骨架屏（shimmer 动效）、品牌呼吸动画 Logo、全局错误边界、离线检测。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/06-global-states.md` — 7 种全局状态完整定义
  - §一: Loading 状态 — Skeleton 骨架屏 + shimmer 微光动效
  - §二: FirstLoad 首次加载 — 品牌 Logo 呼吸动画 + 进度条
  - §三: Empty 空状态 — 专属插画 + 引导文案 + CTA 按钮
  - §四: Error 错误状态 — 分类型错误页面（网络/服务器/404）
  - §五: Partial 部分加载 — 已加载内容保留 + 失败区域重试
  - §六: Offline 离线状态 — 顶部离线 Banner + 仅展示缓存内容
  - §七: Success 正常状态 — 内容展示
- 编码规范: `grules/05-coding-standards.md` §二.3 — 状态管理（Context + TanStack Query）
- 设计规范: `grules/06-ui-design.md` §三.3 — 骨架屏与加载态规范
- 关联任务: T02-004（auth 登录）→ T02-007（i18n）→ T02-008（theme）→ 本任务

## 技术方案

### AppContext 统一整合

```typescript
// frontend/src/core/contexts/AppContext.tsx
interface AppContextValue {
  // 用户状态（来自 T02-004 auth）
  user: UserProfile | null
  isAuthenticated: boolean
  userPermission: 'guest' | 'free' | 'paid'
  
  // 语言状态（来自 T02-007 i18n）
  uiLanguage: UILanguage
  learningMode: LearningMode
  explanationLanguage: ExplanationLanguage
  
  // 主题状态（来自 T02-008 theme）
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  
  // 网络状态
  isOnline: boolean
}
```

### 7 种状态组件

```
frontend/src/core/components/states/
├── GlobalLoading.tsx              # Skeleton 骨架屏（shimmer 微光）
├── FirstLoadScreen.tsx            # 首次加载（Logo 呼吸动画 + 进度条）
├── EmptyState.tsx                 # 空状态（插画 + 文案 + CTA）
├── ErrorBoundary.tsx              # React ErrorBoundary 包裹
├── ErrorFallback.tsx              # 错误回退页面（网络/服务器/404）
├── PartialError.tsx               # 部分加载失败（保留内容 + 重试按钮）
├── OfflineBanner.tsx              # 离线顶部 Banner
└── index.ts
```

### Skeleton 骨架屏规范

```css
/* shimmer 微光动效 */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-primary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
```

### 品牌 Logo 首次加载

```typescript
// FirstLoadScreen: 全屏居中
// Logo: 呼吸动画 (opacity 0.6 → 1.0, scale 0.95 → 1.0, 循环)
// 进度条: 线性进度，知语品牌色
// 文案: "知语 Zhiyu · 探索中华之美"
```

### 离线检测

```typescript
// 使用 navigator.onLine + online/offline 事件
// 离线 → 顶部显示 OfflineBanner（黄色警告条 "当前无网络连接，显示缓存内容"）
// 恢复在线 → Banner 消失 + 自动重试失败请求
```

### 全局错误边界

```typescript
// ErrorBoundary 包裹 App 根组件
// 捕获渲染错误 → ErrorFallback 页面
// ErrorFallback 按错误类型分类:
//   - 网络错误: "网络连接异常" + 重试按钮
//   - 服务器错误(5xx): "服务器繁忙" + 重试按钮
//   - 404: "页面不存在" + 返回首页按钮
```

## 范围（做什么）

- 实现 `AppContext` 统一整合用户/语言/主题/网络状态
- 实现 `GlobalLoading` 骨架屏组件（shimmer 微光）
- 实现 `FirstLoadScreen` 首次加载动画
- 实现 `EmptyState` 空状态组件（可配置插画/文案/CTA）
- 实现 `ErrorBoundary` + `ErrorFallback` 全局错误处理
- 实现 `PartialError` 部分加载失败处理
- 实现 `OfflineBanner` 离线提示 + 在线恢复自动重试
- 实现 `navigator.onLine` 网络状态监听
- 实现各状态组件的 Light + Dark 适配

## 边界（不做什么）

- 不实现 auth/i18n/theme 的核心逻辑（已在 T02-004/007/008 完成）
- 不实现各业务页面的具体 Skeleton 形状（各模块自行扩展）
- 不实现空状态插画设计（使用通用占位符）
- 不实现 Service Worker 离线缓存策略（T02-013 PWA 模块）

## 涉及文件

- 新建: `frontend/src/core/contexts/AppContext.tsx`
- 新建: `frontend/src/core/components/states/GlobalLoading.tsx`
- 新建: `frontend/src/core/components/states/FirstLoadScreen.tsx`
- 新建: `frontend/src/core/components/states/EmptyState.tsx`
- 新建: `frontend/src/core/components/states/ErrorBoundary.tsx`
- 新建: `frontend/src/core/components/states/ErrorFallback.tsx`
- 新建: `frontend/src/core/components/states/PartialError.tsx`
- 新建: `frontend/src/core/components/states/OfflineBanner.tsx`
- 新建: `frontend/src/core/components/states/index.ts`
- 修改: `frontend/src/App.tsx`（挂载 AppContext + ErrorBoundary + OfflineBanner）

## 依赖

- 前置: T02-004（用户认证状态）、T02-007（语言状态）、T02-008（主题状态）
- 后续: 全部前端页面使用 AppContext + 状态组件

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 应用首次加载  
   **WHEN** React 尚未就绪  
   **THEN** 显示 FirstLoadScreen（Logo 呼吸动画 + 进度条 + "知语 Zhiyu" 文案）

2. **GIVEN** 页面数据加载中  
   **WHEN** API 请求未完成  
   **THEN** 显示 Skeleton 骨架屏 + shimmer 微光动效

3. **GIVEN** 列表数据为空  
   **WHEN** API 返回空数组  
   **THEN** 显示 EmptyState（插画 + "暂无内容" 文案 + CTA 按钮）

4. **GIVEN** API 请求失败（网络错误）  
   **WHEN** ErrorFallback 渲染  
   **THEN** 显示 "网络连接异常" + 重试按钮

5. **GIVEN** 页面部分内容加载失败  
   **WHEN** PartialError 渲染  
   **THEN** 已加载内容保留 + 失败区域显示重试按钮

6. **GIVEN** 设备断网  
   **WHEN** offline 事件触发  
   **THEN** 顶部显示 OfflineBanner 黄色警告条

7. **GIVEN** OfflineBanner 显示中  
   **WHEN** 网络恢复  
   **THEN** Banner 消失 + TanStack Query 自动重试

8. **GIVEN** AppContext 已挂载  
   **WHEN** 调用 useAppContext()  
   **THEN** 可获取 user/uiLanguage/themeMode/isOnline 等全部状态

9. **GIVEN** 深色模式  
   **WHEN** 查看 Skeleton 骨架屏  
   **THEN** shimmer 颜色适配深色主题

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 验证 FirstLoadScreen 动画
4. Browser MCP 验证 Skeleton 骨架屏效果
5. Browser MCP 模拟断网 → 验证 OfflineBanner
6. 截图 Light + Dark 各状态
7. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] FirstLoadScreen 动画流畅
- [ ] Skeleton shimmer 动效正确
- [ ] EmptyState 渲染正确
- [ ] ErrorBoundary 捕获错误正确
- [ ] OfflineBanner 在断网/恢复时正确响应
- [ ] Light + Dark 模式适配正确
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-010-global-state.md`

## 自检重点

- [ ] 性能：ErrorBoundary 不影响正常渲染性能
- [ ] 性能：OfflineBanner 监听器在组件卸载时清除
- [ ] UI 规范：Skeleton shimmer 使用 CSS 变量适配主题
- [ ] UI 规范：呼吸动画平滑（不卡顿、不闪烁）
- [ ] 类型安全：AppContextValue 所有字段类型正确
