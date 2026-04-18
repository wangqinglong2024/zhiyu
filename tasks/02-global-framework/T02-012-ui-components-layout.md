# T02-012: UI 组件库 — 布局组件

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现知语 Zhiyu 的布局级通用组件。包含：PageHeader 页面头部（含返回按钮+标题+操作区）、PageContainer 页面容器（安全区域+最大宽度）、LoadingScreen 页面级加载屏、PullToRefresh 下拉刷新、InfiniteScroll 无限滚动、SafeAreaView 安全区域适配、ScrollToTop 回到顶部按钮。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/07-common-components.md`
  - §四: Pull-to-refresh — 下拉超 60px 触发，自定义动画指示器
  - §五: Infinite Scroll — 距底 200px 触发加载，防重复
- 产品需求: `product/apps/01-global-framework/06-global-states.md` — 全局加载态设计
- 设计规范: `grules/06-ui-design.md` §一 — 布局系统（安全区域、最大宽度、间距）
- 设计规范: `grules/01-rules.md` §一.2 — 移动优先响应式断点
- 关联任务: T02-011（原子组件已实现）→ 本任务 → T02-013（PWA）

## 技术方案

### 组件清单

| 组件 | 说明 |
|------|------|
| `PageHeader` | 页面顶部：返回按钮 + 标题 + 右侧操作区，毛玻璃背景 |
| `PageContainer` | 页面内容容器：安全区域 padding + 最大宽度 + 内容居中 |
| `LoadingScreen` | 全页面加载屏（区别于 FirstLoadScreen，用于页面切换） |
| `PullToRefresh` | 下拉刷新包裹组件：自定义动画指示器 |
| `InfiniteScroll` | 无限滚动包裹组件：触底加载 + 防重复 + 加载更多/没有更多 |
| `SafeAreaView` | 安全区域适配（notch + home indicator） |
| `ScrollToTop` | 回到顶部按钮：滚动超过 200px 显示 |

### PageHeader 设计

```typescript
interface PageHeaderProps {
  title: string
  showBack?: boolean            // 默认 true
  onBack?: () => void           // 默认 router.back()
  rightActions?: React.ReactNode
  transparent?: boolean         // 透明背景模式（用于详情页覆盖 banner）
}

// 样式：
// - 高度 44px + safe-area-inset-top
// - 毛玻璃背景（非 transparent 模式）
// - 返回按钮：Lucide ChevronLeft icon
// - 标题：居中 / 左对齐（可配置）
// - 右侧操作区：图标按钮组
```

### PullToRefresh 交互

```
下拉 < 30px: 不显示指示器
下拉 30-60px: 显示指示器，箭头向下
下拉 ≥ 60px: 指示器变为旋转动画（已触发）
释放后: 指示器保持旋转直到刷新完成
刷新完成: 指示器回弹消失 (300ms Spring 缓动)
```

### InfiniteScroll 交互

```typescript
interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number            // 默认 200px
  loader?: React.ReactNode      // 自定义加载指示器
  endMessage?: React.ReactNode  // "没有更多了" 提示
}

// 使用 IntersectionObserver 检测触底
// 防重复: isLoading 为 true 时不触发
// 节流: 500ms 内不重复触发
```

### 响应式断点

```
Mobile: < 768px — 全宽
Tablet: 768px - 1023px — max-width 720px 居中
Desktop: ≥ 1024px — max-width 480px 居中（模拟手机宽度）
```

### 组件目录结构

```
frontend/src/core/components/layout/
├── PageHeader.tsx
├── PageContainer.tsx
├── LoadingScreen.tsx
├── PullToRefresh.tsx
├── InfiniteScroll.tsx
├── SafeAreaView.tsx
├── ScrollToTop.tsx
└── index.ts
```

## 范围（做什么）

- 实现 7 个布局组件（含完整交互）
- PageHeader 毛玻璃 + transparent 模式
- PullToRefresh 自定义下拉指示器 + 动画
- InfiniteScroll IntersectionObserver + 防重复 + 节流
- ScrollToTop 浮动按钮 + 平滑滚动
- 所有组件 Light + Dark 适配
- 所有组件移动端安全区域适配

## 边界（不做什么）

- 不实现 TabLayout / TabBar（T02-001 已完成）
- 不实现 Sidebar（管理后台模块）
- 不实现具体业务页面布局（各模块自行组合）

## 涉及文件

- 新建: `frontend/src/core/components/layout/PageHeader.tsx`
- 新建: `frontend/src/core/components/layout/PageContainer.tsx`
- 新建: `frontend/src/core/components/layout/LoadingScreen.tsx`
- 新建: `frontend/src/core/components/layout/PullToRefresh.tsx`
- 新建: `frontend/src/core/components/layout/InfiniteScroll.tsx`
- 新建: `frontend/src/core/components/layout/SafeAreaView.tsx`
- 新建: `frontend/src/core/components/layout/ScrollToTop.tsx`
- 新建: `frontend/src/core/components/layout/index.ts`
- 修改: `frontend/src/core/components/layout/` 现有文件（如 TabLayout）确保兼容

## 依赖

- 前置: T02-011（原子组件可用，如 Button/Skeleton）
- 后续: T02-013（PWA 需要 PageContainer 等布局基础）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** PageHeader 显示  
   **WHEN** 查看顶部  
   **THEN** 高度 44px + safe-area 填充 + 毛玻璃背景 + 返回按钮 + 居中标题

2. **GIVEN** PageHeader transparent 模式  
   **WHEN** 页面滚动  
   **THEN** 初始透明，滚动一定距离后渐变为毛玻璃背景

3. **GIVEN** 页面在移动端  
   **WHEN** 查看 PageContainer  
   **THEN** 全宽 + 安全区域 padding

4. **GIVEN** 页面在桌面端  
   **WHEN** 查看 PageContainer  
   **THEN** max-width 480px 居中

5. **GIVEN** 列表页面  
   **WHEN** 下拉超过 60px 后释放  
   **THEN** PullToRefresh 指示器旋转 → 刷新完成 → 回弹消失

6. **GIVEN** 列表有更多数据  
   **WHEN** 滚动到距底 200px  
   **THEN** InfiniteScroll 触发 onLoadMore + 显示加载指示器

7. **GIVEN** 列表无更多数据  
   **WHEN** hasMore = false  
   **THEN** 显示 "没有更多了" 提示

8. **GIVEN** 页面滚动超过 200px  
   **WHEN** 查看右下角  
   **THEN** ScrollToTop 浮动按钮显示，点击平滑回到顶部

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 验证各布局组件
4. 截图 375px / 768px / 1280px 三断点
5. 测试 PullToRefresh / InfiniteScroll 交互
6. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 7 个布局组件正确渲染
- [ ] 响应式三断点适配正确
- [ ] PullToRefresh 交互流畅
- [ ] InfiniteScroll 防重复 + 节流
- [ ] 安全区域适配（iOS notch 模拟）
- [ ] Light + Dark 适配
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-012-ui-components-layout.md`

## 自检重点

- [ ] 性能：IntersectionObserver 在组件卸载时 disconnect
- [ ] 性能：PullToRefresh 使用 transform 而非 top/margin（GPU 加速）
- [ ] 性能：ScrollToTop 使用 requestAnimationFrame 平滑滚动
- [ ] 兼容：Safari safe-area-inset 使用 env() + fallback
- [ ] 无障碍：PageHeader 返回按钮有 aria-label
