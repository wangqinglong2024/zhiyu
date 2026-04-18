# T11-005: 前端 — 管理后台项目脚手架

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 15

## 需求摘要

搭建管理后台的前端项目架构。管理后台与应用端共享同一个 Vite React/TS 项目，通过路由前缀 `/admin` 隔离。创建管理后台专属的布局组件骨架（左侧边栏 + 右侧内容区）、路由配置、管理员认证状态管理（AdminAuthProvider）、API 客户端配置、管理后台专属类型定义。桌面端优先（1280px 起），遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/03-navigation.md` §二.1 — 侧边栏 240px/64px 布局规格
- 产品需求: `product/admin/01-admin-dashboard/03-navigation.md` §五 — 响应式行为（桌面/小桌面/平板/移动端）
- 产品需求: `product/admin/00-admin-overview.md` — 管理后台桌面端优先、中英文 UI
- 架构白皮书: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统 CSS 参数
- 项目结构: `grules/02-project-structure.md` — 前端目录结构模板
- UI 设计: `grules/06-ui-design.md` — 完整设计规范
- 编码规范: `grules/05-coding-standards.md` §二 — 前端命名约定
- 关联任务: 前置 T01-009（前端 Vite React 脚手架） → 后续 T11-006（登录页）、T11-007（导航布局）

## 技术方案

### 路由隔离方案

```
前端项目（单一 Vite 应用）
├── /              → 应用端路由（已有）
├── /admin         → 管理后台路由（本任务创建）
│   ├── /admin/login        → 管理员登录页
│   ├── /admin/dashboard    → 仪表盘首页
│   ├── /admin/content/*    → 内容管理
│   ├── /admin/users/*      → 用户管理
│   ├── /admin/orders/*     → 订单管理
│   ├── /admin/games/*      → 游戏管理
│   └── /admin/system/*     → 系统设置
```

### 目录结构

```
frontend/src/
├── features/
│   └── admin/                          # 管理后台模块
│       ├── types/
│       │   ├── admin.ts                # 管理员相关类型
│       │   ├── dashboard.ts            # 仪表盘数据类型
│       │   └── index.ts               # 统一导出
│       ├── lib/
│       │   ├── admin-api.ts            # 管理后台 API 客户端
│       │   └── admin-constants.ts      # 管理后台常量（菜单、权限映射）
│       ├── hooks/
│       │   ├── use-admin-auth.ts       # 管理员认证 Hook
│       │   └── use-admin-permission.ts # 权限检查 Hook
│       ├── providers/
│       │   └── AdminAuthProvider.tsx    # 管理员认证上下文
│       ├── components/
│       │   └── layout/                 # 管理后台布局组件
│       │       ├── AdminLayout.tsx     # 管理后台主布局（侧边栏+内容区）占位
│       │       └── AdminGuard.tsx      # 管理员路由守卫
│       ├── pages/                      # 管理后台页面占位
│       │   └── AdminNotFoundPage.tsx   # 管理后台 404 页面
│       └── router/
│           └── admin-routes.tsx        # 管理后台路由配置
```

### 管理员认证 Provider

```typescript
// frontend/src/features/admin/providers/AdminAuthProvider.tsx

interface AdminAuthContextType {
  admin: AdminUser | null              // 当前管理员信息
  roleConfig: AdminRoleConfig | null   // 角色权限配置
  isAuthenticated: boolean             // 是否已登录
  isLoading: boolean                   // 加载中
  login: (email: string, password: string, rememberMe: boolean) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  changePassword: (dto: ChangePasswordDto) => Promise<void>
}

// Provider 职责：
// 1. 管理 JWT Token 存储（sessionStorage / localStorage）
// 2. 自动检查 Token 有效性
// 3. 会话超时检测和续期提醒
// 4. Token 过期自动跳转登录页
// 5. 提供角色权限配置给子组件
```

### 路由守卫

```typescript
// frontend/src/features/admin/components/layout/AdminGuard.tsx

/**
 * 管理员路由守卫组件
 * 1. 检查是否已登录 → 未登录跳转 /admin/login
 * 2. 检查是否为临时密码 → 弹出强制改密弹窗
 * 3. 检查当前路由权限 → 无权限显示无权限页面
 * 4. Token 过期检测 → 超时前 5 分钟弹出续期提醒
 */
