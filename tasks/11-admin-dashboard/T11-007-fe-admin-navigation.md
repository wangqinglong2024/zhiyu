# T11-007: 前端 — 全局导航与布局

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现管理后台的全局布局框架，包括：左侧可收缩侧边栏（240px 展开 / 64px 收缩）、顶部信息栏（面包屑 + 管理员信息）、权限路由守卫（基于角色的菜单显隐和 URL 越权拦截）。侧边栏包含 6 个一级菜单和 15 个二级菜单，按角色权限过滤可见项。支持折叠/展开切换（含动画和 localStorage 记忆）、折叠态 Tooltip 和浮层面板、当前页高亮、退款徽标、响应式断点适配（桌面/小桌面/平板）。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/03-navigation.md` — 全局导航完整 PRD（**核心依据**）
- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` §三 — 无权限页面访问表现
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §三.3 — 导航 11 项验收标准
- 架构白皮书: `grules/01-rules.md` §一 — Cosmic Refraction CSS 参数
- UI 设计: `grules/06-ui-design.md` — 色彩、字体、间距、动效规范
- 编码规范: `grules/05-coding-standards.md` §二 — 前端组件命名
- 关联任务: 前置 T11-003（角色权限 API）、T11-005（管理后台脚手架） → 后续 T11-008（仪表盘页面）

## 技术方案

### 布局结构

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (240px / 64px)  │  Content Area              │
│                          │                            │
│  ┌────────────────────┐  │  ┌──────────────────────┐  │
│  │  Logo 区域         │  │  │  TopBar (56px)       │  │
│  │  ──────────────── │  │  │  面包屑 | 管理员信息   │  │
│  │  一级菜单 1       │  │  └──────────────────────┘  │
│  │    ├ 二级菜单 1   │  │                            │
│  │    └ 二级菜单 2   │  │  ┌──────────────────────┐  │
│  │  一级菜单 2       │  │  │                      │  │
│  │  ...              │  │  │  Page Content         │  │
│  │                   │  │  │  (Outlet)             │  │
│  │  ──────────────── │  │  │                      │  │
│  │  折叠/展开按钮    │  │  └──────────────────────┘  │
│  └────────────────────┘  │                            │
└──────────────────────────────────────────────────────┘
```

### 组件拆分

```
features/admin/components/layout/
├── AdminLayout.tsx              # 管理后台主布局（替换 T11-005 的占位）
├── Sidebar.tsx                  # 左侧边栏
├── SidebarLogo.tsx              # Logo 区域
├── SidebarMenu.tsx              # 菜单列表
├── SidebarMenuItem.tsx          # 一级菜单项
├── SidebarSubMenuItem.tsx       # 二级菜单项
├── SidebarCollapsedPopover.tsx  # 折叠态二级菜单浮层
├── TopBar.tsx                   # 顶部信息栏
├── Breadcrumb.tsx               # 面包屑导航
├── AdminUserInfo.tsx            # 右侧管理员信息 + 退出按钮
├── NoPermissionPage.tsx         # 无权限提示页
└── MobileBlockScreen.tsx        # 小于 768px 设备提示页
```

### 侧边栏规格

```typescript
// Sidebar 核心状态
interface SidebarState {
  collapsed: boolean          // 折叠/展开
  expandedMenuKeys: string[]  // 已展开的一级菜单 key（含二级菜单的）
}

// 折叠/展开
// - 展开宽度: 240px
// - 折叠宽度: 64px
// - 切换动画: width transition 300ms cubic-bezier(0.2, 0, 0, 1)
// - 状态记忆: localStorage key = "admin_sidebar_collapsed"

// 背景样式（暗色模式）
// rgba(14, 14, 14, 0.85) + backdrop-filter: blur(20px)
// 右边缘 1px 分隔线 rgba(255, 255, 255, 0.06)
```

### 菜单数据结构

```typescript
// features/admin/lib/admin-constants.ts

export interface MenuItem {
  key: string                 // 唯一标识
  label: string               // 菜单文案
  icon: LucideIcon            // Lucide 图标组件
  path?: string               // 路由路径（无二级菜单时直接跳转）
  permission?: string         // 权限标识（用于过滤）
  badge?: 'count' | 'dot'     // 徽标类型
  children?: SubMenuItem[]    // 二级菜单
}

