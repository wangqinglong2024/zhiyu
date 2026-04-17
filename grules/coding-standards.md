# 编码规范手册 (Coding Standards)

> **版本**: v1.0 | **最后更新**: 2025-07-16
>
> **适用范围**：所有基于 Vite React/TS + Express/TS/Node.js + Supabase + Docker 技术栈的项目。
> **使用方法**：新项目启动时，将此文件喂给 AI，作为生成代码时必须遵守的铁律。

---

## 一、通用规则（前后端共享）

### 1. 语言与注释
- 变量名、函数名、类名：一律英文，语义清晰
- 代码内注释：一律简体中文，解释"为什么"而不是"做了什么"
- 禁止无意义注释（如 `// 定义变量 x`）

### 2. 命名约定

| 场景 | 风格 | 示例 |
|------|------|------|
| 文件/目录名 | kebab-case（短横线） | `user-profile.tsx`, `auth-router.ts` |
| React 组件文件 | PascalCase | `UserCard.tsx`, `ChatBubble.tsx` |
| TypeScript 变量/函数 | camelCase | `isLoading`, `handleSubmit`, `fetchUserData` |
| TypeScript 接口/类型 | PascalCase + I 前缀可选 | `UserProfile`, `ChatMessage` |
| TypeScript 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 后端变量/函数 (Node.js) | camelCase | `isActive`, `getCurrentUser` |
| 后端类/接口 (Node.js) | PascalCase | `UserResponse`, `ChatService` |
| 后端常量 (Node.js) | UPPER_SNAKE_CASE | `JWT_SECRET`, `DB_URL` |
| 数据库表名 | snake_case 复数 | `user_profiles`, `chat_messages` |
| 数据库字段名 | snake_case | `created_at`, `user_id` |
| API 路径 | kebab-case 复数 | `/api/v1/chat-messages`, `/api/v1/users` |
| 环境变量 | UPPER_SNAKE_CASE | `SUPABASE_URL`, `VITE_API_BASE` |

### 3. 禁止事项（红线清单）
- ❌ 禁止 `any` 类型（TypeScript），必须给出明确类型
- ❤ 禁止 `// @ts-ignore`（后端 TypeScript），必须修正类型问题
- ❌ 禁止硬编码魔法数字/字符串，必须提取为命名常量
- ❌ 禁止 `console.log` / `print` 残留在提交代码中（调试用完即删）
- ❌ 禁止在前端代码中出现 `SERVICE_ROLE_KEY`
- ❌ 禁止使用 `var`（JS/TS），只用 `const` 和 `let`
- ❤ 禁止同步阻塞调用（Node.js 后端），所有 I/O 必须 `async/await`

---

## 二、前端编码规范（React + TypeScript + Vite）

### 1. 组件规范
```tsx
// ✅ 标准组件结构模板
import { useState } from 'react'
import type { FC } from 'react'

// --- 类型定义（紧贴组件） ---
interface UserCardProps {
  userId: string
  onEdit?: (id: string) => void
}

// --- 组件主体 ---
export const UserCard: FC<UserCardProps> = ({ userId, onEdit }) => {
  const [isLoading, setIsLoading] = useState(false)

  // 事件处理函数以 handle 开头
  const handleEdit = () => {
    onEdit?.(userId)
  }

  return (
    <div className="glass-card">
      {/* JSX 内容 */}
    </div>
  )
}
```

### 2. 文件组织规则
- 每个组件一个文件，文件名 = 组件名
- 超过 150 行的组件必须拆分子组件
- 自定义 Hook 必须以 `use` 开头，放入 `hooks/` 目录
- 类型定义超过 10 行时，抽到同目录的 `types.ts` 文件

### 3. 状态管理规则
- 本组件私有状态：`useState`
- 跨组件共享状态：React Context + useReducer
- 服务端数据缓存：TanStack Query（React Query）
- URL 状态：`useSearchParams`
- 禁止 prop drilling 超过 2 层，超过就用 Context

### 4. 样式规则（Tailwind CSS v4）
- 全局样式类（`.glass`, `.glass-card` 等）在全局 CSS 中统一定义
- 组件内样式全部用 Tailwind 原子类，禁止写内联 `style={{}}`
- 响应式使用 mobile-first：默认写移动端样式，`md:` / `lg:` 向上扩展
- 暗色模式通过 CSS 变量切换，禁止在组件里写 `dark:` 条件类