```

### API 客户端

```typescript
// frontend/src/features/admin/lib/admin-api.ts

/**
 * 管理后台专用 API 客户端
 * - 基于 fetch 封装
 * - 自动注入 Authorization: Bearer <token> 头
 * - 统一处理 401（Token 过期）→ 跳转登录页
 * - 统一处理 403（权限不足）→ Toast 提示
 * - 统一处理响应格式（code/data/message）
 */
export const adminApi = {
  get: <T>(url: string, params?: Record<string, string>) => Promise<ApiResponse<T>>,
  post: <T>(url: string, body?: unknown) => Promise<ApiResponse<T>>,
  put: <T>(url: string, body?: unknown) => Promise<ApiResponse<T>>,
  patch: <T>(url: string, body?: unknown) => Promise<ApiResponse<T>>,
  delete: <T>(url: string) => Promise<ApiResponse<T>>,
}
```

### 管理后台路由配置

```typescript
// frontend/src/features/admin/router/admin-routes.tsx

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin/login',
    element: <AdminLoginPage />,      // T11-006
  },
  {
    path: '/admin',
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },  // T11-008
      // 后续模块路由占位（T12/T13/T14 填充）
      { path: 'content/*', element: <div>内容管理（待实现）</div> },
      { path: 'users/*', element: <div>用户管理（待实现）</div> },
      { path: 'orders/*', element: <div>订单管理（待实现）</div> },
      { path: 'games/*', element: <div>游戏管理（待实现）</div> },
      { path: 'system/*', element: <div>系统设置（待实现）</div> },
      { path: '*', element: <AdminNotFoundPage /> },
    ],
  },
]
```

### 前端类型定义

```typescript
// frontend/src/features/admin/types/admin.ts

export type AdminRole = 'super_admin' | 'content_ops' | 'user_ops' | 'game_ops'
export type AdminStatus = 'active' | 'disabled'

