import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../../core/auth'
import { success } from '../../core/response'
import * as ptService from '../../services/placement-test-service'
import { SubmitAnswerSchema } from '../../models/placement-test'

const router = Router()

router.use(authMiddleware)

// POST /placement-tests/start
router.post('/start', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const result = await ptService.startTest(sub)
  success(res, result)
})

// POST /placement-tests/:testId/submit
router.post('/:testId/submit', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const { testId } = req.params
  const { answer, question_id } = SubmitAnswerSchema.parse(req.body)
  const result = await ptService.submitAndGetNext(sub, testId, answer, question_id)
  success(res, result)
})

// POST /placement-tests/:testId/complete
router.post('/:testId/complete', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const { testId } = req.params
  const result = await ptService.completeTest(sub, testId)
  success(res, result)
})

// GET /placement-tests/history
router.get('/history', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const result = await ptService.getTestHistory(sub)
  success(res, result)
})

export default router
