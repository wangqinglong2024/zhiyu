import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

/**
 * 自定义业务异常
 */
export class AppException extends Error {
  constructor(
    public statusCode: number,
    public code: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppException'
  }
}

// 常用异常工厂
export const BadRequest = (message: string, code = 40000) => new AppException(400, code, message)
export const Unauthorized = (message = '未登录或 Token 已过期', code = 40100) => new AppException(401, code, message)
export const Forbidden = (message = '无权限访问', code = 40300) => new AppException(403, code, message)
export const NotFound = (message = '资源不存在', code = 40400) => new AppException(404, code, message)

/**
 * 404 路由兜底
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppException(404, 40400, `路由不存在: ${req.method} ${req.originalUrl}`))
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Zod 校验错误
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 40001,
      message: '参数校验失败',
      data: err.flatten().fieldErrors,
    })
    return
  }

  // 业务异常
  if (err instanceof AppException) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: null,
    })
    return
  }

  // 未知错误（不向客户端暴露内部信息）
  console.error('❌ 未捕获错误：', err)
  res.status(500).json({
    code: 50000,
    message: '服务器内部错误',
    data: null,
  })
}
