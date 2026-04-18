# T13-005: 后端 API — 退款管理 (Admin Refund Management API)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10

## 需求摘要

为管理后台「退款管理」实现完整的后端 API。这是系统中最复杂的业务流程之一，退款链路必须事务性执行：① 向 Paddle 发起退款请求 → ② 立即回收课程访问权 → ③ 扣回推荐返利（推荐人 + 被推荐人，可至负余额）→ ④ 写入退款日志和审计记录 → ⑤ 发送用户通知。Paddle 退款结果通过 Webhook 异步通知，退款失败时需自动回滚课程权限和返利。需实现防重复退款（幂等）、退款列表与筛选。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/05-refund.md` — 退款管理完整 PRD
- 非功能需求: `product/admin/03-admin-user-order/07-data-nonfunctional.md` §二.3 — 退款事务一致性
- 产品总纲: `product/00-product-overview.md` §五.2 — 推荐返利 = 订单金额 × 20%，30 天冷却期
- 财务合规: `plan/07-financial-compliance.md` — 退款合规要求
- 编码规范: `grules/05-coding-standards.md` — 幂等处理、行锁
- 关联任务: T10-006（Paddle 退款 Webhook）、T13-004（订单管理 API）

## 技术方案

### 数据库表结构

```sql
-- 退款记录表（如尚不存在）
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason_category TEXT NOT NULL,     -- 'user_request' | 'quality' | 'system_error' | 'other'
  refund_reason_detail TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'completed' | 'failed'
  paddle_refund_id TEXT,                    -- Paddle 退款 ID
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  course_revoked BOOLEAN DEFAULT FALSE,
  reward_clawed_back BOOLEAN DEFAULT FALSE,
  referrer_claw_amount INT DEFAULT 0,       -- 推荐人扣回知语币数
  self_claw_amount INT DEFAULT 0,           -- 被推荐人自得扣回数
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(order_id)                          -- 同一订单只能退一次
);

CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
```

### API 端点设计

```
前缀: /api/v1/admin/orders

POST   /:orderId/refund           — 发起退款（完整事务链路）
GET    /refunds                   — 退款列表（筛选 + 分页）

# Webhook 端点（Paddle 回调，无需管理员鉴权）
POST   /api/v1/webhooks/paddle/refund  — Paddle 退款结果回调
```

### Zod Schema 定义

```typescript
// backend/src/models/admin-refund.ts
import { z } from 'zod';

export const RefundReasonEnum = z.enum([
  'user_request',   // 用户申请
  'quality',        // 课程质量
  'system_error',   // 系统错误
  'other'           // 其他
]);

export const CreateRefundSchema = z.object({
  reason_category: RefundReasonEnum,
  reason_detail: z.string().max(500).optional(),
  refund_amount: z.number().min(0.01),     // 最小 $0.01
}).refine(
  (data) => data.reason_category !== 'other' || (data.reason_detail && data.reason_detail.trim().length > 0),
  { message: '选择"其他"时原因补充为必填', path: ['reason_detail'] }
);

