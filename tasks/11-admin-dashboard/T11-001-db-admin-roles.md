# T11-001: 数据库 Schema — 管理员与角色

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 3

## 需求摘要

创建管理后台的管理员账号体系数据表，包括 `admin_users` 表（管理员账号信息，独立于应用端 `profiles` 表）和 `admin_roles` 表（角色定义与权限矩阵）。实现完整的 RLS 策略、索引、自动时间戳触发器，以及初始超级管理员种子数据。管理员账号体系完全独立于应用端用户，存储在独立表中。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` — 四种角色定义与完整权限矩阵
- 产品需求: `product/admin/01-admin-dashboard/01-login.md` §六 — 账号创建和密码重置规则
- 产品需求: `product/admin/00-admin-overview.md` — 管理后台角色概览
- 产品需求: `product/00-product-overview.md` §三.2 — 管理后台角色定义
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（RLS 零信任、Migration 留痕）
- 编码规范: `grules/05-coding-standards.md` §一.2 — 数据库表名 snake_case 复数、字段 snake_case
- 环境配置: `grules/env.md` §3 — Supabase 数据库凭证
- 关联任务: 前置 T01-012 → 后续 T11-002（管理员认证 API）、T11-003（角色权限 API）

## 技术方案

### 数据库设计

#### 枚举类型

```sql
-- 管理员角色枚举（四种角色互斥）
CREATE TYPE admin_role AS ENUM ('super_admin', 'content_ops', 'user_ops', 'game_ops');

-- 管理员账号状态
CREATE TYPE admin_status AS ENUM ('active', 'disabled');
```

#### admin_users 表（管理员账号）

```sql
-- supabase/migrations/20260418100001_create_admin_users.sql

-- =====================================================
-- 管理员账号表：独立于应用端用户，存储管理后台账号信息
-- =====================================================

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本信息
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,

  -- 角色（四种角色互斥，一人一角色）
  role admin_role NOT NULL DEFAULT 'content_ops',

  -- 账号状态
  status admin_status NOT NULL DEFAULT 'active',

  -- 密码管理
  is_temp_password BOOLEAN NOT NULL DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ,

  -- 二次验证（TOTP）
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- 登录安全
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,

  -- 并发会话控制（最多 2 个）
  active_sessions JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- 创建者（超级管理员创建其他管理员）
  created_by UUID REFERENCES admin_users(id),

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE UNIQUE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_status ON admin_users(status);
CREATE INDEX idx_admin_users_created_at ON admin_users(created_at DESC);

-- =====================================================
-- RLS 策略（零信任原则）
-- =====================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 策略 1：服务端通过 service_role 操作所有记录（后端 API 使用 service_role key）
-- service_role 自动绕过 RLS，无需额外策略

-- 策略 2：禁止前端直接操作 admin_users（所有操作走后端 API）
-- 不创建任何 anon 或 authenticated 策略 = 前端零访问权限

-- =====================================================
-- 触发器：自动更新 updated_at
-- =====================================================
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE admin_users IS '管理员账号表：独立于应用端用户，存储管理后台账号信息';
COMMENT ON COLUMN admin_users.role IS '管理员角色：super_admin/content_ops/user_ops/game_ops，四种互斥';
COMMENT ON COLUMN admin_users.is_temp_password IS '是否为临时密码（首次登录需强制修改）';
COMMENT ON COLUMN admin_users.totp_secret IS 'TOTP 二次验证密钥（加密存储）';
COMMENT ON COLUMN admin_users.active_sessions IS '活跃会话列表，最多 2 个并发会话';
COMMENT ON COLUMN admin_users.locked_until IS '账号锁定截止时间（5次失败后锁定15分钟）';
```

#### admin_roles 表（角色权限配置）

```sql
-- =====================================================
-- 角色权限配置表：存储各角色的权限矩阵
-- =====================================================

CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 角色标识
  role admin_role NOT NULL UNIQUE,

  -- 角色中文名称
  display_name VARCHAR(50) NOT NULL,

  -- 角色标签颜色（用于前端展示）
  label_color VARCHAR(20) NOT NULL DEFAULT '#0284c7',

  -- 权限矩阵（JSON 格式，精确到菜单/按钮/API 级别）
  permissions JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- 可见的仪表盘数据范围
  dashboard_scope JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- 可见的菜单列表
  visible_menus JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 触发器
