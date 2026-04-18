import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware, adminMiddleware } from '../../../core/auth'
import { success, paginated } from '../../../core/response'
import { i18nService } from '../../../services/i18n-service'
import {
  CreateTranslationSchema,
  UpdateTranslationSchema,
  BatchImportSchema,
  I18nQuerySchema,
} from '../../../models/i18n'

const router = Router()

// 所有管理 API 需要管理员权限
router.use(authMiddleware, adminMiddleware)

// GET /api/v1/admin/i18n — 翻译列表（分页+搜索+筛选）
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = I18nQuerySchema.parse(req.query)
    const { items, total } = await i18nService.listTranslations(query)
    paginated(res, items, total, query.page, query.page_size)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/admin/i18n — 新增翻译
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateTranslationSchema.parse(req.body)
    const data = await i18nService.createTranslation(input)
    res.status(201)
    success(res, data, '翻译已创建')
  } catch (err) {
    next(err)
  }
})

// PUT /api/v1/admin/i18n/:id — 更新翻译
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateTranslationSchema.parse(req.body)
    const data = await i18nService.updateTranslation(req.params.id as string, input)
    success(res, data, '翻译已更新')
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/admin/i18n/:id — 删除翻译
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await i18nService.deleteTranslation(req.params.id as string)
    success(res, null, '翻译已删除')
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/admin/i18n/batch — 批量导入
router.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = BatchImportSchema.parse(req.body)
    const data = await i18nService.batchImport(input)
    success(res, data, '批量导入完成')
  } catch (err) {
    next(err)
  }
})

export default router
