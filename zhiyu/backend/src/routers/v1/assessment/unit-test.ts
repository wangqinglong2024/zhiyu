import { Router, Response, NextFunction } from 'express'
import { authMiddleware, AuthRequest } from '../../../core/auth'
import { success } from '../../../core/response'
import * as unitTestService from '../../../services/unit-test-service'
import { SubmitBatchAnswersSchema, SaveProgressSchema } from '../../../models/quiz-attempt'
import { supabaseAdmin } from '../../../core/supabase'

const router = Router()

router.use(authMiddleware)

// POST /units/:unitId/test — 开始单元测评
router.post('/units/:unitId/test', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { unitId } = req.params

    // Get unit's level_id
    const { data: unit } = await supabaseAdmin
      .from('units')
      .select('level_id')
      .eq('id', unitId)
      .single()

    if (!unit) {
      res.status(404).json({ code: 40400, message: '单元不存在', data: null })
      return
    }

    const result = await unitTestService.startTest(sub, unitId, unit.level_id)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// PUT /assessments/:attemptId/progress — 保存答题进度
router.put('/assessments/:attemptId/progress', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { attemptId } = req.params
    const input = SaveProgressSchema.parse(req.body)

    const result = await unitTestService.saveProgress(
      sub,
      attemptId,
      input.currentIndex,
      input.answers,
      input.elapsedSeconds,
    )
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// GET /assessments/:attemptId/progress — 恢复答题进度
router.get('/assessments/:attemptId/progress', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { attemptId } = req.params

    const result = await unitTestService.restoreProgress(sub, attemptId)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// POST /assessments/:attemptId/submit-test — 统一提交单元测评
router.post('/assessments/:attemptId/submit-test', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { attemptId } = req.params
    const input = SubmitBatchAnswersSchema.parse(req.body)

    const result = await unitTestService.submitTest(sub, attemptId, input.answers)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

export default router