### 5. API 调用规范
```tsx
// ✅ 使用统一的 API 客户端封装
import { apiClient } from '@/lib/api-client'

// ✅ 搭配 React Query 使用
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.get<UserProfile>(`/api/v1/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  })
}
```
- 禁止在组件内直接写 `fetch()` 或 `axios.get()`
- 所有 API 调用必须经过统一封装的 `apiClient`
- 该客户端负责：自动附加 Authorization Header、统一错误拦截、基础 URL 拼接

### 6. 错误处理
- API 错误统一由 `apiClient` 拦截器处理，弹出 Toast 通知
- 页面级错误使用 React Error Boundary 兜底
- 表单验证使用 Zod schema，禁止手写 if-else 校验
- 所有用户输入必须做前端校验 + 后端二次校验（双重保险）

---

## 三、后端编码规范（Express + TypeScript + Node.js）

### 1. 路由函数标准模板
```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { authMiddleware, AuthRequest } from '@/core/auth'
import { UserUpdateSchema, UserResponse } from '@/models/user'
import { userService } from '@/services/user-service'

const router = Router()

// 更新用户资料。仅允许用户修改自己的信息。
router.put('/:userId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const payload = UserUpdateSchema.parse(req.body)

    if (req.user.sub !== userId) {
      return res.status(403).json({ code: 40301, message: '无权修改他人资料', data: null })
    }

    const result = await userService.updateUser(userId, payload)
    res.json({ code: 0, message: 'success', data: result })
  } catch (err) {
    next(err)
  }
})

export default router
```

### 2. 分层架构规则
```
后端代码严格分三层，禁止跨层调用：

Router 层（路由）  → 只做：参数接收、鉴权、调用 Service、返回响应
Service 层（服务） → 只做：业务逻辑、编排多个数据操作、事务控制
Repository 层（数据访问）→ 只做：与 Supabase/数据库的直接交互
```
- Router 禁止直接写 SQL 或调用 Supabase SDK
- Service 禁止直接操作 HTTP Request/Response 对象
- Repository 禁止包含业务判断逻辑

### 3. Zod 数据校验规范
```typescript
import { z } from 'zod'

// 请求体 Schema：以 Create / Update 结尾
export const UserCreateSchema = z.object({
  username: z.string().min(2).max(50).describe('用户名'),
  email: z.string().email().describe('邮箱地址'),
})

// 响应体类型：以 Response 结尾
export interface UserResponse {
  id: string
  username: string
  createdAt: string
}

// 从 Zod Schema 推导类型
export type UserCreate = z.infer<typeof UserCreateSchema>
export type UserUpdate = z.infer<typeof UserUpdateSchema>
```
- 每个请求 Schema 字段必须有 `.describe("中文说明")`
- 请求 Schema 必须设置字段约束（`min`, `max`, `email`, `regex` 等）
- 响应类型使用 TypeScript `interface`，与前端共享

### 4. 错误处理规范
```typescript
// ✅ 统一响应格式
{
    "code": 0,         // 业务状态码（0 = 成功，非零 = 错误）
    "message": "操作成功",
    "data": { ... }    // 实际数据
}

// ✅ 错误响应格式
{
    "code": 40301,         // 业务错误码（HTTP状态码前缀 + 2位序号）
    "message": "积分不足，无法兑换",
    "data": null
}
```
- 使用全局 Express 错误处理中间件统一捕获，禁止在路由里裸 `try/catch` 不往下传递
- 已知业务异常用自定义 `BizError(code, message)` 抛出
- 未知异常由全局错误中间件兜底，生产环境只返回"服务器内部错误"，不暴露堆栈

### 5. 异步 HTTP 客户端与后台任务
- 调用第三方 API（大模型、支付等）使用 `axios` 全局单例或 Node.js 原生 `fetch`，禁止使用同步请求
- CPU 密集型任务（报表生成、大图裁剪）禁止在路由函数内同步执行，必须使用 `BullMQ` 消息队列或 `worker_threads`，立即返回"处理中"

### 6. Nginx 网关意识
- 所有前后端流量经 `/opt/gateway/` 下的 Nginx 反向代理接管
- 遇到 CORS 预检失败、502 Bad Gateway 时，优先检查 Nginx `location` 规则和 Header 透传配置，而非仅排查代码
- 新增后端服务时，必须同步更新 Nginx 配置

### 7. 日志规范
- 使用 `winston` 或 `pino`，禁止用 `console.log`（生产代码）
- 日志级别：debug（开发调试）、info（关键业务节点）、warn（异常但可恢复）、error（需人工介入）
- 每条日志必须包含：`userId`（如有）、`requestId`、关键业务参数
- 敏感信息（密码、Token）禁止出现在日志中

---

## 四、Supabase 交互规范

### 1. 前端调用（仅限 ANON_KEY）
```tsx
// ✅ 前端 Supabase Client 初始化
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

