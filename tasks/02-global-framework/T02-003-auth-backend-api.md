# T02-003: 认证系统 — 后端 API

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

基于 Supabase Auth 实现知语 Zhiyu 的完整后端认证体系。包含：JWT 本地无状态验签中间件（`authMiddleware`）、Google/Apple OAuth 回调处理、邮箱注册/登录/重置密码 API、推荐码验证与绑定、登出与 Token 刷新。所有 API 遵循 `grules/04-api-design.md` 统一响应格式。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/02-auth-system.md` — 登录/注册/忘记密码完整流程
- 架构白皮书: `grules/01-rules.md` §三 — JWT 本地无状态验签、全链路异步
- API 规约: `grules/04-api-design.md` — 统一响应格式、错误码、鉴权等级
- 编码规范: `grules/05-coding-standards.md` §三 — 后端三层分离（Router→Service→Repository）
- 编码规范: `grules/05-coding-standards.md` §六.2 — Token 存储安全、密码策略
- 环境配置: `grules/env.md` — `JWT_SECRET`、`SUPABASE_SERVICE_ROLE_KEY`
- 关联任务: T02-002（profiles 表已创建）→ 本任务 → T02-004（前端登录）、T02-009（推送通知）

## 技术方案

### API 端点清单

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `POST` | `/api/v1/auth/register` | 无 | 邮箱注册 |
| `POST` | `/api/v1/auth/login` | 无 | 邮箱登录 |
| `POST` | `/api/v1/auth/oauth/callback` | 无 | Google/Apple OAuth 回调 |
| `POST` | `/api/v1/auth/forgot-password` | 无 | 发送重置密码验证码 |
| `POST` | `/api/v1/auth/verify-code` | 无 | 验证重置密码验证码 |
| `POST` | `/api/v1/auth/reset-password` | 无 | 设置新密码 |
| `POST` | `/api/v1/auth/refresh-token` | 需 Refresh Token | 刷新 Access Token |
| `POST` | `/api/v1/auth/logout` | 需登录 | 登出（清除服务端会话） |
| `GET`  | `/api/v1/auth/me` | 需登录 | 获取当前用户 Profile |
| `POST` | `/api/v1/auth/validate-referral` | 无 | 验证推荐码有效性 |

### JWT 验签中间件

```typescript
// backend/src/core/auth.ts
// 使用 jsonwebtoken 库在本地毫秒级验签
// 从 Authorization: Bearer <token> 中提取 JWT
// 用 JWT_SECRET 本地验签，不请求 Supabase
// 验签成功 → req.user = { sub, email, role, ... }
// 验签失败 → 返回 40101/40102/40103 错误码
```

### 三层架构

```
backend/src/
├── core/
│   └── auth.ts                    # authMiddleware + AuthRequest 类型
├── models/
│   └── auth.ts                    # RegisterSchema, LoginSchema, ResetPasswordSchema 等
├── routers/v1/
│   └── auth.ts                    # 路由层：参数接收 + Zod 校验 + 调 Service + 统一响应
├── services/
│   └── auth-service.ts            # 业务层：调 Supabase Auth API + 推荐码逻辑
└── repositories/
    └── user-repo.ts               # 数据层：profiles 表 CRUD
