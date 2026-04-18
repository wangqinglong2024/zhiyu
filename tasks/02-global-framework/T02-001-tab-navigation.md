# T02-001: 底部 Tab 导航 — 路由配置与页面骨架

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现知语 Zhiyu 应用端的底部 Tab 导航框架，包含四个 Tab（发现中国、系统课程、游戏模式、个人中心）的路由配置、页面骨架占位、Tab 切换动效、角标数据占位、以及导航守卫（未登录用户受限 Tab 拦截）。此任务为全局框架的导航基础。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/01-tab-navigation.md` — Tab 结构定义、切换逻辑、角标规则、视觉规范
- 产品需求: `product/apps/01-global-framework/00-index.md` — 全局框架功能清单
- 产品总纲: `product/00-product-overview.md` §三.1 — 应用端用户分层（未登录/登录/付费）
- 设计规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统（Tab Bar 毛玻璃材质）
- 设计规范: `grules/06-ui-design.md` §三.1 — 导航体系（底部 Tab Bar 三层导航层级）
- 项目结构: `grules/02-project-structure.md` — 路由、页面、组件目录约定
- 编码规范: `grules/05-coding-standards.md` §二 — 前端组件规范
- 关联任务: T01-012（前端构建验证完成）→ 本任务 → T02-004/T02-005（认证系统依赖 Tab 导航骨架）

## 技术方案

### 前端路由

```typescript
// frontend/src/router/index.tsx
// 使用 react-router-dom v7，配置四个 Tab 对应的一级路由
const routes = [
  { path: '/', element: <TabLayout />, children: [
    { index: true, element: <Navigate to="/discover" replace /> },
    { path: 'discover', element: <DiscoverPage /> },    // Tab 1
    { path: 'courses', element: <CoursesPage /> },       // Tab 2（需登录）
    { path: 'games', element: <GamesPage /> },           // Tab 3（需登录）
    { path: 'profile', element: <ProfilePage /> },       // Tab 4（需登录）
  ]},
  { path: '*', element: <NotFoundPage /> },
]
```

### 组件架构

```
frontend/src/
├── components/
│   └── layout/
│       ├── TabLayout.tsx          # Tab 导航布局（含 TabBar + Outlet）
│       └── TabBar.tsx             # 底部 Tab Bar 组件
├── pages/
│   ├── DiscoverPage.tsx           # 发现中国骨架页
│   ├── CoursesPage.tsx            # 系统课程骨架页
│   ├── GamesPage.tsx              # 游戏模式骨架页
│   └── ProfilePage.tsx            # 个人中心骨架页
└── router/
    ├── index.tsx                  # 路由定义
    └── guards.tsx                 # Tab 导航守卫（未登录拦截）
