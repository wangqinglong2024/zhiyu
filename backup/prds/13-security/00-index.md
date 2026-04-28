> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 13 · 安全与反爬（Security · SC）

> **代号**：SC | **优先级**：P0 | **核心**：Cloudflare 边缘 + API 签名 + 设备指纹 + 内容水印

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 边缘：Cloudflare WAF + Bot Fight Mode + Turnstile（注册 / 关键操作）
- 速率限制：Cloudflare Rules + Edge Functions 双层
- API 签名：HMAC `v=1, ts, nonce, signature`
- 设备指纹：FingerprintJS（开源 fork）
- 音频签名 URL：5 分钟有效，HMAC 签名
- 未登录 token：1 小时 anonymous JWT
- 内容水印：句子级零宽字符标识 user_id / session_id
- 红线词检测：双层 LLM
- 反爬：行为指纹（点击模式 / 滚动模式）
- DDoS：Cloudflare 自动防护
