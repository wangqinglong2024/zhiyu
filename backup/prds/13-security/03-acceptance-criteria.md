> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 13.3 · 安全 · 验收准则

## 功能
- [ ] SC-AC-001：Cloudflare WAF / Bot Fight / Turnstile 启用
- [ ] SC-AC-002：rate limit 命中（10/min login，30/min discover）
- [ ] SC-AC-003：HMAC 签名校验有效；缺失 / 错签拒
- [ ] SC-AC-004：nonce 重放拒
- [ ] SC-AC-005：JWT 过期续签 OK
- [ ] SC-AC-006：未登录 anonymous JWT 1h
- [ ] SC-AC-007：FingerprintJS 设备 ID
- [ ] SC-AC-008：音频 URL 5min 过期
- [ ] SC-AC-009：内容零宽字符水印（解码可识别 user）
- [ ] SC-AC-010：红线词双层检测（block / warn / pass）
- [ ] SC-AC-011：CSP / HSTS / X-Frame 头
- [ ] SC-AC-012：cookie 同意横幅 4 语种
- [ ] SC-AC-013：security_events 全覆盖
- [ ] SC-AC-014：DDoS 自动防护

## 非功能
- [ ] HMAC 校验 P95 < 50ms
- [ ] 红线 Layer1 < 20ms
- [ ] OWASP Top 10 自查通过
- [ ] PDPL/PDPA/UU PDP 合规

## 测试用例
1. 篡改 ts 至 1h 前 → 拒
2. 重放同 nonce → 拒
3. 客户端不带 X-Sig → 拒
4. 拷贝音频 URL 6min 后访问 → 403
5. 内容含"敏感词" → 立即 block
6. 内容含暗讽政治 → LLM warn → 人工审
7. 同 IP 注册 6 次 / 小时 → 第 6 次拒
8. 复制 50 句到第三方 → 解码水印识别用户

## 监控
- security_events 异常增量告警
- WAF 拦截数（日 / 周）
- 红线 Layer2 LLM 调用成功率 > 99%
- HMAC 失败率 < 1%（高于则疑攻击）
