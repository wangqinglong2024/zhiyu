import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../../core/auth'
import { success } from '../../core/response'
import { pushService } from '../../services/push-service'
import { SubscribeSchema, NotificationPreferencesSchema } from '../../models/push'
import type { AuthRequest } from '../../core/auth'

const router = Router()

// GET /api/v1/push/vapid-public-key — 获取 VAPID 公钥（公开）
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  success(res, { key: pushService.getVapidPublicKey() })
})

// 以下接口需要登录
router.use(authMiddleware)

// POST /api/v1/push/subscribe — 订阅推送
router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const input = SubscribeSchema.parse(req.body)
    const data = await pushService.subscribe(authReq.user!.sub, input)
    success(res, data, '推送订阅成功')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/push/unsubscribe — 取消订阅
router.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    await pushService.unsubscribe(authReq.user!.sub)
    success(res, null, '已取消订阅')
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/push/preferences — 获取通知偏好
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const data = await pushService.getPreferences(authReq.user!.sub)
    success(res, data)
  } catch (err) {
    next(err)
  }
})

// PUT /api/v1/push/preferences — 更新通知偏好
router.put('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const input = NotificationPreferencesSchema.parse(req.body)
    const data = await pushService.updatePreferences(authReq.user!.sub, input)
    success(res, data, '偏好已更新')
  } catch (err) {
    next(err)
  }
})

export default router
