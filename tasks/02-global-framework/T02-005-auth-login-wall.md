# T02-005: 认证系统 — 登录墙与路由守卫

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现知语 Zhiyu 的登录墙（Login Wall）拦截系统和路由守卫。精确覆盖 5 个登录墙触发场景，实现未登录用户受限资源的拦截 → 弹出登录弹窗 → 登录成功后自动回跳/执行原操作。路由守卫基于三层用户权限（未登录/登录免费/付费）进行拦截。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/02-auth-system.md` §一 — 登录墙触发场景清单（5 个场景）
- 产品总纲: `product/00-product-overview.md` §三.1 — 三层用户权限（未登录访客/登录免费/付费用户）
- 产品需求: `product/apps/01-global-framework/01-tab-navigation.md` §二.2 — 未登录用户 Tab 切换行为
- 编码规范: `grules/05-coding-standards.md` §二.3 — 状态管理规则（Context + useReducer）
- 关联任务: T02-004（登录弹窗 AuthModal 已实现）→ 本任务 → T02-010（全局状态整合）

## 技术方案

### 5 个登录墙触发场景

| # | 场景 | 触发条件 | 登录成功后行为 |
|---|------|---------|--------------|
| 1 | 访问受限类目 | 未登录用户点击发现中国第 4-12 类目卡片 | 当前页面刷新，解锁全部 12 类目 |
| 2 | 切换到系统课程 Tab | 未登录用户点击 Tab 2 | 自动切换到 Tab 2 |
| 3 | 切换到游戏模式 Tab | 未登录用户点击 Tab 3 | 自动切换到 Tab 3 |
| 4 | 切换到个人中心 Tab | 未登录用户点击 Tab 4 | 自动切换到 Tab 4 |
| 5 | 收藏文章 | 未登录用户点击收藏按钮 | 自动完成收藏操作 + 成功 Toast |

### 登录墙架构

```typescript
// frontend/src/features/auth/hooks/use-login-wall.ts
interface LoginWallAction {
  type: 'navigate_tab' | 'unlock_category' | 'collect_article'
  payload: {
    targetTab?: string           // 场景 2/3/4
    categoryId?: string          // 场景 1
    articleId?: string           // 场景 5
  }
}

// useLoginWall Hook 负责：
// 1. 记录当前被拦截的操作 (pendingAction)
// 2. 触发 AuthModal 弹窗
// 3. 监听登录成功事件
// 4. 登录成功后执行 pendingAction
```

### 路由守卫层级

```typescript
// frontend/src/router/guards.tsx
// AuthGuard: 要求登录（Tab 2/3/4 的一级路由）
// PaidGuard: 要求付费（L4+ 课程、特定功能）
// 两个守卫可嵌套使用

type UserPermission = 'guest' | 'free' | 'paid'

// 拦截逻辑：
// guest 访问 requireAuth 路由 → 触发 LoginWall
// free 访问 requirePaid 路由 → 显示付费墙（后续模块实现）
// paid 访问任意路由 → 放行
```

### 组件架构

```
frontend/src/features/auth/
├── components/
│   └── LoginWallOverlay.tsx       # 受限内容覆盖层（半透明遮罩 + "登录解锁" 标签）
├── hooks/
│   └── use-login-wall.ts          # 登录墙核心逻辑 Hook
├── contexts/
│   └── LoginWallContext.tsx        # 登录墙状态 Context

