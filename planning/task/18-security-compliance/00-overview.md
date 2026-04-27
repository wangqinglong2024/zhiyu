# 18 · 安全与合规任务清单

## 来源覆盖

- PRD：`planning/prds/13-security/01-functional-requirements.md`、`02-data-model-api.md`。
- 技术：`planning/spec/09-security.md`、`planning/rules.md`。

## 冲突裁决

- 外部边缘/WAF/语义模型/指纹厂商等旧描述转为本地 nginx/Express 中间件、OSS/自研设备 ID、LLMAdapter mock、日志告警。
- 来源句：`planning/rules.md` 写明“本期不集成任何外部托管 SaaS”与“本期 dev 不集成任何真实 AI 调用”。

## 本地映射

| PRD 历史描述 | v1 Docker-only 实现 |
|---|---|
| Cloudflare WAF / Bot Fight | nginx 基础限流 + Express 风控中间件 + security_events |
| Turnstile | CaptchaAdapter always-pass/fake，可切真实 provider 但不阻塞 dev |
| Cloudflare Worker 音频验签 | Express audio proxy + Supabase Storage signed path |
| Cloudflare DDoS | nginx 限流、阈值告警、运营 Runbook |
| FingerprintJS Pro | OSS/自研 visitor_id + 行为日志 |
| Claude / Slack 告警 | LLMAdapter mock + EmailAdapter/fake + admin security console |

## 任务清单

- [ ] SC-01 建立 `security_events`、`blocked_entities`、`api_signature_nonces`、`red_line_dictionary`。来源句：`planning/prds/13-security/02-data-model-api.md` DDL 定义这些表。
- [ ] SC-02 实现本地 rate limiting：登录 10/min/IP、注册 5/min/IP、未登录文章 30/min/IP、全局 1000/min/IP。来源句：`SC-FR-001` Rate Limiting Rules。
- [ ] SC-03 实现关键操作 CaptchaAdapter/fake gate：注册、重置密码、关键操作。来源句：`SC-FR-001` 写明“Turnstile 嵌入：注册 / 重置密码 / 关键操作”，Adapter 裁决见 `planning/spec/02-tech-stack.md`。
- [ ] SC-04 实现 HMAC 签名：X-Sig-V/Ts/Nonce/Sig，ts≤5min，nonce 60min 未用，写 Redis。来源句：`SC-FR-002`。
- [ ] SC-05 HMAC 应用于所有写 API + 关键读 API；dev 提供 sdk 自动签名。来源句：`SC-FR-002` 写明“应用范围：所有写 API + 关键读 API（题目内容）”。
- [ ] SC-06 实现 JWT：access 15min、refresh 7d、anonymous 1h、HttpOnly Cookie。来源句：`SC-FR-003`。
- [ ] SC-07 实现匿名 token：anon_id、exp、ip_hash，用于 DC/NV 匿名访问风控与注册转化关联；DC 不再按文章篇数计数。来源句：`SC-FR-006` 与 `UA-FR-013`。
- [ ] SC-08 实现设备 ID：dev 使用 OSS/自研 visitor_id，注册/登录/关键操作携带，反作弊识别多账号/自推。来源句：`SC-FR-004`。
- [ ] SC-09 实现音频签名 URL：HMAC + ts + path + 5min 过期，Express 生成。来源句：`SC-FR-005`。
- [ ] SC-10 实现内容水印：零宽字符编码 user/session 哈希，支持检测工具。来源句：`SC-FR-007`。
- [ ] SC-11 实现红线词检测 Layer1 本地词典；Layer2 语义判断走 LLMAdapter mock，只返回 fixture，不接真实模型。来源句：`SC-FR-008` 与 `planning/rules.md` AI mock 裁决。
- [ ] SC-12 实现行为指纹日志：鼠标、滚动、输入间隔、停留，v1 仅记录，v1.5 拦截占位。来源句：`SC-FR-009`。
- [ ] SC-13 实现暴力破解防护：登录 5 次失败锁 IP+邮箱 15min，注册同 IP 5/h 拦截。来源句：`SC-FR-010`。
- [ ] SC-14 实现 CSRF：SameSite=Lax、关键写操作 X-Sig、旧式表单 CSRF token。来源句：`SC-FR-011`。
- [ ] SC-15 实现 CSP、HSTS、nosniff、DENY、Referrer、Permissions-Policy。来源句：`SC-FR-012`。
- [ ] SC-16 所有安全事件写 `security_events`，7 年保留，可导出。来源句：`SC-FR-013`。
- [ ] SC-17 实现合规模块：Cookie 同意、数据导出/删除联动、隐私政策/服务条款 4 语。来源句：`SC-FR-014`。
- [ ] SC-18 外部 DDoS 描述转为本地阈值告警 + nginx 限流 + 运营介入。来源句：`SC-FR-015` 与 `planning/rules.md` 外部 SaaS 禁用裁决。
- [ ] SC-19 后台安全事件列表和 blocklist 操作必须写审计。来源句：`AD-FR-012` 与 `SC-FR-013`。
- [ ] SC-20 实现 HMAC 客户端会话密钥初始化：登录/匿名会话后由 `/api/v1/security/client-session` 返回一次性 client_session_id 与短期派生 secret；secret 仅存在内存，刷新/登出/过期即失效。来源句：`SC-FR-002` 写明“secret：客户端通过 OAuth-like 流程取得，每会话独立”。
- [ ] SC-21 实现 HMAC SDK：app-fe/admin-fe 统一计算 body_sha256、nonce、ts、签名，自动重试只重签不复用 nonce；服务端错误码可本地化。来源句：`SC-FR-002` 请求头与计算规则。

## 验收与测试

- [ ] SC-T01 重放同 nonce 被拒，过期 ts 被拒，错误签名写 security_events。来源句：`SC-FR-002`。
- [ ] SC-T02 未登录 anon JWT 访问 DC 第 4-12 类目或 NV 第 2 章时被引导注册。来源句：`SC-FR-006` 与 `UA-FR-013`。
- [ ] SC-T03 红线词命中 block 直接拒绝，不入库。来源句：`SC-FR-008`。
- [ ] SC-T04 HMAC secret 过期、刷新、登出后旧 secret 均不可签名成功；nonce 不可跨 session 复用。
- [ ] SC-T05 本地映射表中的旧 SaaS 能力均有 Docker/dev 可验证替代路径。
