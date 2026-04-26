# ZY-03-02 · 注册（Email + 验证码）

> Epic：E03 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 新访客
**I want** 用邮箱注册并收到验证码完成验证
**So that** 我可以登录、保存学习进度、参与社区。

## 上下文
- supabase-auth GoTrue 内置 OTP / magic link；本期采用 6 位邮件验证码（OTP）。
- 缺少邮件供应商时 EmailAdapter 回退到 console；注册流程不阻塞。
- 注册成功 → trigger 自动建 profile（接 ZY-03-01）→ 跳新手引导（接 ZY-05）。
- 不允许在 FE 直接调 supabase Auth REST，必须通过 BE 包一层（统一审计 + i18n 错误）。

## Acceptance Criteria
- [ ] `POST /api/v1/auth/sign-up` { email, locale, captcha? } → 触发 OTP，返回 `{ challenge_id }`
- [ ] `POST /api/v1/auth/verify-otp` { challenge_id, code } → 返回 access/refresh token + 设 httpOnly cookie
- [ ] 节流：同 email 60s 内只能请求一次 OTP；同 IP 5 min 不超过 5 次（接 ZY-18-02 ratelimit）
- [ ] 错误国际化：i18n key `auth.otp_expired` / `auth.too_many_attempts` / `auth.email_invalid`
- [ ] 成功后自动 join `audit_logs`（接 ZY-18-04）
- [ ] FE 注册页（apps/web `/signup`）：邮箱输入 → 验证码 6 位输入框 → 完成

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run auth.signup
```
- MCP Puppeteer：浏览器走完整流程（console 看 fake email 验证码）

## DoD
- [ ] 端到端通；fake EmailAdapter 命中
- [ ] 节流生效
- [ ] 不引入 Auth0 / Clerk

## 不做
- OAuth（属 ZY-03-03）
- 密码登录（属 ZY-03-03）

## 依赖
- 上游：ZY-03-01 / ZY-04 / ZY-18-02
- 下游：ZY-03-04 / ZY-05
