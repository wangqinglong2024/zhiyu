# Epic E18 · 安全与合规（Security & Compliance）

> 阶段：M0-M6 贯穿 · 优先级：P0 · 估算：4 周（分散）
>
> 顶层约束：[planning/00-rules.md](../00-rules.md)
>
> **WAF / Bot 防护**：本 dev 周期通过 nginx 中间件 + Supabase RLS + express-rate-limit，**不**接 Cloudflare / Turnstile / Recaptcha。生产侧 WAF / CDN 由用户自行处理。

## 摘要
OWASP Top 10、加密、合规（GDPR / PDPA）、审计、风控、隐私政策、漏洞响应。

## Stories（按需 8）

### ZY-18-01 · 密码 / Token 安全基线
**AC**
- [ ] supabase auth 默认 bcrypt + 强密码策略（password requirements 配置）
- [ ] JWT 过期 / refresh 黑名单（在 BE 层维护）
**估**：M

### ZY-18-02 · API 输入校验 + Rate Limit
**AC**
- [ ] Zod schema 入口校验
- [ ] express-rate-limit + ioredis store；全局 + 端点级；IP + user 双键
- [ ] 不引入 @upstash/ratelimit
**估**：M

### ZY-18-03 · 安全 HTTP 头（helmet）
**AC**
- [ ] HSTS（dev 关、prod 由用户 nginx 加）/ CSP / X-Frame / Referrer / Permissions
- [ ] CSP 严格白名单；report endpoint 写 `error_events`
**估**：M

### ZY-18-04 · 数据加密 + 审计日志
**AC**
- [ ] 敏感字段 AES-GCM（密钥来自 env，dev 用占位 key）
- [ ] supabase-storage 默认服务端加密
- [ ] `audit_logs` 表（schema `zhiyu`）；后台写操作 100% 写入；append-only；保留 7 年
**估**：M

### ZY-18-05 · 隐私政策 + TOS（4 语 + 中文）
**AC**
- [ ] 文案占位（律师审稿在用户自处理范围）
- [ ] 注册必勾选；重大变更重确认
**估**：M

### ZY-18-06 · 数据下载 + 删除（GDPR）
**AC**
- [ ] `/api/v1/me/export` JSON 包；`/me/delete` 30d 软删
- [ ] DPA 文档占位（用户后续完善）
**估**：L

### ZY-18-07 · 漏洞扫描 + 依赖管理
**AC**
- [ ] `pnpm audit` + `socket-cli`（容器内一次性脚本）
- [ ] Renovate 配置文件提交但不接外部 CI；用户后续如需可启用
**估**：M

### ZY-18-08 · WAF 替代 + 风控 + 事件响应
**AC**
- [ ] nginx 中间件：UA 黑名单 / 已知坏路径 404 / 简单 IP 限速（zhiyu-internal nginx 容器配置）
- [ ] 异常 IP 自动黑名单（写 supabase 表 `blocked_ips`）
- [ ] runbook md 文档；演练 1 次（命令手册）
**估**：M

## DoD
- [ ] OWASP Top 10 自查通过（清单）
- [ ] 合规文件 4+1 语占位齐
- [ ] 不引用 Cloudflare / Turnstile / Recaptcha 真实接入
- [ ] **ZY-18-09** 已完成：OWASP A04/A08/A10 专项补丁（SSRF 防护 + Webhook HMAC + 不安全设计 checklist），使 Top 10 覆盖拼图闭环；同时确保**种子数据**导入路径仅本地资产、禁止外部 URL fetch
