> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 13.1 · 安全 · 功能需求

## SC-FR-001：Cloudflare 边缘
- WAF 默认规则集
- Bot Fight Mode 开
- Rate Limiting Rules：
  - `/api/auth/login` 10/min/IP
  - `/api/auth/register` 5/min/IP
  - `/api/discover/articles/:slug` 30/min/IP（未登录）
  - 全局 1000/min/IP
- Country block：v1 仅服务 VN/TH/ID/EN-speaking + CN（按需），其他地区慢响应（不显式拒绝）
- Turnstile 嵌入：注册 / 重置密码 / 关键操作

## SC-FR-002：API 签名（HMAC）
- 请求头：`X-Sig-V: 1`、`X-Sig-Ts: 1700000000`、`X-Sig-Nonce: <uuid>`、`X-Sig: <hex>`
- 计算：`HMAC-SHA256(secret, v + ts + nonce + method + path + body_sha256)`
- 服务端校验：
  - ts 偏差 ≤ 5min
  - nonce 60min 内未用过（Redis）
  - 签名匹配
- 应用范围：所有写 API + 关键读 API（题目内容）
- secret：客户端通过 OAuth-like 流程取得，每会话独立

## SC-FR-003：JWT
- 已登录：access JWT 15min + refresh 7d
- 未登录：anonymous JWT 1h（含 anon_id）
- Algorithm：HS256
- HttpOnly Cookie

## SC-FR-004：设备指纹
- FingerprintJS Pro 或 OSS 版
- 注册时生成 visitor_id 写 user_devices
- 注册 / 登录 / 关键操作携带
- 反作弊：识别多账号 / 自推

## SC-FR-005：音频签名 URL
- 后端生成 signed URL（Cloudflare Workers / Express）
- HMAC + ts + path + 5min 过期
- CDN 验签（Cloudflare Worker）

## SC-FR-006：未登录 token
- 首次访问签发 anonymous JWT
- 含 anon_id + exp + ip_hash
- 用于 DC / NV 限流计数

## SC-FR-007：内容水印
- 零宽字符（U+200B / U+200C）每句插入若干位
- 编码：user_id 哈希前 8 位 + session_id 哈希后 8 位
- 检测工具：复制内容后可解码出泄露源

## SC-FR-008：红线词检测（双层）
- Layer 1：本地词典匹配（已知敏感词）
- Layer 2：LLM 语义判断（Claude Sonnet 4.5）
- 触发：内容生成 / 审校提交 / 用户报错
- 阻断：直接拒绝（不入库）
- 告警：邮件运营 + Slack

## SC-FR-009：行为指纹（反爬）
- 收集：鼠标轨迹 / 滚动模式 / 输入间隔 / 页面停留
- 阈值：行为接近随机 / 异常一致 → 标 bot 嫌疑
- v1：仅记录日志；v1.5 自动拦截

## SC-FR-010：暴力破解
- 登录 5 次失败锁 IP+邮箱 15min
- 注册同 IP 5 次 / 小时拦截

## SC-FR-011：CSRF
- SameSite=Lax cookie
- 关键写操作要求 X-Sig 签名
- CSRF token（旧式表单）

## SC-FR-012：CSP / 安全头
- Content-Security-Policy（限定 script-src）
- Strict-Transport-Security（HSTS）
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

## SC-FR-013：日志 / 审计
- 全部安全事件入 security_events 表
- 7 年保留
- 可导出（合规）

## SC-FR-014：合规
- PDPL (TH) / PDPA (SG/MY) / UU PDP (ID)
- Cookie 同意横幅
- 数据导出 / 删除（UA 模块）
- 隐私政策 4 语种
- 服务条款 4 语种

## SC-FR-015：DDoS 防护
- Cloudflare 自动
- 阈值告警 → 运营介入
