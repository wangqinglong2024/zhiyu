# T10-012: 前端 — 购买与支付

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

实现课程购买和 Paddle 支付全流程的前端页面。包含：课程购买确认页（价格明细 + 知语币抵扣滑块 + 实付金额实时计算）、Paddle.js Overlay Checkout 唤起、支付等待页（轮询订单状态）、支付成功/失败结果页、订单历史列表页。需处理价格换算精度、知语币抵扣上限、Paddle 对接异常。严格遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/05-purchase-payment.md` — 购买支付完整 PRD
- 产品需求: `product/apps/09-personal-payment/03-pricing.md` — 课程定价策略
- 产品需求: `product/apps/09-personal-payment/04-zhiyu-coins.md` — 知语币抵扣规则
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` — 前端编码规范
- 关联任务: T10-005（Paddle 支付 API）→ 本任务

## 技术方案

### 前端架构

```
src/features/purchase/
├── pages/
│   ├── PurchaseConfirmPage.tsx      — 购买确认页
│   ├── PaymentPendingPage.tsx       — 支付等待页
│   ├── PaymentSuccessPage.tsx       — 支付成功页
│   ├── PaymentFailedPage.tsx        — 支付失败页
│   └── OrderHistoryPage.tsx         — 订单历史页
├── components/
│   ├── PriceBreakdown.tsx           — 价格明细卡片
│   ├── CoinDeductSlider.tsx         — 知语币抵扣滑块
│   ├── PaymentSummary.tsx           — 实付金额摘要
│   ├── PaddleCheckout.tsx           — Paddle.js Overlay 封装
│   ├── OrderStatusPoller.tsx        — 订单状态轮询
│   ├── PaymentResultCard.tsx        — 支付结果展示卡片
│   ├── OrderCard.tsx                — 订单历史卡片
│   └── CourseUnlockAnimation.tsx    — 课程解锁动画
├── hooks/
│   ├── use-purchase.ts              — 购买流程 Hook
│   ├── use-paddle.ts                — Paddle.js Hook
│   ├── use-order-status.ts          — 订单状态轮询 Hook
│   └── use-order-history.ts         — 订单历史 Hook
├── services/
│   └── order-service.ts             — 订单 API 调用
├── utils/
│   └── price-calculator.ts          — 价格计算工具
└── types/
    └── index.ts
```

### 页面结构（购买确认页）

```
PurchaseConfirmPage
├── Header "购买课程"
├── 课程信息区
│   ├── 课程封面 (圆角卡片)
│   ├── 课程名称 "Level 4: 日常表达"
│   ├── 课程简介 (最多 2 行)
│   └── 有效期 "购买后 3 年有效" (续费时显示折扣)
├── PriceBreakdown (.glass-card)
│   ├── 课程原价               $6.00  (续费时显示 ~~$6.00~~ $4.80)
│   ├── 续费折扣 (仅续费)      -$1.20
│   ├── 知语币抵扣              -$1.20  (动态变化)
│   ├── ─────────────────────
│   └── 实付金额               $4.80   (Rose 色大字)
├── CoinDeductSlider
│   ├── "使用知语币抵扣"
│   ├── 滑块 [0 ─────○──── 120] (最大值 = min(余额, 原价×100))
│   ├── "使用 120 知语币 ≈ $1.20"
│   └── 可用余额提示 "余额 320 知语币"
├── PaymentSummary (固定底部)
│   ├── 实付金额 "$4.80"
│   └── [确认支付] 按钮 (Sky 色渐变)
└── 全额知语币支付
    └── 如果知语币足够支付全额 → 按钮变为 "使用 {N} 知语币支付"
```

### 知语币抵扣计算逻辑

