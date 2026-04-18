# T10-004: 后端 API — 知语币系统

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8

## 需求摘要

实现知语币系统的完整后端 API，包括余额查询、收支明细分页查询、知语币获取（各来源统一调用 `change_user_coins` 存储过程）、知语币扣除（购买皮肤/兑换课程/抵扣消费）。所有操作通过 idempotency_key 保证幂等，支持负数余额查询展示。采用三层分离架构：Router → Service → Repository。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/04-zhiyu-coins.md` — 知语币页面完整 PRD
- 产品总纲: `product/00-product-overview.md` §五.2 — 知语币体系完整规则
- API 规约: `grules/04-api-design.md` — RESTful 设计规范、统一响应格式
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范（三层分离）
- 编码规范: `grules/05-coding-standards.md` §六 — 安全规范（幂等、签名）
- 架构白皮书: `grules/01-rules.md` §三 — 并发安全（行锁、幂等处理）
- 关联任务: T10-001（知语币 Schema）→ 本任务 → T10-009（前端个人中心）、T10-011（前端知语币页）

## 技术方案

### API 设计

#### 1. 查询知语币余额

```
GET /api/v1/coins/balance
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "balance": 320,
    "total_earned": 1200,
    "total_spent": 880,
    "equivalent_usd": 3.20
  }
}
```

#### 2. 查询收支明细

```
GET /api/v1/coins/transactions?page=1&page_size=30&type=all
Authorization: Bearer <jwt>

Query Params:
  page: 页码（默认 1）
  page_size: 每页条数（默认 30，上限 100）
  type: all / income / expense（默认 all）

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "referral_reward",
        "amount": 120,
        "balance_after": 440,
        "description": "被推荐人购买 L4 课程",
        "description_key": "coin.referral_reward",
        "metadata": { "referred_nickname": "知**生", "level": 4 },
        "created_at": "2026-03-15T14:30:00Z"
      }
    ],
    "total": 56,
    "page": 1,
    "page_size": 30,
    "has_next": true
  }
}
```

#### 3. 扣除知语币（内部调用）

```
POST /api/v1/coins/deduct
Authorization: Bearer <jwt> (Service-to-Service or Admin)

Body:
{
  "user_id": "uuid",
  "amount": 99,
  "idempotency_key": "skin_purchase:uuid-xxx:deduct",
  "type": "skin_purchase",
  "description": "购买皮肤 — G1 汉字切切切 · 火焰刀光",
  "source_type": "skin",
  "source_id": "uuid-xxx"
}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "new_balance": 221,
    "transaction_id": "uuid"
  }
}
```

#### 4. 增加知语币（内部调用）

```
POST /api/v1/coins/credit
Authorization: Bearer <jwt> (Service-to-Service or Admin)

Body:
{
  "user_id": "uuid",
  "amount": 120,
  "idempotency_key": "referral:order-uuid:reward",
  "type": "referral_reward",
  "description": "推荐返利 — 被推荐人购买 L4 课程",
  "source_type": "referral",
  "source_id": "uuid-xxx"
}
```

### 后端架构

```
src/
├── routes/coin-routes.ts          — Router 层：参数校验 + 鉴权 + 响应
├── services/coin-service.ts       — Service 层：业务逻辑
├── repositories/coin-repository.ts — Repository 层：数据访问（调用 rpc）
├── validators/coin-validators.ts  — Zod 验证 Schema
└── types/coins.ts                 — TypeScript 类型定义
```

### Zod 验证 Schema

```typescript
// src/validators/coin-validators.ts
import { z } from 'zod'

export const CoinDeductSchema = z.object({
  user_id: z.string().uuid().describe('目标用户 ID'),
  amount: z.number().int().positive().describe('扣除金额（正数）'),
  idempotency_key: z.string().min(1).max(128).describe('幂等键'),
  type: z.enum([
    'skin_purchase', 'course_redeem', 'course_deduct', 'refund_clawback'
  ]).describe('交易类型'),
  description: z.string().min(1).describe('中文描述'),
  source_type: z.string().optional().describe('来源实体类型'),
  source_id: z.string().uuid().optional().describe('来源实体 ID'),
})

