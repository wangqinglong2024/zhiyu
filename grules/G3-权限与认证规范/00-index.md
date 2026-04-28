# G3 · 权限与认证规范（索引）

> **谁来写**：AI 根据 `prompt/G3-用户-角色与权限描述.md` 与 PM 决策生成。
> **谁来审**：产品经理。
> **何时引用**：所有涉及用户身份、登录、Token、菜单可见、按钮可用、API 鉴权的开发**必须**遵守本目录文档。
>
> 上游：[G1-架构与技术规范](../G1-架构与技术规范/00-index.md)（确定技术栈与 Supabase Auth 选型）
> 下游：每个功能模块的 F2-AI 接口规范引用本规范定义的"鉴权中间件 / 角色枚举 / 错误码"。

---

## 文件结构

| 文件 | 内容 |
|------|------|
| [00-index.md](./00-index.md) | 本索引、核心原则、跨文件约定 |
| [01-角色定义.md](./01-角色定义.md) | 角色枚举、显示名、权限级别、与 PRD 模块映射 |
| [02-认证流程.md](./02-认证流程.md) | 登录 / Token / 登出 / 会话 / 密码安全 / 忘记密码 |
| [03-权限校验机制.md](./03-权限校验机制.md) | 前端路由守卫 / 菜单过滤 / 按钮控制；后端 Hono 中间件 / 错误格式 |
| [04-数据结构.md](./04-数据结构.md) | `auth.users` 字段约定、`profiles` / `user_sessions` / `admin_accounts` 表结构 |
| [05-注册流程.md](./05-注册流程.md) | 邮箱注册 / Google 自动注册 / 超级管理员手动 seed |
| [99-待确认问题清单.md](./99-待确认问题清单.md) | 待 PM 决策项 |

---

## 一、核心原则（不可违反）

1. **认证后端 = 自托管 Supabase Auth（GoTrue）**：与 G1 决策一致；Hono API 不自建 JWT 签发器，全部委托 Supabase Auth。
2. **角色仅两种**：`super_admin`（默认仅 1 个，但**技术上允许多个**，管理端不提供创建入口，必要时手动在 DB 添加）+ `user`（应用端用户）。**不引入多角色 / RBAC 矩阵**。
3. **登录方式**：邮箱 + 密码、Google OAuth；**应用端**两者均可，**管理端**仅邮箱密码；本期**不上 TOTP / 2FA**（列入后续安全升级升级）。
4. **Token 协议**：Supabase 颐发的 JWT（HS256，签名密钥来自 Supabase 实例的 `JWT_SECRET`），Access Token 1h，Refresh Token 30d 滚动。
5. **多设备策略**：同一账号最多 **3 个活跃会话**（硬编码）；第 4 次登录踢掉最早的会话（自建 `user_sessions` 表 + Supabase Admin API revoke）。**不提供「我的设备」页**，有问题重新登录即可。
6. **不自动登出**：除非用户主动登出 / 被踢 / Refresh Token 过期 30d；浏览器端 Refresh Token 通过 supabase-js 自动续期。
7. **超级管理员账号**：账号与初始密码放在项目 `.env`（`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`），首次部署 seed；**超管不能删除自己**。忘密 / 丢账时运维直接在 DB 手工插入新超管，不设「机器超管」逆生通道。
8. **被禁用账号**：登录时返回明确错误码 `AUTH_ACCOUNT_DISABLED`；禁用动作同时 **撚销该用户全部 refresh_token**（全设备踢出）；支持重新启用（只需反转 `is_disabled`，用户重新登录即恢复）。
9. **凭证存储 = httpOnly Cookie（PM 决策：安全优先）**：supabase-js 使用自定义 `cookieStorage` adapter，access_token 与 refresh_token 均写入 `HttpOnly; Secure; SameSite=Lax` Cookie（同域 / 跨子域配置详见 [02-认证流程.md §二](./02-认证流程.md)）；前端代码不能读到 token，避免 XSS 泄露。
10. **角色信息来源**：从 JWT `app_metadata.role` 解析，**不再查库**；写入时机仅在管理脚本与注册预检 hook 中。
11. **防爆破**：本期**不依赖第三方验证码**（不接 Cloudflare Turnstile / hCaptcha）；仅靠后端节流（`email + ip` 5次/15分钟锁定、邮箱重设 60s/1h 节流、注册 IP 1h ≤ 5 次）。
12. **i18n 提示全量 5 语言**：所有 `AUTH_*` 错误提示、邮件模板、页面文案本期完成 zh / en / vi / th / id（与 G1 §七一致）。

---

## 二、跨文件约定

- 角色枚举唯一定义在 [01-角色定义.md](./01-角色定义.md) §1；其他文档引用其字符串字面量。
- 错误码统一前缀 `AUTH_*`，详细列表在 [03-权限校验机制.md](./03-权限校验机制.md) §四。
- 所有 SQL / 表结构以 [04-数据结构.md](./04-数据结构.md) 为权威；G1 数据库规范 [03-数据库规范.md](../G1-架构与技术规范/03-数据库规范.md) 引用之。
- 所有 Hono 中间件签名与错误响应格式与 G1 [04-API接口规范.md](../G1-架构与技术规范/04-API接口规范.md) 保持一致。
