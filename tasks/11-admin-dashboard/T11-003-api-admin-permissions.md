# T11-003: 后端 API — 角色权限管理

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6

## 需求摘要

实现管理后台的角色权限管理 API 和管理员 CRUD API。包括：角色权限配置查询、管理员列表/创建/编辑/禁用/启用/密码重置、接口级鉴权中间件（基于角色权限矩阵校验每个 API 请求的操作权限）。核心是实现权限控制粒度到接口级别的后端中间件，确保四种角色只能访问其权限范围内的 API。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` — 四种角色定义、完整权限矩阵表、互斥规则、变更生效机制
- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` §三 — 无权限 API 返回 403
- 产品需求: `product/admin/01-admin-dashboard/01-login.md` §六 — 账号创建、密码重置、临时密码规则
- 产品需求: `product/admin/00-admin-overview.md` — 管理后台六大模块权限分配
- API 设计: `grules/04-api-design.md` — RESTful 统一响应格式
- 编码规范: `grules/05-coding-standards.md` §三 — 后端分层架构
- 关联任务: 前置 T11-001 → 后续 T11-007（前端权限路由守卫）、T11-009（前端管理员管理页面）

## 技术方案

### API 端点设计

```
# 角色权限
GET    /api/v1/admin/roles                    — 获取所有角色权限配置
GET    /api/v1/admin/roles/:role              — 获取指定角色权限详情

# 管理员管理（仅超级管理员可操作）
GET    /api/v1/admin/users                    — 管理员列表（分页+筛选）
POST   /api/v1/admin/users                    — 创建管理员
GET    /api/v1/admin/users/:id                — 管理员详情
PUT    /api/v1/admin/users/:id                — 编辑管理员
PATCH  /api/v1/admin/users/:id/status         — 禁用/启用管理员
PATCH  /api/v1/admin/users/:id/role           — 修改管理员角色
POST   /api/v1/admin/users/:id/reset-password — 重置密码（生成临时密码）
```

### 接口级鉴权中间件

```typescript
// backend/src/core/admin-permission.middleware.ts

/**
 * 权限鉴权中间件工厂
 * 用法：router.get('/articles', requirePermission('content.articles.view'), handler)
 *
 * 工作流程：
 * 1. 从 req.adminRole 获取当前角色（由 adminAuthMiddleware 注入）
 * 2. 查询 admin_roles 表获取该角色的 permissions JSONB
 * 3. 检查 permissions[requiredPermission] === true
 * 4. 通过 → next()，不通过 → 403
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 实现权限检查逻辑
  }
}

/**
 * 仅超级管理员可操作的中间件
 * 用法：router.post('/users', requireSuperAdmin, handler)
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void

/**
 * 权限缓存机制
 * - 角色权限配置从数据库读取后缓存到内存（node-cache，TTL 5分钟）
 * - 角色权限变更时主动清除缓存
 */
```

### Repository 层 — `backend/src/repositories/admin-role.repository.ts`

```typescript
export class AdminRoleRepository {
  // 获取所有角色权限配置
  async findAll(): Promise<AdminRoleConfig[]>

  // 根据角色标识获取权限配置
  async findByRole(role: AdminRole): Promise<AdminRoleConfig | null>

  // 获取角色的权限矩阵（用于鉴权中间件）
  async getPermissions(role: AdminRole): Promise<Record<string, boolean>>

  // 获取角色的可见菜单
  async getVisibleMenus(role: AdminRole): Promise<string[]>

  // 获取角色的仪表盘数据范围
  async getDashboardScope(role: AdminRole): Promise<Record<string, boolean>>
}
```

### Service 层 — `backend/src/services/admin-user.service.ts`

```typescript
export class AdminUserService {
  // 管理员列表（分页+角色筛选+状态筛选+关键字搜索）
  async list(params: AdminListParams): Promise<PaginatedResult<AdminUserResponse>>

  // 创建管理员（仅超管可操作）
  async create(dto: AdminCreate, creatorId: string): Promise<AdminUserResponse>

  // 获取管理员详情
  async getById(id: string): Promise<AdminUserResponse>

  // 编辑管理员信息
  async update(id: string, dto: AdminUpdate, operatorId: string): Promise<AdminUserResponse>

  // 禁用/启用管理员
  async toggleStatus(id: string, status: AdminStatus, operatorId: string): Promise<void>

  // 修改管理员角色
  async changeRole(id: string, newRole: AdminRole, operatorId: string): Promise<void>

  // 重置密码（生成临时密码）
  async resetPassword(id: string, operatorId: string): Promise<{ temp_password: string }>

  // 超管保护：检查是否为最后一个超管
  private async ensureNotLastSuperAdmin(id: string): Promise<void>
}
```

### 管理员创建流程

```
POST /api/v1/admin/users
Body: { email, name, role }
鉴权: requireSuperAdmin

处理流程：
1. Zod 校验请求体
2. 检查邮箱唯一性
3. 生成随机临时密码（12位，包含大小写字母+数字+特殊字符）
4. bcrypt 哈希密码
5. 插入 admin_users（is_temp_password = true）
6. 记录审计日志（敏感操作）
7. 返回管理员信息 + 临时密码（明文，仅此一次展示）
8. TODO: 后续由 T15 横切关注点实现邮件发送
```

### 超管保护机制

```typescript
/**
 * 在以下操作前检查：
 * - 删除/禁用超级管理员
 * - 降级超级管理员角色
 *
 * 规则：系统中至少保留一个 active 状态的超级管理员
 * 违反时：返回 400，message = "系统至少需要一个超级管理员"
 */
```

### 角色变更实时通知

