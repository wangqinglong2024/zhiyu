# T11-009: 前端 — 管理员管理页面

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 7

## 需求摘要

实现管理员管理页面（仅超级管理员可访问），包括：管理员列表表格（分页、搜索、角色筛选）、新增管理员弹窗（邮箱/姓名/角色选择/系统生成临时密码）、编辑管理员信息弹窗、角色分配/变更弹窗（含影响提示）、启用/禁用管理员确认弹窗、重置密码确认弹窗（生成新临时密码）。所有操作通过 T11-003 API 完成。超级管理员保护规则：无法删除或降级最后一个超级管理员。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` §四 — 管理员管理界面
- 产品需求: `product/admin/01-admin-dashboard/01-login.md` §六 — 管理员账号生命周期（新增→初始化→正常→禁用→解锁）
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §三.2 — 验收标准（P-系列部分）
- 架构白皮书: `grules/01-rules.md` §一 — Cosmic Refraction CSS 参数
- UI 设计: `grules/06-ui-design.md` — 表格、弹窗、表单设计规范
- API 设计: `grules/04-api-design.md` — 响应格式、分页
- 关联任务: 前置 T11-003（管理员 CRUD API + 权限接口）、T11-007（全局导航） → 后续 T11-010（集成验证）

## 技术方案

### 页面布局

```
路由: /admin/system/admins
权限: system.admins.view（仅 super_admin）

┌──────────────────────────────────────────────────────┐
│  H1: "管理员管理"               [+ 新增管理员] 按钮   │
│                                                      │
│  ┌─ 筛选栏 ──────────────────────────────────────┐   │
│  │  🔍 搜索（邮箱/姓名）  │ 角色筛选  │ 状态筛选 │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 管理员列表表格 ──────────────────────────────┐   │
│  │  姓名 | 邮箱 | 角色 | 状态 | 最后登录 | 操作  │   │
│  │  ────────────────────────────────────────────  │   │
│  │  张三 | zhang@... | 超级管理员 | 正常 | ... |...│   │
│  │  李四 | li@...    | 内容运营   | 正常 | ... |...│   │
│  │  ...                                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 分页 ────────────────────────────────────────┐   │
│  │  共 12 条  │  < 1 2 3 >  │  每页 10/20/50 条  │   │
│  └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 组件拆分

```
features/admin/pages/
└── AdminManagementPage.tsx          # 管理员管理页面主组件

features/admin/components/management/
├── AdminTable.tsx                    # 管理员列表表格
├── AdminTableFilters.tsx             # 搜索和筛选栏
├── AdminTableRow.tsx                 # 表格行（含操作按钮组）
├── CreateAdminModal.tsx              # 新增管理员弹窗
├── EditAdminModal.tsx                # 编辑管理员信息弹窗
├── ChangeRoleModal.tsx               # 角色变更弹窗
├── AdminActionConfirmModal.tsx       # 通用确认弹窗（禁用/启用/重置密码）
└── AdminPagination.tsx               # 分页组件
```

### 管理员列表表格

```typescript
// AdminTable 列定义
const columns = [
  {
    key: 'name',
    title: '姓名',
    width: '15%',
    render: (admin) => (
      // 头像 + 姓名
      // 头像: 32px 圆形，无图片显示姓名首字（Rose 背景白字）
      // 姓名: 14px 白色 font-medium
    ),
  },
  {
    key: 'email',
    title: '邮箱',
    width: '20%',
    // 14px 灰色 #a3a3a3
  },
  {
    key: 'role',
    title: '角色',
    width: '15%',
    render: (admin) => (
      // 药丸形标签
      // super_admin: "超级管理员" Amber #d97706 背景 10% 透明度
      // content_ops: "内容运营" Sky #0284c7
      // user_ops: "用户运营" Rose #e11d48
      // game_ops: "游戏运营" 绿色 #22c55e
    ),
  },
  {
    key: 'status',
    title: '状态',
    width: '10%',
    render: (admin) => (
      // 小圆点 + 文字
      // active: 🟢 "正常"
      // disabled: 🔴 "已禁用"
      // locked: 🟡 "已锁定"
    ),
  },
  {
    key: 'last_login_at',
    title: '最后登录',
    width: '15%',
    // 格式: YYYY-MM-DD HH:mm
    // 从未登录: "从未登录" 灰色斜体
  },
  {
    key: 'created_at',
    title: '创建时间',
    width: '12%',
    // 格式: YYYY-MM-DD
  },
  {
    key: 'actions',
    title: '操作',
    width: '13%',
    render: (admin) => (
      // 操作按钮组（... 更多下拉菜单）
      // - 编辑信息
      // - 变更角色
      // - 重置密码
      // - 禁用/启用
      // 保护规则: 最后一个超管不显示"变更角色"和"禁用"
    ),
  },
]

// 表格样式
// 表头: rgba(255,255,255,0.06) 背景，12px 灰色文字 uppercase
// 行: 分隔线 rgba(255,255,255,0.06)
// Hover: rgba(255,255,255,0.03) 背景
// 选中: rgba(225, 29, 72, 0.05) 背景
```

