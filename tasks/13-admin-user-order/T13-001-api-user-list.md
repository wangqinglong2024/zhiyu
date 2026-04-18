# T13-001: 后端 API — 用户列表与搜索 (Admin User List & Search API)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

为管理后台「用户管理」模块实现用户列表与搜索的后端 API。支持通过昵称/邮箱/用户ID 搜索用户，支持多维度高级筛选（用户类型、注册日期、最近活跃、国家/地区、段位、账号状态），支持三列可排序（注册日期、最近活跃、累计消费），支持分页（每页 20 条），以及 CSV 异步导出功能。所有接口需管理员鉴权（超级管理员 + 用户运营）。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/01-user-list.md` — 用户列表 PRD 完整定义
- 非功能需求: `product/admin/03-admin-user-order/07-data-nonfunctional.md` §二 — 性能/并发/安全
- API 规约: `grules/04-api-design.md` — CRUD、分页、筛选、统一响应格式
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 全局架构: `grules/01-rules.md` — Supabase + Express 技术栈
- 产品总纲: `product/00-product-overview.md` §五.1 — 课程购买规则、§五.2 — 知语币体系
- 关联任务: T11-003（管理员鉴权中间件）、T01-006（用户表基础）

## 技术方案

### 数据库查询（引用已有 users 相关表）

```sql
-- 用户列表查询需要聚合以下表数据：
-- users（基本信息：昵称/邮箱/注册日期/头像/国家/最近活跃/状态）
-- user_courses（订单表聚合累计消费金额）
-- user_game_stats 或 user_ranks（当前段位信息）
-- user_bans（封禁状态）

-- 视图或联合查询示例：
SELECT
  u.id,
  u.nickname,
  u.email,
  u.avatar_url,
  u.country,
  u.created_at AS registered_at,
  u.last_active_at,
  u.status,
  COALESCE(SUM(o.amount), 0) AS total_spent,
  r.current_rank,
  CASE
    WHEN EXISTS (SELECT 1 FROM orders o2 WHERE o2.user_id = u.id AND o2.status = 'completed') THEN 'paid'
    WHEN u.last_active_at IS NOT NULL THEN 'free'
    ELSE 'guest'
  END AS user_type
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
LEFT JOIN user_ranks r ON r.user_id = u.id
GROUP BY u.id, r.current_rank;
```

### API 端点设计

```
前缀: /api/v1/admin/users

GET    /                  — 用户列表（分页 + 搜索 + 筛选 + 排序）
GET    /export            — 异步导出 CSV（当前筛选条件）
```

### Zod Schema 定义

```typescript
// backend/src/models/admin-user.ts
import { z } from 'zod';

export const UserTypeEnum = z.enum(['all', 'guest', 'free', 'paid']);

export const UserRankEnum = z.enum([
  'all', 'none', 'bronze', 'silver', 'gold',
  'platinum', 'diamond', 'star', 'king'
]);

export const AccountStatusEnum = z.enum(['all', 'normal', 'banned']);

