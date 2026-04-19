# T01-008: 后端 Express 框架搭建

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 7

## 需求摘要

搭建后端 Express + TypeScript 框架，包含应用入口 `main.ts`、核心中间件（CORS、Helmet、Morgan、Compression、请求 ID、统一错误处理）、统一响应格式封装、自定义异常类、健康检查路由、v1 路由汇总。搭建完成后后端可正常响应健康检查请求。

## 相关上下文

- 架构白皮书: `grules/01-rules.md` §三 — 后端架构哲学（全链路异步、三层分离、网关意识）
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范（路由模板、分层规则）
- API 规范: `grules/04-api-design.md` — RESTful 设计规约
- 项目结构: `grules/02-project-structure.md` — 后端目录结构
- 环境配置: `grules/env.md` §2 — 后端内部端口 3000
- 关联任务: 前置 T01-004（配置管理） → 后续 T01-012（集成验证）

## 技术方案

### backend/src/main.ts — 应用入口

```typescript
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
app.use(helmet())                     // 安全头
app.use(cors({
  origin: config.APP_ENV === 'production'
    ? ['https://ideas.top']           // 生产环境白名单
    : '*',                            // 开发环境允许所有
  credentials: true,
}))
app.use(compression())                // Gzip 压缩
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))           // 请求日志
app.use(requestIdMiddleware)          // 请求 ID 追踪

// ===== 路由挂载 =====
app.use('/api/v1', healthRouter)      // 健康检查（无需前缀版本号也可访问）
app.use('/api/v1', v1Router)          // v1 业务路由

// ===== 错误处理（必须在路由之后） =====
app.use(notFoundHandler)              // 404 兜底
app.use(errorHandler)                 // 全局错误处理

// ===== 启动服务 =====
const PORT = config.BACKEND_INTERNAL_PORT

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 知语后端已启动 | 环境: ${config.APP_ENV} | 端口: ${PORT}`)
  console.log(`📡 健康检查: http://localhost:${PORT}/api/v1/health`)
})
```

### backend/src/core/middleware.ts — 中间件

```typescript
import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

/**
 * 请求 ID 中间件 — 为每个请求分配唯一 ID，便于日志追踪
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID()
  next()
}
```

### backend/src/core/response.ts — 统一响应封装

```typescript
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
```

### backend/src/core/exceptions.ts — 异常处理

```typescript
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
```

### backend/src/core/auth.ts — JWT 认证占位

```typescript
import { Request, Response, NextFunction } from 'express'
import { Unauthorized } from './exceptions'

/**
 * 认证后的请求类型（携带用户信息）
 */
export interface AuthRequest extends Request {
  user: {
    sub: string       // 用户 UUID
    role: string      // 用户角色
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
```

### backend/src/routers/health.ts — 健康检查

```typescript
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
```

### backend/src/routers/v1/index.ts — v1 路由汇总

```typescript
import { Router } from 'express'

const router = Router()

// 后续业务路由在此注册：
// router.use('/users', usersRouter)
// router.use('/auth', authRouter)
// router.use('/configs', configsRouter)

export default router
```

## 范围（做什么）

- 实现 `backend/src/main.ts` 应用入口
- 实现 `backend/src/core/middleware.ts` 请求 ID 中间件
- 实现 `backend/src/core/response.ts` 统一响应封装
- 实现 `backend/src/core/exceptions.ts` 异常类 + 全局错误处理
- 实现 `backend/src/core/auth.ts` JWT 认证占位
- 实现 `backend/src/routers/health.ts` 健康检查路由
- 实现 `backend/src/routers/v1/index.ts` v1 路由汇总

## 边界（不做什么）

- 不实现完整 JWT 验签（T02 全局框架）
- 不创建业务路由（后续各模块任务）
- 不实现日志持久化（后续横切任务）
- 不配置 PM2 进程管理（生产部署任务）

## 涉及文件

- 修改: `zhiyu/backend/src/main.ts`
- 修改: `zhiyu/backend/src/core/middleware.ts`
- 修改: `zhiyu/backend/src/core/response.ts`
- 修改: `zhiyu/backend/src/core/exceptions.ts`
- 修改: `zhiyu/backend/src/core/auth.ts`
- 修改: `zhiyu/backend/src/routers/health.ts`（⚠️ T01-005 已集成 Supabase 健康检查，此处在其基础上补充 uptime/version 等元数据字段，非覆盖重写）
- 修改: `zhiyu/backend/src/routers/v1/index.ts`

## 依赖

- 前置: T01-004（config.ts 提供端口等配置）、T01-005（supabase.ts 提供健康检查）
- 后续: T01-012（集成验证需要后端正常响应）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 后端 Docker 容器已启动  
   **WHEN** 访问 `GET /api/v1/health`  
   **THEN** 返回 200，包含 service、version、environment、database、uptime 字段

2. **GIVEN** 后端已启动  
   **WHEN** 访问不存在的路由 `GET /api/v1/nonexistent`  
   **THEN** 返回 404，格式 `{ code: 40400, message: "路由不存在: ...", data: null }`

3. **GIVEN** 后端已启动  
   **WHEN** 向需要 JSON body 的路由发送无效 JSON  
   **THEN** 返回 400，Zod 校验错误格式

4. **GIVEN** 后端已启动  
   **WHEN** 检查响应头  
   **THEN** 包含 Helmet 注入的安全头（X-Content-Type-Options 等）

5. **GIVEN** 后端已启动  
   **WHEN** 检查请求日志输出  
   **THEN** Morgan 格式化日志包含请求方法、路径、状态码、耗时

6. **GIVEN** 统一响应封装  
   **WHEN** 调用 `success(res, { id: '1' })`  
   **THEN** 响应格式为 `{ code: 0, message: "success", data: { id: "1" } }`

7. **GIVEN** 后端已启动  
   **WHEN** 检查 CORS 配置  
   **THEN** dev 环境允许所有 origin，有 credentials: true

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认 backend 容器 Running
3. `docker compose logs --tail=30 backend` — 确认启动日志输出端口信息
4. `curl http://localhost:8100/api/v1/health` — 健康检查
5. `curl http://localhost:8100/api/v1/nonexistent` — 404 测试
6. `curl -I http://localhost:8100/api/v1/health` — 检查安全头

### 测试通过标准

- [ ] Docker 构建零错误
- [ ] 后端容器 Running，日志无 Error
- [ ] 健康检查返回 200
- [ ] 404 路由返回标准错误格式
- [ ] 安全头存在
- [ ] CORS 配置正确

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-008-backend-express-setup.md`

## 自检重点

- [ ] 安全：Helmet 安全头开启
- [ ] 安全：CORS 生产环境白名单
- [ ] 安全：全局错误处理不暴露内部信息
- [ ] 性能：Compression 中间件开启
- [ ] 可维护：统一响应格式
- [ ] 架构：三层分离（Router 层仅挂载路由）
