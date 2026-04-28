# 4.7 · 反爬与安全

## 一、反爬目标

### 1.1 威胁模型
- **无脑爬虫**（curl / requests）：80% 流量
- **无头浏览器**（Puppeteer / Playwright）：15%
- **专业爬取（绕反爬技术）**：5%
- **逆向 App**（v2 移动端）：极少

### 1.2 防护级别
- 内容公开层（发现中国前 3 句 / 课程标题 / 游戏规则）：低防护，允许被抓（也利好 SEO）
- 内容核心层（完整文章 / 课程内容 / 题目）：高防护，登录 + 鉴权 + 限流
- 内容付费层（课程视频 / 高级章节）：最高防护，签名 URL + 水印

## 二、技术栈

### 2.1 网关层（Cloudflare）
- **WAF 规则**：
  - 速率限制（IP / 用户）
  - User-Agent 黑名单（明显爬虫 UA）
  - 地理限制（明显异常 IP 段）
  - 请求大小 / 频率异常
- **Cloudflare Turnstile**：替代 reCAPTCHA，对登录 / 关键 API 触发
- **Bot Fight Mode**：自动识别 + 拦截
- **IP Reputation**：Tor / VPN / 数据中心 IP 自动可疑

### 2.2 应用层（API 鉴权）
- 所有内容 API 必须带 Auth Token（即使是"未登录可看"的发现中国，也要 anonymous token）
- Token 来源：
  - 登录用户：Supabase JWT
  - 匿名用户：服务端首次访问自动签发短期 token（1 小时）+ Cloudflare Turnstile 验证
- API 请求带 HMAC 签名（防止 Token 被简单复用）

### 2.3 数据层（动态加载）
- HTML 不包含完整内容（仅渲染骨架）
- 内容通过 API 动态加载
- 关键数据加密：
  - 音频 URL 用签名 + TTL（5 分钟）
  - 内容字段可选 base64 + 简单偏移混淆（增加爬取门槛，不依赖此防护）
- 关键内容禁止前端缓存到 LocalStorage（避免被开发者工具一键导出）

### 2.4 行为分析
- 检测异常模式：
  - 单 IP 短时间访问 100+ 不同知识点
  - 单 IP 触发 X 个 4xx 错误
  - 用户 Agent + Accept-Language 不匹配（如 UA 是中国手机但 Accept 是越南语）
- 命中后：自动加 Turnstile / 限流 / 暂时封禁

## 三、内容水印（防转载）

### 3.1 文本水印（隐式）
- 在每篇文章中插入零宽字符（U+200B/200C/200D）
- 用户 ID 编码到零宽字符序列
- 内容被转载时可定位泄露源

### 3.2 音频水印
- 每个用户的音频请求生成独立签名 URL（短期 5 分钟）
- 服务端记录请求日志（user_id + audio_id + ts）
- 长期可分析转载源

### 3.3 视觉水印（v2，针对未来视频内容）
- 视频右下角动态水印（user email 部分掩码）

## 四、API 详细鉴权

### 4.1 Token 类型

| Token | 来源 | 时效 | 用途 |
|---|---|:---:|---|
| Supabase JWT | Auth | 1h（refresh 1 月） | 登录用户身份 |
| Anonymous Token | Edge Function 签发 | 1h | 未登录访问发现中国前 3 篇 |
| Content Signed URL | Storage 签名 | 5min | 音频访问 |
| HMAC API Signature | 客户端计算 | 单次 | 防止重放 |

### 4.2 鉴权中间件流

```
Request
   │
   ├── Cloudflare WAF（首道）
   │
   ├── Edge Function：
   │   ├── 速率限制
   │   ├── Token 校验
   │   ├── HMAC 签名校验
   │   ├── 地理 / UA 异常检测
   │   └── 通过 → 业务处理
   │
   └── 拒绝 → 返回 429 / 401 / 418
```

### 4.3 HMAC 签名算法

```typescript
// 客户端
const ts = Date.now();
const nonce = randomString(16);
const sig = HMAC_SHA256(`${method}|${path}|${ts}|${nonce}|${body}`, clientSecret);
fetch(url, {
  headers: {
    'X-Timestamp': ts,
    'X-Nonce': nonce,
    'X-Signature': sig,
  },
});

// 服务端
- 验证 ts 在 5 分钟窗口内
- 验证 nonce 未使用过（Redis 缓存 5 分钟）
- 重计算 HMAC 并比对
```

