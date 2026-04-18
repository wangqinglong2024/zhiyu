import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { articleService } from '../../services/article-service'
import { success } from '../../core/response'
import type { AuthRequest } from '../../core/auth'

const router = Router()

const articlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['latest', 'popular']).default('latest'),
  locale: z.enum(['zh', 'en', 'vi']).default('zh'),
})

const viewBodySchema = z.object({
  fingerprint: z.string().max(64).optional(),
})

// GET /api/v1/categories/:categoryId/articles
router.get('/categories/:categoryId/articles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = parseInt(req.params.categoryId as string, 10)
    if (isNaN(categoryId)) {
      res.status(400).json({ code: 40001, message: '无效的类目 ID', data: null })
      return
    }

    const { page, pageSize, sort, locale } = articlesQuerySchema.parse(req.query)
    const userId = (req as AuthRequest).user?.sub

    const { items, total } = await articleService.getArticleList(categoryId, page, pageSize, sort, locale, userId)

    res.json({
      code: 0,
      message: 'success',
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/articles/:articleId
router.get('/articles/:articleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articleId = req.params.articleId as string
    const userId = (req as AuthRequest).user?.sub
    const detail = await articleService.getArticleDetail(articleId, userId)
    success(res, detail)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/articles/:articleId/view
router.post('/articles/:articleId/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articleId = req.params.articleId as string
    const { fingerprint } = viewBodySchema.parse(req.body)
    const userId = (req as AuthRequest).user?.sub
    const counted = await articleService.recordView(articleId, userId, fingerprint)
    success(res, { counted })
  } catch (err) {
    next(err)
  }
})

export default router