### 2. 后端调用（SERVICE_ROLE_KEY 仅限服务端）
```typescript
// ✅ 后端 Supabase Client
import { createClient } from '@supabase/supabase-js'
import { config } from '@/core/config'

export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
)
```

### 3. 查表优先原则
- 编写任何数据库交互代码前，必须先查明当前 Schema 结构、表关系、字段类型（UUID vs BigInt 等）
- 禁止凭空捏造表名或字段名，必须通过 MCP 工具或 `\dt`, `\d table_name` 确认

### 4. auth.users 禁区与业务扩展
- **绝对红线**：严禁修改、增删 Supabase 内部的 `auth` schema 下的表（如 `auth.users`）
- **业务扩展**：增加用户字段（头像、昵称、积分等），必须在 `public` schema 下新建关联表（如 `public.profiles`），主键 `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`

### 5. Migration 文件规范
- 命名：时间戳前缀，如 `20260218200500_create_profiles_table.sql`
- 文件存放：`supabase/migrations/` 目录
- 文件头部必须有中文注释：此次变更目的、受影响模块、回滚策略
- 禁止通过 Dashboard UI 手动建表，所有变更必须有 migration 文件留痕

### 6. 数据库变更必须同步
每次变更数据库 Schema 后，必须立即执行：
1. 生成迁移文件到 `supabase/migrations/`
2. 后端：更新对应的 Zod Schema 和 TypeScript 类型
3. 前端：运行 `supabase gen types typescript` 更新 `src/types/supabase.ts`
4. 三端类型必须 100% 一致

---

## 五、Git 提交规范

### Commit Message 格式
```
<type>(<scope>): <简短中文描述>

[可选的详细说明]
```

### Type 清单
| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `refactor` | 重构（不影响功能） |
| `style` | 样式/格式调整（不影响逻辑） |
| `docs` | 文档变更 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |
| `perf` | 性能优化 |
| `ci` | CI/CD 配置变更 |

### 示例
```
feat(auth): 新增手机号验证码登录功能
fix(chat): 修复长消息截断显示问题
refactor(api): 用户模块拆分为独立的 service 层
```

### 原子提交纪律
- **一个提交 = 一个逻辑变更**，禁止把多个不相关修改打包在同一个 commit
- 修复 Bug 时：修复代码一个 commit，对应的回归测试一个 commit
- 重构时：移动/重命名与行为变更必须分开 commit
- 每个 commit 必须独立可理解、可回退（`git revert` 不会引发连锁问题）
- 禁止 `git add .` 一把梭，必须 `git add <具体文件>` 精确暂存

### 回归测试纪律
- **每修一个 Bug 必须附带一个回归测试**，没有例外
- 回归测试的注释必须标注来源：`# 回归测试: 修复 ISSUE-NNN — 问题描述`
- 测试必须复现触发 Bug 的前置条件，而不是泛泛地测"能跑"
- 新增条件分支（if/else、switch）时，必须测试所有分支路径
- 新增错误处理时，必须有触发该错误的测试用例

### 分支规范
- `main` — 生产分支，禁止直接推送
- `dev` — 开发主线
- `feat/xxx` — 功能分支，从 dev 切出
- `fix/xxx` — 修复分支
- `release/vX.Y.Z` — 发版分支

