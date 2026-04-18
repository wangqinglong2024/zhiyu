import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { config } from './core/config'
import { errorHandler, notFoundHandler } from './core/exceptions'
import { requestIdMiddleware } from './core/middleware'
import healthRouter from './routers/health'
import v1Router from './routers/v1'

const app = express()

// ===== 基础中间件 =====
app.use(helmet())
app.use(cors({
  origin: config.APP_ENV === 'production'
    ? ['https://ideas.top']
    : '*',
  credentials: true,
}))
app.use(compression())

// Paddle Webhook 需要原始 body 用于签名验证
app.use('/api/v1/webhooks/paddle', express.raw({ type: 'application/json' }), (req, _res, next) => {
  (req as any).rawBody = req.body
  req.body = JSON.parse(req.body.toString())
  next()
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))
app.use(requestIdMiddleware)

// ===== 路由挂载 =====
app.use('/api/v1', healthRouter)
app.use('/api/v1', v1Router)

// ===== 错误处理（必须在路由之后） =====
app.use(notFoundHandler)
app.use(errorHandler)

// ===== 启动服务 =====
const PORT = config.BACKEND_INTERNAL_PORT

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 知语后端已启动 | 环境: ${config.APP_ENV} | 端口: ${PORT}`)
  console.log(`📡 健康检查: http://localhost:${PORT}/api/v1/health`)
})
