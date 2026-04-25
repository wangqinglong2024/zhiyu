# Epic E03 · 用户账户体系（User Account）

> 阶段：M1 · 优先级：P0 · 估算：4 周

## 摘要
注册 / 登录 / OAuth / 个人资料 / 设置 / 设备管理 / 邮箱手机验证。

## 范围
- 邮箱 + 密码注册登录
- Google / Apple OAuth（v1）
- 邮箱验证 + 找回密码
- 个人资料 / 偏好设置
- 设备 / 会话管理
- 账号删除

## 非范围
- 手机注册（v1.5）
- TikTok OAuth（v1.5）
- 实名认证

## Stories

### ZY-03-01 · users / sessions 表 + 迁移
**AC**
- [ ] 表 + 索引创建
- [ ] RLS 策略
- [ ] 种子数据（dev）
**Tech**：spec/05 § 4.1-4.2
**估**: M

### ZY-03-02 · 注册 API + 邮箱验证
**AC**
- [ ] POST /v1/auth/register
- [ ] bcrypt cost 12
- [ ] 验证邮件（Resend）
- [ ] 24h 内必须验证
- [ ] Captcha 验证（Turnstile）
**Tech**：spec/04 § 3, spec/09 § 2
**估**: L

### ZY-03-03 · 登录 API + JWT 颁发
**AC**
- [ ] POST /v1/auth/login
- [ ] 失败 5 次锁 15min
- [ ] access 15min + refresh 30d
- [ ] refresh 存 Redis
- [ ] 异常登录通知（邮件）
**估**: M

### ZY-03-04 · OAuth Google + Apple
**AC**
- [ ] /v1/auth/oauth/google /apple
- [ ] 回调 upsert users + oauth_accounts
- [ ] 自动绑定同邮箱账号
**Tech**：spec/07 § 2
**估**: L

### ZY-03-05 · 找回密码流
**AC**
- [ ] POST /v1/auth/forgot-password → 邮件 link
- [ ] 1h 过期
- [ ] POST /v1/auth/reset-password
- [ ] 历史 5 个不可重复
**估**: M

### ZY-03-06 · 个人资料 + 头像
**AC**
- [ ] GET / PATCH /v1/me
- [ ] 头像上传走 R2 presign
- [ ] 昵称 / 国家 / 偏好语言
**Tech**：ux/11-screens-app-profile.md, spec/07 § 9
**估**: M

### ZY-03-07 · 设置中心
**AC**
- [ ] 主题偏好持久化
- [ ] 通知偏好（push/email/learning）
- [ ] 学习提醒时间
- [ ] HSK 自评 / 测试入口
**估**: M

### ZY-03-08 · 设备 / 会话管理
**AC**
- [ ] /v1/me/sessions 列出
- [ ] DELETE /v1/me/sessions/:id 远程登出
- [ ] DELETE /v1/me/sessions 全部登出
**估**: S

### ZY-03-09 · 账号删除（GDPR）
**AC**
- [ ] 验证密码 + 邮件确认
- [ ] 软删 30d → 自动硬删
- [ ] 数据下载（JSON 包）
- [ ] 取消删除（30d 内）
**Tech**：spec/09 § 4.2
**估**: L

### ZY-03-10 · 前端账户页
**AC**
- [ ] 登录 / 注册 / 找回 3 页
- [ ] 个人资料 + 设置
- [ ] 设备列表
- [ ] 玻璃态适配
- [ ] i18n 4 语
**Tech**：ux/11
**估**: L

## 风险
- OAuth 配置复杂 → 提前申请 + 充足测试
- Apple Privacy Email → 后端兼容

## DoD
- [ ] 邮箱 + OAuth 全流可走
- [ ] 安全测试通过（暴力破解 / token 重放）
- [ ] 4 语翻译完整
- [ ] 数据删除合规