### 依赖版本锁定
- **前端**：`package-lock.json` 必须提交到 Git；CI/CD 和 Docker 中使用 `npm ci`（而非 `npm install`），确保安装与 lock 文件 100% 一致
- **后端**：`package-lock.json` 中所有依赖必须使用精确版本号；CI/CD 和 Docker 中使用 `npm ci`（而非 `npm install`），确保安装与 lock 文件 100% 一致
- **Docker 镜像**：基础镜像使用固定版本标签（如 `node:20-alpine`），禁止使用 `latest`（已在安全规范 §六.5 中强调）
- **依赖更新纪律**：禁止随意 `npm update`；升级依赖必须单独一个 commit（type: `chore`），并在提交说明中注明升级原因和影响范围

---

## 六、安全规范（纵深防御体系）

> 安全不是一个功能，是贯穿每一行代码的底线。每次开发涉及用户输入、鉴权、数据访问、网络通信的功能时，必须对照此清单自查。

### 1. 注入防护（OWASP A03）
- **SQL 注入**：使用 Supabase SDK 参数化查询或 Zod Schema 绑定，禁止拼接 SQL 字符串；手写 SQL 必须用 `$1, $2` 占位符
- **XSS**：React 默认转义，但 `dangerouslySetInnerHTML` 必须经 DOMPurify 消毒；用户生成的富文本内容存储前必须清洗
- **命令注入**：禁止使用 `child_process.exec()` 拼接用户输入，必须使用 `child_process.execFile()` 或传数组参数
- **路径穿越**：文件操作必须校验路径不包含 `..`，使用 `path.resolve()` 规范化后验证前缀

### 2. 鉴权与会话安全（OWASP A01 + A07）
- **Token 存储**：JWT 令牌放 `httpOnly` cookie 或 Authorization Header，**绝对禁止** 存 `localStorage`（XSS 可窃取）
- **接口守卫**：所有写入接口必须 `Depends(get_current_user)`；Service 层必须再次校验资源所有权（双重保险）
- **Token 生命周期**：access_token ≤ 1 小时，refresh_token ≤ 7 天；refresh 也失败时强制跳登录页
- **会话绑定**：Token 内嵌 `user_id` + `iat`（签发时间），修改密码后旧 Token 必须全部失效
- **权限最小化**：默认所有接口需认证，公开接口必须显式声明并在代码评审中确认；接口只返回当前用户有权查看的数据，禁止在前端做权限裁剪
- **密码策略**：密码最短 8 位，必须包含字母 + 数字；使用 `bcrypt` 哈希存储，禁止 MD5/SHA1

### 3. 传输安全（OWASP A02）
- **强制 HTTPS**：所有对外服务必须通过 Nginx 配置 TLS 证书，HTTP 301 永久重定向到 HTTPS
- **Nginx TLS 配置**：禁用 SSLv3/TLS 1.0/1.1，仅允许 TLS 1.2+；使用强密码套件 `EECDH+AESGCM:EDH+AESGCM`
- **HSTS 头**：`Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Docker 内部通信**：虽然内网不强制 TLS，但敏感数据（支付回调、用户密码）即使内网传输也必须 HTTPS 或加密

### 4. 敏感数据加密与保护（OWASP A02 + A04）

**存储加密**：
- 数据库敏感字段（身份证号、银行卡号、手机号）必须使用 AES-256 加密存储，后端提供统一的 `encrypt_field()` / `decrypt_field()` 工具函数
- 加密密钥从环境变量读取（`DATA_ENCRYPTION_KEY`），禁止硬编码；密钥长度 ≥ 32 字节
- PostgreSQL 启用 `pgcrypto` 扩展用于数据库级加密场景
- 密码字段使用 `bcrypt` 单向哈希，禁止可逆加密

**数据脱敏**：
- API 响应中的手机号显示为 `138****1234`、邮箱显示为 `z***@xx.com`、身份证号显示为 `430***********1234`
- 后端提供统一 `mask_phone()` / `mask_email()` / `mask_id_card()` 工具函数
- 日志中所有敏感字段必须脱敏；Token、密码、密钥绝对不许出现在日志中
- `SERVICE_ROLE_KEY` 只允许在后端 Docker 容器环境变量中使用

**文件上传安全**：
- 必须校验文件真实类型（读 Magic Bytes，不信任 `Content-Type`）
- 强制限制：图片 ≤ 5MB、文档 ≤ 20MB、白名单格式（jpg/png/webp/pdf）
- 上传后的文件名必须重命名为 UUID，禁止使用用户原始文件名（防路径注入 + 覆盖攻击）
- 通过 Supabase Storage 上传时，Bucket 策略必须限制 MIME 类型

### 5. 反爬虫与 Bot 防护

**Nginx 网关层**：
```nginx
# /opt/gateway/ 中配置以下规则

