import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { categoryService } from '../../services/category-service'
import { success } from '../../core/response'

const router = Router()

const categoriesQuerySchema = z.object({
  locale: z.enum(['zh', 'en', 'vi']).default('zh'),
})

// GET /api/v1/categories
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locale } = categoriesQuerySchema.parse(req.query)
    const items = await categoryService.getCategories(locale)
    success(res, { items })
  } catch (err) {
    next(err)
  }
})

export default router
