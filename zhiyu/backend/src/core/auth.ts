import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config'
import { AppException } from './exceptions'

/**
 * 认证后的请求类型（携带用户信息）
 */
export interface AuthRequest extends Request {
  user: {
    sub: string
    role: string
    email?: string
    aud?: string
  }
}

/**
 * JWT 本地无状态验签中间件
 * 从 Authorization: Bearer <token> 提取 JWT
 * 使用 JWT_SECRET 本地毫秒级验签，不请求 Supabase
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppException(401, 40101, '缺少认证令牌')
  }

  const token = authHeader.slice(7)
  if (!token) {
    throw new AppException(401, 40101, '认证令牌为空')
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload
    ;(req as AuthRequest).user = {
      sub: decoded.sub as string,
      role: decoded.role as string || 'authenticated',
      email: decoded.email as string | undefined,
      aud: decoded.aud as string | undefined,
    }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppException(401, 40102, 'Token 已过期，请刷新')
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppException(401, 40103, 'Token 无效')
    }
    throw new AppException(401, 40101, '认证失败')
  }
}

/**
 * 管理员权限中间件 — 在 authMiddleware 之后使用
 */
export function adminMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest
  if (!authReq.user || authReq.user.role !== 'admin') {
    throw new AppException(403, 40302, '无管理权限')
  }
  next()
}