注：clientSecret 不是真正密钥（前端可见），但提高门槛 + 配合其他手段。

## 五、安全分层

### 5.1 OWASP Top 10 对照

| 风险 | 知语对策 |
|---|---|
| A01 Broken Access Control | RLS + 中间件双层 |
| A02 Cryptographic Failures | TLS + 强密码哈希 + 不存敏感 |
| A03 Injection | zod 校验 + drizzle 参数化 |
| A04 Insecure Design | 安全默认 + DPO review |
| A05 Security Misconfiguration | IaC + 自动 lint |
| A06 Vulnerable Components | Dependabot + Snyk |
| A07 Identification Failures | Supabase Auth + 2FA（v2） |
| A08 Software Data Integrity | webhook 验签 + idempotency |
| A09 Security Logging | Sentry + audit_logs |
| A10 SSRF | 严格 URL 白名单 |

### 5.2 输入校验
- 所有 API：zod schema
- 所有上传：MIME / size / 病毒扫描（Cloudflare Scanner）
- SQL：drizzle 参数化（无字符串拼接）

### 5.3 输出转义
- React 默认转义
- 富文本：DOMPurify 白名单
- IM 消息：禁止 HTML 标签 + emoji 白名单

### 5.4 CSP / 安全 Header
- Content-Security-Policy（严格）
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Permissions-Policy

## 六、用户账户安全

### 6.1 密码策略
- Supabase Auth 默认（bcrypt + 12 round）
- 密码强度：8+ 字符 + 数字 + 字母
- 泄露密码检测：HIBP API 集成

### 6.2 2FA（v2）
- TOTP（Google Authenticator）
- 关键操作（修改邮箱 / 大额兑换）触发

### 6.3 异地登录检测
- 新设备 / 新 IP 段 → 邮件通知
- 用户可主动登出所有设备

### 6.4 账号黑名单
- 恶意 chargeback / 多次违规 → 黑名单
- 同邮箱 / 同设备指纹 / 同支付卡都拉黑

## 七、设备指纹

### 7.1 实现
- FingerprintJS Pro（开源版本即可）
- 收集：UA / Canvas / WebGL / 字体 / 时区 / 屏幕
- 哈希后存储

### 7.2 用途
- 反欺诈（注册多账号）
- 分销反薅
- 异常登录

### 7.3 隐私合规
- 隐私协议明示
- 仅用于反欺诈
- 用户删除账号时同步删除

## 八、DDoS 防护

- Cloudflare 自动 L3/L4/L7 防护（免费版即可应对中等攻击）
- 关键时段（如上线 / 大型营销）开启 Under Attack Mode

## 九、密钥管理

### 9.1 生产密钥
- 存储：Doppler / 1Password Secret Manager（团队 3 人轻量）
- 不进 Git（强制 pre-commit hook）
- 定期轮换（Paddle / Supabase Service Key 季度轮换）

### 9.2 客户端密钥
- 严格区分 anon key vs service key
- service key 仅服务端用
- anon key 配合 RLS 是安全的

## 十、监控与响应

### 10.1 安全事件监控
- Sentry 自定义事件：登录失败激增、Webhook 失败、异常 API 调用
- 自定义 Slack channel：security-alerts

### 10.2 应急响应
- 文档化的 Incident Response Plan
- 联系人：CTO / DPO / 当地律师

### 10.3 渗透测试
- M+3：第一次外部安全审计
- 年度：例行 pentest

## 十一、反爬效果评估

### 11.1 KPI
- 异常请求率 < 5%
- 内容被完整抓取的成本 > 1000 USD（攻击成本 vs 内容价值）
- 误伤率 < 0.5%（正常用户被拦截）

### 11.2 红线
- 误伤 Google / Bing 爬虫 → 影响 SEO
- 误伤 TikTok / Meta in-app browser
- 误伤东南亚移动 IP（部分共享 IP）

### 11.3 调优周期
- 每周看异常报告
- 月度回顾规则

进入 [`08-srs-algorithm.md`](./08-srs-algorithm.md)。
