# T10-005: 后端 API — Paddle 支付集成

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10

## 需求摘要

实现 Paddle MoR（Merchant of Record）支付集成的完整后端 API。包含创建订单（含知语币抵扣计算）、调用 Paddle API 创建 Checkout Session、Webhook 回调处理（`transaction.completed` / `transaction.payment_failed`）、Paddle 签名验证、订单状态机管理、课程权限解锁、推荐返利触发。所有支付回调必须幂等处理。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/05-purchase-payment.md` — 课程购买与支付完整 PRD
- 数据流向: `product/apps/09-personal-payment/08-data-nonfunctional.md` §一.4 — 支付数据流
- 非功能需求: `product/apps/09-personal-payment/08-data-nonfunctional.md` §二.1 — 支付安全
- 产品总纲: `product/00-product-overview.md` §五.1 — 课程定价（$6/级，L1-L3 免费，3 年有效）
- API 规约: `grules/04-api-design.md` — Webhook 签名验证、统一响应
- 编码规范: `grules/05-coding-standards.md` §六 — 安全规范（签名验证、幂等）
- 架构白皮书: `grules/01-rules.md` §三 — 并发安全
- 关联任务: T10-001（知语币 Schema）→ 本任务 → T10-006（退款处理）、T10-012（前端支付页）

## 技术方案

### 数据库设计（订单表）

```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_no VARCHAR(32) NOT NULL UNIQUE,            -- 平台订单号
  course_level INTEGER NOT NULL,                   -- 购买的课程级别 4-12
  is_renewal BOOLEAN NOT NULL DEFAULT false,       -- 是否续费
  
  -- 金额明细（美分）
  original_price_cents INTEGER NOT NULL,           -- 原价（600 = $6.00）
  discount_cents INTEGER NOT NULL DEFAULT 0,       -- 折扣（续费 20% = 120）
  coin_deduct_cents INTEGER NOT NULL DEFAULT 0,    -- 知语币抵扣（美分）
  coin_deduct_amount INTEGER NOT NULL DEFAULT 0,   -- 知语币抵扣数量
  final_price_cents INTEGER NOT NULL,              -- 最终应付（美分）
  
  -- Paddle 信息
  paddle_transaction_id VARCHAR(64),               -- Paddle 交易 ID
  paddle_checkout_url TEXT,                        -- Paddle Checkout URL
  paddle_event_id VARCHAR(64),                     -- 最后处理的 Paddle Event ID（幂等用）
  
  -- 推荐信息
  referral_code VARCHAR(8),                        -- 使用的推荐码
  referrer_id UUID REFERENCES auth.users(id),      -- 推荐人 ID
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending / paid / refunded / cancelled / expired
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- 课程权限
  course_access_granted BOOLEAN NOT NULL DEFAULT false,
  course_expires_at TIMESTAMPTZ,                   -- 课程过期时间（paid_at + 3 年）
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS '课程购买订单表 — Paddle MoR 支付';
COMMENT ON COLUMN public.orders.status IS '状态机：pending → paid → refunded / pending → cancelled / pending → expired(24h超时)';

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的订单"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- 索引
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_paddle_tx ON public.orders(paddle_transaction_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_no ON public.orders(order_no);
CREATE INDEX idx_orders_course_level ON public.orders(user_id, course_level);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 课程访问权限表

```sql
CREATE TABLE public.course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_level INTEGER NOT NULL,                   -- 课程级别
  order_id UUID NOT NULL REFERENCES public.orders(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,                 -- 过期时间
  is_active BOOLEAN NOT NULL DEFAULT true,         -- 是否有效（退款后 = false）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT uq_course_access UNIQUE (user_id, course_level, order_id)
);

ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的课程权限"
  ON public.course_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_course_access_user ON public.course_access(user_id);
CREATE INDEX idx_course_access_expiry ON public.course_access(expires_at) WHERE is_active = true;
```

### API 设计

#### 1. 创建订单

```
POST /api/v1/orders
Authorization: Bearer <jwt>

Body:
{
  "course_level": 4,
  "use_coins": true,
  "referral_code": "ZY-A8K3M7"  // 可选
}

Response 201:
{
  "code": 0,
  "message": "success",
  "data": {
    "order_id": "uuid",
    "order_no": "ZY20260418143000001",
    "original_price_cents": 600,
    "discount_cents": 0,
    "coin_deduct_cents": 320,
    "coin_deduct_amount": 320,
    "final_price_cents": 280,
    "paddle_checkout_url": "https://checkout.paddle.com/...",
    "paddle_client_token": "..."
  }
}
```

**创建订单逻辑**：
1. 验证课程级别有效（4-12）且用户未拥有该级别有效权限
2. 计算价格：原价 $6.00 → 续费减 20% → 知语币抵扣
3. 如果 `use_coins=true`，在同一事务内预扣知语币（幂等键：`order:{order_id}:coin_deduct`）
4. 最终应付 > 0：调用 Paddle API 创建 Transaction → 获取 Checkout URL
5. 最终应付 = 0（全额知语币兑换）：直接标记 paid → 解锁课程
6. 保存订单

#### 2. 查询订单状态（轮询用）

```
GET /api/v1/orders/:order_id/status
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "order_id": "uuid",
    "status": "paid",
    "course_level": 4,
    "course_expires_at": "2029-04-18T00:00:00Z"
  }
}
```

#### 3. Paddle Webhook 回调

```
POST /api/v1/webhooks/paddle
Headers: Paddle-Signature: ts=...; h1=...

Body: (Paddle 标准 Webhook payload)

Response 200: OK
```

**Webhook 处理逻辑**：
1. **签名验证**：使用 Paddle 公钥验证 `Paddle-Signature` Header
2. **幂等检查**：以 `paddle_event_id` 去重，同一事件不重复处理
3. **事件处理**：
   - `transaction.completed`：更新订单 status=paid → 解锁课程权限 → 触发推荐返利（冷却中）
   - `transaction.payment_failed`：更新订单 status=cancelled → 回退预扣的知语币
   - `transaction.refunded`：交由 T10-006 退款处理逻辑

#### 4. 查询用户课程权限

```
GET /api/v1/courses/access
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "levels": [
      { "level": 1, "is_free": true, "has_access": true },
      { "level": 4, "is_free": false, "has_access": true, "expires_at": "2029-04-18", "days_remaining": 1095 },
      { "level": 5, "is_free": false, "has_access": false }
    ]
  }
}
```

### Paddle 签名验证

```typescript
import crypto from 'crypto'

function verifyPaddleWebhook(rawBody: string, signature: string, secretKey: string): boolean {
  // 解析 Paddle-Signature: ts={ts};h1={hash}
  const parts = signature.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=')
    acc[key.trim()] = value
    return acc
  }, {} as Record<string, string>)

  const ts = parts['ts']
  const h1 = parts['h1']
  if (!ts || !h1) return false

  // 计算 HMAC
  const payload = `${ts}:${rawBody}`
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expectedHash))
}
```

## 范围（做什么）

- 创建 `orders` 订单表和 `course_access` 课程权限表（Migration）
- 实现创建订单 API（含价格计算、知语币预扣、Paddle Checkout 创建）
- 实现订单状态查询 API（前端轮询用）
- 实现 Paddle Webhook 回调处理（签名验证 + 幂等 + 事件分发）
- 实现课程权限查询 API
- 实现 Paddle 签名验证工具
- 实现订单状态机管理

## 边界（不做什么）

- 不实现退款处理（T10-006）
- 不实现 iOS Apple IAP（后续版本）
- 不实现前端支付页面（T10-012）
- 不实现批量购买 L4-L12（P2 功能）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_orders_tables.sql`
- 新建: `src/routes/order-routes.ts`
- 新建: `src/routes/webhook-routes.ts`
- 新建: `src/services/order-service.ts`
- 新建: `src/services/paddle-service.ts`
- 新建: `src/repositories/order-repository.ts`
- 新建: `src/validators/order-validators.ts`
- 新建: `src/types/order.ts`
- 新建: `src/utils/paddle-signature.ts`
- 修改: `src/routes/index.ts` — 注册路由

## 依赖

- 前置: T10-001（知语币 Schema — 知语币抵扣依赖 `change_user_coins`）
- 后续: T10-006（退款处理）、T10-012（前端支付页）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 已登录用户未购买 L4 WHEN POST `/api/v1/orders` with `course_level=4` THEN 返回 201 + 订单信息 + Paddle Checkout URL
2. GIVEN 用户知语币 320、勾选 use_coins WHEN 创建 L4 订单 THEN `coin_deduct_amount=320`、`final_price_cents=280`，知语币被预扣
3. GIVEN 用户知语币 ≥ 600、勾选 use_coins WHEN 创建 L4 订单 THEN `final_price_cents=0`，不调用 Paddle，直接解锁课程
4. GIVEN 有效 Paddle Webhook（transaction.completed）WHEN POST `/api/v1/webhooks/paddle` THEN 订单 status=paid，课程权限解锁，`course_expires_at` = 3 年后
5. GIVEN 重复的 Paddle Event ID WHEN POST webhook THEN 返回 200 但不重复处理（幂等）
6. GIVEN 无效 Paddle 签名 WHEN POST webhook THEN 返回 401 拒绝
7. GIVEN 用户已购 L4（有效权限）WHEN 再次 POST `/api/v1/orders` with `course_level=4` THEN 返回 409 冲突
8. GIVEN 续费场景（课程即将到期）WHEN 创建订单 THEN `discount_cents=120`（20% 折扣），`final_price_cents=480`
9. GIVEN 订单已支付 WHEN GET `/api/v1/orders/:id/status` THEN 返回 `status=paid` + 课程过期时间
10. GIVEN 已登录用户 WHEN GET `/api/v1/courses/access` THEN 返回所有 12 级课程的权限状态

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 测试创建订单 API（各种知语币抵扣场景）
5. 模拟 Paddle Webhook 回调（构造签名 + payload）
6. 验证签名验证拒绝伪造请求
7. 验证幂等处理（重复 Event ID）
8. 验证课程权限解锁
9. 验证续费折扣计算

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 创建订单 API 正常（含价格计算、知语币抵扣）
- [ ] Paddle Webhook 签名验证有效
- [ ] Webhook 幂等处理正确
- [ ] 课程权限正确解锁/查询
- [ ] 续费折扣计算正确
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-005-api-paddle-payment.md`

## 自检重点

- [ ] 安全：Paddle Webhook 签名验证（HMAC-SHA256 + timing-safe compare）
- [ ] 安全：金额不信任客户端，后端独立计算并与 Paddle 交叉校验
- [ ] 幂等：Paddle Event ID 去重 + 知语币操作 idempotency_key
- [ ] 并发安全：知语币预扣在事务内，支付失败回退
- [ ] 状态机：订单状态只能按预定义路径流转
- [ ] 性能：订单查询有索引
