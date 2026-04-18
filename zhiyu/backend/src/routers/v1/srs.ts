import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../../core/auth'
import { success } from '../../core/response'
import * as srsService from '../../services/srs-service'
import { DueItemsQuerySchema, SubmitReviewSchema, AddReviewItemSchema } from '../../models/srs'

const router = Router()

router.use(authMiddleware)

// GET /srs/due
router.get('/due', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const query = DueItemsQuerySchema.parse(req.query)
  const result = await srsService.getDueItems(sub, query.limit ?? 20, query.module)
  success(res, result)
})

// POST /srs/reviews/:itemId
router.post('/reviews/:itemId', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const { itemId } = req.params
  const input = SubmitReviewSchema.parse(req.body)
  const result = await srsService.submitReview(sub, itemId, input)
  success(res, result)
})

// GET /srs/stats
router.get('/stats', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const stats = await srsService.getStats(sub)
  success(res, stats)
})

// POST /srs/items
router.post('/items', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const input = AddReviewItemSchema.parse(req.body)
  const item = await srsService.addReviewItem(sub, input)
  success(res, item)
})

export default router