```typescript
/**
 * 角色变更后的处理：
 * 1. 更新数据库中管理员的 role 字段
 * 2. 记录审计日志（敏感操作）
 * 3. 使该管理员的所有活跃 Token 失效（清空 active_sessions）
 *    → 下次该管理员发起请求时 → 认证中间件校验 session_id 不在 active_sessions → 401
 *    → 前端接收 401 后弹出 Toast 提示角色已变更，触发重新登录
 */
```

### 分页查询参数

```typescript
export const AdminListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  role: AdminRoleEnum.optional(),
  status: AdminStatusEnum.optional(),
  keyword: z.string().max(100).optional(),  // 按姓名或邮箱搜索
  sort_by: z.enum(['created_at', 'last_login_at', 'name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})
```

## 范围（做什么）

- 创建 `backend/src/core/admin-permission.middleware.ts` — 接口级鉴权中间件
- 创建 `backend/src/repositories/admin-role.repository.ts` — 角色权限数据访问层
- 创建 `backend/src/services/admin-user.service.ts` — 管理员管理业务逻辑层
- 创建 `backend/src/routers/v1/admin/users.router.ts` — 管理员管理 API 路由
- 创建 `backend/src/routers/v1/admin/roles.router.ts` — 角色权限 API 路由
- 修改 `backend/src/routers/v1/index.ts` — 挂载新路由
- 修改 `backend/src/models/admin.ts` — 补充分页查询 Schema

## 边界（不做什么）

- 不实现仪表盘数据聚合 API（T11-004）
- 不实现前端管理员管理页面（T11-009）
- 不实现前端权限路由守卫（T11-007）
- 不实现邮件发送临时密码（T15 横切关注点）
- 不修改角色权限矩阵种子数据（T11-001 已完成）

## 涉及文件

- 新建: `zhiyu/backend/src/core/admin-permission.middleware.ts`
- 新建: `zhiyu/backend/src/repositories/admin-role.repository.ts`
- 新建: `zhiyu/backend/src/services/admin-user.service.ts`
- 新建: `zhiyu/backend/src/routers/v1/admin/users.router.ts`
- 新建: `zhiyu/backend/src/routers/v1/admin/roles.router.ts`
- 修改: `zhiyu/backend/src/routers/v1/index.ts`
- 修改: `zhiyu/backend/src/models/admin.ts`

## 依赖

- 前置: T11-001（admin_users / admin_roles 表和种子数据）、T11-002（认证中间件 adminAuthMiddleware）
- 后续: T11-004（仪表盘 API，需要鉴权中间件）、T11-007（前端导航，需要角色权限 API）、T11-009（前端管理员管理页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 已登录的超级管理员 Token  
   **WHEN** GET `/api/v1/admin/roles`  
   **THEN** 返回四种角色的完整权限配置（display_name、label_color、permissions、visible_menus、dashboard_scope）

2. **GIVEN** 已登录的内容运营管理员  
   **WHEN** GET `/api/v1/admin/users`  
   **THEN** 返回 403，message 为"无权执行此操作"

3. **GIVEN** 已登录的超级管理员  
   **WHEN** POST `/api/v1/admin/users` 创建新管理员（email、name、role）  
   **THEN** 返回 201，包含管理员信息和临时密码，数据库中 is_temp_password = true

4. **GIVEN** 已存在同邮箱的管理员  
   **WHEN** POST `/api/v1/admin/users` 用相同邮箱创建  
   **THEN** 返回 409，提示"邮箱已被使用"

5. **GIVEN** 系统仅有 1 个超级管理员  
   **WHEN** 尝试禁用/降级该超级管理员  
   **THEN** 返回 400，message 为"系统至少需要一个超级管理员"

6. **GIVEN** 已登录的超级管理员  
   **WHEN** PATCH `/api/v1/admin/users/:id/role` 修改某管理员角色  
   **THEN** 角色更新成功，该管理员的 active_sessions 被清空

7. **GIVEN** 已登录的超级管理员  
   **WHEN** POST `/api/v1/admin/users/:id/reset-password`  
   **THEN** 返回新的临时密码，数据库中 is_temp_password = true，password_hash 已更新

8. **GIVEN** 内容运营管理员的 Token  
   **WHEN** 调用需要 `users.list.view` 权限的 API  
   **THEN** 鉴权中间件返回 403

9. **GIVEN** 管理员列表 API  
   **WHEN** GET `/api/v1/admin/users?role=content_ops&page=1&page_size=10`  
   **THEN** 返回正确的分页数据，仅包含内容运营角色的管理员

10. **GIVEN** 创建管理员操作  
    **WHEN** 审计日志表查询  
    **THEN** admin_audit_logs 包含该操作记录，is_sensitive = true

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 登录获取超管 Token
5. 测试角色权限查询 API
6. 测试创建管理员 API（各种成功/失败场景）
7. 测试管理员列表分页和筛选
8. 测试禁用/启用管理员
9. 测试角色变更和超管保护
10. 使用内容运营 Token 测试越权访问（应返回 403）
11. 验证审计日志记录

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 角色权限 API 正确返回四种角色配置
- [ ] 管理员 CRUD API 全部正常（创建/查询/编辑/禁用/角色变更/密码重置）
- [ ] 鉴权中间件正确拦截越权请求（403）
- [ ] 超管保护机制正常（最后一个超管不可禁用/降级）
- [ ] 分页查询和筛选正确
- [ ] 审计日志正确记录
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-003-api-admin-permissions.md`

## 自检重点

- [ ] 安全：所有管理员管理 API 仅超管可访问、接口级鉴权无遗漏
- [ ] 性能：权限缓存机制避免每次请求查库
- [ ] 类型同步：API 响应与 models/admin.ts 类型一致
- [ ] 审计日志：敏感操作（创建/禁用/角色变更/密码重置）全部记录
- [ ] 超管保护：最后一个超管不可操作