```

### 关键业务逻辑

**注册流程**：
1. Zod 校验请求体（email, password, nickname, referral_code?）
2. 调 `supabase.auth.signUp()` 创建 auth.users 记录
3. 触发器自动创建 profiles 记录
4. 若有推荐码 → 验证推荐码 → 更新 profiles.referred_by
5. 返回 access_token + refresh_token + user_profile

**OAuth 回调**：
1. 前端通过 Supabase JS SDK 完成 OAuth 授权，获取 session
2. 后端 `/auth/oauth/callback` 接收 token 做后处理（首次登录创建 profile 等）

**密码安全**：
- 密码 ≥ 8 位，必须包含字母 + 数字
- Supabase Auth 内置 bcrypt 哈希
- 连续 5 次登录失败 → 锁定 15 分钟

**Token 生命周期**：
- access_token: 1 小时
- refresh_token: 7 天
- 修改密码后旧 Token 失效

## 范围（做什么）

- 实现 `authMiddleware` JWT 本地验签中间件
- 实现 `AuthRequest` 类型扩展（req.user）
- 实现全部 10 个 auth API 端点
- 实现 Zod Schema（RegisterSchema、LoginSchema、ForgotPasswordSchema、ResetPasswordSchema）
- 实现 auth-service（调用 Supabase Auth + 推荐码逻辑）
- 实现 user-repo（profiles 表 CRUD）
- 统一错误处理（邮箱已注册 40902、密码错误 40101、账号封禁 40302 等）
- 连续登录失败锁定（5 次 / 15 分钟）
- 验证码发送频率限制（同一邮箱 60 秒内不可重复）

## 边界（不做什么）

- 不实现前端登录 UI（T02-004）
- 不实现 OAuth Provider 在 Supabase Dashboard 的配置（运维操作）
- 不实现知语币奖励发放逻辑（T10 支付模块）
- 不实现管理后台的用户封禁 API（T13）

## 涉及文件

- 新建: `backend/src/core/auth.ts`（authMiddleware + AuthRequest）
- 新建: `backend/src/models/auth.ts`（Zod Schemas）
- 新建: `backend/src/routers/v1/auth.ts`（路由端点）
- 新建: `backend/src/services/auth-service.ts`（业务逻辑）
- 新建: `backend/src/repositories/user-repo.ts`（数据访问）
- 修改: `backend/src/routers/v1/index.ts`（注册 auth 路由）
- 修改: `backend/src/main.ts`（挂载全局错误处理中间件）
- 修改: `backend/src/core/config.ts`（添加 JWT_SECRET 等配置读取）
- 修改: `backend/src/core/exceptions.ts`（确认 BizError 可用）
- 修改: `backend/src/core/response.ts`（确认 ok/error 封装可用）

## 依赖

- 前置: T02-002（profiles 表 + Zod Schema 已创建）
- 后续: T02-004（前端登录调用这些 API）、T02-005（登录墙路由守卫依赖 authMiddleware）、T02-009（推送通知依赖登录态）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 后端已启动  
   **WHEN** `POST /api/v1/auth/register` 发送有效的 { email, password, nickname }  
   **THEN** 返回 `{ code: 0, data: { access_token, refresh_token, user } }`，profiles 表新增记录

2. **GIVEN** 用户已注册  
   **WHEN** `POST /api/v1/auth/login` 发送正确邮箱和密码  
   **THEN** 返回 `{ code: 0, data: { access_token, refresh_token, user } }`

3. **GIVEN** 用户已注册  
   **WHEN** `POST /api/v1/auth/login` 发送错误密码  
   **THEN** 返回 `{ code: 40101, message: "密码错误，请重试" }`

4. **GIVEN** 用户连续 5 次输入错误密码  
   **WHEN** 第 6 次尝试登录  
   **THEN** 返回 `{ code: 42901, message: "登录尝试次数过多，请 15 分钟后重试" }`

5. **GIVEN** 有效 access_token  
   **WHEN** `GET /api/v1/auth/me` 附带 Authorization: Bearer {token}  
   **THEN** 返回当前用户的 profile 信息

6. **GIVEN** 过期或无效 token  
   **WHEN** `GET /api/v1/auth/me` 附带该 token  
   **THEN** 返回 `{ code: 40101 }` 或 `{ code: 40102 }`

7. **GIVEN** 注册时填写了有效推荐码  
   **WHEN** 注册成功后查询新用户的 profiles 记录  
   **THEN** `referred_by` 字段为推荐人的 UUID

8. **GIVEN** 用户请求重置密码  
   **WHEN** `POST /api/v1/auth/forgot-password` 发送已注册的邮箱  
   **THEN** 返回成功，验证码发送（Supabase 内置邮件或自定义）

9. **GIVEN** 用户输入正确验证码并设置新密码  
   **WHEN** `POST /api/v1/auth/reset-password`  
   **THEN** 密码更新成功，旧 Token 失效

10. **GIVEN** 同一邮箱已注册  
    **WHEN** `POST /api/v1/auth/register` 再次用该邮箱注册  
    **THEN** 返回 `{ code: 40902, message: "该邮箱已注册" }`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 通过 `curl` 或 Browser MCP 逐个测试 10 个 API 端点
5. 验证所有 GIVEN-WHEN-THEN 验收标准
6. 验证统一响应格式（code/message/data 三字段）

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 10 个 API 端点全部可访问
- [ ] 统一响应格式正确（code/message/data）
- [ ] JWT 验签中间件正常工作
- [ ] 推荐码验证与绑定正常
- [ ] 错误码与 `grules/04-api-design.md` 一致
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-003-auth-backend-api.md`

## 自检重点

- [ ] 安全：JWT 使用本地验签（`JWT_SECRET`），不请求 Supabase
- [ ] 安全：密码校验 ≥ 8 位 + 字母数字
- [ ] 安全：SERVICE_ROLE_KEY 仅在后端使用
- [ ] 安全：Token 存储建议 httpOnly cookie
- [ ] 安全：登录失败锁定 + 验证码频率限制
- [ ] 性能：无 N+1 查询，连接池复用
- [ ] 类型同步：Zod Schema ↔ 数据库字段一致
- [ ] 三层分离：Router/Service/Repository 无跨层调用