-- =====================================================
CREATE TRIGGER admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE admin_roles IS '角色权限配置表：存储各角色的权限矩阵和可见菜单';
COMMENT ON COLUMN admin_roles.permissions IS '权限矩阵 JSON，格式：{"module.action": true/false}';
COMMENT ON COLUMN admin_roles.dashboard_scope IS '仪表盘可见数据范围 JSON';
COMMENT ON COLUMN admin_roles.visible_menus IS '可见菜单路径数组 JSON';
```

#### admin_audit_logs 表（操作审计日志）

```sql
-- =====================================================
-- 管理员操作审计日志表：记录所有管理后台操作
-- =====================================================

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 操作人
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  admin_name VARCHAR(100) NOT NULL,

  -- 操作信息
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(255),

  -- 请求信息
  ip_address INET,
  user_agent TEXT,

  -- 是否敏感操作
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_is_sensitive ON admin_audit_logs(is_sensitive) WHERE is_sensitive = TRUE;

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE admin_audit_logs IS '管理员操作审计日志：记录退款、封禁、知语币调整等敏感操作';
COMMENT ON COLUMN admin_audit_logs.is_sensitive IS '是否敏感操作（退款审批、用户封禁、知语币调整、角色变更等）';
```

#### 种子数据 — 角色权限矩阵

```sql
-- =====================================================
-- 种子数据：四种角色权限配置
-- =====================================================

INSERT INTO admin_roles (role, display_name, label_color, permissions, dashboard_scope, visible_menus)
VALUES
(
  'super_admin',
  '超级管理员',
  '#d97706',
  '{
    "dashboard.view": true, "dashboard.edit": true,
    "content.articles.view": true, "content.articles.edit": true,
    "content.courses.view": true, "content.courses.edit": true,
    "content.quotes.view": true, "content.quotes.edit": true,
    "users.list.view": true, "users.list.edit": true,
    "users.analytics.view": true,
    "orders.list.view": true, "orders.list.edit": true,
    "orders.refunds.view": true, "orders.refunds.edit": true,
    "orders.coins.view": true, "orders.coins.edit": true,
    "games.skins.view": true, "games.skins.edit": true,
    "games.seasons.view": true, "games.seasons.edit": true,
    "games.rankings.view": true, "games.rankings.edit": true,
    "system.push.view": true, "system.push.edit": true,
    "system.i18n.view": true, "system.i18n.edit": true,
    "system.admins.view": true, "system.admins.edit": true,
    "system.logs.view": true
  }'::JSONB,
  '{
    "total_users": true, "dau": true, "paid_users": true,
    "revenue": true, "online_games": true, "pending_refunds": true,
    "user_growth_trend": true, "revenue_trend": true, "dau_trend": true,
    "content_overview": true, "game_overview": true,
    "all_audit_logs": true
  }'::JSONB,
  '[
    "/admin/dashboard",
    "/admin/content/articles", "/admin/content/courses", "/admin/content/quotes",
    "/admin/users/list", "/admin/users/analytics",
    "/admin/orders/list", "/admin/orders/refunds", "/admin/orders/coins",
    "/admin/games/skins", "/admin/games/seasons", "/admin/games/rankings",
    "/admin/system/push", "/admin/system/i18n", "/admin/system/admins", "/admin/system/logs"
  ]'::JSONB
),
(
  'content_ops',
  '内容运营',
  '#0284c7',
  '{
    "dashboard.view": true,
    "content.articles.view": true, "content.articles.edit": true,
    "content.courses.view": true, "content.courses.edit": true,
    "content.quotes.view": true, "content.quotes.edit": true
  }'::JSONB,
  '{
    "content_overview": true
  }'::JSONB,
  '[
    "/admin/dashboard",
    "/admin/content/articles", "/admin/content/courses", "/admin/content/quotes"
  ]'::JSONB
),
(
  'user_ops',
  '用户运营',
  '#0284c7',
  '{
    "dashboard.view": true,
    "users.list.view": true, "users.list.edit": true,
    "users.analytics.view": true,
    "orders.list.view": true, "orders.list.edit": true,
    "orders.refunds.view": true, "orders.refunds.edit": true,
    "orders.coins.view": true, "orders.coins.edit": true
  }'::JSONB,
  '{
    "total_users": true, "dau": true, "paid_users": true,
    "revenue": true, "pending_refunds": true,
    "user_growth_trend": true, "revenue_trend": true, "dau_trend": true
  }'::JSONB,
  '[
    "/admin/dashboard",
    "/admin/users/list", "/admin/users/analytics",
    "/admin/orders/list", "/admin/orders/refunds", "/admin/orders/coins"
  ]'::JSONB
),
(
  'game_ops',
  '游戏运营',
  '#0284c7',
  '{
    "dashboard.view": true,
    "games.skins.view": true, "games.skins.edit": true,
    "games.seasons.view": true, "games.seasons.edit": true,
    "games.rankings.view": true, "games.rankings.edit": true
  }'::JSONB,
  '{
    "online_games": true, "game_overview": true
  }'::JSONB,
  '[
    "/admin/dashboard",
    "/admin/games/skins", "/admin/games/seasons", "/admin/games/rankings"
  ]'::JSONB
);

