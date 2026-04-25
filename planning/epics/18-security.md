# Epic E18 · 安全与合规（Security & Compliance）

> 阶段：M0-M6 贯穿 · 优先级：P0 · 估算：5 周（分散）

## 摘要
OWASP Top 10、加密、合规（GDPR / PDPA）、风控、隐私政策、漏洞响应。

## Stories

### ZY-18-01 · 密码 / Token 安全基线
**AC**
- [ ] bcrypt 12 + 强密码策略
- [ ] JWT 签名 + 过期
- [ ] Refresh 黑名单
**估**: M

### ZY-18-02 · API 输入校验 + Rate Limit
**AC**
- [ ] Zod schema 全部入口
- [ ] 全局 + 端点级限速
- [ ] IP + user 双键
**估**: M

### ZY-18-03 · 安全 HTTP 头
**AC**
- [ ] HSTS / CSP / X-Frame / Referrer / Permissions
- [ ] CSP 严格白名单
- [ ] 报告端点
**Tech**：spec/09 § 6
**估**: M

### ZY-18-04 · 数据加密
**AC**
- [ ] TLS 1.3 强制
- [ ] 敏感字段 AES-GCM（手机）
- [ ] R2 SSE
**估**: M

### ZY-18-05 · 审计日志
**AC**
- [ ] 后台写操作 100% 记录
- [ ] append-only
- [ ] 7 年保留
**Tech**：spec/05 § 4.16
**估**: M

### ZY-18-06 · 隐私政策 + TOS（4 语 + 中文）
**AC**
- [ ] 律师审稿
- [ ] 注册必勾选
- [ ] 重大变更重确认
**估**: M

### ZY-18-07 · 数据下载 + 删除（GDPR）
**AC**
- [ ] /me/export → JSON 包
- [ ] /me/delete → 30d 软删
- [ ] DPA 第三方覆盖
**估**: L

### ZY-18-08 · 漏洞扫描 + 依赖管理
**AC**
- [ ] CodeQL CI
- [ ] Renovate / Dependabot
- [ ] 高危 24h
- [ ] OWASP ZAP（v1.5）
**估**: M

### ZY-18-09 · WAF + Bot 防护
**AC**
- [ ] Cloudflare WAF rules
- [ ] Turnstile 注册 / 重置
- [ ] 异常 IP 封禁
**估**: M

### ZY-18-10 · 事件响应流程
**AC**
- [ ] runbook
- [ ] security@zhiyu.io
- [ ] 状态页集成
- [ ] 演练 1 次
**估**: M

## 风险
- 跨国合规复杂 → 律师 + 分国处理
- 单点故障导致泄露 → 多层防护

## DoD
- [ ] OWASP Top 10 验证通过
- [ ] 渗透测试报告
- [ ] 合规文件 4+1 语