# 1. User-Agent 黑名单（拦截已知爬虫）
if ($http_user_agent ~* "(Scrapy|Curl|HttpClient|python-requests|Go-http|Java/)") {
    return 403;
}

# 2. 空 User-Agent 拒绝
if ($http_user_agent = "") {
    return 403;
}

# 3. 全局速率限制（突发容忍 + 漏桶）
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req zone=api_limit burst=60 nodelay;

# 4. 连接数限制（同一 IP 最多 50 并发连接）
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 50;
```

**应用层**：
- 关键接口（登录、注册、短信发送、支付）必须加图形验证码或滑块验证
- 同一 IP 对列表接口 1 分钟内翻页超过 100 页 → 自动触发临时封禁 10 分钟
- API 响应禁止返回数据总量（如"共 385,271 条"），只返回 `has_next: true/false`，防止爬虫估算数据规模
- 前端敏感操作（如复制内容、批量下载）加防护：`user-select: none`（CSS） + 右键菜单提示

**请求指纹检测**：
- 中间件记录 `{IP, User-Agent, Accept-Language, Referer}` 特征组合
- 短时间内同一指纹发出大量不同路径请求 → 标记为可疑，加入观察队列
- 可疑 IP 自动降级为极低速率限制（10 次/分钟）

### 6. 请求防篡改与接口签名

**前后端签名（关键接口使用）**：
- 涉及金额、积分、敏感操作的接口，前端请求必须携带签名 Header：`X-Signature`
- 签名算法：`HMAC-SHA256(timestamp + nonce + sorted_params, APP_SECRET)`
- 后端验签步骤：
  1. 检查 `X-Timestamp` 与服务器时间差 ≤ 5 分钟（防重放攻击）
  2. 检查 `X-Nonce` 在 Redis 中是否已存在（5 分钟内不可重复）
  3. 按相同规则重新计算签名并比对
- `APP_SECRET` 在前端通过环境变量注入（`VITE_APP_SECRET`），不提交到 Git

**幂等性保障**：
- 所有 POST 类写入接口必须支持 `X-Idempotency-Key` Header
- 后端将 key 存入 Redis（TTL=24h），重复请求直接返回首次结果
- 支付、下单等资金相关接口的幂等是强制的，非可选

### 7. 安全响应头（Nginx 统一配置）

```nginx
# /opt/gateway/ Nginx 全局配置
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://supabase.ideas.top:9443 wss://supabase.ideas.top:9443;" always;
```

- 禁止在任何响应中暴露服务器技术栈信息：Nginx 配置 `server_tokens off;`，Express 响应不带 `X-Powered-By`（`app.disable('x-powered-by')`）
- 错误页面（404/500）使用自定义页面，禁止默认的 Nginx/Express 错误页（泄露版本号）

### 8. CORS 跨域严格管控

```typescript
// Express CORS 配置（仅限生产环境允许的域名）
import cors from 'cors'

