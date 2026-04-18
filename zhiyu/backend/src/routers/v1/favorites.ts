import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authMiddleware, type AuthRequest } from '../../core/auth'
import { favoriteService } from '../../services/favorite-service'
import { success } from '../../core/response'

const router = Router()

const favoriteBodySchema = z.object({
  articleId: z.string().uuid(),
})

const favoriteCheckSchema = z.object({
  articleIds: z.array(z.string().uuid()).min(1).max(50),
})

const favoriteListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  locale: z.enum(['zh', 'en', 'vi']).default('zh'),
})

// POST /api/v1/favorites — 收藏文章
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { articleId } = favoriteBodySchema.parse(req.body)
    const { data, isNew } = await favoriteService.addFavorite(userId, articleId)

    if (isNew) {
      res.status(201).json({ code: 0, message: 'success', data })
    } else {
      res.status(200).json({ code: 0, message: 'Already favorited', data })
    }
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/favorites/:articleId — 取消收藏
router.delete('/:articleId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user.sub
    const articleId = req.params.articleId as string
    await favoriteService.removeFavorite(userId, articleId)
    success(res, null)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/favorites — 我的收藏列表
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { page, pageSize, locale } = favoriteListSchema.parse(req.query)
    const { items, total } = await favoriteService.getFavoriteList(userId, page, pageSize, locale)

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

// POST /api/v1/favorites/check — 批量查询收藏状态
router.post('/check', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user.sub
    const { articleIds } = favoriteCheckSchema.parse(req.body)
    const result = await favoriteService.checkFavorites(userId, articleIds)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

export default router
