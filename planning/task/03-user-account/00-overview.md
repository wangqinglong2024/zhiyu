# 03 · 用户账号任务清单

## 来源覆盖

- PRD：`planning/prds/06-user-account/01-functional-requirements.md`、`02-data-model-api.md`。
- 关联：`planning/prds/08-economy/**` 注册赠币、`planning/prds/15-i18n/**` 语言偏好、`planning/rules.md` Supabase/Auth 与 fake adapter 裁决。

## 冲突裁决

- 验证码、邮件、OAuth 真实外部依赖都经 Supabase/Auth 或 Adapter/fake，本期缺 key 不阻塞。
- 来源句：`planning/rules.md` 写明“缺失第三方 API key 时使用 mock/fake 适配器，禁止因缺 key 阻塞容器启动或测试。”

## 任务清单

- [ ] UA-01 建立 `users`、`user_preferences`、`user_devices`、`user_sessions`、`user_email_otp`、`user_data_exports` 并启用 RLS。来源句：`planning/prds/06-user-account/02-data-model-api.md` DDL 定义这些表并写明 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`。
- [ ] UA-02 实现邮箱注册：邮箱、密码、母语、隐私同意；触发邮箱验证；验证后发 100 知语币。来源句：`UA-FR-001` 写明“字段：邮箱、密码、母语（默认 UI 语言）、隐私同意”与“注册立即送 100 知语币”。
- [ ] UA-03 实现 CaptchaAdapter always-pass/fake 替代真实验证码。来源句：`UA-FR-001` 写明“Turnstile 验证”，`planning/spec/02-tech-stack.md` 写明“CaptchaAdapter | always-pass”。
- [ ] UA-04 实现 Google OAuth 接口占位，dev 无 key 时返回 mock provider 失败提示或本地 fake token。来源句：`UA-FR-002` 写明“Supabase Auth Google provider”。
- [ ] UA-05 首次 OAuth 登录后弹引导补母语和隐私同意，并同样赠币。来源句：`UA-FR-002` 写明“首次登录后弹引导填母语 + 隐私同意；同样送 100 币”。
- [ ] UA-06 实现邮箱验证 OTP：6 位数字、15min、60s 重发、5 次/小时、未验证功能受限。来源句：`UA-FR-003`。
- [ ] UA-07 实现登录：邮箱密码或 OAuth，失败 5 次锁 15min，记住设备 30 天。来源句：`UA-FR-004`。
- [ ] UA-08 实现忘记密码与重置：10min 一次性 token，重置后让所有 session 登出。来源句：`UA-FR-005`。
- [ ] UA-09 实现个人资料：昵称≤30、头像上传/默认、母语 en/vi/th/id、时区、学习目标、HSK 自评/估算。来源句：`UA-FR-006`。
- [ ] UA-10 实现偏好：UI 语言、拼音模式、翻译显示、字号、TTS 语速/音色、邮件订阅。来源句：`UA-FR-007` 逐项列出这些偏好。
- [ ] UA-11 实现会话管理 `/me/sessions`，列出设备名/IP/最近活跃，可单个或全部下线。来源句：`UA-FR-008`。
- [ ] UA-12 实现账户安全：改密码、改邮箱；2FA 标记为 v1.5 占位。来源句：`UA-FR-009` 写明“启用 2FA（v1.5）”。
- [ ] UA-13 实现数据导出：JSON/CSV，包含 profile/progress/wrong_set/favorites/notes/orders/coin_ledger，邮件链接 24h，每月 1 次。来源句：`UA-FR-010`。
- [ ] UA-14 实现销户：二次确认+密码、90 天可恢复软删、90 天后硬删、订阅不退款、知语币清零。来源句：`UA-FR-011`。
- [ ] UA-15 实现欢迎流程：母语、UI 语言、学习目标、当前水平、推荐轨道、拼音入门提示，任意步骤可跳过。来源句：`UA-FR-012`。
- [ ] UA-16 实现匿名访问计数：DC 前 3 篇、NV 首章、设备指纹累计、注册转化埋点。来源句：`UA-FR-013`。
- [ ] UA-17 实现 API：register/login/oauth/refresh/logout/otp/password/me/preferences/sessions/avatar/data-export/delete-account/restore-account。来源句：`planning/prds/06-user-account/02-data-model-api.md` “API”章节列出这些端点。
- [ ] UA-18 实现限流：register/login 10/min/IP，send-otp 1/60s/email 与 5/h/email，数据导出 1/月/user。来源句：同文件“限流”章节。
- [ ] UA-19 实现安全基线：bcrypt rounds=12、access 15min、refresh 7d、HttpOnly/Secure/SameSite。来源句：`planning/prds/06-user-account/01-functional-requirements.md` “性能 / 安全”章节。
- [ ] UA-20 按铁律提供 seed 用户：admin、normal、vip、referrer、blocked，并覆盖用户状态/权限/钱包基础数据。来源句：`planning/rules.md` 写明“UA | 种子用户 ≥5：admin、normal、vip、referrer、blocked”。

## 验收与测试

- [ ] UA-T01 Docker 内完成注册 → OTP → 登录 → 偏好修改 → 会话下线 → 导出申请 → 销户软删主流程。来源句：`UA-FR-001~013`。
- [ ] UA-T02 未验证用户不能付费和不能 1v1 客服。来源句：`UA-FR-003` 写明“未验证：可登录但功能受限（不能付费 / 不能 1v1 客服）”。
- [ ] UA-T03 `pnpm seed:user-account` 干净库幂等执行。来源句：`planning/rules.md` 写明“所有 seed 必须幂等：按 slug/code/external_id upsert”。
