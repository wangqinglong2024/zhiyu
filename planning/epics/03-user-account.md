# Epic E03 · 用户账户体系（User Account）

> 阶段：M1 · 优先级：P0 · 估算：3 周
>
> 顶层约束：[planning/00-rules.md](../00-rules.md)。所有账户能力**优先复用 Supabase Auth**（GoTrue），仅在 Supabase 不能覆盖时再写自定义代码。

## 摘要
注册 / 登录 / OAuth / 个人资料 / 设置 / 设备管理 / 账号删除；邮箱与可选 OAuth 走 Supabase Auth；手机号注册留空（未来评估）。

## 范围
- 邮箱 + 密码注册登录（Supabase Auth）
- Google / Apple OAuth（Supabase Auth provider）
- 找回密码（Supabase Auth flow）
- 个人资料 + 偏好设置
- 设备 / 会话管理（基于 supabase auth sessions）
- 账号删除（30 天软删）

## 非范围
- 手机号注册（未来）
- TikTok / Line OAuth（未来）
- Captcha 真实接入（用 `CaptchaAdapter` fake；缺 key 不阻塞）
- 邮件真实发送（用 `EmailAdapter` fake；console 输出验证链接，便于本地通过 Supabase studio 取得 token 完成验证）

## Stories（按需 6）

### ZY-03-01 · users / profiles / preferences 表
**AC**
- [ ] schema `zhiyu`：`profiles`（外键 supabase auth.users.id）、`user_preferences`、`user_devices`
- [ ] 基础 RLS：本人可读写自己；service_role 全权
- [ ] Drizzle migration + 种子（dev 1 个测试用户由 supabase studio 创建后自动 trigger 写 profile）
**测试**：`pnpm db:check` 显示 3 张表
**估**：M

### ZY-03-02 · 注册 / 邮箱验证（走 Supabase Auth）
**AC**
- [ ] FE：调用 `supabase.auth.signUp`，邮箱验证链接由 Supabase 邮件模板触发；本地通过 supabase Studio 拿到 token
- [ ] BE：监听 supabase webhook（auth.user.created）→ 自动写 `profiles`
- [ ] `EmailAdapter` 仅用于自定义业务通知，不替代 Supabase Auth 内置邮件
**估**：M

### ZY-03-03 · 登录 / OAuth / 找回密码
**AC**
- [ ] 邮箱+密码登录走 Supabase Auth
- [ ] Google / Apple provider 在 supabase studio 配置；缺 OAuth key 时仅日志 WARN，登录界面隐藏对应按钮
- [ ] 找回密码走 Supabase Auth `resetPasswordForEmail`
- [ ] BE 统一通过 `supabase-js`（service role）做权限校验中间件，不再自管 JWT 颁发
**估**：M

### ZY-03-04 · 个人资料 + 头像
**AC**
- [ ] GET / PATCH `/api/v1/me` 操作 `profiles`
- [ ] 头像上传走 supabase-storage 的 `images/avatars/<uid>` 桶；FE 直接 signed url 上传
- [ ] 字段：昵称、国家、UI 语言、学习偏好
**估**：M

### ZY-03-05 · 设置中心 + 设备/会话管理
**AC**
- [ ] 设置：主题、通知偏好、学习提醒时间、HSK 自评入口
- [ ] `/api/v1/me/sessions` 列出 supabase auth sessions（admin api）
- [ ] DELETE 单个 / 全部 session（远程登出）
**估**：M

### ZY-03-06 · 账号删除（GDPR）
**AC**
- [ ] 验证密码 + 邮件二次确认（确认链接 console 输出）
- [ ] 软删 30 天（写 `profiles.deleted_at`），cron 到期硬删 supabase auth user + 关联表
- [ ] `/api/v1/me/export` 返回 JSON 包（profile + 学习记录 + 订单）
- [ ] 30 天内可取消删除
**测试**：MCP Puppeteer：账号删除流程完整截图
**估**：L

## DoD
- [ ] 注册→验证→登录→个人资料→删除 全链路在容器内通
- [ ] 缺 Google/Apple OAuth key 时 FE 自动隐藏按钮、不报错
- [ ] 不引用 Resend / Sendgrid / Twilio 等 SaaS（统一通过 Adapter）
- [ ] supabase Studio 能看到对应 user 与 profile
- [ ] **种子数据（§11.1 UA）**：预置 ≥ 5 个种子用户（admin / cs / 3 个普通）从 `system/packages/db/seed/users/users.json` 幂等灬入；RLS 验证仅本人可读