-- =====================================================
-- 种子数据：初始超级管理员账号
-- 密码: Zhiyu@2026（bcrypt 哈希，首次登录强制修改）
-- =====================================================

INSERT INTO admin_users (email, password_hash, name, role, is_temp_password)
VALUES (
  'admin@ideas.top',
  '$2b$12$LJ3m4ys0Gp5Ht6K8vXqYZOJ3IZjQ8xB7mN9kL2pR4wE5tY6uI8sK',
  '系统管理员',
  'super_admin',
  TRUE
);
```

### 后端类型定义 — `backend/src/models/admin.ts`

```typescript
import { z } from 'zod'

// ===== 管理员角色枚举 =====
export const AdminRoleEnum = z.enum(['super_admin', 'content_ops', 'user_ops', 'game_ops'])
export type AdminRole = z.infer<typeof AdminRoleEnum>

// ===== 管理员状态枚举 =====
export const AdminStatusEnum = z.enum(['active', 'disabled'])
export type AdminStatus = z.infer<typeof AdminStatusEnum>

// ===== 管理员创建 Schema =====
export const AdminCreateSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(255),
  name: z.string().min(1, '请输入姓名').max(100),
  role: AdminRoleEnum,
})
export type AdminCreate = z.infer<typeof AdminCreateSchema>

// ===== 管理员更新 Schema =====
export const AdminUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: AdminRoleEnum.optional(),
  status: AdminStatusEnum.optional(),
  avatar_url: z.string().url().optional(),
})
export type AdminUpdate = z.infer<typeof AdminUpdateSchema>

// ===== 登录请求 Schema =====
export const AdminLoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
  remember_me: z.boolean().optional().default(false),
})
export type AdminLogin = z.infer<typeof AdminLoginSchema>

// ===== 修改密码 Schema =====
export const AdminChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string()
    .min(8, '密码至少 8 位')
    .max(32, '密码最多 32 位')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: '两次输入密码不一致',
  path: ['confirm_password'],
})
export type AdminChangePassword = z.infer<typeof AdminChangePasswordSchema>