export interface SubMenuItem {
  key: string
  label: string
  icon: LucideIcon
  path: string
  permission: string
  badge?: 'count' | 'dot'
}

// 完整菜单配置（6个一级，15个二级）
export const ADMIN_MENUS: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    permission: 'dashboard.view',
  },
  {
    key: 'content',
    label: '内容管理',
    icon: FileText,
    permission: 'content',
    children: [
      { key: 'articles', label: '文章管理', icon: Newspaper, path: '/admin/content/articles', permission: 'content.articles.view' },
      { key: 'courses', label: '课程管理', icon: GraduationCap, path: '/admin/content/courses', permission: 'content.courses.view' },
      { key: 'quotes', label: '每日金句', icon: Quote, path: '/admin/content/quotes', permission: 'content.quotes.view' },
    ],
  },
  {
    key: 'users',
    label: '用户管理',
    icon: Users,
    permission: 'users',
    children: [
      { key: 'user-list', label: '用户列表', icon: UserSearch, path: '/admin/users/list', permission: 'users.list.view' },
      { key: 'user-analytics', label: '用户分析', icon: BarChart3, path: '/admin/users/analytics', permission: 'users.analytics.view' },
    ],
  },
  {
    key: 'orders',
    label: '订单管理',
    icon: Receipt,
    permission: 'orders',
    children: [
      { key: 'order-list', label: '订单列表', icon: ShoppingCart, path: '/admin/orders/list', permission: 'orders.list.view' },
      { key: 'refunds', label: '退款管理', icon: RotateCcw, path: '/admin/orders/refunds', permission: 'orders.refunds.view', badge: 'count' },
      { key: 'coins', label: '知语币管理', icon: Coins, path: '/admin/orders/coins', permission: 'orders.coins.view' },
    ],
  },
  {
    key: 'games',
    label: '游戏管理',
    icon: Gamepad2,
    permission: 'games',
    children: [
      { key: 'skins', label: '皮肤管理', icon: Palette, path: '/admin/games/skins', permission: 'games.skins.view' },
      { key: 'seasons', label: '赛季管理', icon: Trophy, path: '/admin/games/seasons', permission: 'games.seasons.view' },
      { key: 'rankings', label: '排行榜', icon: Medal, path: '/admin/games/rankings', permission: 'games.rankings.view' },
    ],
  },
  {
    key: 'system',
    label: '系统设置',
    icon: Settings,
    permission: 'system',
    children: [
      { key: 'push', label: '推送管理', icon: Bell, path: '/admin/system/push', permission: 'system.push.view' },
      { key: 'i18n', label: '多语言管理', icon: Languages, path: '/admin/system/i18n', permission: 'system.i18n.view' },
      { key: 'admins', label: '管理员管理', icon: UserCog, path: '/admin/system/admins', permission: 'system.admins.view' },
      { key: 'logs', label: '系统日志', icon: ScrollText, path: '/admin/system/logs', permission: 'system.logs.view', badge: 'dot' },
    ],
  },
]
```

### 菜单项交互状态

```css
/* 默认态 */
.menu-item { color: #a3a3a3; }

/* Hover 态 */
.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fafafa;
  border-radius: 8px;
  transition: all 150ms;
}

/* 当前页高亮 */
.menu-item--active {
  background: rgba(225, 29, 72, 0.1);
  color: #e11d48;
  border-left: 3px solid #e11d48;
}

/* 二级菜单展开/收起 */
/* ChevronDown 旋转 180°，二级列表高度过渡 200ms */
```

### 顶部栏规格

```typescript
// TopBar 组件
// 高度: 56px
// 背景: rgba(14, 14, 14, 0.6) + backdrop-filter: blur(12px)
// 底部分隔线: 1px rgba(255, 255, 255, 0.06)

// 左侧: Breadcrumb
// - 分隔符: ChevronRight 12px 灰色
// - 非末级: Sky 色 #0284c7 可点击链接，Hover 下划线
// - 末级: 白色 #fafafa 不可点击