```typescript
// src/features/purchase/utils/price-calculator.ts

interface PriceCalculation {
  originalPrice: number      // 原价 (cents)
  renewalDiscount: number    // 续费折扣 (cents)
  coinDeduct: number         // 知语币抵扣 (coins, 1 coin = 1 cent)
  finalPrice: number         // 实付金额 (cents)
  isFullCoinPayment: boolean // 是否全额知语币支付
}

function calculatePrice(params: {
  basePrice: number          // 课程原价 (cents), 600 = $6.00
  isRenewal: boolean         // 是否续费
  coinBalance: number        // 用户知语币余额
  coinToUse: number          // 用户选择使用的知语币数量
}): PriceCalculation {
  const { basePrice, isRenewal, coinBalance, coinToUse } = params
  
  // 续费 20% 折扣
  const renewalDiscount = isRenewal ? Math.floor(basePrice * 0.2) : 0
  const afterDiscount = basePrice - renewalDiscount
  
  // 知语币抵扣上限 = 打折后价格
  const maxCoinDeduct = afterDiscount
  const actualCoinDeduct = Math.min(coinToUse, coinBalance, maxCoinDeduct)
  
  const finalPrice = afterDiscount - actualCoinDeduct
  
  return {
    originalPrice: basePrice,
    renewalDiscount,
    coinDeduct: actualCoinDeduct,
    finalPrice,
    isFullCoinPayment: finalPrice === 0
  }
}
```

### Paddle.js 集成

```typescript
// src/features/purchase/hooks/use-paddle.ts

import { initializePaddle, Paddle } from '@paddle/paddle-js'

function usePaddle() {
  const paddleRef = useRef<Paddle | null>(null)
  
  useEffect(() => {
    initializePaddle({
      environment: import.meta.env.VITE_PADDLE_ENV,  // 'sandbox' | 'production'
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      eventCallback: (event) => {
        switch (event.name) {
          case 'checkout.completed':
            // 跳转支付等待页（轮询订单状态）
            break
          case 'checkout.closed':
            // 用户关闭 Checkout，不做特殊处理
            break
          case 'checkout.error':
            // 跳转支付失败页
            break
        }
      }
    }).then(instance => { paddleRef.current = instance })
  }, [])
  
  const openCheckout = (transactionId: string) => {
    paddleRef.current?.Checkout.open({
      transactionId,  // 后端创建的 Paddle Transaction ID
    })
  }
  
  return { openCheckout }
}
```

### 订单状态轮询

```typescript
// src/features/purchase/hooks/use-order-status.ts

function useOrderStatus(orderId: string) {
  return useQuery({
    queryKey: ['order-status', orderId],
    queryFn: () => orderService.getOrderStatus(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'paid' || status === 'failed' || status === 'cancelled') {
        return false  // 停止轮询
      }
      return 2000    // 每 2 秒轮询
    },
    enabled: !!orderId,
  })
}
```

### 页面结构（支付等待页）

```
PaymentPendingPage
├── 中心区域
│   ├── 旋转加载动画 (脉冲光环)
│   ├── "支付处理中..."
│   └── "请稍等，正在确认支付结果"
├── 超时处理 (60 秒)
│   ├── "支付确认超时"
│   ├── "如已完成支付，请稍后查看订单"
│   └── [查看订单] [重试] 按钮
└── 成功/失败自动跳转
```

### 页面结构（支付结果页）

```
PaymentSuccessPage
├── CourseUnlockAnimation
│   ├── 锁打开动画 (scale 0 → 1 + 粒子效果)
│   ├── ✅ "支付成功"
│   ├── "Level 4: 日常表达 已解锁"
│   ├── 有效期 "至 2029-04-01"
│   └── 知语币变动 "-120 知语币已扣除"
├── 操作按钮
│   ├── [立即学习] → 跳转课程页 (Sky 色主按钮)
│   └── [返回首页] → 跳转首页 (次级按钮)

PaymentFailedPage
├── ❌ "支付失败"
├── 错误描述
├── [重新支付] → 回到购买确认页
└── [联系客服] → mailto/反馈
```

### 定价数据

| 级别 | 价格 | 续费价 | 状态 |
|------|------|--------|------|
| L1-L3 | 免费 | — | 永久解锁 |
| L4-L12 | $6.00 | $4.80 | 3 年有效 |

## 范围（做什么）

- 实现购买确认页（价格明细 + 知语币抵扣滑块 + 全额知语币支付）
- 实现 Paddle.js Overlay Checkout 集成（唤起/回调处理）
- 实现支付等待页（轮询 + 超时处理）
- 实现支付成功/失败结果页（含解锁动画）
- 实现订单历史列表页
- 实现价格计算工具函数
- Light/Dark 双模式、响应式

## 边界（不做什么）