app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Signature', 'X-Timestamp', 'X-Nonce', 'X-Idempotency-Key'],
}))
```
- **绝对禁止** `origin: '*'` 上线到生产环境
- 开发环境可临时放开，但必须在 `.env` 中通过环境变量控制，不写死在代码里
- Nginx 层也要配置 CORS 保持一致，避免 Nginx 和 Express 响应头冲突

### 9. 速率限制（分层防护）

| 接口类型 | 限制规则 | 实现层 |
|---------|---------|--------|
| 登录/注册 | 同一 IP 5 分钟内 ≤ 10 次 | Nginx `limit_req` |
| 短信验证码 | 同一手机号 60 秒 ≤ 1 次；同一 IP 1 小时 ≤ 20 次 | 后端 Redis + Nginx |
| 支付类接口 | 同一用户 10 秒内 ≤ 1 次 | 后端 Redis 幂等锁 |
| 通用 API（未认证） | 100 次/分钟 | Nginx `limit_req` |
| 通用 API（已认证） | 600 次/分钟 | 后端中间件 |
| 文件上传 | 同一用户 1 分钟 ≤ 10 次 | 后端中间件 |

- 触发限流返回 `429 Too Many Requests` + `Retry-After` Header
- 连续触发 3 次限流的 IP，自动进入 10 分钟冷却黑名单

### 10. CSRF 防护
- Supabase Auth 使用 Bearer Token 方案，天然免疫 CSRF（Token 不随 Cookie 自动发送）
- **但如果使用了 `httpOnly` Cookie 传递 Token**，必须：
  - 启用 `SameSite=Strict` 或 `SameSite=Lax` Cookie 属性
  - 关键写入操作（支付、改密码）额外要求自定义 Header（`X-CSRF-Token`）
  - 后端校验 `Origin` / `Referer` 头与白名单域名匹配

### 11. 依赖与部署安全
- 禁止安装来源不明的 npm 包，只用星标 > 1000 的主流库
- Docker 镜像使用固定版本标签，禁止 `latest`
- 生产环境禁止开启 `NODE_ENV=development`、Swagger UI（仅 dev 环境开放 `swagger-ui-express`）
- Docker 容器以非 root 用户运行（`USER nonroot`），禁止 `--privileged`
- `.env` 文件权限设为 `600`，仅属主可读写
- 定期检查依赖漏洞：前后端均使用 `npm audit`

### 12. 安全事件响应
- 发现异常登录（同一账号短时间内多地登录）→ 强制下线所有会话 + 通知用户
- 发现疑似数据泄露 → 立即轮换受影响的密钥（JWT_SECRET、SERVICE_ROLE_KEY 等）
- 所有安全事件的日志必须包含：时间、IP、User-Agent、用户 ID、操作类型、结果
- 关键操作（修改密码、绑定手机、大额支付）必须记录审计日志到独立表 `audit_logs`

---

## 七、代码审查检查表

> AI 在完成每个任务后，自动执行此检查表。所有项通过后才算完成。

### 功能正确性
- [ ] 核心功能按需求正常工作
- [ ] 边界情况已处理（空值、空列表、超长输入、并发）
- [ ] 错误路径有合理的用户提示

### 代码质量
- [ ] 命名清晰、符合命名约定表
- [ ] 无重复代码（相同逻辑出现 2 次以上必须抽取）
- [ ] 无遗留的调试代码（console.log / print / TODO）
- [ ] 类型完整（TypeScript 前后端均无 `any`）

### 安全性
- [ ] 用户输入已校验（前端 Zod + 后端 Zod）
- [ ] 有鉴权守卫（需要登录的接口有 authMiddleware）
- [ ] RLS 策略已配置（新表刚创建就开启）
- [ ] 无敏感信息硬编码
- [ ] 敏感字段已加密存储或脱敏输出
- [ ] 涉及金额的接口有签名验证 + 幂等处理
- [ ] 新增 API 已配置速率限制
- [ ] CORS 白名单已配置（无 `*` 通配符）

### 性能
- [ ] 数据库查询有索引支持（WHERE / ORDER BY 的字段）
- [ ] 无 N+1 查询（列表接口一次性查完所需数据）
- [ ] 大列表有分页、无一次性全量加载

### 可维护性
- [ ] 关键决策有中文注释解释"为什么"
- [ ] 数据库变更有 migration 文件
- [ ] 三端类型同步（DB Schema → Zod Schema/TS 类型 → 前端类型）

---

## 八、完成状态协议

> AI 完成每个任务后，必须在交付时声明完成状态。

| 状态 | 含义 | 何时使用 |
|------|------|---------|
| ✅ **完成** | 全部步骤执行成功，有验证证据 | 代码写完、测试通过、check-list 全绿 |
| ⚠️ **完成但有顾虑** | 已完成，但有需要注意的问题 | 主路径可用但存在已知边界限制 |
| 🚫 **阻塞** | 无法继续，需要外部输入 | 缺少凭证、依赖服务不可达、需求不明确 |
| ❓ **需要上下文** | 缺少必要信息 | 不确定产品意图、不确定技术选型 |

### 升级机制
- 同一问题尝试 3 次仍失败 → 立即停下，报告状态为 **阻塞**
- 涉及安全敏感变更 → 不擅自行动，报告状态为 **需要上下文**
- 影响范围超出当前任务边界 → 标记为 **完成但有顾虑**，列出溢出影响

---

## 九、"先查后建"原则

> 写任何新代码前，先确认有没有现成方案。

### 检查顺序
1. **Supabase 有没有原生支持？** — Auth、Storage、Realtime、Edge Functions 已覆盖就直接用
2. **框架有没有内置？** — React Router、Express 中间件、Zod 验证
3. **现有代码库有没有类似实现？** — 搜索项目内已有的 utils、hooks、services
4. **主流第三方库？** — 只选星标 > 1000、维护活跃（最近 3 个月有更新）的库

### 禁止重复造轮子的场景
- 日期处理 → 用 `dayjs`（前端）/ `datetime`（后端），不手写解析
- 表单校验 → 用 `zod`（前后端共用），不手写 if-else
- HTTP 请求 → 用封装好的 `apiClient`，不裸写 `fetch`
- 加密/哈希 → 用 `bcrypt`/`jsonwebtoken`/`crypto`，不自己实现算法

---

## 十、支付与资金安全规范

> 涉及微信支付、余额操作、虚拟货币等任何资金流动的功能，必须严格遵守以下规则。资金安全零容忍。

### 1. 微信支付接入安全

**密钥管理**：
- 商户 API 密钥（`WECHAT_PAY_API_KEY`）、证书文件（`apiclient_cert.pem`、`apiclient_key.pem`）、APIv3 密钥仅存放于后端 Docker 容器，通过环境变量 / Secret 挂载方式注入
- **绝对禁止**将支付密钥提交到 Git、写入前端代码、出现在日志中
- 证书文件权限设为 `400`（仅属主可读），Docker 中以 volume 挂载

**签名验证**：
- 所有发送给微信的请求必须按微信文档要求签名（APIv3 使用 RSA-SHA256）
- 微信支付回调通知必须**验证签名**后再处理业务逻辑；签名不匹配则直接返回失败并记录告警日志
- 回调 URL 必须使用 HTTPS，在 Nginx 中配置白名单 IP（微信支付服务器 IP 段）

**金额核实**：
- 微信回调中的 `total_fee`（实付金额）必须与数据库中订单的 `expected_amount` 逐笔核对
- 金额不一致 → 标记订单异常 + 记录告警日志 + 禁止发货/充值，等待人工审核
- 金额运算使用整数分（cent）计算，禁止浮点数运算（`0.1 + 0.2 ≠ 0.3`）

### 2. 订单与支付流程安全

**订单号不可猜测**：
- 订单号使用 `时间戳 + 随机字符串`（如 `20260407143022_aB3xK9mZ`），禁止自增 ID
- 前端不传金额，只传商品/服务 ID；后端根据 ID 查库确定金额，防止前端篡改

**支付状态机（严格单向流转）**：
```
待支付(pending) → 支付中(paying) → 已支付(paid) → 已完成(completed)
                                  ↘ 支付失败(failed)
