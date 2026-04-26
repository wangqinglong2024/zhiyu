# ZY-03-03 · 登录（密码 / OAuth / 重置密码）

> Epic：E03 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 已注册用户
**I want** 用邮箱+密码或 Google / Apple OAuth 登录，并在忘记密码时重置
**So that** 我能稳定登录并恢复账号。

## 上下文
- supabase-auth 内置 password & OAuth；OAuth 在自托管下需配置 redirect URI = `http://115.159.109.23:3100/auth/callback`。
- OAuth 客户端 id/secret 缺失时 → BE 自动隐藏对应按钮（不报错）。
- 密码规则：≥10 字符 + 大写 + 数字 + 特殊（接 ZY-18-01）。
- 登录失败 5 次 → 锁定 15 分钟（写 `zhiyu.login_attempts` 表）。

## Acceptance Criteria
- [ ] `POST /api/v1/auth/sign-in` { email, password } → token + cookie
- [ ] `GET /api/v1/auth/oauth/:provider` → 重定向到 supabase-auth OAuth URL
- [ ] `GET /api/v1/auth/callback` → 处理 OAuth 回调，建/绑 profile
- [ ] `POST /api/v1/auth/reset-password` { email } → 发送 OTP；`POST /api/v1/auth/reset-password/confirm` { challenge_id, code, new_password }
- [ ] 锁定逻辑：写 login_attempts，5 次 fail 锁 15 min；管理员可 override（接 ZY-17）
- [ ] FE：`/signin`、`/auth/callback`、`/reset-password`

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run auth.signin auth.reset
```
- MCP Puppeteer：连续 5 次错误密码 → 6 次拒登录

## DoD
- [ ] 锁定生效
- [ ] OAuth 缺 key 时按钮隐藏
- [ ] 不存储明文密码

## 不做
- 双因子（v1.5）
- 单点登出全设备（属 ZY-03-05）

## 依赖
- 上游：ZY-03-01 / ZY-18
- 下游：所有需要登录态的功能
