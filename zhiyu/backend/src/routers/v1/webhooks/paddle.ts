import { Router, Request, Response } from 'express'
import * as purchaseService from '../../../services/course-purchase-service'
import { success } from '../../../core/response'
import { BadRequest } from '../../../core/exceptions'
import crypto from 'crypto'

const router = Router()

/**
 * POST /webhooks/paddle
 * Paddle Webhook 回调（无 auth，使用签名验证）
 */
router.post('/paddle', async (req: Request, res: Response) => {
  // 签名验证
  const signature = req.headers['paddle-signature'] as string
  if (!signature) throw BadRequest('缺少 Paddle 签名')

  const rawBody = (req as any).rawBody as Buffer
  if (!rawBody) throw BadRequest('缺少原始请求体')

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET
  if (!webhookSecret) throw BadRequest('Webhook 密钥未配置')

  // 解析签名 ts=...;h1=...
  const parts = signature.split(';')
  const tsStr = parts.find(p => p.startsWith('ts='))?.slice(3)
  const h1 = parts.find(p => p.startsWith('h1='))?.slice(3)

  if (!tsStr || !h1) throw BadRequest('无效的签名格式')

  // 验证签名
  const payload = `${tsStr}:${rawBody.toString()}`
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expectedSig))) {
    throw BadRequest('签名验证失败')
  }

  // 检查时间戳（5分钟内）
  const ts = parseInt(tsStr, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > 300) {
    throw BadRequest('请求已过期')
  }

  const body = JSON.parse(rawBody.toString())
  const eventType = body.event_type as string
  const data = body.data as Record<string, unknown>

  await purchaseService.handlePaddleWebhook(eventType, data)

  success(res, { received: true })
})

export default router
