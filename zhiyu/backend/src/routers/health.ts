import { Router, Request, Response } from 'express'
import { checkSupabaseHealth } from '../core/supabase'

const router = Router()

/**
 * 健康检查端点 — Docker 容器和负载均衡器使用
 */
router.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await checkSupabaseHealth()

  const status = dbHealthy ? 200 : 503
  res.status(status).json({
    code: dbHealthy ? 0 : 50301,
    message: dbHealthy ? 'healthy' : 'database unavailable',
    data: {
      service: 'zhiyu-backend',
      version: '0.1.0',
      environment: process.env.APP_ENV || 'dev',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
})

export default router
