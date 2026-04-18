# T01-005: Supabase 基础连接与配置

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 5

## 需求摘要

初始化前后端的 Supabase Client，建立与 Supabase（PostgreSQL + Auth）的基础连接。后端使用 `SERVICE_ROLE_KEY` 创建管理员级 Client（绕过 RLS），前端使用 `ANON_KEY` 创建用户级 Client。两端均需健康检查验证连接可用性。

## 相关上下文

- 环境配置: `grules/env.md` §3 — Supabase 凭证（URL、ANON_KEY、SERVICE_ROLE_KEY、JWT_SECRET）
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（原生能力优先、RLS 零信任）
- 编码规范: `grules/05-coding-standards.md` §一.3 — 禁止前端出现 SERVICE_ROLE_KEY
- 架构白皮书: `grules/01-rules.md` §三 — Supabase Client 全局单例
- 关联任务: 前置 T01-004（配置管理提供凭证） → 后续 T01-006/T01-007（数据库 Schema）

## 技术方案

### 后端 Supabase Client — `backend/src/core/supabase.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from './config'

// 全局单例 — 应用启动时初始化一次，模块导出共享
// 使用 SERVICE_ROLE_KEY：绕过 RLS，用于服务端管理操作
const supabaseAdmin: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// 使用 ANON_KEY：遵循 RLS，用于代理用户请求
const supabaseClient: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * 健康检查 — 验证 Supabase 连接是否可用
 * 尝试查询 pg_catalog 系统表，成功则连接正常
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('_health_check_placeholder')
      .select('count')
      .limit(1)
      .maybeSingle()

    // 表不存在也算连接成功（42P01 = relation does not exist）
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Supabase 健康检查失败：', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('❌ Supabase 连接异常：', err)
    return false
  }
}

export { supabaseAdmin, supabaseClient }
```

### 前端 Supabase Client — `frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { APP_CONFIG } from './constants'

// 前端使用 ANON_KEY — 所有操作受 RLS 策略约束
export const supabase = createClient(
  APP_CONFIG.supabaseUrl,
  APP_CONFIG.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
```

### 后端健康检查集成 — 更新 `backend/src/routers/health.ts`

```typescript
import { Router, Request, Response } from 'express'
import { checkSupabaseHealth } from '@/core/supabase'

const router = Router()

router.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await checkSupabaseHealth()

  const status = dbHealthy ? 200 : 503
  res.status(status).json({
    code: dbHealthy ? 0 : 50301,
    message: dbHealthy ? 'healthy' : 'database unavailable',
    data: {
      service: 'zhiyu-backend',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
```

### 依赖安装

**后端**:
```bash
npm install @supabase/supabase-js
```

**前端**:
```bash
npm install @supabase/supabase-js
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 后端双 Client | supabaseAdmin + supabaseClient | admin 绕过 RLS 做管理，client 遵循 RLS 代理用户 |
| 全局单例 | 模块级常量导出 | 避免每次请求创建新连接，复用连接池 |
| 前端 persistSession | true | 浏览器刷新后保持登录态 |
| 后端 persistSession | false | 服务端无需持久化会话 |
| 健康检查 | 查询系统表 | 最轻量的连接验证方式 |

## 范围（做什么）

- 安装 `@supabase/supabase-js` 到前后端
- 实现 `backend/src/core/supabase.ts`（双 Client + 健康检查）
- 实现 `frontend/src/lib/supabase.ts`（用户级 Client）
- 更新健康检查路由集成数据库状态
- 更新 `frontend/package.json` 和 `backend/package.json` 依赖

## 边界（不做什么）

- 不建表、不写 Migration（T01-006/T01-007）
- 不实现认证流程（T02 全局框架阶段）
- 不配置 Realtime 订阅
- 不配置 Storage Bucket

## 涉及文件

- 修改: `zhiyu/backend/src/core/supabase.ts`（从占位变为完整实现）
- 修改: `zhiyu/frontend/src/lib/supabase.ts`（从占位变为完整实现）
- 修改: `zhiyu/backend/src/routers/health.ts`（集成 Supabase 健康检查）
- 修改: `zhiyu/backend/package.json`（添加 @supabase/supabase-js）
- 修改: `zhiyu/frontend/package.json`（添加 @supabase/supabase-js）

## 依赖

- 前置: T01-004（config.ts 提供 SUPABASE_URL、KEY 等配置）
- 后续: T01-006（用户表 Schema）、T01-007（系统配置 Schema）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 后端已启动且 Supabase 可达  
   **WHEN** 访问 `GET /api/v1/health`  
   **THEN** 返回 `{ code: 0, data: { database: "connected" } }`

2. **GIVEN** 后端已启动但 Supabase 不可达  
   **WHEN** 访问 `GET /api/v1/health`  
   **THEN** 返回 503 状态码和 `{ data: { database: "disconnected" } }`

3. **GIVEN** 后端 supabase.ts 已实现  
   **WHEN** 检查导出内容  
   **THEN** 导出 `supabaseAdmin`（SERVICE_ROLE_KEY）和 `supabaseClient`（ANON_KEY）两个实例

4. **GIVEN** 前端 supabase.ts 已实现  
   **WHEN** 检查前端代码中所有 `@supabase/supabase-js` 的使用  
   **THEN** 仅使用 ANON_KEY，无 SERVICE_ROLE_KEY 引用

5. **GIVEN** 前端 Supabase Client 配置  
   **WHEN** 检查 auth 配置  
   **THEN** `autoRefreshToken: true`，`persistSession: true`

6. **GIVEN** 两端依赖已安装  
   **WHEN** 检查 package.json 的 dependencies  
   **THEN** 包含 `@supabase/supabase-js`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 确认无 Supabase 连接错误
4. `curl http://localhost:8100/api/v1/health` — 检查数据库连接状态
5. 通过 Browser MCP 打开前端页面，检查控制台无 Supabase 初始化错误

### 测试通过标准

- [ ] 后端启动无错误
- [ ] 健康检查返回数据库状态
- [ ] 前端无 Supabase 初始化错误
- [ ] 前端代码不含 SERVICE_ROLE_KEY
- [ ] 后端双 Client 正确创建

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-005-supabase-setup.md`

## 自检重点

- [ ] 安全：前端不含 SERVICE_ROLE_KEY
- [ ] 安全：后端管理员 Client 仅在必要场景使用
- [ ] 性能：Client 全局单例，非每次请求创建
- [ ] 可维护：配置从 config.ts 统一读取
