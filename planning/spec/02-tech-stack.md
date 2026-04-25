# 02 · 技术选型矩阵（Tech Stack）

## 一、整体原则

1. **TypeScript first**：全栈强类型
2. **托管优先**：v1 不自建数据库 / Redis / Storage
3. **开源生态**：避免厂商锁定（除非不可避）
4. **东南亚低延迟**：选 Singapore Region
5. **成本可控**：从免费 / Hobby tier 起步

## 二、前端

| 层 | 技术 | 版本 | 替代 / 备注 |
|---|---|---|---|
| 框架 | React | 19.x | Vue / Solid 不选 |
| 构建 | Vite | 6.x | Webpack 不选 |
| 路由 | TanStack Router | 1.x | React Router 不选（类型差） |
| 数据 | TanStack Query | 5.x | SWR 备选 |
| 状态 | Zustand | 5.x | Redux 太重 / Jotai 备选 |
| 表单 | React Hook Form + Zod | 7.x / 3.x | Formik 不选 |
| 样式 | Tailwind CSS | 4.x | CSS-in-JS 不选 |
| UI | shadcn/ui + 自研 | latest | MUI 太重 |
| 动效 | Framer Motion | 11.x | - |
| i18n | i18next + react-i18next | 23.x / 14.x | - |
| 图标 | lucide-react | latest | - |
| 游戏 | PixiJS + Matter.js + Howler.js | 8.x / 0.20.x / 2.x | Phaser 备选 |
| 图表 | Recharts | 2.x | Chart.js 备选 |
| 编辑器 | Tiptap | 2.x | 后台富文本 |
| 表格 | TanStack Table | 8.x | 后台 |
| 日期 | date-fns | 3.x | dayjs 备选 |
| 测试 | Vitest + RTL + Playwright | latest | Jest 不选 |
| Storybook | 8.x | - | 组件文档 |

## 三、后端

| 层 | 技术 | 版本 | 替代 / 备注 |
|---|---|---|---|
| 运行时 | Node.js | 20.x LTS | Bun 备选（v2） |
| 框架 | Express | 4.x | Fastify v1.5 评估 |
| API 模式 | REST + tRPC | - | tRPC 仅前后端共享 |
| 验证 | Zod | 3.x | Joi 不选 |
| ORM | Drizzle ORM | latest | Prisma 备选（成本） |
| 队列 | BullMQ | 5.x | Agenda 不选 |
| 调度 | node-cron | 3.x | 简单定时 |
| 上传 | Multer + R2 SDK | - | - |
| 邮件 | Resend | latest | SES 备选 |
| 推送 | OneSignal SDK | - | FCM 备选 |
| WebSocket | ws + Socket.io | - | 客服 IM |
| 文件存储 | @aws-sdk/client-s3 (R2) | latest | - |
| 测试 | Vitest + Supertest | - | - |

## 四、AI / Workflow

| 用途 | 技术 | 备注 |
|---|---|---|
| 编排 | LangGraph (TS) | 节点 / 状态 / 条件 |
| 主创作 | Anthropic Claude Sonnet 4.5 | 长文 / 翻译 / 改写 |
| 副创作 | DeepSeek V3 | 简单生成 / 审稿（成本 1/10） |
| TTS | DeepSeek TTS / Azure | 句级音频 |
| ASR | Whisper (api) | 跟读评分 |
| Embedding | text-embedding-3-small | 语义检索 / 推荐 |
| 向量库 | Supabase pgvector | 已含 |
| 评估 | LangSmith | 链路追踪 + 评估 |

## 五、数据库

| 用途 | 技术 | 版本 | 备注 |
|---|---|---|---|
| 主库 | Supabase Postgres | 16.x | SG region |
| ORM | Drizzle | latest | 迁移 / 类型 |
| 缓存 | Upstash Redis | 7.x | session / cache |
| 队列 | BullMQ + Redis | - | - |
| 全文搜索 | Postgres FTS | - | v1 简单 |
| 高级搜索 | Meilisearch | latest | v1.5 上线 |
| 向量 | pgvector | - | RAG 推荐 |
| Object | Cloudflare R2 | - | S3 兼容 |
| KV | Cloudflare Workers KV | - | Feature Flags |

## 六、Auth / Security

| 用途 | 技术 | 备注 |
|---|---|---|
| 用户 Auth | Supabase Auth | OAuth / Email / Phone |
| 后台 Auth | 自实现 + Supabase Auth | RBAC |
| Session | JWT (短) + Refresh (Redis) | - |
| 加密 | Node crypto + libsodium | E2E 部分 |
| 密钥管理 | Doppler | 环境变量 |
| WAF | Cloudflare | DDoS / Bot |
| Captcha | Cloudflare Turnstile | 注册防刷 |
| Rate Limit | upstash/ratelimit | API |