```

### Tab Bar 视觉规范

- 高度: 56px + `env(safe-area-inset-bottom)` 安全区
- 背景: 毛玻璃效果 `backdrop-blur(16px)`
  - Light: 白色 95% 透明度 + 顶部 1px 分割线（中性灰 10%）
  - Dark: 深色 90% 透明度 + 顶部 1px 分割线（白色 8%）
- 图标: Lucide Icons 24px，选中态 Rose 色填充 + `scale(1.05)→scale(1.0)` 弹跳
- 文字: 11px / Caption，选中态 Rose 色
- 页面内容底部安全距离 ≥ 80px

### 导航守卫逻辑

- Tab 1（发现中国）：所有用户可访问
- Tab 2/3/4：未登录用户点击后不切换 Tab，触发 `onLoginRequired(targetTab)` 回调
- 登录成功后：自动切换到用户原本想去的 Tab

## 范围（做什么）

- 配置 react-router-dom v7 的 Tab 路由
- 实现 `TabLayout` 布局组件（Outlet + TabBar）
- 实现 `TabBar` 底部导航组件（四 Tab、选中态、切换动效）
- 实现 Tab 图标切换动效（描边→填充，150ms Spring）
- 实现 Tab 内容切换过渡动效（Fade 200ms）
- 创建四个页面骨架组件（占位文本+标题）
- 实现未登录用户受限 Tab 的拦截逻辑（Tab 不切换 + 触发回调）
- 角标组件占位（红点 + 数字角标 UI 壳子）
- 保留 Tab 滚动位置（切换后恢复上次位置）
- 支持 Light/Dark 双模式
- 适配 375px / 768px / 1280px 三断点

## 边界（不做什么）

- 不实现登录弹窗（T02-004）
- 不实现真实认证逻辑（T02-003/T02-004）
- 不实现角标数据来源和真实判断逻辑（后续任务填充）
- 不实现横屏游戏时 Tab Bar 隐藏（游戏模块任务）
- 不实现真实页面内容（各业务模块任务）

## 涉及文件

- 新建: `frontend/src/components/layout/TabLayout.tsx`
- 新建: `frontend/src/components/layout/TabBar.tsx`
- 新建: `frontend/src/components/ui/Badge.tsx`（角标组件）
- 新建: `frontend/src/pages/DiscoverPage.tsx`
- 新建: `frontend/src/pages/CoursesPage.tsx`
- 新建: `frontend/src/pages/GamesPage.tsx`
- 新建: `frontend/src/pages/ProfilePage.tsx`
- 修改: `frontend/src/router/index.tsx`（填充路由配置）
- 修改: `frontend/src/router/guards.tsx`（Tab 导航守卫）
- 修改: `frontend/src/App.tsx`（挂载路由）

## 依赖

- 前置: T01-012（前端构建验证 — 确保 Vite + React + Tailwind 基础可用）
- 后续: T02-004（登录弹窗需在 Tab 拦截时触发）、T02-005（登录墙扩展）、T02-012（布局组件扩展）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 应用已启动  
   **WHEN** 访问根路径 `/`  
   **THEN** 自动重定向到 `/discover`，底部 Tab Bar 可见且 Tab 1 选中（Rose 色填充图标 + Rose 文字）

2. **GIVEN** 用户在 Tab 1（发现中国）  
   **WHEN** 点击 Tab 2（系统课程）  
   **THEN**（未登录模式下）Tab 1 选中态不变、Tab 2 不高亮；触发 `onLoginRequired` 回调

3. **GIVEN** 用户已模拟登录态  
   **WHEN** 依次点击 Tab 1→2→3→4  
   **THEN** 每次切换响应 < 100ms，内容区域 Fade 过渡 200ms，图标切换有 Spring 弹跳动效

4. **GIVEN** Tab Bar 渲染完毕  
   **WHEN** 检查 Tab Bar 高度和背景  
   **THEN** 高度 56px + 安全区；背景为毛玻璃效果（Light: 白色 95% 透明度 + blur(16px)）

5. **GIVEN** 浏览器切换到深色模式  
   **WHEN** 查看 Tab Bar  
   **THEN** 背景变为深色 90% 透明度，分割线变为白色 8% 透明度

6. **GIVEN** 用户在某 Tab 页面向下滚动 200px  
   **WHEN** 切换到其他 Tab 后再切回  
   **THEN** 滚动位置恢复到之前的 200px

7. **GIVEN** 页面宽度分别为 375px / 768px / 1280px  
   **WHEN** 查看 Tab Bar 布局  
   **THEN** 四个 Tab 等宽分布，图标与文字垂直居中对齐

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. `docker compose logs --tail=30 frontend` — 前端构建成功
5. 通过 Browser MCP（Puppeteer）访问前端页面
6. 验证所有 GIVEN-WHEN-THEN 验收标准
7. 截图记录 Light + Dark 模式下的 Tab Bar
8. 截图记录 375px / 768px / 1280px 三断点

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 前端页面正常渲染（Light + Dark 模式）
- [ ] Tab 切换流畅，选中态视觉正确
- [ ] 未登录拦截逻辑正常工作
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过
- [ ] UI 符合 Cosmic Refraction 设计系统（毛玻璃、Rose 色、圆角、动效）
- [ ] 响应式测试通过（375px / 768px / 1280px）

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/02-global-framework/` 下创建同名结果文件

结果文件路径: `/tasks/result/02-global-framework/T02-001-tab-navigation.md`

## 自检重点

- [ ] 安全：Tab 守卫不依赖前端状态绕过
- [ ] 性能：Tab 切换无卡顿、Fade 动效流畅
- [ ] 类型同步：路由配置类型安全
- [ ] UI 设计规范：毛玻璃 Tab Bar、Rose 选中色、Lucide Icons、无紫色
- [ ] 响应式：三断点布局正确
- [ ] 无障碍：Tab 按钮有 aria-label，装饰元素有 aria-hidden
