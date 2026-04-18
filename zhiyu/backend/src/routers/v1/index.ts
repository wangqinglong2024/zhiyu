import { Router } from 'express'
import authRouter from './auth'
import i18nRouter from './i18n'
import pushRouter from './push'
import categoriesRouter from './categories'
import articlesRouter from './articles'
import dailyQuotesRouter from './daily-quotes'
import favoritesRouter from './favorites'
import coursesRouter from './courses'
import courseProgressRouter from './course-progress'
import coursePurchasesRouter from './course-purchases'
import srsRouter from './srs'
import placementTestsRouter from './placement-tests'
import paddleWebhookRouter from './webhooks/paddle'
import adminI18nRouter from './admin/i18n'
import adminPushRouter from './admin/push'
import { optionalAuthMiddleware } from '../../core/auth'

const router = Router()

// 业务路由
router.use('/auth', authRouter)
router.use('/i18n', i18nRouter)
router.use('/push', pushRouter)
router.use('/categories', optionalAuthMiddleware, categoriesRouter)
router.use('/', optionalAuthMiddleware, articlesRouter)
router.use('/daily-quotes', dailyQuotesRouter)
router.use('/favorites', favoritesRouter)

// 课程学习模块
router.use('/courses', coursesRouter)
router.use('/course-progress', courseProgressRouter)
router.use('/course-purchases', coursePurchasesRouter)
router.use('/srs', srsRouter)
router.use('/placement-tests', placementTestsRouter)
router.use('/webhooks', paddleWebhookRouter)

// 管理后台路由
router.use('/admin/i18n', adminI18nRouter)
router.use('/admin/push', adminPushRouter)

export default router
