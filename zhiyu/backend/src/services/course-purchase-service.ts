import * as purchaseRepo from '../repositories/course-purchase-repository'
import * as courseRepo from '../repositories/course-repository'
import { BadRequest, NotFound, Forbidden } from '../core/exceptions'
import { AppException } from '../core/exceptions'
import type { PurchaseStatus } from '../models/course-purchase'

const THREE_YEARS_MS = 3 * 365.25 * 24 * 60 * 60 * 1000

/**
 * 发起 Paddle 支付
 */
export async function initiatePaddlePurchase(userId: string, levelId: string, idempotencyKey: string) {
  // 幂等检查
  const existingByKey = await purchaseRepo.findPurchaseByIdempotencyKey(idempotencyKey)
  if (existingByKey) {
    return {
      purchase_id: existingByKey.id,
      checkout_url: `https://checkout.paddle.com/placeholder/${existingByKey.id}`,
      expires_in: 3600,
    }
  }

  // 检查 Level
  const level = await courseRepo.findLevelById(levelId)
  if (!level) throw NotFound('Level 不存在')
  if (level.is_free) throw BadRequest('免费 Level 无需购买')

  // 检查是否已购买
  const activePurchase = await purchaseRepo.findActivePurchase(userId, levelId)
  if (activePurchase) {
    throw new AppException(409, 40901, '已购买该 Level，无需重复购买')
  }

  // 创建 pending 购买记录
  const purchase = await purchaseRepo.createPurchase({
    user_id: userId,
    level_id: levelId,
    purchase_type: 'paddle',
    amount_usd: level.price_usd,
    idempotency_key: idempotencyKey,
    status: 'pending',
  })

  // TODO: 调用 Paddle API 创建 Checkout Session
  // 目前返回占位 URL
  const checkoutUrl = `https://checkout.paddle.com/placeholder/${purchase.id}`

  return {
    purchase_id: purchase.id,
    checkout_url: checkoutUrl,
    expires_in: 3600,
  }
}

/**
 * 处理 Paddle Webhook
 */
export async function handlePaddleWebhook(eventType: string, data: Record<string, unknown>) {
  const txId = data.transaction_id as string
  if (!txId) return

  switch (eventType) {
    case 'transaction.completed': {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + THREE_YEARS_MS)

      await purchaseRepo.updatePurchaseByPaddleTxId(txId, {
        status: 'completed',
        purchased_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      break
    }
    case 'transaction.payment_failed': {
      await purchaseRepo.updatePurchaseByPaddleTxId(txId, { status: 'failed' })
      break
    }
    case 'refund.completed': {
      await purchaseRepo.updatePurchaseByPaddleTxId(txId, { status: 'refunded' })
      break
    }
  }
}

/**
 * 知语币兑换课程
 */
export async function coinExchange(userId: string, levelId: string, idempotencyKey: string) {
  // 幂等检查
  const existingByKey = await purchaseRepo.findPurchaseByIdempotencyKey(idempotencyKey)
  if (existingByKey) return existingByKey

  // 检查 Level
  const level = await courseRepo.findLevelById(levelId)
  if (!level) throw NotFound('Level 不存在')
  if (level.is_free) throw BadRequest('免费 Level 无需购买')

  // 检查是否已购买
  const activePurchase = await purchaseRepo.findActivePurchase(userId, levelId)
  if (activePurchase) {
    throw new AppException(409, 40901, '已购买该 Level，无需重复购买')
  }

  // TODO: 检查知语币余额 >= 600 & 扣除
  // 目前假设余额充足

  const now = new Date()
  const expiresAt = new Date(now.getTime() + THREE_YEARS_MS)

  const purchase = await purchaseRepo.createPurchase({
    user_id: userId,
    level_id: levelId,
    purchase_type: 'coin_exchange',
    coin_amount: level.coin_price,
    amount_usd: 0,
    idempotency_key: idempotencyKey,
    status: 'completed',
    purchased_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  })

  return purchase
}

/**
 * 查询用户购买记录
 */
export async function getUserPurchases(userId: string) {
  return purchaseRepo.findUserPurchases(userId)
}

/**
 * 检查 Level 购买状态
 */
export async function getLevelPurchaseStatus(userId: string, levelId: string): Promise<PurchaseStatus> {
  const level = await courseRepo.findLevelById(levelId)
  if (!level) throw NotFound('Level 不存在')

  if (level.is_free) {
    return {
      is_purchased: true,
      purchase_type: 'free',
      expires_at: null,
      expiring_soon: false,
      days_remaining: null,
    }
  }

  const purchase = await purchaseRepo.findActivePurchase(userId, levelId)
  if (!purchase) {
    return {
      is_purchased: false,
      purchase_type: null,
      expires_at: null,
      expiring_soon: false,
      days_remaining: null,
    }
  }

  const expiresAt = new Date(purchase.expires_at!)
  const now = new Date()
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  return {
    is_purchased: true,
    purchase_type: purchase.purchase_type,
    expires_at: purchase.expires_at,
    expiring_soon: daysRemaining <= 30,
    days_remaining: daysRemaining,
  }
}
