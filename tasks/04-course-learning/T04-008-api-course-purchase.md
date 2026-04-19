# T04-008: 后端 API — 课程购买

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8

## 需求摘要

实现课程购买 API，包括：发起 Paddle 支付（创建 Checkout Session）、Paddle Webhook 回调处理（验签 + 更新购买状态）、知语币兑换课程（600 币/Level）、购买状态查询、到期提醒逻辑。所有购买操作必须幂等（idempotency_key），Webhook 必须验签防伪造。购买记录采用"软状态"设计（pending → completed / refunded），不允许硬删除。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/03-paywall.md`（付费墙完整 PRD）
- 产品需求: `product/apps/03-course-learning/03-paywall.md` §二（两种购买方式 — Paddle + 知语币）
- 产品需求: `product/apps/03-course-learning/03-paywall.md` §三.3（知语币兑换规则 — 600 币/Level）
- 产品需求: `product/apps/09-personal-payment/` §相关（Paddle 集成、退款流程）
- 设计规范: `grules/04-api-design.md` §七（Webhook 安全要求 — 验签 + 幂等）
- 设计规范: `grules/05-coding-standards.md` §三（三层分离、事务处理）
- 关联任务: T04-003（购买表设计 — idempotency_key, conditional unique index）→ 本任务

## 技术方案

### API 设计

#### 1. 发起 Paddle 支付

```
POST /api/v1/courses/purchase/paddle
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "level_id": "uuid",
  "idempotency_key": "uuid-v4-客户端生成"
}
```

业务规则:
- 检查 Level 是否为付费 Level（L4-L12）
- 检查用户是否已购买且未过期 → 已购买返回 409
- 创建 `user_course_purchases` 记录（status = pending）
- 调用 Paddle API 创建 Checkout Session
- 返回 Paddle checkout_url 给前端

响应:
```json
{
  "code": 0,
  "data": {
    "purchase_id": "uuid",
    "checkout_url": "https://checkout.paddle.com/...",
    "expires_in": 3600
  }
}
```

#### 2. Paddle Webhook 回调

```
POST /api/v1/webhooks/paddle
鉴权级别: 0（公开 — 但必须验签）
```

业务规则:
- 验证 Paddle 签名（sha256 HMAC）
- 处理事件类型:
  - `transaction.completed` → 更新购买状态为 completed，设置 expires_at = now() + 3 年
  - `transaction.payment_failed` → 更新购买状态为 failed
  - `subscription.canceled` → 无（课程为一次性购买）
  - `refund.completed` → 更新购买状态为 refunded
- 幂等处理：通过 Paddle transaction_id 去重

#### 3. 知语币兑换课程

```
POST /api/v1/courses/purchase/coin-exchange
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "level_id": "uuid",
  "idempotency_key": "uuid-v4"
}
```

业务规则:
- 检查用户知语币余额 ≥ 600
- 检查用户是否已购买该 Level → 已购买返回 409
- 事务内执行:
  1. 扣除 600 知语币
  2. 创建购买记录（purchase_type = coin_exchange, status = completed）
  3. 设置 expires_at = now() + 3 年
- 余额不足 → 返回 400（余额不足，请充值）

#### 4. 查询用户购买记录

```
GET /api/v1/courses/purchases
鉴权级别: 1（需登录）
```

返回用户所有课程购买记录（含状态、到期时间、购买方式）。

#### 5. 检查 Level 购买状态

```
GET /api/v1/courses/levels/:levelId/purchase-status
鉴权级别: 1（需登录）
```

返回：是否已购买、购买方式、到期时间、是否即将到期。

### 三层架构

```
Router: src/routers/v1/course-purchase.ts
Webhook: src/routers/v1/webhooks/paddle.ts  (独立路由，不经过 authMiddleware)
Service: src/services/course-purchase-service.ts
Repository: src/repositories/course-purchase-repository.ts
```

### 幂等设计

```
idempotency_key 处理流程:
  1. 请求到达 Service 层
  2. 查询 user_course_purchases WHERE idempotency_key = ?
  3. 若存在 → 返回已有记录（不重复创建）
  4. 若不存在 → 创建新记录（数据库 UNIQUE 约束兜底）
```

### Webhook 验签

```typescript
import crypto from 'node:crypto'

