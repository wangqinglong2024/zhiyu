import { Router } from 'express'
import authRouter from './auth'
import i18nRouter from './i18n'
import pushRouter from './push'
import adminI18nRouter from './admin/i18n'
import adminPushRouter from './admin/push'

const router = Router()

// 业务路由
router.use('/auth', authRouter)
router.use('/i18n', i18nRouter)
router.use('/push', pushRouter)

// 管理后台路由
router.use('/admin/i18n', adminI18nRouter)
router.use('/admin/push', adminPushRouter)

export default router
