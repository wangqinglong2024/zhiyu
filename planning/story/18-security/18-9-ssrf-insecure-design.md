# ZY-18-09 · SSRF 防护 + 不安全设计补丁（OWASP A04 / A08 / A10）

> Epic：E18 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md) §安全
> 补全 OWASP Top 10 覆盖：A04 Insecure Design / A08 Software & Data Integrity / A10 SSRF

## User Story
**As a** 平台 / 用户
**I want** 后端发起的所有外部 URL 请求都受白名单 + 内网黑名单约束，所有 webhook 与外部 JSON 输入都被签名与完整性校验
**So that** 攻击者不能借助我方服务器探测 / 攻击内网，也不能篡改 webhook 触发恶意业务流。

## 上下文
- 当前 ZY-18-01..08 覆盖了认证 / 速率 / CSP / 加密 / 隐私 / GDPR / 漏扫 / WAF 替代，但 OWASP A04/A08/A10 没有专门 story。
- 后端可能发起外部 HTTP 的位置：
  - PaymentAdapter webhook 回拨（E13）
  - LLMAdapter / WebSearchAdapter（E16，本期 fake，但接口要安全）
  - PixelAdapter（E20）
  - 头像 OAuth 登录回拨（E03）
  - admin 工具的种子文件 `seed://` 解析 → 仅本地资产，禁止外部 fetch

## Acceptance Criteria
- [ ] 实现 `packages/http-safe/src/safeFetch.ts`，所有 outbound HTTP 必须经其调用：
  - 解析目标域，禁止 `localhost / 127.0.0.0/8 / ::1 / 169.254.0.0/16 / 10.0.0.0/8 / 172.16.0.0/12 / 192.168.0.0/16 / metadata.google.internal / instance-data`（含 DNS 解析后再校验）
  - 强制超时 30s
  - 重定向最多 5 次，每次重定向均重新校验
  - 域名白名单注入：`HTTP_ALLOW_HOSTS` 列表 + per-adapter 显式列表
- [ ] Webhook 签名验证统一抽象 `packages/security/src/verifyHmac.ts`：
  - HMAC-SHA256(secret, ts + nonce + body)，时间窗 ±5min 拒绝
  - PaymentAdapter / PixelAdapter 的 webhook 路由必须先过签名 + 重放保护（nonce 入 redis 24h 去重）
- [ ] 数据完整性：种子 JSON / 批量导入文件支持可选 `__signature` 字段（HMAC），admin UI 提供"严格签名模式"切换
- [ ] CSP report endpoint 已经在 ZY-18-03 落地，本 story 补 audit_log 写入与 admin 异常面板入口
- [ ] 安全设计 checklist 文档：`system/docs/security/checklist.md`，开发新接口前自检 12 条（含 IDOR、Mass Assignment、Open Redirect、SSRF、Path Traversal、SQL Injection 等）
- [ ] 单测：用 nock / msw 模拟"重定向到 169.254.169.254"等情形 → safeFetch 必须抛错

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run security.safefetch security.hmac
docker compose exec zhiyu-app-be pnpm vitest run security.replay
```
- 手工：用 curl 构造伪 webhook（错时间 / 错签名 / 重放）→ 全部 401/403。

## DoD
- [ ] OWASP Top 10 全部 10 项均有 story 关联（A01..A10）
- [ ] 全部 outbound HTTP 走 safeFetch（grep 自检：`grep -RE "axios\.|fetch\(|http\.get" apps/ | grep -v safeFetch`）
- [ ] webhook 路由 100% 过 verifyHmac

## 依赖
- 上游：ZY-18-02（zod + ratelimit）/ ZY-18-03（helmet/CSP）/ ZY-18-04（audit_log）
- 下游：E13 webhook、E16 LLMAdapter、E20 PixelAdapter
