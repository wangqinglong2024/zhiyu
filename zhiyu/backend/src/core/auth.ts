import { Request, Response, NextFunction } from 'express'
import { Unauthorized } from './exceptions'

/**
 * 认证后的请求类型（携带用户信息）
 */
export interface AuthRequest extends Request {
  user: {
    sub: string
    role: string
    email?: string
  }
}

/**
 * JWT 认证中间件 — 占位实现，T02 全局框架完善
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // TODO: T02-全局框架 实现完整 JWT 验签
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw Unauthorized()
  }
  next()
}
