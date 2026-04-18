import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { dailyQuoteService } from '../../services/daily-quote-service'
import { success } from '../../core/response'

const router = Router()

const quoteListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

// GET /api/v1/daily-quotes/today
router.get('/today', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const quote = await dailyQuoteService.getTodayQuote()
    res.setHeader('Cache-Control', 'public, max-age=300')
    success(res, quote)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/daily-quotes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = quoteListSchema.parse(req.query)
    const { items, total } = await dailyQuoteService.getQuoteList(page, pageSize)

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

export default router
