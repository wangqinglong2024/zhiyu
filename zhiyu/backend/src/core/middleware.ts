import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

/**
 * 请求 ID 中间件 — 为每个请求分配唯一 ID，便于日志追踪
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID()
  next()
}