- 不实现后端 API（T10-005）
- 不实现 iOS Apple IAP（后续迭代）
- 不实现退款申请页面（通过 Paddle 后台处理）

## 涉及文件

- 新建: `src/features/purchase/pages/PurchaseConfirmPage.tsx`
- 新建: `src/features/purchase/pages/PaymentPendingPage.tsx`
- 新建: `src/features/purchase/pages/PaymentSuccessPage.tsx`
- 新建: `src/features/purchase/pages/PaymentFailedPage.tsx`
- 新建: `src/features/purchase/pages/OrderHistoryPage.tsx`
- 新建: `src/features/purchase/components/PriceBreakdown.tsx`
- 新建: `src/features/purchase/components/CoinDeductSlider.tsx`
- 新建: `src/features/purchase/components/PaddleCheckout.tsx`
- 新建: `src/features/purchase/components/OrderStatusPoller.tsx`
- 新建: `src/features/purchase/components/CourseUnlockAnimation.tsx`
- 新建: `src/features/purchase/hooks/use-purchase.ts`
- 新建: `src/features/purchase/hooks/use-paddle.ts`
- 新建: `src/features/purchase/hooks/use-order-status.ts`
- 新建: `src/features/purchase/utils/price-calculator.ts`
- 修改: `src/router/index.tsx` — 添加路由

## 依赖

- 前置: T10-005（Paddle 支付 API）
- 后续: T10-014（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户选购 Level 4（首购） WHEN 进入购买确认页 THEN 显示原价 $6.00，无续费折扣
2. GIVEN 用户选购 Level 4（续费） WHEN 进入购买确认页 THEN 显示原价 ~~$6.00~~ 折后 $4.80
3. GIVEN 用户余额 320 知语币 WHEN 拖动抵扣滑块到 120 THEN 知语币抵扣 $1.20，实付 $4.80
4. GIVEN 用户余额 600+ 知语币且折后价 $4.80 WHEN 拖动滑块到最大 THEN 实付 $0.00，按钮变为 "使用 480 知语币支付"
5. GIVEN 用户确认支付 WHEN 实付 > 0 THEN 唤起 Paddle Overlay Checkout
6. GIVEN 用户确认支付 WHEN 实付 = 0（全知语币） THEN 直接创建订单，跳过 Paddle
7. GIVEN Paddle Checkout 完成 WHEN 跳转等待页 THEN 轮询订单状态，paid 后跳转成功页
8. GIVEN 等待超过 60 秒 WHEN 订单未确认 THEN 显示超时提示 + 重试/查看订单按钮
9. GIVEN 支付成功 WHEN 进入成功页 THEN 播放解锁动画 + 显示课程信息和到期时间
10. GIVEN 支付失败 WHEN 进入失败页 THEN 显示错误信息 + 重新支付按钮
11. GIVEN Light/Dark 模式 WHEN 切换 THEN 购买流程所有页面正确适配
12. GIVEN 375px 宽度 WHEN 查看购买确认页 THEN 价格明细和滑块布局正常

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. Browser MCP 导航到购买确认页
3. 验证价格计算（首购/续费/知语币抵扣）
4. 验证 Paddle Checkout 唤起（Sandbox 环境）
5. 验证支付结果页
6. 截图：Light + Dark + 三断点

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 价格计算正确（原价/折扣/抵扣/实付）
- [ ] 知语币抵扣滑块正常（上限逻辑正确）
- [ ] 全额知语币支付路径可用
- [ ] Paddle.js 初始化成功（Sandbox）
- [ ] 支付等待页轮询正常 + 超时处理
- [ ] 支付结果页正确展示
- [ ] 响应式通过
- [ ] Light/Dark 模式正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-012-fe-purchase-payment.md`

## 自检重点

- [ ] 安全：Paddle Client Token 存于环境变量，不硬编码
- [ ] 精度：所有金额以 cents 计算，避免浮点误差
- [ ] UI：Cosmic Refraction 设计系统
- [ ] UI：色彩仅限 Rose/Sky/Amber
- [ ] 容错：Paddle 加载失败有降级提示
- [ ] 幂等：全额知语币支付需幂等处理
- [ ] 超时：轮询 60 秒超时有兜底