function verifyPaddleSignature(rawBody: string, signature: string, secret: string): boolean {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature)
  )
}
```

### 到期提醒

```
定时任务（可选 — 基于 Supabase Edge Function 或 Node cron）:
  查询 expires_at 在 30/7/1 天内的记录
  更新 remind_30d/remind_7d/remind_1d 标志
  触发推送通知（通过消息队列或直接发送）
```

## 范围（做什么）

- 实现 5 个 API 端点（发起支付/Webhook/知语币兑换/购买记录/购买状态）
- Paddle Webhook 验签
- 幂等处理（idempotency_key）
- 知语币扣除事务
- 三层分离

## 边界（不做什么）

- 不实现 Paddle 商品配置（需在 Paddle Dashboard 手动配置）
- 不实现知语币充值（属于 09-personal-payment 模块）
- 不实现到期自动续费（课程为一次性购买，到期后需重新购买）
- 不实现退款发起（退款由管理后台操作，Webhook 接收退款事件）
- 不实现前端付费墙页面

## 涉及文件

- 新建: `backend/src/routers/v1/course-purchase.ts`
- 新建: `backend/src/routers/v1/webhooks/paddle.ts`
- 新建: `backend/src/services/course-purchase-service.ts`
- 新建: `backend/src/repositories/course-purchase-repository.ts`
- 新建: `backend/src/utils/paddle-signature.ts` — Paddle 验签工具
- 修改: `backend/src/models/course-purchase.ts` — 扩展 Zod Schema + API 请求/响应类型（T04-003 已新建基础类型）
- 修改: `backend/src/routers/v1/index.ts` — 注册路由
- 修改: `backend/src/app.ts` — Webhook 路由需使用 raw body（不经过 JSON parser）

## 依赖

- 前置: T04-003（购买表）、知语币 Service（T09 模块，需约定接口）
- 后续: T04-011（付费墙前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 已登录用户选择 L5 **WHEN** `POST /paddle` **THEN** 返回 Paddle checkout_url，购买记录 status = pending
2. **GIVEN** 用户已购买 L5（未过期） **WHEN** `POST /paddle` 再次购买 L5 **THEN** 返回 409 Conflict
3. **GIVEN** 相同 idempotency_key 重复请求 **WHEN** `POST /paddle` **THEN** 返回已有记录，不重复创建
4. **GIVEN** Paddle 支付成功 **WHEN** Webhook `transaction.completed` **THEN** 购买状态更新为 completed，expires_at = now() + 3 年
5. **GIVEN** 无效签名的 Webhook 请求 **WHEN** `POST /webhooks/paddle` **THEN** 返回 401 验签失败
6. **GIVEN** 用户知语币余额 ≥ 600 **WHEN** `POST /coin-exchange` **THEN** 扣除 600 币，购买记录 status = completed
7. **GIVEN** 用户知语币余额 < 600 **WHEN** `POST /coin-exchange` **THEN** 返回 400（余额不足）
8. **GIVEN** 知语币兑换事务中途失败 **WHEN** 扣币成功但购买记录创建失败 **THEN** 事务回滚，知语币不扣除
9. **GIVEN** 已登录用户 **WHEN** `GET /purchases` **THEN** 返回用户所有购买记录
10. **GIVEN** L5 已购买且 expires_at 在 30 天内 **WHEN** `GET /levels/:l5Id/purchase-status` **THEN** `expiring_soon = true`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 设置 Paddle 测试环境变量（PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET）
3. 通过 curl 测试发起支付 → 模拟 Webhook → 验证状态更新
4. 测试知语币兑换流程（余额充足 + 不足）
5. 测试幂等处理
6. 测试 Webhook 验签（有效签名 + 无效签名）
7. 测试查询 API

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] Paddle Checkout Session 创建成功（或 Mock 验证）
- [ ] Webhook 验签正确
- [ ] 幂等处理正确
- [ ] 知语币兑换事务安全
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-008-api-course-purchase.md`

## 自检重点

- [ ] 安全: Webhook 验签（timingSafeEqual 防时序攻击）
- [ ] 安全: Webhook 路由使用 raw body
- [ ] 安全: 知语币扣除在事务内
- [ ] 安全: 幂等 key 防重复扣款
- [ ] 安全: 不能购买免费 Level（L1-L3 直接拒绝）
- [ ] 三层分离: Paddle 调用封装在 Service 层
