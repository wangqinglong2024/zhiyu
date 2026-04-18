import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../../core/auth'
import { success } from '../../core/response'
import * as purchaseService from '../../services/course-purchase-service'
import { PaddlePurchaseSchema, CoinExchangeSchema } from '../../models/course-purchase'
import { LevelIdParamSchema } from '../../models/course'

const router = Router()

router.use(authMiddleware)

// POST /course-purchases/paddle
router.post('/paddle', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const { level_id, idempotency_key } = PaddlePurchaseSchema.parse(req.body)
  const result = await purchaseService.initiatePaddlePurchase(sub, level_id, idempotency_key)
  success(res, result)
})

// POST /course-purchases/coin-exchange
router.post('/coin-exchange', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const { level_id, idempotency_key } = CoinExchangeSchema.parse(req.body)
  const result = await purchaseService.coinExchange(sub, level_id, idempotency_key)
  success(res, result)
})

// GET /course-purchases
router.get('/', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const purchases = await purchaseService.getUserPurchases(sub)
  success(res, purchases)
})

// GET /course-purchases/levels/:levelId/status
router.get('/levels/:levelId/status', async (req, res: Response) => {
  const { levelId } = LevelIdParamSchema.parse(req.params)
  const { sub } = (req as AuthRequest).user
  const status = await purchaseService.getLevelPurchaseStatus(sub, levelId)
  success(res, status)
})

export default router
