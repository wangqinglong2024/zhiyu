# T01-004: 环境变量与配置管理

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: S(简单)
> 预估文件数: 4

## 需求摘要

建立前后端统一的环境变量管理体系。创建 `.env.example` 模板（包含所有必要变量键）、后端 `config.ts` 配置管理模块（使用 Zod 校验环境变量）、前端环境变量约定（`VITE_` 前缀）。确保敏感信息不泄露，配置可按环境切换。

## 相关上下文

- 环境配置: `grules/env.md` — 完整凭证和配置（**核心依据**）
- 编码规范: `grules/05-coding-standards.md` §一.2 — 环境变量命名 UPPER_SNAKE_CASE
- 安全规范: `grules/05-coding-standards.md` §一.3 — 禁止前端出现 SERVICE_ROLE_KEY
- 关联任务: 前置 T01-001 → 后续 T01-005（Supabase）、T01-008（Express）、T01-009（React）

## 技术方案

### .env.example

```bash
# ===== 应用环境 =====
APP_ENV=dev
PROJECT_NAME=ideas
NODE_ENV=development

# ===== 端口映射 =====
FRONTEND_PORT=3100
BACKEND_PORT=8100
BACKEND_INTERNAL_PORT=3000

# ===== Supabase =====
SUPABASE_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=

# ===== 前端环境变量（VITE_ 前缀） =====
VITE_API_BASE=http://115.159.109.23:8100
VITE_SUPABASE_URL=http://115.159.109.23:8000
VITE_SUPABASE_ANON_KEY=
VITE_APP_ENV=dev

# ===== Dify（AI 工作流） =====
DIFY_API_URL=http://dify-nginx/v1
DIFY_API_KEY=

# ===== Redis（缓存） =====
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

### backend/src/core/config.ts

```typescript
import { z } from 'zod'
import dotenv from 'dotenv'

// 在应用启动时加载 .env
dotenv.config()

// 使用 Zod 校验环境变量，启动时即发现配置缺失
const envSchema = z.object({
  // 应用
  APP_ENV: z.enum(['dev', 'staging', 'production']).default('dev'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_INTERNAL_PORT: z.coerce.number().default(3000),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),

  // Dify（可选，后续功能需要时再强制）
  DIFY_API_URL: z.string().url().optional(),
  DIFY_API_KEY: z.string().optional(),

  // Redis（可选）
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
})

// 解析并验证，启动时失败快速报错
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ 环境变量校验失败：')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
export type AppConfig = z.infer<typeof envSchema>
```

### 前端环境变量约定

前端通过 Vite 的 `import.meta.env` 访问，仅 `VITE_` 前缀变量会暴露给浏览器：

```typescript
// frontend/src/lib/constants.ts
export const APP_CONFIG = {
  apiBase: import.meta.env.VITE_API_BASE || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  appEnv: import.meta.env.VITE_APP_ENV || 'dev',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
```

### 关键安全规则

| 规则 | 说明 |
|------|------|
| **SERVICE_ROLE_KEY 绝不暴露** | 仅后端使用，前端代码中严禁出现 |
| **VITE_ 前缀规范** | 前端能访问的变量必须以 VITE_ 开头 |
| **.env 不提交 Git** | .gitignore 中包含 .env |
| **Zod 启动校验** | 后端启动时立即校验所有必要变量，缺失即退出 |
| **类型安全** | 通过 Zod 推导类型，后续代码有完整的 IDE 提示 |

## 范围（做什么）

- 创建完整的 `.env.example` 模板文件
- 创建 `.env` 文件（含真实配置值，仅本地使用）
- 创建 `backend/src/core/config.ts` 配置管理模块
- 更新 `frontend/src/lib/constants.ts` 前端常量配置

## 边界（不做什么）

- 不写 Supabase Client 初始化（T01-005）
- 不写 Express 中间件（T01-008）
- 不配置 CI/CD 环境变量注入
- 不配置 staging/production 环境的 .env 文件

## 涉及文件

- 新建: `zhiyu/.env.example`
- 新建: `zhiyu/.env`（不提交 Git）
- 修改: `zhiyu/backend/src/core/config.ts`（从占位变为完整实现）
- 修改: `zhiyu/frontend/src/lib/constants.ts`（添加环境变量读取）

## 依赖

- 前置: T01-001（目录骨架和占位文件必须存在）
- 后续: T01-005（Supabase 需要从 config 读取连接信息）、T01-008（Express 需要端口配置）、T01-009（React 需要前端常量）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** .env.example 文件存在  
   **WHEN** 检查文件内容  
   **THEN** 包含 SUPABASE_URL、JWT_SECRET、VITE_API_BASE 等所有必要键，值为空

2. **GIVEN** config.ts 使用 Zod 校验  
   **WHEN** 缺少必要环境变量（如 SUPABASE_URL）时启动后端  
   **THEN** 应用立即报错退出，控制台输出缺失变量名

3. **GIVEN** config.ts 校验通过  
   **WHEN** 在后端代码中导入 `config`  
   **THEN** 可获取类型安全的配置值（IDE 有完整提示）

4. **GIVEN** 前端 constants.ts 配置完成  
   **WHEN** 在组件中导入 `APP_CONFIG`  
   **THEN** 可访问 apiBase、supabaseUrl 等配置，类型为 string

5. **GIVEN** .env 包含 SERVICE_ROLE_KEY  
   **WHEN** 搜索前端代码中所有文件  
   **THEN** 无任何 SERVICE_ROLE_KEY 引用

6. **GIVEN** .gitignore 配置完成  
   **WHEN** 检查 .gitignore 内容  
   **THEN** 包含 `.env` 但不包含 `.env.example`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. `docker compose logs --tail=30 backend` — 确认无环境变量校验失败
3. 修改 .env 删除 SUPABASE_URL → 重新构建 → 确认后端启动失败并输出明确错误
4. 恢复 .env → 重新构建 → 确认启动成功

### 测试通过标准

- [ ] .env.example 包含所有必要变量
- [ ] 后端启动时 Zod 校验通过
- [ ] 缺少变量时后端明确报错
- [ ] 前端无 SERVICE_ROLE_KEY 引用
- [ ] .env 在 .gitignore 中

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-004-env-config.md`

## 自检重点

- [ ] 安全：SERVICE_ROLE_KEY 仅后端使用
- [ ] 安全：.env 不提交 Git
- [ ] 类型安全：Zod 推导 TypeScript 类型
- [ ] 启动校验：缺少变量快速失败
- [ ] 命名规范：环境变量全大写下划线