### 筛选栏

```typescript
// AdminTableFilters
interface FilterState {
  search: string          // 搜索关键词（邮箱或姓名）
  role: string | null     // 角色筛选 (all / super_admin / content_ops / user_ops / game_ops)
  status: string | null   // 状态筛选 (all / active / disabled / locked)
}

// 搜索框: 防抖 300ms
// 角色下拉: 全部角色 / 超级管理员 / 内容运营 / 用户运营 / 游戏运营
// 状态下拉: 全部状态 / 正常 / 已禁用 / 已锁定

// 筛选变更时重新请求 API（page 重置为 1）
```

### 新增管理员弹窗

```typescript
// CreateAdminModal
// 触发: 点击右上角 [+ 新增管理员] 按钮
// 弹窗标题: "新增管理员"

// 表单字段:
// 1. 邮箱地址 *（必填，唯一性校验）
// 2. 姓名 *（必填，2-20字符）
// 3. 角色 *（必填，下拉选择 4 种角色）

// 密码:
// - 系统自动生成临时密码（不可编辑）
// - 创建成功后弹窗显示临时密码（带复制按钮）
// - "请妥善保存临时密码，此弹窗关闭后将无法再次查看"

// 按钮:
// "取消"（Ghost 按钮）+ "创建"（Rose 主按钮）

// 创建成功 → 刷新列表 → 显示临时密码弹窗
// 创建失败 → 表单内显示错误（如邮箱已存在）
```

### 编辑管理员弹窗

```typescript
// EditAdminModal
// 触发: 操作菜单 → "编辑信息"
// 弹窗标题: "编辑管理员"

// 可编辑字段:
// 1. 姓名（必填）
// 2. 邮箱（必填，唯一性校验，修改后需要重新登录）

// 不可编辑（只读展示）:
// - 角色（通过单独的"变更角色"操作）
// - 创建时间
// - 最后登录时间

// 按钮: "取消" + "保存"
// 保存成功 → 刷新列表 → Toast "管理员信息已更新"
```

### 角色变更弹窗

```typescript
// ChangeRoleModal
// 触发: 操作菜单 → "变更角色"
// 弹窗标题: "变更角色"

// 内容:
// 当前角色: [超级管理员] （药丸标签）
// 新角色: 下拉选择（排除当前角色）
//
// ⚠️ 影响提示（Amber 色警示框）:
// "变更角色后，该管理员的所有活跃会话将被立即终止，
//  需要重新登录。新角色的权限将立即生效。"
//
// 保护规则:
// - 如果是最后一个 super_admin → 禁止变更，提示 "系统中至少需要保留一个超级管理员"

// 按钮: "取消" + "确认变更"（Amber 警示按钮）
```

### 通用确认弹窗

```typescript
// AdminActionConfirmModal — 用于禁用/启用/重置密码
interface ConfirmModalConfig {
  type: 'disable' | 'enable' | 'reset_password'
  admin: AdminUser
}

// type === 'disable':
// 标题: "禁用管理员"
// 内容: "确定要禁用管理员 [姓名] 吗？禁用后该管理员将无法登录，所有活跃会话将被终止。"
// 按钮: "取消" + "确认禁用"（红色危险按钮）
// 保护: 最后一个 super_admin 不可禁用

// type === 'enable':
// 标题: "启用管理员"
// 内容: "确定要启用管理员 [姓名] 吗？启用后该管理员可以正常登录。"
// 按钮: "取消" + "确认启用"（绿色按钮）

// type === 'reset_password':
// 标题: "重置密码"
// 内容: "确定要重置管理员 [姓名] 的密码吗？重置后将生成新的临时密码，该管理员下次登录需要修改密码。"
// 按钮: "取消" + "确认重置"（Amber 按钮）
// 重置成功 → 显示新临时密码弹窗（同新增时的临时密码弹窗）
```

### 分页组件

```typescript
// AdminPagination
interface PaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

// 左侧: "共 {total} 条"
// 中间: 页码按钮 (< 1 2 3 ... 10 >)
// 右侧: 每页条数选择 (10 / 20 / 50)

// 样式:
// 当前页: Rose 背景白字圆形按钮
// 其他页: 透明背景灰字，Hover 白色背景 3% 透明度
// 禁用: opacity-50 cursor-not-allowed
```

## 范围（做什么）

- 创建管理员管理页面主组件
- 创建管理员列表表格（排序、头像+姓名、角色标签、状态指示、操作菜单）
- 创建搜索和筛选栏（搜索防抖、角色筛选、状态筛选）
- 创建新增管理员弹窗（表单校验 + 临时密码显示）
- 创建编辑管理员弹窗
- 创建角色变更弹窗（含影响提示和超管保护）
- 创建通用确认弹窗（禁用/启用/重置密码）
- 创建分页组件
- 挂载路由 `/admin/system/admins`

## 边界（不做什么）

