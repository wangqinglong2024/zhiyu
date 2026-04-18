# T13-003: 后端 API — 封禁与解封 (Admin User Ban/Unban API)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 7

## 需求摘要

为管理后台实现用户封禁与解封的后端 API。封禁操作需要选择原因（违规言论/作弊行为/异常操作/其他）和期限（1 天/7 天/30 天/永久），封禁后写入封禁记录和操作日志。解封分为自动到期解封（定时任务）和管理员手动解封。每一次封禁/解封操作必须完整记录审计信息，不可修改不可删除。被封禁用户在应用端登录后弹出全屏封禁通知，无法使用任何功能。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/03-user-ban.md` — 封禁/解封完整 PRD
- 非功能需求: `product/admin/03-admin-user-order/07-data-nonfunctional.md` §二.5 — 操作审计
- API 规约: `grules/04-api-design.md` — 特殊操作用子路径
- 编码规范: `grules/05-coding-standards.md` §三 — 幂等、行锁
- 关联任务: T13-001（用户列表 API）

## 技术方案

### 数据库表结构（如 user_bans 表尚未创建，需新增）

```sql
-- 封禁记录表
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ban_reason_category TEXT NOT NULL,   -- 'rule_violation' | 'cheating' | 'abnormal' | 'other'
  ban_reason_detail TEXT,              -- 补充说明（选择"其他"时必填）
  ban_duration TEXT NOT NULL,          -- '1d' | '7d' | '30d' | 'permanent'
  banned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,             -- 到期时间（永久封禁为 NULL）
  banned_by UUID NOT NULL REFERENCES auth.users(id),  -- 操作管理员
  unbanned_at TIMESTAMPTZ,            -- 解封时间
  unban_method TEXT,                   -- 'auto_expired' | 'manual'
  unbanned_by UUID REFERENCES auth.users(id),  -- 解封操作管理员
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX idx_user_bans_expires_at ON user_bans(expires_at) WHERE unbanned_at IS NULL;
```

### API 端点设计

```
前缀: /api/v1/admin/users/:userId

POST   /ban                — 封禁用户
POST   /unban              — 手动解封用户
GET    /ban-status          — 获取当前封禁状态（供应用端检查）

# 内部定时任务
POST   /api/v1/admin/system/auto-unban   — 自动解封到期用户（定时任务调用）
```

### Zod Schema 定义

```typescript
// backend/src/models/admin-user-ban.ts
import { z } from 'zod';

export const BanReasonCategoryEnum = z.enum([
  'rule_violation',  // 违规言论
  'cheating',        // 作弊行为
  'abnormal',        // 异常操作
  'other'            // 其他
]);

export const BanDurationEnum = z.enum(['1d', '7d', '30d', 'permanent']);

export const BanUserSchema = z.object({
  reason_category: BanReasonCategoryEnum,
  reason_detail: z.string().max(200).optional(),
  duration: BanDurationEnum,
}).refine(
  (data) => data.reason_category !== 'other' || (data.reason_detail && data.reason_detail.trim().length > 0),
  { message: '选择"其他"时补充说明为必填', path: ['reason_detail'] }
);

// 封禁期限到到期时间的映射
// '1d'  → now() + 24h
// '7d'  → now() + 168h
// '30d' → now() + 720h
// 'permanent' → null（无到期时间）
```

### Service 层

```typescript
// backend/src/services/admin-user-ban.service.ts
export class AdminUserBanService {
  // 封禁业务规则：
  // - 已封禁用户不可重复封禁（返回 409 冲突）
  // - 封禁后立即更新 users 表状态为 'banned'
  // - 写入 user_bans 表记录
  // - 写入 admin_logs 审计日志
  // - 课程有效期不因封禁暂停（产品设计明确要求）

  async banUser(userId: string, data: BanUserInput, adminId: string): Promise<void>;
  
  // 解封业务规则：
  // - 非封禁状态用户不可解封（返回 400）
  // - 解封后立即更新 users 表状态为 'normal'
  // - 更新 user_bans 表最近一条封禁记录的解封信息
  // - 写入 admin_logs 审计日志

  async unbanUser(userId: string, adminId: string): Promise<void>;

  // 自动解封（定时任务）：
  // - 查询 expires_at <= now() 且 unbanned_at IS NULL 的记录
  // - 批量解封，unban_method = 'auto_expired'

  async autoUnbanExpiredUsers(): Promise<number>;  // 返回解封数量

  // 获取封禁状态（供应用端调用）：
  async getBanStatus(userId: string): Promise<BanStatusResponse>;
}
```

### 并发安全

```typescript
// 封禁操作需要对用户记录加行锁，防止并发封禁同一用户
// 使用 SELECT ... FOR UPDATE 或 Supabase 事务

