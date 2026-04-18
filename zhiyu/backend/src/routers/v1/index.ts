import { Router } from 'express'
import authRouter from './auth'
import i18nRouter from './i18n'
import pushRouter from './push'
import categoriesRouter from './categories'
import articlesRouter from './articles'
import dailyQuotesRouter from './daily-quotes'
import favoritesRouter from './favorites'
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

// 管理后台路由
router.use('/admin/i18n', adminI18nRouter)
router.use('/admin/push', adminPushRouter)

export default router
