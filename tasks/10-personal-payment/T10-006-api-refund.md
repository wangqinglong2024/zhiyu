# T10-006: 后端 API — 退款处理

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 6

## 需求摘要

实现 Paddle 退款回调的完整后端处理逻辑。当 Paddle 发送 `transaction.refunded` Webhook 时，后端需要：更新订单状态为 refunded → 回收课程权限（`course_access.is_active=false`）→ 退回知语币抵扣部分 → 触发推荐返利扣回（可使推荐人余额变为负数）。所有操作在同一事务内完成，保证原子性和幂等性。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/05-purchase-payment.md` — 退款流程
- 产品总纲: `product/00-product-overview.md` §五.2 — 退款扣除知语币可至负数
- 数据流向: `product/apps/09-personal-payment/08-data-nonfunctional.md` §一.4 — 退款数据流
- 非功能需求: `product/apps/09-personal-payment/08-data-nonfunctional.md` §二.1 — 退款限制
- 编码规范: `grules/05-coding-standards.md` §六 — 安全规范
- 关联任务: T10-005（Paddle 支付集成）→ 本任务 → T10-014（集成验证）

## 技术方案

### 退款处理流程

```
Paddle Webhook: transaction.refunded
    ↓
1. 签名验证（复用 T10-005 的 verifyPaddleWebhook）
    ↓
2. 幂等检查（Paddle Event ID 去重）
    ↓
3. 查找对应订单（paddle_transaction_id）
    ↓
4. 事务开始 ──────────────────────────
    │
    ├─ 4a. 更新订单 status = 'refunded', refunded_at = now()
    │
    ├─ 4b. 回收课程权限
    │      UPDATE course_access SET is_active = false
    │      WHERE order_id = :order_id
    │
    ├─ 4c. 退回知语币抵扣（如有）
    │      调用 change_user_coins(+coin_deduct_amount)
    │      idempotency_key: 'refund:{order_id}:coin_return'
    │
    ├─ 4d. 推荐返利处理
    │      ├─ 冷却期内（status='cooling'）→ 取消返利记录（status='cancelled'）
    │      └─ 已到账（status='confirmed'）→ 扣回推荐人和被推荐人的知语币
    │         ├─ change_user_coins(referrer, -reward, 'refund_clawback')
    │         └─ change_user_coins(referred, -reward, 'refund_clawback')
    │         → 余额可至负数
    │
    └─ 事务结束 ──────────────────────────
    ↓
5. 返回 200 OK
```

### API 设计

退款处理不暴露独立 API 端点，通过 Paddle Webhook 路由（T10-005 已创建的 `/api/v1/webhooks/paddle`）中的事件分发触发。

#### 内部 Service 接口

```typescript
// src/services/refund-service.ts

interface RefundContext {
  orderId: string
  paddleTransactionId: string
  paddleEventId: string
  refundAmount: number // Paddle 退款金额（美分）
}

