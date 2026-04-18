# T11-002: 后端 API — 管理员认证

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8

## 需求摘要

实现管理后台完整的认证体系 API，包括：邮箱+密码登录、JWT Token 签发与验证、会话管理（2小时/7天有效期）、登录失败计数与账号锁定（5次/15分钟）、首次登录强制改密、密码重置（超管操作）、主动退出、会话续期、并发会话控制（最多2个）。管理员认证体系独立于应用端 Supabase Auth，使用自建 JWT 方案。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/01-login.md` — 登录表单、安全机制、会话管理完整 PRD
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §一.1 — 登录鉴权数据流、§二.3 — 会话安全指标
- 产品需求: `product/admin/01-admin-dashboard/01-login.md` §六 — 首次登录改密、密码重置规则
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构（后端使用 service_role）
- API 设计: `grules/04-api-design.md` — RESTful 统一响应格式、错误码
- 编码规范: `grules/05-coding-standards.md` §三 — 后端路由/服务/仓库分层、§六 — 安全规范
- 环境配置: `grules/env.md` §2 — 后端端口 8100(dev)
- 关联任务: 前置 T11-001 → 后续 T11-003（权限管理）、T11-006（前端登录页）

## 技术方案

### API 端点设计

```
POST   /api/v1/admin/auth/login           — 管理员登录
POST   /api/v1/admin/auth/logout          — 主动退出
POST   /api/v1/admin/auth/refresh         — 刷新 Token / 会话续期
POST   /api/v1/admin/auth/change-password — 修改密码（含首次登录强制改密）
GET    /api/v1/admin/auth/me              — 获取当前管理员信息
```

### 登录流程

```
POST /api/v1/admin/auth/login
Body: { email, password, remember_me }

处理流程：
1. Zod 校验请求体
2. 查询 admin_users（按 email）
3. 检查账号状态（disabled → 403）
4. 检查锁定状态（locked_until > NOW() → 403，返回剩余锁定秒数）
5. bcrypt.compare 验证密码
6. 密码错误 → 累加 failed_login_count → ≥5 次写入 locked_until = NOW() + 15min
7. 密码正确 → 重置 failed_login_count = 0
8. 检查并发会话（>2 时踢出最早的）
9. 签发 JWT Token（含 admin_id、role、session_id）
10. 写入 active_sessions、last_login_at、last_login_ip
11. 记录审计日志
12. 返回 Token + 管理员信息 + is_temp_password 标记
```

### JWT Token 设计

```typescript
// Token Payload
interface AdminTokenPayload {
  admin_id: string       // 管理员 ID
  role: AdminRole        // 角色
  session_id: string     // 会话 ID（用于并发控制）
  iat: number            // 签发时间
  exp: number            // 过期时间
}

// Token 有效期
// 未勾选"记住我": 2 小时
// 勾选"记住我": 7 天
```

### Repository 层 — `backend/src/repositories/admin-user.repository.ts`

```typescript
// 核心方法
export class AdminUserRepository {
  // 根据邮箱查询管理员
  async findByEmail(email: string): Promise<AdminUser | null>

  // 根据 ID 查询管理员
  async findById(id: string): Promise<AdminUser | null>

  // 更新登录失败计数
  async incrementFailedLogin(id: string): Promise<{ failed_count: number; locked_until: string | null }>

  // 重置登录失败计数
  async resetFailedLogin(id: string): Promise<void>

  // 锁定账号
  async lockAccount(id: string, until: Date): Promise<void>

  // 更新最后登录信息
  async updateLoginInfo(id: string, ip: string, sessionId: string): Promise<void>

  // 更新活跃会话
  async updateActiveSessions(id: string, sessions: SessionInfo[]): Promise<void>

  // 修改密码
  async updatePassword(id: string, passwordHash: string): Promise<void>

  // 标记密码已修改（is_temp_password = false）
  async markPasswordChanged(id: string): Promise<void>
}
```

### Service 层 — `backend/src/services/admin-auth.service.ts`

```typescript
export class AdminAuthService {
  // 管理员登录
  async login(dto: AdminLogin, clientIp: string): Promise<LoginResult>

  // 主动退出
  async logout(adminId: string, sessionId: string): Promise<void>

  // 刷新 Token（会话续期）
  async refreshToken(adminId: string, sessionId: string, rememberMe: boolean): Promise<string>