已支付(paid) → 退款中(refunding) → 已退款(refunded)
```
- 状态流转必须在 Service 层用 `SELECT ... FOR UPDATE` 行锁 + 状态前置条件校验
- 禁止跳状态（如从 pending 直接到 completed）；每次状态变更都记录到 `order_status_logs` 表

**幂等处理**：
- 发起支付请求必须携带 `out_trade_no`，微信侧自动去重
- 后端收到回调时，先查订单是否已成功 → 已成功则直接返回 `SUCCESS`，不重复处理
- 使用 Redis 分布式锁防止同一订单并发回调导致重复入账

### 3. 余额与虚拟资产操作

**数据库级保障**：
- 余额字段类型使用 `BIGINT`（存储分），禁止 `DECIMAL` / `FLOAT`
- 余额变动必须通过 PostgreSQL 存储过程（`FUNCTION`）执行，不允许应用层直接 `UPDATE balance = balance - ?`
- 存储过程内必须：检查余额是否充足 → 扣款 → 写流水 → 返回结果（一个事务内完成）
- 余额不允许为负数：`ALTER TABLE wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);`

**流水表（必须有）**：
```sql
CREATE TABLE transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type VARCHAR(20) NOT NULL,        -- 'charge'|'withdraw'|'purchase'|'refund'
    amount BIGINT NOT NULL,           -- 正数=入账，负数=出账（分）
    balance_before BIGINT NOT NULL,   -- 操作前余额
    balance_after BIGINT NOT NULL,    -- 操作后余额
    ref_order_id UUID,                -- 关联订单号
    remark TEXT,                      -- 备注
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
- 流水表只允许 INSERT，**绝对禁止** UPDATE 和 DELETE
- 任何时刻 `balance_after` 必须等于 `balance_before + amount`，否则报审计告警
- 定期对账：`SUM(amount) WHERE user_id = ?` 必须等于用户钱包的当前余额