frontend/src/router/
├── guards.tsx                     # AuthGuard / PaidGuard 组件
└── index.tsx                      # 路由配置更新（嵌套守卫）
```

## 范围（做什么）

- 实现 `useLoginWall` Hook（拦截操作 + 记录 pendingAction + 触发弹窗 + 回跳）
- 实现 `LoginWallContext`（登录墙状态共享）
- 实现 `AuthGuard` 路由守卫组件（包裹需要登录的路由）
- 实现 `PaidGuard` 路由守卫组件占位（付费墙后续填充）
- 实现 `LoginWallOverlay` 受限内容覆盖层（卡片半透明遮罩 + "登录解锁" 标签）
- 精确覆盖 5 个登录墙触发场景
- 登录成功后自动执行 pendingAction（Tab 切换/页面刷新/收藏操作）
- 与 T02-001 的 Tab 导航守卫集成
- 与 T02-004 的 AuthModal 集成

## 边界（不做什么）

- 不实现付费墙具体 UI（课程购买模块 T04/T10）
- 不实现发现中国的类目卡片 UI（T03 发现中国模块）
- 不实现收藏功能后端（T03）
- 不实现登录弹窗本身（T02-004 已完成）

## 涉及文件

- 新建: `frontend/src/features/auth/hooks/use-login-wall.ts`
- 新建: `frontend/src/features/auth/contexts/LoginWallContext.tsx`
- 新建: `frontend/src/features/auth/components/LoginWallOverlay.tsx`
- 修改: `frontend/src/router/guards.tsx`（实现 AuthGuard + PaidGuard 占位）
- 修改: `frontend/src/router/index.tsx`（路由嵌套守卫）
- 修改: `frontend/src/components/layout/TabBar.tsx`（集成 useLoginWall）
- 修改: `frontend/src/features/auth/index.ts`（导出新模块）
- 修改: `frontend/src/App.tsx`（挂载 LoginWallContext Provider）

## 依赖

- 前置: T02-004（AuthModal 登录弹窗已实现）
- 后续: T02-010（全局状态整合用户权限判断）、T03（发现中国受限类目使用 LoginWallOverlay）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户未登录，在 Tab 1（发现中国）  
   **WHEN** 点击 Tab 2（系统课程）  
   **THEN** Tab 1 选中态不变，登录弹窗弹出；登录成功后自动切换到 Tab 2

2. **GIVEN** 用户未登录，在 Tab 1  
   **WHEN** 点击 Tab 3（游戏模式）  
   **THEN** Tab 1 不变，登录弹窗弹出；登录成功后自动切换到 Tab 3

3. **GIVEN** 用户未登录，在 Tab 1  
   **WHEN** 点击 Tab 4（个人中心）  
   **THEN** Tab 1 不变，登录弹窗弹出；登录成功后自动切换到 Tab 4

4. **GIVEN** 用户未登录，登录弹窗因 Tab 2 触发  
   **WHEN** 用户关闭弹窗（不登录）  
   **THEN** 保持在当前 Tab，Tab Bar 选中态不变

5. **GIVEN** 用户未登录，直接访问 `/courses` URL  
   **WHEN** 路由守卫拦截  
   **THEN** 重定向到 `/discover` + 触发登录弹窗

6. **GIVEN** 用户已登录（免费用户）  
   **WHEN** 点击 Tab 2/3/4  
   **THEN** 正常切换，无拦截

7. **GIVEN** LoginWallOverlay 显示在受限类目卡片上  
   **WHEN** 查看覆盖层  
   **THEN** 半透明遮罩 + "登录解锁" 标签，点击触发登录弹窗

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. Browser MCP 以未登录状态测试所有 5 个拦截场景
4. Browser MCP 登录后测试回跳行为
5. 验证所有 GIVEN-WHEN-THEN 验收标准
6. 截图记录登录墙拦截效果

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 5 个登录墙场景全部正确拦截
- [ ] 登录成功后正确回跳/执行 pendingAction
- [ ] 路由守卫正确拦截未授权访问
- [ ] 关闭弹窗不影响当前页面
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-005-auth-login-wall.md`

## 自检重点

- [ ] 安全：路由守卫不可被前端 URL 直接绕过（后端也要校验权限）
- [ ] 安全：权限判断基于后端返回的 user_role，非前端硬编码
- [ ] 性能：pendingAction 不造成内存泄漏
- [ ] UI 规范：LoginWallOverlay 半透明遮罩视觉正确
- [ ] 类型同步：UserPermission 类型与后端一致
