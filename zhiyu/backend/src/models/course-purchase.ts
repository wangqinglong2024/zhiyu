import { z } from 'zod'

// ===== 购买记录 =====
export interface PurchaseRow {
  id: string
  user_id: string
  level_id: string
  purchase_type: 'paddle' | 'coin_exchange' | 'bundle'
  amount_usd: number
  coin_amount: number
  paddle_transaction_id: string | null
  paddle_checkout_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'expired'
  idempotency_key: string | null
  purchased_at: string | null
  expires_at: string | null
  bundle_order_id: string | null
  created_at: string
  updated_at: string
}

// ===== Paddle 支付请求 =====
export const PaddlePurchaseSchema = z.object({
  level_id: z.string().uuid('无效的 Level ID'),
  idempotency_key: z.string().min(1).max(100),
})

export type PaddlePurchaseInput = z.infer<typeof PaddlePurchaseSchema>

// ===== 知语币兑换请求 =====
export const CoinExchangeSchema = z.object({
  level_id: z.string().uuid('无效的 Level ID'),
  idempotency_key: z.string().min(1).max(100),
})

export type CoinExchangeInput = z.infer<typeof CoinExchangeSchema>

// ===== 购买状态响应 =====
export interface PurchaseStatus {
  is_purchased: boolean
  purchase_type: string | null
  expires_at: string | null
  expiring_soon: boolean
  days_remaining: number | null
}

// ===== Paddle Webhook 事件类型 =====
export type PaddleEventType =
  | 'transaction.completed'
  | 'transaction.payment_failed'
  | 'refund.completed'