- 不实现管理员操作日志详情页（属于系统日志模块）
- 不实现批量操作（批量禁用/删除等，后续迭代）
- 不实现管理员头像上传（当前使用姓名首字）
- 不实现 TOTP 二次验证管理

## 涉及文件

- 新建: `zhiyu/frontend/src/features/admin/pages/AdminManagementPage.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/AdminTable.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/AdminTableFilters.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/AdminTableRow.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/CreateAdminModal.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/EditAdminModal.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/ChangeRoleModal.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/AdminActionConfirmModal.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/management/AdminPagination.tsx`
- 修改: `zhiyu/frontend/src/features/admin/router/admin-routes.tsx` — 挂载管理员管理路由

## 依赖

- 前置: T11-003（管理员 CRUD API 8 个端点）、T11-007（全局导航布局）
- 后续: T11-010（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

> 以下标准对应 PRD `02-permissions.md` §四 + `05-data-nonfunctional.md` P-系列

1. **GIVEN** 超级管理员访问管理员管理页  
   **WHEN** 页面加载  
   **THEN** 显示管理员列表表格，含所有管理员信息（P-06）

2. **GIVEN** 管理员列表  
   **WHEN** 在搜索框输入"张三"  
   **THEN** 300ms 防抖后列表过滤，仅显示匹配结果（P-07）

3. **GIVEN** 角色筛选下拉  
   **WHEN** 选择"内容运营"  
   **THEN** 列表仅显示内容运营角色的管理员

4. **GIVEN** 点击 [+ 新增管理员] 按钮  
   **WHEN** 填写邮箱/姓名/角色 → 点击"创建"  
   **THEN** 创建成功 → 列表刷新 → 弹出临时密码显示弹窗（含复制按钮）

5. **GIVEN** 新增管理员时输入已存在的邮箱  
   **WHEN** 点击"创建"  
   **THEN** 邮箱字段下方显示"该邮箱已被使用"错误提示

6. **GIVEN** 操作菜单 → 点击"变更角色"  
   **WHEN** 弹窗打开  
   **THEN** 显示当前角色 + 新角色下拉 + Amber 色影响提示

7. **GIVEN** 系统中只有一个超级管理员  
   **WHEN** 尝试变更其角色或禁用  
   **THEN** 操作被阻止 → 提示"系统中至少需要保留一个超级管理员"（P-08）

8. **GIVEN** 操作菜单 → 点击"禁用"  
   **WHEN** 确认弹窗 → 点击"确认禁用"  
   **THEN** 管理员状态变为"已禁用" → 列表刷新 → Toast "管理员已禁用"

9. **GIVEN** 操作菜单 → 点击"重置密码"  
   **WHEN** 确认弹窗 → 点击"确认重置"  
   **THEN** 显示新临时密码弹窗 → Toast "密码已重置"

10. **GIVEN** 非超级管理员  
    **WHEN** 直接访问 /admin/system/admins  
    **THEN** 显示无权限提示页（T11-007 的 NoPermissionPage）（P-05）

11. **GIVEN** 管理员列表 12 条数据  
    **WHEN** 每页 10 条  
    **THEN** 显示 2 页分页 → 点击第 2 页正确加载

12. **GIVEN** 角色变更成功  
    **WHEN** 该管理员在其他设备已登录  
    **THEN** 所有会话被终止（API 侧处理，前端显示 Toast 确认）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. Browser MCP 登录管理后台（super_admin 账号）
4. 导航到 /admin/system/admins
5. 截图记录管理员列表页面
6. 测试搜索过滤（输入关键词 → 验证列表更新）
7. 测试角色筛选下拉
8. 测试新增管理员完整流程（填写表单 → 创建 → 验证临时密码弹窗）
9. 测试编辑管理员信息
10. 测试角色变更弹窗（含影响提示）
11. 测试禁用/启用管理员
12. 测试重置密码
13. 测试超级管理员保护规则
14. 测试分页功能
15. 使用非超管账号访问验证无权限拦截

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 管理员列表正确渲染（头像、角色标签、状态指示）
- [ ] 搜索和筛选正常工作
- [ ] 新增管理员完整流程正常（含临时密码）
- [ ] 编辑管理员信息正常
- [ ] 角色变更正常（含影响提示）
- [ ] 禁用/启用正常
- [ ] 重置密码正常
- [ ] 超管保护规则有效
- [ ] 分页正常
- [ ] 非超管无权限拦截
- [ ] UI 符合 Cosmic Refraction 设计系统
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-009-fe-admin-management.md`

## 自检重点

- [ ] 安全：超管保护规则完整（不可删除/降级最后一个超管）
- [ ] 安全：临时密码仅显示一次，不可再次查看
- [ ] UI 设计规范：毛玻璃表格、药丸标签、Cosmic Refraction
- [ ] 表单校验：必填项、邮箱格式、唯一性
- [ ] 性能：搜索防抖 300ms、列表分页不一次加载全部
- [ ] 无障碍：表格语义标签、弹窗 Focus Trap、键盘操作