export const AdminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().min(2).max(100).optional(),           // 搜索关键词（昵称/邮箱/ID）
  user_type: UserTypeEnum.default('all'),                    // 用户类型筛选
  register_start: z.string().datetime().optional(),          // 注册日期起始
  register_end: z.string().datetime().optional(),            // 注册日期结束
  active_start: z.string().datetime().optional(),            // 最近活跃起始
  active_end: z.string().datetime().optional(),              // 最近活跃结束
  country: z.string().max(10).optional(),                    // 国家/地区
  rank: UserRankEnum.default('all'),                         // 段位
  status: AccountStatusEnum.default('all'),                  // 账号状态
  sort_by: z.enum(['registered_at', 'last_active_at', 'total_spent']).default('registered_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// 用户列表项响应类型
export interface AdminUserListItem {
  id: string;
  nickname: string;
  email: string;
  avatar_url: string | null;
  country: string | null;
  registered_at: string;
  last_active_at: string | null;
  user_type: 'guest' | 'free' | 'paid';
  current_rank: string | null;
  total_spent: number;
  status: 'normal' | 'banned';
  ban_expires_at: string | null;  // 封禁到期时间（仅 banned 状态）
}

// 导出参数（复用列表查询参数，去除分页）
export const AdminUserExportQuerySchema = AdminUserListQuerySchema.omit({
  page: true,
  page_size: true,
});
```

### Repository 层

```typescript
// backend/src/repositories/admin-user.repository.ts
export class AdminUserRepository {
  // 用户列表查询（聚合多表）
  async findAll(query: AdminUserListQuery): Promise<PaginatedResult<AdminUserListItem>>;
  // 导出查询（无分页限制，最多 50000 条）
  async findAllForExport(query: AdminUserExportQuery): Promise<AdminUserListItem[]>;
  // 获取用户总数（用于导出前校验）
  async countByFilter(query: AdminUserExportQuery): Promise<number>;
}
```

### Service 层

```typescript
// backend/src/services/admin-user.service.ts
export class AdminUserService {
  // 业务规则：
  // - 搜索关键词同时匹配昵称（模糊）、邮箱（前缀）、用户ID（精确）
  // - 筛选条件之间为 AND 关系
  // - 用户类型根据订单和活跃数据动态计算
  // - 导出最多 50,000 条，超出返回错误
  // - 导出异步处理，生成 UTF-8 with BOM 的 CSV
  // - 导出操作记录到 admin_logs

  async listUsers(query: AdminUserListQuery): Promise<PaginatedResult<AdminUserListItem>>;
  async exportUsers(query: AdminUserExportQuery, adminId: string): Promise<ReadableStream>;
}
```

### Router 层

```typescript
// backend/src/routers/v1/admin/user.router.ts
import { Router } from 'express';
import { requireAdmin, requireRole } from '@/core/middleware';

const router = Router();

// 需要管理员鉴权 + 用户运营或超级管理员角色
router.use(requireAdmin);
router.use(requireRole(['super_admin', 'user_operator']));

router.get('/', adminUserController.list);
router.get('/export', adminUserController.export);
```

### 搜索匹配逻辑

```typescript
// 搜索同时匹配三个字段
// 昵称：ILIKE '%keyword%'（模糊匹配）
// 邮箱：ILIKE 'keyword%'（前缀匹配）
// 用户ID：= keyword（精确匹配）
// 三者为 OR 关系
```

### CSV 导出逻辑

```typescript
// 1. 校验导出数量 ≤ 50,000
// 2. 设置响应头：Content-Type: text/csv; charset=utf-8
// 3. 写入 BOM (\uFEFF) 兼容 Excel 中文显示
// 4. 流式写入 CSV 行（避免内存溢出）
// 5. 文件名: zhiyu_users_YYYYMMDD_HHmmss.csv
// 6. GDPR 合规：不导出密码/精确位置/IP/设备标识
// 7. 记录导出日志到 admin_logs（操作人/时间/筛选条件/行数）
```

## 范围（做什么）

- 创建 `admin-user.ts` Zod Schema + TypeScript 类型定义
- 实现 `AdminUserRepository` 数据访问层（多表联合查询）
- 实现 `AdminUserService` 业务逻辑层（搜索、筛选、排序、导出）
- 实现 `adminUserController` 控制器 + 路由注册
- 用户列表分页查询（默认每页 20 条）
- 搜索功能（昵称模糊 + 邮箱前缀 + ID 精确匹配）
- 6 个维度筛选（用户类型/注册日期/活跃日期/国家/段位/状态）
- 3 列排序（注册日期/最近活跃/累计消费）
- CSV 异步导出（UTF-8 BOM，GDPR 合规，最多 50,000 条）
- 导出操作审计日志

## 边界（不做什么）

- 不实现用户详情 API（T13-002）
- 不实现封禁/解封 API（T13-003）
- 不实现前端页面（T13-007）
- 不建用户相关表（依赖 T01-006 已创建的 users 表和 T10 相关表）
- 不实现管理员鉴权中间件（T11-003 已完成，本任务引用）

## 涉及文件

- 新建: `backend/src/models/admin-user.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/admin-user.repository.ts` — 数据访问层
- 新建: `backend/src/services/admin-user.service.ts` — 业务逻辑层
- 新建: `backend/src/controllers/admin-user.controller.ts` — 控制器
- 新建: `backend/src/routers/v1/admin/user.router.ts` — 路由
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册用户管理路由
- 新建: `backend/src/utils/csv-export.ts` — CSV 导出工具
- 不动: `backend/src/core/middleware.ts` — 鉴权中间件（T11-003 已实现）

## 依赖

- 前置: T11-003（管理员鉴权中间件）、T01-006（用户表基础）
- 后续: T13-002（用户详情）、T13-003（封禁）、T13-007（前端用户列表）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录且角色为用户运营
   **WHEN** 调用 `GET /api/v1/admin/users?page=1&page_size=20`
   **THEN** 返回分页用户列表，包含 items/total/page/page_size/has_next 字段，每项包含 id/nickname/email/avatar_url/country/registered_at/last_active_at/user_type/current_rank/total_spent/status，响应码 200

2. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/users?keyword=张三`
   **THEN** 返回昵称包含「张三」的用户列表；调用 `?keyword=test@` 返回邮箱前缀匹配的结果

3. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/users?user_type=paid&rank=gold&status=normal`
   **THEN** 返回仅匹配全部筛选条件（AND 关系）的用户列表

4. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/users?sort_by=total_spent&sort_order=desc`
   **THEN** 返回按累计消费降序排列的用户列表

5. **GIVEN** 管理员已登录且当前筛选条件下有 500 条用户
   **WHEN** 调用 `GET /api/v1/admin/users/export`
   **THEN** 返回 UTF-8 BOM CSV 文件，文件名格式 `zhiyu_users_YYYYMMDD_HHmmss.csv`，包含 10 个合规字段，不包含密码/IP/位置/设备信息

6. **GIVEN** 管理员已登录且筛选条件下有 60,000 条用户
   **WHEN** 调用 `GET /api/v1/admin/users/export`
   **THEN** 返回错误提示「数据量过大，请缩小筛选范围」

7. **GIVEN** 未登录用户或角色非管理员/用户运营
   **WHEN** 调用 `GET /api/v1/admin/users`
   **THEN** 返回 401/403 错误，拒绝访问

8. **GIVEN** 管理员执行了导出操作
   **WHEN** 查询 admin_logs 表
   **THEN** 存在一条导出日志，包含操作人ID/时间/筛选条件/导出行数

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待后端健康检查通过：`curl http://localhost:3000/api/health`
3. 使用管理员 JWT Token 调用以下接口验证：
   - 无参数查询列表 → 默认注册日期降序、每页 20 条
   - 搜索关键词 → 昵称模糊匹配 + 邮箱前缀匹配 + ID 精确匹配
   - 组合筛选 → 多条件 AND 结果正确
   - 排序切换 → 三个字段升降序均正确
   - CSV 导出 → 文件格式正确、字段合规
4. 验证非管理员访问返回 403
5. 验证 keyword 不足 2 字符时返回全量列表
6. 检查 admin_logs 导出操作日志

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 用户列表分页查询正确
- [ ] 搜索三字段匹配逻辑正确
- [ ] 6 维度筛选组合正确
- [ ] 3 列排序正确
- [ ] CSV 导出格式正确（UTF-8 BOM）
- [ ] GDPR 合规（禁止字段未导出）
- [ ] 非管理员被拒绝（401/403）
- [ ] 导出审计日志已记录
- [ ] API 响应时间 < 1s（用户列表搜索/筛选）

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-001-api-user-list.md`

## 自检重点

- [ ] 所有端点遵循 RESTful 设计，路径前缀 `/api/v1/admin/users`
- [ ] Zod Schema 覆盖所有查询参数，无 `any` 类型
- [ ] 统一响应格式 `{ code, data, message }`
- [ ] 分页默认 page=1, page_size=20
- [ ] 搜索关键词 < 2 字符时不触发搜索
- [ ] SQL 查询使用参数化防注入
- [ ] 导出流式传输，不缓存在服务器
- [ ] 导出文件 UTF-8 with BOM
- [ ] 文件命名 kebab-case，函数命名 camelCase
- [ ] 并发安全：导出不影响列表查询性能