class RefundService {
  /**
   * 处理退款 — 在事务内完成全部操作
   * 1. 更新订单状态
   * 2. 回收课程权限
   * 3. 退回知语币抵扣
   * 4. 处理推荐返利扣回
   */
  async processRefund(ctx: RefundContext): Promise<void>
}
```

### 推荐返利扣回逻辑

```typescript
async function handleReferralClawback(orderId: string): Promise<void> {
  // 查找该订单关联的推荐记录
  const referralRecord = await referralRepo.findByOrderId(orderId)
  if (!referralRecord) return // 无推荐关系，跳过

  if (referralRecord.status === 'cooling') {
    // 冷却期内 → 直接取消，不涉及知语币
    await referralRepo.updateStatus(referralRecord.id, 'cancelled')
  } else if (referralRecord.status === 'confirmed') {
    // 已到账 → 扣回双方知语币（可至负数）
    await coinService.deduct({
      user_id: referralRecord.referrer_id,
      amount: referralRecord.referrer_reward,
      idempotency_key: `refund:${orderId}:clawback:referrer`,
      type: 'refund_clawback',
      description: `被推荐人退款 L${referralRecord.courseLevel} 课程`,
    })
    await coinService.deduct({
      user_id: referralRecord.referred_id,
      amount: referralRecord.referred_reward,
      idempotency_key: `refund:${orderId}:clawback:referred`,
      type: 'refund_clawback',
      description: `推荐奖励扣回 — L${referralRecord.courseLevel} 课程退款`,
    })
    await referralRepo.updateStatus(referralRecord.id, 'clawed_back')
  }
}
```

## 范围（做什么）

- 实现 `RefundService.processRefund()` 退款事务处理
- 在 Paddle Webhook 事件分发中添加 `transaction.refunded` 处理
- 实现课程权限回收逻辑
- 实现知语币抵扣退回逻辑
- 实现推荐返利扣回逻辑（冷却期取消 / 已到账扣回）
- 所有操作幂等（idempotency_key）

## 边界（不做什么）

- 不自行发起退款到 Paddle（Paddle MoR 模式，退款由 Paddle 处理）
- 不实现管理后台退款审批界面（T13 管理后台任务）
- 不实现前端退款结果展示（前端仅展示订单状态）

## 涉及文件

- 新建: `src/services/refund-service.ts`
- 修改: `src/routes/webhook-routes.ts` — 添加 `transaction.refunded` 事件处理
- 修改: `src/services/order-service.ts` — 添加退款相关方法
- 修改: `src/repositories/order-repository.ts` — 添加退款查询/更新方法
- 修改: `src/repositories/referral-repository.ts` — 添加按订单查询推荐记录方法
- 新建: `src/types/refund.ts`

## 依赖

- 前置: T10-005（Paddle 支付集成 — Webhook 路由和签名验证已就绪）
- 后续: T10-014（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 已支付订单（status=paid，知语币抵扣 320）WHEN Paddle 发送 `transaction.refunded` Webhook THEN 订单 status=refunded，课程权限 is_active=false，知语币退回 320
2. GIVEN 已支付订单有推荐返利（冷却中）WHEN 退款处理 THEN 推荐记录 status=cancelled，不涉及知语币变动
3. GIVEN 已支付订单有推荐返利（已到账，推荐人获得 120 币）WHEN 退款处理 THEN 推荐人知语币 -120，被推荐人知语币 -120，推荐记录 status=clawed_back
4. GIVEN 推荐人余额 50 WHEN 扣回 120 币 THEN 推荐人余额变为 -70（允许负数）
5. GIVEN 重复的退款 Webhook（相同 Paddle Event ID）WHEN 处理 THEN 幂等，不重复执行
6. GIVEN 无推荐关系的订单退款 WHEN 处理 THEN 仅回收课程权限和退回知语币，跳过推荐返利处理
7. GIVEN 全额知语币兑换的订单（无 Paddle 交易）WHEN 管理员触发退款 THEN 回收课程权限，退回 600 知语币

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 创建测试订单并模拟支付成功
4. 发送模拟 `transaction.refunded` Webhook
5. 验证订单状态、课程权限、知语币余额、推荐记录
6. 验证负数余额场景
7. 验证幂等处理

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 退款后订单状态正确（refunded）
- [ ] 课程权限正确回收
- [ ] 知语币抵扣正确退回
- [ ] 推荐返利正确扣回（含负数余额）
- [ ] 幂等处理有效
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-006-api-refund.md`

## 自检重点

- [ ] 安全：退款仅通过 Paddle Webhook 触发，不暴露公开 API
- [ ] 原子性：订单状态 + 权限回收 + 知语币 + 推荐扣回在同一事务
- [ ] 幂等：所有知语币操作有 idempotency_key
- [ ] 负数余额：退款扣回允许余额为负
- [ ] 状态机：订单 paid → refunded，不可逆