  // 修改密码
  async changePassword(adminId: string, dto: AdminChangePassword): Promise<void>

  // 获取当前管理员信息
  async getMe(adminId: string): Promise<AdminUserResponse>

  // 验证并发会话（踢出最早的）
  private async enforceSessionLimit(adminId: string, newSessionId: string): Promise<void>

  // 签发 JWT
  private signToken(payload: AdminTokenPayload): string

  // 验证 JWT
  static verifyToken(token: string): AdminTokenPayload
}
```

### 中间件 — `backend/src/core/admin-auth.middleware.ts`

```typescript
// 管理员认证中间件：验证 JWT Token，注入 admin_id 和 role 到 req
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void

// 从 Authorization: Bearer <token> 或 Cookie 中提取 Token
// 验证 Token 有效性 + 检查会话是否仍在 active_sessions 中
// 验证通过 → req.adminId = payload.admin_id, req.adminRole = payload.role
// 验证失败 → 401 Unauthorized
```

### 响应格式（遵循 grules/04-api-design.md）

```typescript
// 登录成功响应
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 7200,           // 秒（2小时或7天）
    "admin": {
      "id": "uuid",
      "email": "admin@ideas.top",
      "name": "系统管理员",
      "avatar_url": null,
      "role": "super_admin",
      "is_temp_password": true     // 前端据此弹出改密弹窗
    },
    "role_config": {
      "display_name": "超级管理员",
      "label_color": "#d97706",
      "visible_menus": [...],
      "dashboard_scope": {...}
    }
  },
  "message": "登录成功"
}

// 登录失败响应（密码错误）
{
  "code": 401,
  "data": {
    "remaining_attempts": 3,       // 剩余尝试次数
    "locked": false
  },
  "message": "邮箱或密码错误，还剩 3 次尝试机会"
}