// 伪代码：
// BEGIN TRANSACTION
//   SELECT * FROM users WHERE id = :userId FOR UPDATE
//   IF user.status = 'banned' THEN THROW 409
//   UPDATE users SET status = 'banned'
//   INSERT INTO user_bans (...)
//   INSERT INTO admin_logs (...)
// COMMIT
```

### 定时任务

```typescript
// 自动解封定时任务，每分钟运行一次
// 可通过 node-cron 或 Express 内部定时器实现
// 查询 user_bans 中 expires_at <= now() 且 unbanned_at IS NULL 的记录
// 批量更新 users.status = 'normal'
// 批量更新 user_bans.unbanned_at/unban_method
```

## 范围（做什么）

- 创建 `admin-user-ban.ts` Zod Schema + 类型定义
- 创建 user_bans 表迁移脚本（如尚不存在）
- 实现封禁 API：校验 → 行锁 → 更新状态 → 写入封禁记录 → 审计日志
- 实现手动解封 API：校验 → 更新状态 → 更新封禁记录 → 审计日志
- 实现自动解封定时任务（node-cron，每分钟检查到期封禁）
- 实现封禁状态查询 API（供应用端调用）
- 所有操作写入 admin_logs 审计日志

## 边界（不做什么）

- 不实现应用端封禁通知弹窗 UI（属于前端全局框架任务）
- 不实现前端封禁管理页面（T13-009）
- 不修改课程有效期逻辑（有效期不因封禁暂停是产品规则）

## 涉及文件

- 新建: `backend/src/models/admin-user-ban.ts` — Zod Schema + 类型
- 新建: `backend/src/services/admin-user-ban.service.ts` — 业务逻辑层
- 新建: `backend/src/controllers/admin-user-ban.controller.ts` — 控制器
- 新建: `supabase/migrations/YYYYMMDDHHMMSS_create_user_bans.sql` — 建表迁移
- 修改: `backend/src/routers/v1/admin/user.router.ts` — 增加封禁/解封路由
- 新建: `backend/src/jobs/auto-unban.job.ts` — 自动解封定时任务
- 修改: `backend/src/main.ts` — 注册定时任务

## 依赖

- 前置: T13-001（用户管理路由基础）
- 后续: T13-009（前端封禁管理页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录，目标用户状态为「正常」
   **WHEN** 调用 `POST /api/v1/admin/users/:userId/ban`，Body: `{ reason_category: "cheating", duration: "7d" }`
   **THEN** 用户状态变为 banned，user_bans 表新增一条记录（含封禁时间/原因/期限/操作人），admin_logs 记录封禁操作

2. **GIVEN** 目标用户已处于封禁状态
   **WHEN** 调用 `POST /api/v1/admin/users/:userId/ban`
   **THEN** 返回 409 冲突错误「该用户已处于封禁状态」

3. **GIVEN** 选择封禁原因为「其他」但未填写补充说明
   **WHEN** 调用封禁 API
   **THEN** 返回 400 校验错误「选择"其他"时补充说明为必填」

4. **GIVEN** 管理员已登录，目标用户处于封禁状态
   **WHEN** 调用 `POST /api/v1/admin/users/:userId/unban`
   **THEN** 用户状态变为 normal，user_bans 记录更新解封时间和解封方式（manual）+ 解封操作人，admin_logs 记录解封操作

5. **GIVEN** 用户被封禁 1 天，且封禁已超过 24 小时
   **WHEN** 自动解封定时任务运行
   **THEN** 该用户自动解封，user_bans 记录解封方式为 auto_expired

6. **GIVEN** 被封禁用户通过应用端请求
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/ban-status`（或应用端鉴权中间件检查）
   **THEN** 返回封禁状态信息：`{ banned: true, reason: "作弊行为", expires_at: "2026-04-25T..." }`

7. **GIVEN** 用户被永久封禁
   **WHEN** 查看封禁记录
   **THEN** expires_at 为 null，仅可由管理员手动解封

8. **GIVEN** 封禁/解封操作完成
   **WHEN** 查询 admin_logs 表
   **THEN** 每条日志包含：管理员 ID + 操作类型 + 目标用户 ID + 时间 + 原因（封禁时）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 封禁正常用户 → 验证状态变更 + 封禁记录 + 审计日志
3. 重复封禁同一用户 → 验证返回 409
4. 手动解封 → 验证状态恢复 + 封禁记录更新 + 审计日志
5. 模拟定时任务 → 验证到期自动解封
6. 测试封禁状态查询 API
7. 测试 Zod 校验拦截

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 封禁操作正确更新用户状态 + 写入封禁记录
- [ ] 重复封禁返回 409
- [ ] 手动解封正确恢复状态 + 更新封禁记录
- [ ] 自动解封定时任务正常运行
- [ ] 封禁状态查询 API 返回正确信息
- [ ] 所有操作有 admin_logs 审计记录
- [ ] 行锁防并发冲突
- [ ] Zod 校验拦截无效输入

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-003-api-user-ban.md`

## 自检重点

- [ ] 封禁/解封使用事务 + 行锁保证并发安全
- [ ] 封禁记录不可修改不可删除（审计要求）
- [ ] 自动解封定时任务正确处理边界（并发执行、幂等性）
- [ ] 永久封禁 expires_at 为 null
- [ ] Zod 校验：「其他」原因时补充说明必填
- [ ] 操作日志包含完整审计信息
- [ ] SQL 查询参数化防注入
