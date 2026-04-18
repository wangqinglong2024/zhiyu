import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../../core/auth'
import { success } from '../../core/response'
import * as progressService from '../../services/course-progress-service'
import { SaveProgressSchema, UpdateLessonStatusSchema, InitializeProgressSchema } from '../../models/learning-progress'
import { LessonIdParamSchema, LevelIdParamSchema } from '../../models/course'

const router = Router()

router.use(authMiddleware)

// PUT /course-progress/lessons/:lessonId
router.put('/lessons/:lessonId', async (req, res: Response) => {
  const { lessonId } = LessonIdParamSchema.parse(req.params)
  const { sub } = (req as AuthRequest).user
  const input = SaveProgressSchema.parse(req.body)
  const result = await progressService.saveLessonProgress(sub, lessonId, input)
  success(res, result)
})

// PATCH /course-progress/lessons/:lessonId/status
router.patch('/lessons/:lessonId/status', async (req, res: Response) => {
  const { lessonId } = LessonIdParamSchema.parse(req.params)
  const { sub } = (req as AuthRequest).user
  const { status } = UpdateLessonStatusSchema.parse(req.body)
  const result = await progressService.updateLessonStatus(sub, lessonId, status)
  success(res, result)
})

// GET /course-progress/overview
router.get('/overview', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const overview = await progressService.getProgressOverview(sub)
  success(res, overview)
})

// GET /course-progress/levels/:levelId/unlock-status
router.get('/levels/:levelId/unlock-status', async (req, res: Response) => {
  const { levelId } = LevelIdParamSchema.parse(req.params)
  const { sub } = (req as AuthRequest).user
  const status = await progressService.getUnlockStatus(sub, levelId)
  success(res, status)
})

// POST /course-progress/initialize
router.post('/initialize', async (req, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const { start_level } = InitializeProgressSchema.parse(req.body)
  const result = await progressService.initializeProgress(sub, start_level)
  success(res, result)
})

export default router
