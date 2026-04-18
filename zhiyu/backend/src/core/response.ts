import { Response } from 'express'

/**
 * 统一成功响应
 */
export function success<T>(res: Response, data: T, message = 'success', code = 0): void {
  res.json({ code, message, data })
}

/**
 * 统一分页响应
 */
export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): void {
  res.json({
    code: 0,
    message: 'success',
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
