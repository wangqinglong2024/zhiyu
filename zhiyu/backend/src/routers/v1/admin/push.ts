import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware, adminMiddleware } from '../../../core/auth'
import { success } from '../../../core/response'
import { pushService } from '../../../services/push-service'
import { SendPushSchema } from '../../../models/push'

const router = Router()

router.use(authMiddleware, adminMiddleware)

// POST /api/v1/admin/push/send — 管理员发送推送
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = SendPushSchema.parse(req.body)
    const data = await pushService.sendNotification(input)
    success(res, data, '推送已发送')
  } catch (err) {
    next(err)
  }
})

export default router
