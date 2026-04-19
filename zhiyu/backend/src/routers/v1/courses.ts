import { Router, Response, NextFunction } from 'express'
import { authMiddleware, AuthRequest } from '../../core/auth'
import { success } from '../../core/response'
import * as courseService from '../../services/course-service'
import { LevelIdParamSchema, UnitIdParamSchema, LessonIdParamSchema } from '../../models/course'

const router = Router()

// 所有路由需认证
router.use(authMiddleware)

// GET /courses/levels
router.get('/levels', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as AuthRequest).user
    const levels = await courseService.getLevelsWithUserStatus(sub)
    success(res, levels)
  } catch (err) {
    next(err)
  }
})

// GET /courses/levels/:levelId
router.get('/levels/:levelId', async (req, res: Response, next: NextFunction) => {
  try {
    const { levelId } = LevelIdParamSchema.parse(req.params)
    const { sub } = (req as unknown as AuthRequest).user
    const units = await courseService.getUnitsWithProgress(sub, levelId)
    success(res, units)
  } catch (err) {
    next(err)
  }
})

// GET /courses/levels/:levelId/preview
router.get('/levels/:levelId/preview', async (req, res: Response, next: NextFunction) => {
  try {
    const { levelId } = LevelIdParamSchema.parse(req.params)
    const level = await courseService.getLevelPreview(levelId)
    success(res, level)
  } catch (err) {
    next(err)
  }
})

// GET /courses/units/:unitId/lessons
router.get('/units/:unitId/lessons', async (req, res: Response, next: NextFunction) => {
  try {
    const { unitId } = UnitIdParamSchema.parse(req.params)
    const { sub } = (req as unknown as AuthRequest).user
    const lessons = await courseService.getLessonsWithProgress(sub, unitId)
    success(res, lessons)
  } catch (err) {
    next(err)
  }
})

// GET /courses/lessons/:lessonId
router.get('/lessons/:lessonId', async (req, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = LessonIdParamSchema.parse(req.params)
    const { sub } = (req as unknown as AuthRequest).user
    const lesson = await courseService.getLessonDetail(sub, lessonId)
    success(res, lesson)
  } catch (err) {
    next(err)
  }
})

export default router