// 登录失败响应（账号锁定）
{
  "code": 403,
  "data": {
    "locked": true,
    "locked_until": "2026-04-18T10:30:00Z",
    "remaining_seconds": 895       // 剩余锁定秒数
  },
  "message": "账号已锁定，请 15 分钟后重试"
}
```

### 安全要点

| 安全项 | 实现方式 |
|--------|---------|
| 密码哈希 | bcrypt（saltRounds=12），禁止明文存储 |
| JWT 签名 | HS256 + 环境变量中的 JWT_SECRET |
| 模糊错误提示 | 始终返回"邮箱或密码错误"，不区分邮箱不存在/密码错误 |
| 暴力破解防护 | 5 次失败锁定 15 分钟，按邮箱维度计数 |
| 会话安全 | Token 含 session_id，退出时从 active_sessions 移除 |
| 并发控制 | 最多 2 个并发会话，超出踢出最早的 |
| HTTPS 强制 | Nginx 层强制 HTTPS（生产环境） |
| 密码强度 | 8-32 位，必须包含大小写字母和数字 |
| 审计日志 | 登录/退出/改密均记录到 admin_audit_logs |

## 范围（做什么）

- 创建 `backend/src/repositories/admin-user.repository.ts` — 管理员数据访问层
- 创建 `backend/src/services/admin-auth.service.ts` — 认证业务逻辑层
- 创建 `backend/src/routers/v1/admin/auth.router.ts` — 认证 API 路由
- 创建 `backend/src/core/admin-auth.middleware.ts` — 管理员认证中间件
- 创建 `backend/src/core/jwt.ts` — JWT 签发与验证工具
- 修改 `backend/src/routers/v1/index.ts` — 挂载 admin 路由
- 修改 `backend/package.json` — 添加 bcryptjs、jsonwebtoken 依赖

## 边界（不做什么）

- 不实现角色权限管理 CRUD API（T11-003）
- 不实现 TOTP 二次验证的 setup/verify 流程（可在后续迭代添加）
- 不实现前端登录页面（T11-006）
- 不实现管理员管理 CRUD API（T11-003 中创建/T11-009 前端）
- 不实现邮件发送（临时密码邮件属于 T15 横切关注点）

## 涉及文件

- 新建: `zhiyu/backend/src/repositories/admin-user.repository.ts`
- 新建: `zhiyu/backend/src/services/admin-auth.service.ts`
- 新建: `zhiyu/backend/src/routers/v1/admin/auth.router.ts`
- 新建: `zhiyu/backend/src/core/admin-auth.middleware.ts`
- 新建: `zhiyu/backend/src/core/jwt.ts`
- 修改: `zhiyu/backend/src/routers/v1/index.ts`
- 修改: `zhiyu/backend/package.json`
- 修改: `zhiyu/backend/src/models/admin.ts`（如需补充类型）

## 依赖

- 前置: T11-001（admin_users / admin_roles 表已创建）
- 后续: T11-003（角色权限管理 API）、T11-004（仪表盘 API，需要认证中间件）、T11-006（前端登录页）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 初始管理员账号已存在（admin@ideas.top）  
   **WHEN** POST `/api/v1/admin/auth/login` 发送正确邮箱和密码  
   **THEN** 返回 200，包含 token、expires_in、admin 信息、role_config，is_temp_password 为 true

2. **GIVEN** 管理员账号存在  
   **WHEN** POST `/api/v1/admin/auth/login` 发送错误密码（第 1 次）  
   **THEN** 返回 401，message 包含"还剩 4 次尝试机会"，remaining_attempts 为 4

3. **GIVEN** 管理员已连续失败 4 次  
   **WHEN** 第 5 次发送错误密码  
   **THEN** 返回 403，message 包含"账号已锁定"，locked 为 true，remaining_seconds > 0

4. **GIVEN** 管理员账号被锁定中  
   **WHEN** 发送正确密码登录  
   **THEN** 返回 403，提示账号锁定中，返回剩余锁定秒数

5. **GIVEN** 管理员已登录（持有有效 Token）  
   **WHEN** GET `/api/v1/admin/auth/me`  
   **THEN** 返回 200，包含当前管理员完整信息（不含 password_hash）

6. **GIVEN** 管理员使用临时密码登录成功  
   **WHEN** POST `/api/v1/admin/auth/change-password` 发送新密码（满足强度要求）  
   **THEN** 返回 200，is_temp_password 被标记为 false

7. **GIVEN** 管理员修改密码  
   **WHEN** 新密码不含大写字母  
   **THEN** 返回 400，提示"密码必须包含大写字母"

8. **GIVEN** 管理员已登录  
   **WHEN** POST `/api/v1/admin/auth/logout`  
   **THEN** 返回 200，Token 失效，会话从 active_sessions 移除

9. **GIVEN** 管理员已登录且 Token 即将过期  
   **WHEN** POST `/api/v1/admin/auth/refresh`  
   **THEN** 返回新 Token，有效期重新计算

10. **GIVEN** 管理员已有 2 个活跃会话  
    **WHEN** 从第 3 个设备登录  
    **THEN** 登录成功，最早的会话被踢出（从 active_sessions 移除）

11. **GIVEN** 管理员状态为 disabled  
    **WHEN** POST `/api/v1/admin/auth/login`  
    **THEN** 返回 403，提示"账号已禁用"

12. **GIVEN** 无 Token 或 Token 无效  
    **WHEN** 访问需要认证的 API  
    **THEN** 返回 401，message 为"未授权，请先登录"

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 通过 curl 测试登录 API：`curl -X POST http://localhost:8100/api/v1/admin/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@ideas.top","password":"Zhiyu@2026"}'`
5. 使用返回的 Token 测试 `/me` 接口
6. 测试错误密码累计锁定
7. 测试修改密码
8. 测试退出登录
9. 测试 Token 过期/无效时的 401 响应
10. 测试并发会话控制

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 登录 API 正确返回 Token 和管理员信息
- [ ] 错误密码返回正确的剩余尝试次数
- [ ] 5 次失败后正确锁定 15 分钟
- [ ] 锁定期间正确拒绝登录并返回剩余秒数
- [ ] 修改密码 API 正确验证密码强度
- [ ] 退出登录正确清除会话
- [ ] Token 过期/无效返回 401
- [ ] 并发会话超过 2 个时正确踢出最早的
- [ ] 审计日志正确记录登录/退出/改密操作
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-002-api-admin-auth.md`

## 自检重点

- [ ] 安全：密码 bcrypt 哈希、JWT 密钥环境变量、模糊错误提示、锁定机制
- [ ] 性能：bcrypt 不阻塞事件循环（使用 async 版本）
- [ ] 类型同步：API 响应与 models/admin.ts 类型一致
- [ ] 审计日志：登录/退出/改密操作均记录
- [ ] API 规范：响应格式符合 grules/04-api-design.md
