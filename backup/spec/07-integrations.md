# 07 · 第三方集成（Integrations）

> ⚠️ **本文件大量章节（Cloudflare R2/Workers/Turnstile、PostHog、Sentry、Better Stack、Doppler）已被 [00-rules.md](../00-rules.md) 禁用**；保留作为未来评估底稿。本期所有第三方一律走 Adapter 接口（见 spec/02 §六）+ fake 实现；密钥走 `system/docker/.env` 单文件。下一波次会按此规则精改本文。

## 一、整体集成清单

| 类别 | 服务 | 用途 | 阶段 |
|---|---|---|---|
| Auth | Google / Apple / TikTok | OAuth 登录 | v1 / v1.5 |
| Payment | Paddle | 主支付 + MoR | v1 |
| Payment | LemonSqueezy | 备选支付 | v1 |
| Payment | Xendit / Midtrans | 东南亚本地 | v1.5 |
| AI | Anthropic | Claude Sonnet | v1 |
| AI | DeepSeek | V3 + TTS | v1 |
| AI | OpenAI | DALL-E (封面) | v1.5 |
| TTS | Azure Speech | 备选 | v1 |
| ASR | Whisper | 跟读评分 | v1.5 |
| Email | Resend | 事务邮件 | v1 |
| Push | OneSignal | Web Push | v1 |
| SMS | Twilio | 验证码 | v1.5 |
| 客服 IM | 自建 + Crisp 备 | 工单 | v1 |
| 反垃圾 | Cloudflare Turnstile | Captcha | v1 |
| Storage | Cloudflare R2 | 图 / 音频 | v1 |
| CDN | Cloudflare | 全球加速 | v1 |
| Analytics | PostHog | 行为 | v1 |
| Error | Sentry | FE / BE | v1 |
| Logs | Better Stack | 日志 / 监控 | v1 |
| Uptime | UptimeRobot | 探测 | v1 |
| 翻译辅助 | DeepL | 备选 | v1.5 |
| 翻译人审 | 外包平台 | 母语审稿 | v1 |
| 数据 BI | Metabase | 内部 BI | v1.5 |

## 二、OAuth 集成

### 2.1 Google
- 通过 Supabase Auth Provider
- 配置 Console → Client ID / Secret
- Redirect: `{API}/auth/callback/google`

### 2.2 Apple
- Supabase Auth Provider
- 需 Apple Developer 账号 + Service ID + Key
- 隐私邮箱处理

### 2.3 TikTok（v1.5）
- 自实现（Supabase 暂不支持）
- TikTok for Developers → app review
- 关键于 SEA 增长

### 2.4 流程
```
1. 前端 → /auth/oauth/{provider}
2. 跳第三方授权
3. 回调 /auth/callback/{provider}?code=xxx
4. 后端换 token + 拉用户信息
5. upsert users + oauth_accounts
6. 颁发 JWT + Refresh
7. 前端跳 /
```

## 三、支付集成

### 3.1 Paddle (主)

**注册**
- Paddle Vendor Account
- 提交 KYC
- Tax form

**集成**
- Paddle Billing v2
- 创建 Products / Plans
- Checkout：iframe / hosted

**前端**
```ts
import { initializePaddle } from '@paddle/paddle-js';
const paddle = await initializePaddle({
  environment: 'production',
  token: VITE_PADDLE_CLIENT_TOKEN,
});
paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  customer: { email },
  customData: { userId },
});
```

**Webhook**
- `checkout.completed` → 创建 payment_orders
- `subscription.created` → 创建 subscriptions
- `subscription.updated` → 更新
- `subscription.canceled` → 标记取消
- `transaction.completed` → 解锁
- 签名校验：Paddle-Signature 头 HMAC

### 3.2 LemonSqueezy (备)
- 类似集成
- 用于 Paddle 不可用国家（少数）
- 简化用户切换

### 3.3 本地支付 (v1.5)
- 印尼 Midtrans (GoPay / OVO / DANA)
- 越南 ZaloPay / MoMo
- 泰国 PromptPay
- 流程：跳支付页 → 异步通知 → 解锁

### 3.4 退款
- 后台发起 → API 调用 Paddle Refund
- Webhook 收到 → 标记订单 + 调整知语币 + 反佣

### 3.5 对账
- 每日下载 Paddle 流水 → 与本地对账
- 差异告警

## 四、AI 集成

### 4.1 Anthropic
```ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: env.ANTHROPIC_KEY });

const msg = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  messages: [...],
  metadata: { user_id: factoryTaskId },
});
```
- 限速：tier 1 → 50 req/min（升级 tier 4 → 4000）
- 成本上报 per call

### 4.2 DeepSeek
- 兼容 OpenAI SDK
```ts
const ds = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: env.DEEPSEEK_KEY,
});
```

### 4.3 DeepSeek TTS
- POST /audio/tts
- 输入：text / voice / speed
- 输出：mp3 流