export interface AdminUser {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: AdminRole
  status: AdminStatus
  is_temp_password: boolean
  totp_enabled: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminRoleConfig {
  role: AdminRole
  display_name: string
  label_color: string
  permissions: Record<string, boolean>
  dashboard_scope: Record<string, boolean>
  visible_menus: string[]
}

export interface LoginResult {
  token: string
  expires_in: number
  admin: AdminUser
  role_config: AdminRoleConfig
}

export interface LoginError {
  remaining_attempts?: number
  locked?: boolean
  locked_until?: string
  remaining_seconds?: number
}
```

### 小于 768px 提示页

```typescript
// 检测屏幕宽度 < 768px 时显示全屏提示
// "请使用电脑或平板设备访问管理后台"
// Lucide Monitor 图标 + 居中提示文字
// 此检测应在 AdminLayout 组件中实现
```

## 范围（做什么）

- 创建 `frontend/src/features/admin/` 目录结构
- 创建管理后台路由配置并挂载到主路由
- 创建 AdminAuthProvider 认证上下文
- 创建 AdminGuard 路由守卫
- 创建 admin-api 管理后台 API 客户端
- 创建管理后台前端类型定义（与后端 models/admin.ts 同步）
- 创建 AdminLayout 占位组件（侧边栏+内容区骨架）
- 创建 AdminNotFoundPage 404 页面
- 创建管理后台常量配置（菜单结构、权限映射）
- 修改 `frontend/src/router/index.tsx` 合入 admin 路由

## 边界（不做什么）

- 不实现登录页面具体 UI（T11-006）
- 不实现侧边栏和顶部栏具体 UI（T11-007）
- 不实现仪表盘页面（T11-008）
- 不实现管理员管理页面（T11-009）
- 不实现 CSS 样式细节（本任务专注于架构骨架）

## 涉及文件

- 新建: `zhiyu/frontend/src/features/admin/types/admin.ts`
- 新建: `zhiyu/frontend/src/features/admin/types/dashboard.ts`
- 新建: `zhiyu/frontend/src/features/admin/types/index.ts`
- 新建: `zhiyu/frontend/src/features/admin/lib/admin-api.ts`
- 新建: `zhiyu/frontend/src/features/admin/lib/admin-constants.ts`
- 新建: `zhiyu/frontend/src/features/admin/hooks/use-admin-auth.ts`
- 新建: `zhiyu/frontend/src/features/admin/hooks/use-admin-permission.ts`
- 新建: `zhiyu/frontend/src/features/admin/providers/AdminAuthProvider.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/AdminLayout.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/AdminGuard.tsx`
- 新建: `zhiyu/frontend/src/features/admin/pages/AdminNotFoundPage.tsx`
- 新建: `zhiyu/frontend/src/features/admin/router/admin-routes.tsx`
- 修改: `zhiyu/frontend/src/router/index.tsx` — 合入 admin 路由

## 依赖

- 前置: T01-009（前端 Vite React 脚手架已就绪）
- 后续: T11-006（登录页）、T11-007（导航布局）、T11-008（仪表盘页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 前端项目已构建  
   **WHEN** 访问 `/admin`  
   **THEN** 重定向到 `/admin/login`（未登录状态）

2. **GIVEN** 前端项目已构建  
   **WHEN** 访问 `/admin/dashboard`（未登录）  
   **THEN** AdminGuard 拦截，重定向到 `/admin/login?redirect=/admin/dashboard`

3. **GIVEN** 管理后台目录结构已创建  
   **WHEN** 检查 `frontend/src/features/admin/` 目录  
   **THEN** types/、lib/、hooks/、providers/、components/layout/、pages/、router/ 全部存在

4. **GIVEN** AdminAuthProvider 已实现  
   **WHEN** 在 Provider 外部调用 useAdminAuth()  
   **THEN** 抛出错误提示需要在 Provider 内使用

5. **GIVEN** admin-api 客户端已实现  
   **WHEN** Token 过期时发起 API 请求  
   **THEN** 自动处理 401，清除 Token，跳转登录页

6. **GIVEN** 前端类型定义已创建  
   **WHEN** 检查 AdminUser、AdminRoleConfig、LoginResult 类型  
   **THEN** 与后端 models/admin.ts 的 AdminUserResponse、AdminRoleConfig 类型一致

7. **GIVEN** 管理后台路由已配置  
   **WHEN** 访问 `/admin/unknown-path`  
   **THEN** 显示管理后台 404 页面（非应用端 404）

8. **GIVEN** 屏幕宽度 < 768px  
   **WHEN** 访问管理后台任意页面  
   **THEN** 显示全屏提示"请使用电脑或平板设备访问管理后台"

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. Browser MCP 访问 `http://localhost:3100/admin` — 验证重定向到登录页
5. Browser MCP 访问 `http://localhost:3100/admin/dashboard` — 验证路由守卫拦截
6. Browser MCP 访问 `http://localhost:3100/admin/not-exist` — 验证 404 页面
7. Browser MCP 设置视口宽度 750px — 验证小屏提示
8. 检查 TypeScript 编译无错误
9. 检查控制台无 Error

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] /admin 路由正确重定向到登录页
- [ ] AdminGuard 路由守卫正常工作
- [ ] 管理后台 404 页面正常显示
- [ ] 小于 768px 显示设备提示
- [ ] 目录结构符合规范
- [ ] 前端类型与后端类型一致
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-005-fe-admin-scaffold.md`

## 自检重点

- [ ] 安全：Token 存储位置正确、401/403 处理、XSS 防护
- [ ] 类型同步：前端类型与后端 API 响应一致
- [ ] 代码质量：目录结构清晰、模块职责单一
- [ ] UI 设计规范：Tailwind CSS v4、无 tailwind.config.js
- [ ] 响应式：768px 以下显示设备提示