// 右侧: AdminUserInfo
// - 头像 32px 圆形（无头像显示姓名首字，Rose 背景白字）
// - 姓名 14px 白色
// - 角色标签 12px 药丸形（超管 Amber #d97706，其他 Sky #0284c7）
// - 退出登录按钮 14px 灰色，Hover 变 Rose
```

### 面包屑生成规则

```typescript
// 根据当前路由自动生成面包屑
// 规则参见 PRD 03-navigation.md §四

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // /admin/dashboard → [{ label: '仪表盘', path: null }]
  // /admin/content/articles → [{ label: '内容管理', path: '/admin/content/articles' }, { label: '文章管理', path: null }]
  // /admin/content/articles/edit/123 → [{ label: '内容管理', path: '/admin/content/articles' }, { label: '文章管理', path: '/admin/content/articles' }, { label: '编辑文章', path: null }]
}
```

### 权限路由守卫（URL 越权拦截）

```typescript
// 在 AdminGuard 中增加权限检查
// 1. 获取当前路由 pathname
// 2. 检查 pathname 是否在当前角色的 visible_menus 中
// 3. 不在 → 渲染 NoPermissionPage 而非 Outlet

// NoPermissionPage 内容:
// 居中 ShieldX 图标 64px 灰色
// "无权限访问" H2
// "您的角色（[角色名]）无权访问此页面，如需权限请联系超级管理员" Body
// "返回仪表盘" Rose 主按钮
```

### 响应式断点

```typescript
// 断点定义
// ≥ 1280px: 桌面端，侧边栏默认展开
// 1024-1279px: 小桌面端，侧边栏默认折叠
// 768-1023px: 平板端，侧边栏隐藏，汉堡按钮唤出 overlay
// < 768px: 全屏提示页（T11-005 已处理）