// 退款列表查询
export const RefundListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'processing', 'completed', 'failed']).default('all'),
  date_start: z.string().datetime().optional(),
  date_end: z.string().datetime().optional(),
  operator_id: z.string().uuid().optional(),
  sort_by: z.enum(['created_at', 'refund_amount']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// 退款列表项
export interface RefundListItem {
  refund_id: string;
  order_id: string;
  user: { id: string; nickname: string; avatar_url: string | null };
  refund_amount: number;
  refund_reason: string;
  operator_name: string;
  created_at: string;
  status: 'processing' | 'completed' | 'failed';
}

// 退款影响预览（前端展示用）
export interface RefundImpactPreview {
  course_level: string;
  course_name: string;
  has_referrer: boolean;
  referrer_info: { nickname: string; reward_amount: number; current_balance: number; balance_after: number } | null;
  self_reward_amount: number;
  self_balance_after: number;
}
```

### Service 层（核心复杂度）

```typescript
// backend/src/services/admin-refund.service.ts
export class AdminRefundService {
  /**
   * 退款完整事务链路（全部成功或全部回滚）
   * 
   * Step 1: 校验订单状态（仅 completed 可退款）
   * Step 2: 校验退款金额 ≤ 订单原始金额
   * Step 3: 幂等检查（订单是否已有退款记录）
   * Step 4: 开启数据库事务 + 行锁
   *   4a: 创建退款记录（status = processing）
   *   4b: 订单状态变更为 refunding
   *   4c: 课程访问权回收（user_courses 标记 revoked）
   *   4d: 推荐返利扣回（如有推荐关系）
   *       - 冷却期内未发放 → 取消待发放记录
   *       - 已发放 → 从推荐人和被推荐人余额扣除（可至负数）
   *   4e: 写入知语币流水记录
   *   4f: 写入 admin_logs 审计日志
   * Step 5: 向 Paddle Refund API 发起退款请求
   * Step 6: 返回退款成功响应
   */
  async createRefund(orderId: string, data: CreateRefundInput, adminId: string): Promise<RefundResult>;

  /**
   * 退款影响预览（发起退款前调用）
   */
  async getRefundImpactPreview(orderId: string): Promise<RefundImpactPreview>;

  /**
   * Paddle 退款回调处理
   * - 退款成功 → 订单状态变更为 refunded + 退款记录标记 completed
   * - 退款失败 → 回滚：订单恢复 completed + 课程权限恢复 + 返利恢复 + 退款记录标记 failed
   */
  async handlePaddleRefundWebhook(webhookData: PaddleRefundWebhookPayload): Promise<void>;

  /**
   * 退款列表查询
   */
  async listRefunds(query: RefundListQuery): Promise<PaginatedResult<RefundListItem>>;
}
```

### 推荐返利扣回逻辑

```typescript
// 退款扣回返利的详细逻辑
async function clawBackRewards(orderId: string, tx: Transaction): Promise<ClawBackResult> {
  // 1. 查询该订单关联的推荐关系
  const referral = await findReferralByOrderId(orderId, tx);
  if (!referral) return { clawed: false, reason: 'no_referral' };

  // 2. 计算扣回金额：订单金额 × 20% ÷ $0.01 = 知语币数
  const rewardAmount = Math.floor(referral.order_amount * 0.20 / 0.01);

  // 3. 检查返利状态
  if (referral.reward_status === 'cooling') {
    // 冷却期内尚未发放 → 取消待发放记录
    await cancelPendingReward(referral.id, tx);
  } else if (referral.reward_status === 'issued') {
    // 已发放 → 从推荐人余额扣除（可至负数）
    await deductCoins(referral.referrer_id, rewardAmount, '退款扣回', tx);
    // 从被推荐人余额扣除（可至负数）
    await deductCoins(referral.referee_id, rewardAmount, '退款扣回', tx);
  }

  return { clawed: true, referrer_amount: rewardAmount, self_amount: rewardAmount };
}
```

### 并发安全与幂等

```typescript
// 防重复退款：
// 1. refunds 表 UNIQUE(order_id) 约束
// 2. 前端确认按钮点击后 Disabled
// 3. 后端幂等键：order_id，重复请求返回「该订单已在退款处理中」

// 行锁防并发：
// SELECT * FROM orders WHERE id = :orderId FOR UPDATE
// 确保同一订单不会被两个管理员同时操作退款
```

## 范围（做什么）

- 创建 `admin-refund.ts` Zod Schema + 类型定义
- 创建 refunds 表迁移脚本（如尚不存在）
- 实现退款发起 API（完整事务链路：Paddle 退款 + 课程回收 + 返利扣回 + 日志）
- 实现退款影响预览 API
- 实现 Paddle 退款 Webhook 回调处理（成功确认 / 失败回滚）
- 实现退款列表查询 API（筛选 + 分页）
- 推荐返利扣回逻辑（冷却期取消 / 已发放扣回 / 可至负数）
- 退款失败自动回滚（课程恢复 + 返利恢复）
- 防重复退款幂等处理
- 所有操作写入 admin_logs

## 边界（不做什么）

- 不实现 Paddle Refund API 的具体 HTTP 调用封装（T10-006 已有 Paddle 客户端）
- 不实现用户端退款通知推送（由通知服务统一处理）
- 不实现前端退款弹窗 UI（T13-010）
- 不实现部分退款的金额分摊逻辑（MVP 简化为全额退款为主）

## 涉及文件

- 新建: `backend/src/models/admin-refund.ts` — Zod Schema + 类型
- 新建: `backend/src/services/admin-refund.service.ts` — 退款业务核心逻辑
- 新建: `backend/src/controllers/admin-refund.controller.ts` — 控制器
- 新建: `backend/src/routers/v1/admin/refund.router.ts` — 路由
- 新建: `supabase/migrations/YYYYMMDDHHMMSS_create_refunds.sql` — 建表迁移
- 修改: `backend/src/routers/v1/admin/order.router.ts` — 增加退款子路由
- 修改: `backend/src/routers/v1/webhooks/paddle.router.ts` — 增加退款回调路由
- 新建: `backend/src/services/reward-clawback.service.ts` — 返利扣回独立服务
- 不动: `backend/src/lib/paddle-client.ts` — Paddle API 封装（T10-006 已实现）

## 依赖

- 前置: T10-006（Paddle 退款 Webhook 基础）、T13-004（订单管理 API）
- 后续: T13-010（前端订单退款页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 订单状态为 completed 且无退款记录
   **WHEN** 调用 `POST /api/v1/admin/orders/:orderId/refund`，Body: `{ reason_category: "user_request", refund_amount: 6.00 }`
   **THEN** 退款记录创建（status=processing），订单状态变为 refunding，课程访问权立即回收，推荐返利扣回，admin_logs 记录

2. **GIVEN** 订单已有退款记录（processing 或 completed）
   **WHEN** 再次调用退款 API
   **THEN** 返回 409 错误「该订单已在退款处理中」或「该订单已退款」

3. **GIVEN** 退款金额 > 订单原始金额
   **WHEN** 调用退款 API
   **THEN** 返回 400 错误「退款金额不能超过订单金额」

4. **GIVEN** 退款订单存在推荐关系，推荐返利已发放，推荐人余额 50 币，扣回需要 120 币
   **WHEN** 退款执行
   **THEN** 推荐人余额变为 -70 币（允许负数），知语币流水记录扣回事由

5. **GIVEN** 退款订单推荐返利在冷却期内（未发放）
   **WHEN** 退款执行
   **THEN** 待发放返利记录被取消，不从余额扣除

6. **GIVEN** 退款发起后，Paddle 通过 Webhook 通知退款成功
   **WHEN** 系统收到 Webhook
   **THEN** 订单状态变为 refunded，退款记录标记 completed

7. **GIVEN** Paddle 通知退款失败
   **WHEN** 系统收到失败 Webhook
   **THEN** 自动回滚：订单恢复 completed + 课程权限恢复 + 返利恢复 + 退款记录标记 failed

8. **GIVEN** 管理员查看退款列表
   **WHEN** 调用 `GET /api/v1/admin/orders/refunds?status=completed&sort_by=created_at&sort_order=desc`
   **THEN** 返回分页退款列表，含退款单号/关联订单号/用户/金额/原因/操作人/日期/状态

9. **GIVEN** 管理员准备发起退款
   **WHEN** 调用退款影响预览 API
   **THEN** 返回课程回收信息 + 推荐返利扣回金额 + 推荐人当前余额和扣回后余额

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 测试完整退款链路：发起退款 → 课程回收 → 返利扣回 → 日志记录
3. 测试重复退款幂等拒绝
4. 测试退款金额校验
5. 模拟 Paddle Webhook 成功回调 → 验证状态变更
6. 模拟 Paddle Webhook 失败回调 → 验证回滚
7. 测试退款列表筛选和分页
8. 测试负余额场景

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 退款事务完整执行（课程回收 + 返利扣回 + 日志）
- [ ] 重复退款返回 409 幂等拒绝
- [ ] 退款金额校验正确
- [ ] Paddle 成功回调正确更新状态
- [ ] Paddle 失败回调正确回滚
- [ ] 负余额场景不阻断退款
- [ ] 冷却期返利取消逻辑正确
- [ ] 退款列表筛选和分页正确
- [ ] 行锁防并发冲突
- [ ] admin_logs 审计记录完整
- [ ] 退款操作 < 3s（不含 Paddle 异步处理）

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-005-api-refund-management.md`

## 自检重点

- [ ] 退款事务原子性：全部成功或全部回滚
- [ ] 幂等键 order_id，UNIQUE 约束 + 应用层校验
- [ ] 行锁 SELECT FOR UPDATE 防并发
- [ ] 负余额允许且正确记录流水
- [ ] Paddle Webhook 签名验证（安全）
- [ ] 退款失败回滚逻辑覆盖所有步骤
- [ ] 知语币扣回金额计算公式正确（订单金额 × 20% ÷ 0.01）
- [ ] 所有写操作记录审计日志
- [ ] SQL 查询参数化防注入