### 4. 退款安全
- 退款接口必须有管理员权限或额外验证（如输入支付密码）
- 退款金额 ≤ 原订单金额，超出的直接拒绝
- 同一订单的退款总额累计不超过原支付金额
- 退款结果以微信回调为准，后端先标记"退款中"，收到成功回调后才更新为"已退款"

### 5. 对账与审计
- 每日凌晨自动拉取微信支付账单（`downloadbill` 接口），与本地订单表逐笔核对
- 差异记录写入 `reconciliation_logs` 表，标记为"待人工核查"
- 审计日志（`audit_logs`）记录所有资金操作：操作人、操作类型、金额、IP、时间戳
- 管理后台必须有"交易流水查询"页面，支持按用户/时间/类型筛选

---

## 十一、数据库设计铁律

> 此处定义建表时必须遵守的数据库设计规则，与 §四 Supabase 交互规范互补。

### 1. 表结构基线
每张业务表必须包含以下基线字段：

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 主键
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),          -- 创建时间
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()           -- 更新时间
```
- 主键统一使用 `UUID`，禁止自增 `SERIAL`（防爬虫枚举 + 多表合并冲突）
- `updated_at` 必须配合触发器自动更新：
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;
  -- 每张表创建后立即挂载
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON {table}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```

### 2. 软删除 vs 硬删除
- 涉及用户数据、订单、支付记录的表：必须软删除（`deleted_at TIMESTAMPTZ DEFAULT NULL`）
- 配置类、日志类的表：可以硬删除
- 软删除的表，所有查询默认加 `WHERE deleted_at IS NULL`；RLS 策略也必须包含此条件
- 定期归档：已软删除超过 90 天的数据可迁移到归档表

### 3. 字段类型铁律

| 场景 | 正确类型 | 禁止用 |
|------|---------|--------|
| 主键/外键 | `UUID` | `SERIAL`, `INT` |
| 金额（分） | `BIGINT` | `DECIMAL`, `FLOAT`, `NUMERIC` |
| 时间 | `TIMESTAMPTZ` | `TIMESTAMP`（无时区）, `VARCHAR` |
| 布尔 | `BOOLEAN` | `INT(0/1)`, `VARCHAR('Y'/'N')` |
| 枚举 | PostgreSQL `ENUM` 或 `VARCHAR` + CHECK | `INT` 映射 |
| JSON 数据 | `JSONB` | `JSON`, `TEXT` |
| 手机号/身份证 | 加密后 `BYTEA` 或 `TEXT`，查询用哈希索引 | 明文 `VARCHAR` |

### 4. 索引策略
- 所有外键字段必须有索引
- `WHERE` 常用过滤字段（`status`, `user_id`, `type`）必须有索引
- `ORDER BY` 常用排序字段（`created_at`）必须有索引
- 组合查询（`WHERE user_id = ? AND status = ?`）用复合索引
- 全文搜索用 PostgreSQL `tsvector` + GIN 索引，禁止 `LIKE '%keyword%'`
- 禁止对高基数大表无条件 `SELECT *`

### 5. 外键与关联
- 所有关联表之间必须有显式外键约束（`REFERENCES ... ON DELETE CASCADE/SET NULL/RESTRICT`）
- 多对多关系使用中间表（关联表），中间表的两个外键组成联合主键
- 跨 schema 引用 `auth.users(id)` 时必须 `ON DELETE CASCADE`
- 禁止无外键的"逻辑关联"（仅靠字段名相似来关联）