## 七、部署 / 基础设施

| 层 | 技术 | 备注 |
|---|---|---|
| 静态站点 | Cloudflare Pages | - |
| API | Render (SG) → v1.5 Fly.io | 多区 |
| Worker | Render | 队列消费 |
| Cron | Render Cron | 定时任务 |
| CDN | Cloudflare | 全球 |
| 媒体 CDN | Cloudflare R2 + Image Resizing | - |
| DNS | Cloudflare | - |
| CI/CD | GitHub Actions | PR + Deploy |
| IaC | Terraform | (v1.5 引入) |

## 八、观测

| 用途 | 技术 | 备注 |
|---|---|---|
| Error 上报 | Sentry | FE + BE |
| 性能 | Sentry Performance | Tracing |
| 日志 | Better Stack (Logtail) | - |
| 指标 | Better Stack | 仪表板 |
| 告警 | Better Stack + PagerDuty | - |
| 行为分析 | PostHog (cloud) | 漏斗 / 留存 |
| 会话回放 | PostHog | 选择性开启 |
| 业务报表 | Metabase (自托管) | 后台 BI |
| Uptime | UptimeRobot | 多端探测 |

## 九、支付 / 商业

| 用途 | 技术 | 备注 |
|---|---|---|
| 支付主 | Paddle (MoR) | 全球结税 |
| 支付备 | LemonSqueezy | 备份方案 |
| 本地支付 | (按国后续) Xendit / Midtrans | v1.5 |
| 发票 / 报税 | Paddle 内置 | - |
| 分销跟踪 | 自实现 + Cookie | 30 天 cookie |

## 十、第三方集成

| 用途 | 服务 | 备注 |
|---|---|---|
| Google OAuth | Supabase Auth | - |
| Apple OAuth | Supabase Auth | - |
| TikTok OAuth | 自集成 | v1.5 |
| 短信 | Twilio | 仅必要 |
| 邮件 | Resend | 事务邮件 |
| 推送 | OneSignal | Web Push |
| IM 客服 | 自建 + Crisp 备 | - |
| 翻译辅助 | Claude / DeepL | 内容工厂 |
| 反垃圾 | Cloudflare Turnstile | - |

## 十一、开发 / 协作

| 用途 | 工具 |
|---|---|
| Repo | GitHub |
| Project | Linear / GitHub Projects |
| 文档 | Markdown in repo + Docusaurus（v1.5） |
| 设计 | Figma |
| 任务 | Linear |
| 沟通 | Slack |
| 流程 | BMAD（本套） |
| 代码评审 | GitHub PR |
| 包管理 | pnpm | 9.x |
| Monorepo | pnpm workspace + Turborepo | - |
| 提交规范 | Conventional Commits + commitlint | - |
| Hooks | Husky + lint-staged | - |
| Lint | ESLint + Prettier + Stylelint | - |

## 十二、版本锁定原则

- 主要框架锁主版本（如 react@^19.0.0）
- 业务依赖锁次版本（^x.y.0）
- 安全 / Bug 修复自动 patch
- Renovate Bot 每周 PR

## 十三、替代方案存档

| 选定 | 备选 | 不选理由 |
|---|---|---|
| Express | Fastify | 团队熟，Fastify v1.5 评估 |
| Drizzle | Prisma | Prisma 成本 + Generate 慢 |
| TanStack Router | React Router | 类型安全弱 |
| Tailwind v4 | Tailwind v3 | v4 性能 + 新特性 |
| pnpm | npm/yarn | pnpm 快、节省磁盘 |
| Render | Fly.io v1 | Render 简单；Fly v1.5 切换 |
| Cloudflare R2 | AWS S3 | 出流量免费 |
| Supabase | Self-hosted PG | 启动期省运维 |

## 十四、成本预算（v1 月度）

| 项 | 估算 USD |
|---|---|
| Cloudflare | $20 |
| Supabase Pro | $25 |
| Upstash | $20 |
| Render (API + Worker × 2) | $100 |
| Anthropic Claude | $300 |
| DeepSeek | $50 |
| Sentry | $26 |
| PostHog | $0 (free tier) |
| Better Stack | $30 |
| Resend | $20 |
| OneSignal | $0 (free tier) |
| Paddle / LS | 5% 流水 |
| Doppler | $0 |
| 域名 | $1 |
| **合计基础设施** | **≈ $620** |

v1.5：$3,000-5,000；v2：$15,000-25,000

## 十五、检查清单

- [ ] 全部依赖确认许可证（MIT / Apache 优先）
- [ ] 全部托管服务有 Singapore Region
- [ ] 有付费上限告警
- [ ] 有 SBOM
- [ ] 关键依赖有备选方案
