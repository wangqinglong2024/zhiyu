# 环境变量索引

| 变量 | 用途 | 缺失行为 |
|------|------|---------|
| `SUPABASE_JWT_SECRET` | GoTrue/PostgREST/Hono 共用 HS256 密钥 | 必需 |
| `SUPABASE_SERVICE_ROLE_KEY` | 后端绕 RLS | 必需（dev 已 seed） |
| `SUPABASE_ANON_KEY` | 浏览器匿名 | 必需 |
| `DATABASE_URL` | 仅供脚本 / RPC 测试 | 必需 |
| `REDIS_URL` | 缓存 + BullMQ | 必需 |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | 首次 seed 创建超管 | 必需（生产改 `.env.local`） |
| `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` | LLM | 缺则 LLMAdapter → mock |
| `GOOGLE_OAUTH_CLIENT_ID/SECRET` | 应用端 Google 登录 | 缺则前端隐藏 Google 按钮 |
| `PADDLE_*` | 支付 | 缺则 PaymentAdapter → mock |
| `SMTP_*` / `RESEND_API_KEY` | 邮件 | 缺则写入 `.dev/mailbox/` 并控制台打印 |

## 申请方式

- Anthropic：https://console.anthropic.com → API Keys
- DeepSeek：https://platform.deepseek.com
- OpenAI：https://platform.openai.com
- Google OAuth：Google Cloud Console → APIs & Services → OAuth consent + Credentials
- Paddle：https://vendors.paddle.com → Developer Tools
- Resend：https://resend.com