// useBreakpoint Hook 检测当前断点
// 侧边栏行为根据断点自动调整
```

### 平板端 Overlay 模式

```typescript
// 768-1023px 时：
// - 顶部栏左侧新增汉堡菜单按钮 (Menu 图标)
// - 点击汉堡按钮 → 侧边栏从左滑入（280px 宽）
// - 内容区右侧出现半透明遮罩 rgba(0, 0, 0, 0.5)
// - 关闭方式: 点击遮罩 / 点击菜单项 / 点击汉堡按钮
// - 动画: translateX(-100%) → translateX(0), 300ms ease-out
```

## 范围（做什么）

- 创建完整的侧边栏组件（展开/折叠/菜单/高亮/徽标/折叠态 Tooltip 和浮层）
- 创建顶部信息栏（面包屑+管理员信息+退出按钮）
- 创建 AdminLayout 主布局（替换 T11-005 占位）
- 创建 NoPermissionPage 无权限提示页
- 实现权限路由守卫（URL 越权拦截）
- 实现菜单按角色过滤
- 实现响应式断点适配（桌面/小桌面/平板）
- 实现折叠/展开状态 localStorage 记忆
- 实现退出登录确认弹窗

## 边界（不做什么）

- 不实现仪表盘页面内容（T11-008）
- 不实现管理员管理页面（T11-009）
- 不实现后续模块的具体页面（T12/T13/T14）
- 不实现退款数量徽标的实时数据获取（仅预留组件接口，T11-008 或 T13 时填充）

## 涉及文件

- 新建: `zhiyu/frontend/src/features/admin/components/layout/Sidebar.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/SidebarLogo.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/SidebarMenu.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/SidebarMenuItem.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/SidebarSubMenuItem.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/SidebarCollapsedPopover.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/TopBar.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/Breadcrumb.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/AdminUserInfo.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/layout/NoPermissionPage.tsx`
- 修改: `zhiyu/frontend/src/features/admin/components/layout/AdminLayout.tsx`（替换占位）
- 修改: `zhiyu/frontend/src/features/admin/components/layout/AdminGuard.tsx`（增加权限检查）
- 修改: `zhiyu/frontend/src/features/admin/lib/admin-constants.ts`（完善菜单配置）

## 依赖

- 前置: T11-003（角色权限 API，提供 visible_menus）、T11-005（管理后台脚手架）
- 后续: T11-008（仪表盘页面，作为导航布局的子页面）

## 验收标准（GIVEN-WHEN-THEN）

> 以下标准对应 PRD `05-data-nonfunctional.md` §三.3 的 N-01 至 N-11

1. **GIVEN** 当前页面为文章管理  
   **WHEN** 查看侧边栏  
   **THEN** "内容管理"一级菜单展开，"文章管理"高亮（Rose 色背景 + 左侧 3px 竖条指示器）（N-01）

2. **GIVEN** 侧边栏展开状态  
   **WHEN** 点击底部折叠按钮  
   **THEN** 宽度从 240px 动画过渡到 64px（300ms），仅显示图标 → 再次点击恢复展开（N-02）

3. **GIVEN** 侧边栏折叠状态  
   **WHEN** Hover 一级菜单图标  
   **THEN** 右侧弹出 Tooltip 显示菜单名称（N-03）

4. **GIVEN** 侧边栏折叠状态  
   **WHEN** Hover 含二级菜单的一级图标  
   **THEN** 右侧弹出浮层面板显示全部二级菜单项（N-04）

5. **GIVEN** 当前页面为文章编辑页  
   **WHEN** 查看面包屑  
   **THEN** 显示"内容管理 / 文章管理 / 编辑文章"→ 点击"文章管理"跳转列表页（N-05）

6. **GIVEN** 内容运营管理员登录  
   **WHEN** 查看顶部栏右侧  
   **THEN** 显示管理员头像 + 姓名 + "内容运营"角色标签（Sky 色）+ 退出登录按钮（N-06）

7. **GIVEN** 内容运营管理员登录  
   **WHEN** 查看侧边栏  
   **THEN** 仅显示"仪表盘"和"内容管理"两个一级菜单，其他菜单不显示（P-01）

8. **GIVEN** 内容运营管理员  
   **WHEN** 直接访问 `/admin/users/list`  
   **THEN** 显示 NoPermissionPage：ShieldX 图标 + "无权限访问" + "返回仪表盘"按钮（P-05）

9. **GIVEN** 侧边栏已折叠  
   **WHEN** 刷新页面  
   **THEN** 侧边栏保持折叠状态（localStorage 记忆）（N-08）

10. **GIVEN** 窗口宽度 1024-1279px  
    **WHEN** 页面加载  
    **THEN** 侧边栏默认折叠（N-09）

11. **GIVEN** 窗口宽度 768-1023px  
    **WHEN** 页面加载  
    **THEN** 侧边栏隐藏，顶部栏出现汉堡按钮 → 点击汉堡按钮弹出 overlay 侧边栏（N-10）

12. **GIVEN** 退出登录  
    **WHEN** 点击退出按钮  
    **THEN** 弹出确认弹窗"确定要退出登录吗？"→ 确认后跳转登录页 + Toast "已安全退出"

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. Browser MCP 登录管理后台
4. 截图记录 1280px 宽度完整布局
5. 测试侧边栏折叠/展开动画
6. 测试折叠态 Tooltip 和二级菜单浮层
7. 测试面包屑导航和点击跳转
8. 测试菜单当前页高亮
9. 使用不同角色登录测试菜单过滤
10. 测试 URL 越权拦截（无权限页面）
11. 截图 1024px 宽度（小桌面端折叠态）
12. 截图 800px 宽度（平板端 overlay 模式）
13. 测试退出登录确认弹窗

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 侧边栏展开/折叠动画流畅（300ms）
- [ ] 菜单按角色正确过滤（四种角色均验证）
- [ ] 当前页高亮正确（Rose 色 + 左侧竖条）
- [ ] 面包屑导航正确生成和点击跳转
- [ ] 折叠态 Tooltip 和浮层面板正常
- [ ] URL 越权正确显示无权限页面
- [ ] 响应式三断点正确适配
- [ ] 折叠状态 localStorage 记忆正常
- [ ] 退出登录弹窗正常
- [ ] UI 符合 Cosmic Refraction 设计系统
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-007-fe-admin-navigation.md`

## 自检重点

- [ ] 安全：权限路由守卫无遗漏、退出正确清除 Token
- [ ] UI 设计规范：毛玻璃背景、Rose/Sky/Amber 色彩、无紫色
- [ ] 动效：折叠过渡 300ms、菜单展开 200ms、Hover 150ms
- [ ] 无障碍：菜单键盘导航、Focus 管理、aria-label
- [ ] 响应式：1280px+ / 1024-1279px / 768-1023px 三断点
- [ ] 性能：菜单过滤不重复计算（useMemo）