export const CoinCreditSchema = z.object({
  user_id: z.string().uuid().describe('目标用户 ID'),
  amount: z.number().int().positive().max(100000).describe('增加金额（正数，上限 100000）'),
  idempotency_key: z.string().min(1).max(128).describe('幂等键'),
  type: z.enum([
    'referral_reward', 'referral_received', 'daily_checkin',
    'game_streak', 'newbie_bonus', 'season_reward',
    'milestone_reward', 'activity_bonus'
  ]).describe('交易类型'),
  description: z.string().min(1).describe('中文描述'),
  source_type: z.string().optional(),
  source_id: z.string().uuid().optional(),
})

export const CoinTransactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(30),
  type: z.enum(['all', 'income', 'expense']).default('all'),
})
```

## 范围（做什么）

- 实现知语币余额查询 API
- 实现知语币收支明细分页查询 API（支持 all/income/expense 筛选）
- 实现知语币扣除 API（内部调用，如购买皮肤/兑换课程）
- 实现知语币增加 API（内部调用，如推荐返利/签到/游戏连胜）
- Zod 验证 Schema 定义
- 三层分离：Router → Service → Repository
- 统一错误处理（余额不足、超过上限等）

## 边界（不做什么）

- 不实现签到/推荐的业务逻辑（T10-007）
- 不实现 Paddle 支付集成（T10-005）
- 不实现前端页面（T10-011）
- 不修改数据库 Schema（T10-001 已完成）

## 涉及文件

- 新建: `src/routes/coin-routes.ts`
- 新建: `src/services/coin-service.ts`
- 新建: `src/validators/coin-validators.ts`
- 修改: `src/repositories/coin-repository.ts` — 补充查询方法
- 修改: `src/routes/index.ts` — 注册路由
- 修改: `src/types/coins.ts` — 补充 API 响应类型

## 依赖

- 前置: T10-001（知语币 Schema + `change_user_coins` 存储过程）
- 后续: T10-005（Paddle 支付中调用扣除/增加）、T10-007（签到/推荐中调用增加）、T10-009/T10-011（前端）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 已登录用户余额 320 WHEN GET `/api/v1/coins/balance` THEN 返回 `{ balance: 320, equivalent_usd: 3.20 }`
2. GIVEN 用户有 56 条流水 WHEN GET `/api/v1/coins/transactions?page=1&page_size=30` THEN 返回前 30 条，`has_next=true`，按时间倒序
3. GIVEN 用户有收入和支出流水 WHEN GET `/api/v1/coins/transactions?type=income` THEN 仅返回 `amount > 0` 的记录
4. GIVEN 余额 320 WHEN POST `/api/v1/coins/deduct` 扣除 99 THEN 返回 `new_balance=221`，流水记录 `amount=-99`
5. GIVEN 余额 320 WHEN POST `/api/v1/coins/deduct` 以相同 idempotency_key 重复调用 THEN 不产生新扣除，返回现有余额（幂等）
6. GIVEN 余额 320 WHEN POST `/api/v1/coins/credit` 增加 120 THEN 返回 `new_balance=440`
7. GIVEN 余额 320 WHEN POST `/api/v1/coins/deduct` 扣除 500（退款扣回场景，type=refund_clawback）THEN 允许负数，返回 `new_balance=-180`
8. GIVEN 未登录用户 WHEN 访问任何知语币 API THEN 返回 401 错误
9. GIVEN 请求体缺少必填字段 WHEN POST `/api/v1/coins/deduct` THEN 返回 400 错误，包含 Zod 验证错误信息

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 通过 curl/Browser MCP 测试各 API 端点
5. 验证幂等性（重复请求）
6. 验证负数余额场景
7. 验证参数校验（Zod）
8. 验证鉴权（无 Token / 错误 Token）

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 所有 API 端点返回正确数据格式
- [ ] 幂等保护有效
- [ ] 负数余额正常处理
- [ ] Zod 参数校验拦截无效请求
- [ ] 鉴权正确（401/403）
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-004-api-coins.md`

## 自检重点

- [ ] 安全：所有端点有 authMiddleware，credit/deduct 端点仅内部/管理员可调用
- [ ] 性能：分页查询有索引支持，无 N+1 查询
- [ ] 类型同步：Zod Schema ↔ TypeScript 类型 ↔ 数据库字段一致
- [ ] 幂等：所有变动操作通过 idempotency_key 去重
- [ ] 并发安全：底层通过 `change_user_coins` 行锁保证