// ===== 管理员响应类型 =====
export interface AdminUserResponse {
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

// ===== 角色权限配置响应类型 =====
export interface AdminRoleConfig {
  role: AdminRole
  display_name: string
  label_color: string
  permissions: Record<string, boolean>
  dashboard_scope: Record<string, boolean>
  visible_menus: string[]
}

// ===== 审计日志响应类型 =====
export interface AuditLogResponse {
  id: string
  admin_id: string
  admin_name: string
  action: string
  description: string
  target_type: string | null
  target_id: string | null
  is_sensitive: boolean
  created_at: string
}
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 独立 admin_users 表 | 不复用 auth.users / profiles | 管理后台账号体系完全独立于应用端用户，安全隔离 |
| 密码存储 | bcrypt 哈希 + 后端处理 | 不依赖 Supabase Auth，自行管理密码哈希 |
| 权限矩阵 | JSONB 格式存储 | 灵活支持权限粒度扩展，无需改表结构 |
| 角色互斥 | role 字段单值 ENUM | 数据库层面强约束一人一角色 |
| 审计日志 | 独立表 + 敏感标记 | PRD 要求 100% 记录敏感操作 |
| 并发会话 | JSONB 数组存储 | 最多 2 个会话，超出时踢出最早的 |
| RLS 策略 | 禁止前端直接访问 | 所有操作走后端 API + service_role |

## 范围（做什么）

- 创建 `supabase/migrations/20260418100001_create_admin_users.sql` Migration 文件
- 创建 `admin_users` 表（含完整字段、索引、RLS、触发器）
- 创建 `admin_roles` 表（含权限矩阵 JSONB）
- 创建 `admin_audit_logs` 表（操作审计日志）
- 插入四种角色的权限矩阵种子数据
- 插入初始超级管理员账号种子数据
- 创建 `backend/src/models/admin.ts` Zod Schema 和 TypeScript 类型

## 边界（不做什么）

- 不实现登录认证 API（T11-002）
- 不实现角色权限管理 API（T11-003）
- 不实现仪表盘数据聚合 API（T11-004）
- 不创建前端页面或组件
- 不实现 TOTP 二次验证的具体逻辑（T11-002）
- 不创建 Repository 层（T11-002/003 中创建）

## 涉及文件

- 新建: `zhiyu/supabase/migrations/20260418100001_create_admin_users.sql`
- 新建: `zhiyu/backend/src/models/admin.ts`
- 新建: `zhiyu/scripts/seed-admin.sql`（初始管理员种子数据，可独立执行）

## 依赖

- 前置: T01-012（基础架构搭建完成，Supabase 可用，`update_updated_at()` 函数已存在）
- 后续: T11-002（管理员认证 API）、T11-003（角色权限管理 API）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration SQL 已执行  
   **WHEN** 查询 `\d admin_users`  
   **THEN** 表存在，包含 id、email、password_hash、name、role、status、is_temp_password、totp_secret、failed_login_count、locked_until 等全部字段

2. **GIVEN** admin_users 表 RLS 已开启  
   **WHEN** 使用 ANON_KEY 查询 admin_users  
   **THEN** 返回空结果（RLS 禁止前端直接访问）

3. **GIVEN** admin_roles 表种子数据已插入  
   **WHEN** 查询 `SELECT role, display_name FROM admin_roles`  
   **THEN** 返回四条记录：super_admin/超级管理员、content_ops/内容运营、user_ops/用户运营、game_ops/游戏运营

4. **GIVEN** super_admin 权限矩阵已插入  
   **WHEN** 查询 `SELECT permissions FROM admin_roles WHERE role = 'super_admin'`  
   **THEN** permissions JSON 包含所有模块的 view 和 edit 权限为 true

5. **GIVEN** content_ops 权限矩阵已插入  
   **WHEN** 查询 `SELECT visible_menus FROM admin_roles WHERE role = 'content_ops'`  
   **THEN** visible_menus 仅包含 /admin/dashboard 和 /admin/content/* 路径

6. **GIVEN** 初始超级管理员账号已创建  
   **WHEN** 查询 `SELECT email, role, is_temp_password FROM admin_users`  
   **THEN** 返回 admin@ideas.top，角色为 super_admin，is_temp_password 为 true

7. **GIVEN** admin_audit_logs 表已创建  
   **WHEN** 查询 `\d admin_audit_logs`  
   **THEN** 表存在，包含 admin_id、action、description、is_sensitive、created_at 等字段

8. **GIVEN** backend/src/models/admin.ts 存在  
   **WHEN** 使用 AdminLoginSchema 校验缺少 email 字段的数据  
   **THEN** Zod 校验失败并返回"请输入有效的邮箱地址"错误

9. **GIVEN** 密码校验 Schema 存在  
   **WHEN** 使用 AdminChangePasswordSchema 校验不含大写字母的密码  
   **THEN** 校验失败并返回"密码必须包含大写字母"错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 通过 Supabase MCP 或 psql 执行 Migration SQL
3. 验证 admin_users 表结构：`\d admin_users`
4. 验证 admin_roles 表结构：`\d admin_roles`
5. 验证 admin_audit_logs 表结构：`\d admin_audit_logs`
6. 验证索引：`\di admin_users*` 和 `\di admin_roles*`
7. 验证 RLS：`SELECT * FROM pg_policies WHERE tablename IN ('admin_users', 'admin_roles', 'admin_audit_logs')`
8. 验证种子数据：`SELECT role, display_name FROM admin_roles`
9. 验证初始管理员：`SELECT email, role FROM admin_users`
10. 验证 ANON_KEY 无法访问 admin_users

### 测试通过标准

- [ ] Migration SQL 执行无错误
- [ ] admin_users 表结构完整（所有字段、类型、约束正确）
- [ ] admin_roles 表结构完整
- [ ] admin_audit_logs 表结构完整
- [ ] RLS 已开启且策略正确（前端无法直接访问）
- [ ] 四种角色的权限矩阵种子数据已插入
- [ ] 初始超级管理员账号已创建（is_temp_password = true）
- [ ] 索引已创建
- [ ] Zod Schema 类型校验正确

### 测试不通过处理

- 发现问题 → 立即修复 SQL → 删表重建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-001-db-admin-roles.md`

## 自检重点

- [ ] 安全：密码哈希存储、RLS 禁止前端访问、敏感字段不暴露
- [ ] 类型同步：Zod Schema 与数据库字段一一对应
- [ ] RLS：admin_users/admin_roles/admin_audit_logs 均已开启 RLS
- [ ] 数据完整性：外键、UNIQUE、CHECK 约束齐全
- [ ] 种子数据：四种角色权限矩阵与 PRD 02-permissions.md 完全一致
