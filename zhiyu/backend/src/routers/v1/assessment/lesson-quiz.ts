import { Router, Response, NextFunction } from 'express'
import { authMiddleware, AuthRequest } from '../../../core/auth'
import { success } from '../../../core/response'
import * as lessonQuizService from '../../../services/lesson-quiz-service'
import { SubmitSingleAnswerSchema } from '../../../models/quiz-attempt'
import { supabaseAdmin } from '../../../core/supabase'

const router = Router()

router.use(authMiddleware)

// POST /lessons/:lessonId/quiz — 开始课时小测验
router.post('/lessons/:lessonId/quiz', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { lessonId } = req.params

    // Get lesson's level_id
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('level_id')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      res.status(404).json({ code: 40400, message: '课时不存在', data: null })
      return
    }

    const result = await lessonQuizService.startQuiz(sub, lessonId, lesson.level_id)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// POST /assessments/:attemptId/answers — 提交单题答案（即时反馈）
router.post('/assessments/:attemptId/answers', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { attemptId } = req.params
    const input = SubmitSingleAnswerSchema.parse(req.body)

    const result = await lessonQuizService.submitAnswer(
      sub,
      attemptId,
      input.questionId,
      input.userAnswer,
      input.timeSpentMs,
    )
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// POST /assessments/:attemptId/submit — 完成小测验
router.post('/assessments/:attemptId/submit', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const { attemptId } = req.params

    const result = await lessonQuizService.finishQuiz(sub, attemptId)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

export default router