### 4.4 Whisper (v1.5)
- POST /audio/transcriptions
- 用于跟读评分（用户音频）

### 4.5 DALL-E (v1.5)
- 封面图生成（少量）
- v1 用模板 + Cloudflare Image 实时合成

## 五、Email (Resend)

### 5.1 类型
- 注册欢迎
- 邮箱验证
- 密码重置
- 订阅成功
- 订阅到期提醒
- 客服回复
- 营销（用户同意后）

### 5.2 模板
- React Email + 同 design tokens
- 4 语版本

### 5.3 发送
```ts
await resend.emails.send({
  from: 'Zhiyu <hello@zhiyu.io>',
  to: user.email,
  subject: t('email.welcome.subject'),
  react: <WelcomeEmail user={user} />,
});
```

### 5.4 退订
- 退订链接每封 footer
- DB 记录偏好

## 六、Push (OneSignal)

### 6.1 集成
- Web SDK 注册
- token 上传 push_tokens 表

### 6.2 发送
```ts
await onesignal.createNotification({
  app_id: env.ONESIGNAL_APP_ID,
  include_external_user_ids: [userId],
  contents: { en: '...', vi: '...', th: '...', id: '...' },
  url: 'https://app.zhiyu.io/...',
});
```

### 6.3 类型
- 学习提醒（按用户偏好时间）
- 新课程发布
- 客服回复
- 知语币活动

## 七、客服 IM

### 7.1 自建
- WebSocket（Socket.io）
- 后端 conversations / messages 表
- 用户端 / 客服端共享 schema

### 7.2 路由
- 用户进入 → 创建 / 复用 conversation
- 自动派发空闲客服
- 离线 → 转工单

### 7.3 离线兜底（v1）
- Crisp 集成（关键事件触发）
- v1.5 替换为自建

## 八、Captcha (Turnstile)

### 8.1 用途
- 注册
- 找回密码
- 客服首次发消息

### 8.2 集成
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
<div class="cf-turnstile" data-sitekey="..."></div>
```
- 后端验证 token → Cloudflare API

## 九、Storage (R2)

### 9.1 桶规划
- `zhiyu-images-prod` → 图片
- `zhiyu-audio-prod` → 音频
- `zhiyu-uploads-prod` → 用户上传
- `zhiyu-backups-prod` → 备份

### 9.2 访问
- Public: cover / 封面
- Private: 付费内容音频 → presigned URL

### 9.3 上传流程
1. 前端请求 `/v1/uploads/presign`
2. 后端用 S3 SDK 生成 PUT URL
3. 前端 fetch PUT
4. 完成回调 `/v1/uploads/complete` → 写记录

### 9.4 Image Resizing
- Cloudflare Image Resizing
- URL 参数：`/cdn-cgi/image/width=400,format=webp/{path}`

## 十、Analytics (PostHog)

### 10.1 事件
- pageview
- feature_used
- onboarding_completed
- registered
- subscribed
- coin_earned / coin_spent
- lesson_started / completed
- game_started / finished
- referral_invited / converted

### 10.2 漏斗
- 注册漏斗
- 付费漏斗
- 学习留存

### 10.3 会话回放
- 仅 1% 采样 + 用户同意
- 排除付费 / 敏感页

## 十一、Sentry / Better Stack

详见 10-observability.md

## 十二、SMS (Twilio v1.5)

### 12.1 用途
- 手机注册验证（仅 SEA）
- 安全提醒

### 12.2 成本控制
- 单用户限额
- 同号 / 同 IP 限速

## 十三、人审外包

### 13.1 平台
- 自建审稿池（Native 母语者）
- 备选：上塔斯克 / Lionbridge

### 13.2 流程
- 工厂出稿 → 队列
- 派发到审稿员（按语言）
- 审稿评分 + 注释
- 通过 → 发布
- 打回 → 重生

### 13.3 计费
- 按字 + 评分质量
- 月度结算

## 十四、Webhook 安全

### 14.1 签名校验
- 全部入站 webhook 验签名
- 签名算法 HMAC-SHA256

### 14.2 幂等
- 事件 ID 去重（Redis 7d）
- 重复事件返 200

### 14.3 重试
- 第三方失败 → 第三方重试机制

## 十五、密钥管理

- Doppler （集中管理）
- 环境：仅 dev（本规划不覆盖 staging/prod）
- 轮换计划：90 天
- 最小权限

## 十六、容错

### 16.1 服务降级
- AI 不可用 → 队列暂停
- TTS 不可用 → 后台标记 + 重试
- 邮件失败 → 队列重试

### 16.2 熔断
- 集成调用熔断器（opossum）
- 失败率 > 50% → 打开 30s

## 十七、检查清单

- [ ] 全部第三方密钥在 Doppler
- [ ] 全部 webhook 签名校验
- [ ] 全部第三方调用监控
- [ ] 全部第三方调用幂等 + 重试
- [ ] 全部第三方有备选方案
- [ ] 成本告警配置
