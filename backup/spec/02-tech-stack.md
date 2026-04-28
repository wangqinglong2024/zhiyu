# 02 · 技术选型矩阵（Tech Stack）

> **本文档受 [planning/00-rules.md](../00-rules.md) 强约束**：Docker-only、Supabase 全功能优先、本期 AI 为 mock。

---

## 一、整体原则

1. **TypeScript first**：全栈 strict。
2. **Docker only**：唯一开发/部署形态，禁止托管 SaaS。
3. **Supabase first**：数据/认证/存储/向量/实时一律走自托管 Supabase。
4. **缺 key 不阻塞**：所有第三方走 Adapter 接口，可回落 fake。
5. **本期 AI = mock**：未来才上 LangGraph + Vercel AI SDK；Dify 全局禁用。

---

## 二、前端

| 层 | 技术 | 版本 | 备注 |
|---|---|---|---|
| 框架 | React | 19.x | — |
| 构建 | Vite | 6.x | — |
| 路由 | TanStack Router | 1.x | 类型安全 |
| 数据层 | TanStack Query + Supabase JS | 5.x / 2.x | RPC 优先 supabase rpc |
| 状态 | Zustand | 5.x | — |
| 表单 | React Hook Form + Zod | 7.x / 3.x | — |
| 样式 | Tailwind CSS | 4.x | — |
| UI | shadcn/ui + 自研 | latest | — |
| 动效 | Framer Motion | 11.x | — |
| i18n | i18next + react-i18next | 23.x / 14.x | — |
| 图标 | lucide-react | latest | — |
| 游戏 | PixiJS + Matter.js + Howler.js | 8.x / 0.20.x / 2.x | — |
| 图表 | Recharts | 2.x | — |
| 编辑器 | Tiptap | 2.x | 后台富文本 |
| 表格 | TanStack Table | 8.x | 后台 |
| 日期 | date-fns | 3.x | — |
| 测试 | Vitest + RTL（容器内）| latest | E2E 见 §十二 |
| Storybook | 8.x（可选）| — | — |

---

## 三、后端

| 层 | 技术 | 版本 | 备注 |
|---|---|---|---|
| 运行时 | Node.js | 20.x LTS | docker `node:20-alpine` |
| 框架 | Express | 4.x | — |
| API 模式 | REST（OpenAPI）| — | tRPC 仅前后端共享类型 |
| 验证 | Zod | 3.x | 启动校验 + 入参校验 |
| ORM | Drizzle ORM | latest | drizzle-kit 迁移 |
| 队列 | BullMQ | 5.x | 复用现有 redis 容器 |
| 调度 | node-cron | 3.x | 容器内 |
| 日志 | pino | 9.x | 结构化 JSON |
| WebSocket | Supabase Realtime | — | 不再独立 Socket.io |
| 文件存储 | Supabase Storage SDK | latest | — |
| 测试 | Vitest + Supertest | — | 跑在 docker compose run |

---

## 四、数据 / 认证 / 存储（统一 Supabase 自托管）

| 用途 | 技术 | 备注 |
|---|---|---|
| 关系型主库 | Supabase Postgres 16 | schema：`zhiyu`（唯一环境） |
| 用户认证 | Supabase Auth (GoTrue) | 邮箱/OAuth/Phone |
| 后台认证 | 复用 Supabase Auth + RBAC 表 | `admin` role |
| 文件存储 | Supabase Storage | 4 桶 |
| 向量 | pgvector | RAG / 推荐 |
| 全文 | Postgres FTS | v1 |
| 实时 | Supabase Realtime | IM / 通知 |
| 缓存/队列 | Redis（既有 docker 容器，复用）| BullMQ + cache |
| 边缘函数 | Supabase Edge Functions | webhook 转发等 |

> **不引入**：Upstash、Cloudflare Workers KV、Pinecone、Meilisearch（v1）。

---

## 五、AI / Workflow（本期 = mock 接口）

| 用途 | 现状 | 未来方向 |
|---|---|---|
| 编排 | `WorkflowAdapter` 接口 + fixture | LangGraph (TS) |
| 模型调用 | `LLMAdapter` 接口 + fixture | Vercel AI SDK 统一 |
| 主创作模型 | （未集成）| Anthropic Claude Sonnet 4.5 |
| 副创作模型 | （未集成）| DeepSeek V3 |
| TTS | `TTSAdapter` mock | DeepSeek TTS / Azure |
| ASR | `ASRAdapter` mock | Whisper |
| Embedding | 真用 pgvector + 简易 hash 占位 | text-embedding-3-small |
| 评估 | — | LangSmith（可选）|

> **禁用**：Dify。任何文档不得新增 Dify 引用。

---

## 六、外部服务（全部 Adapter + 占位）

| 用途 | 接口 | 本期实现 | 未来 |
|---|---|---|---|
| 邮件 | `EmailAdapter` | console + 落 `outbox` 表 | Resend / SES |
| 短信 | `SmsAdapter` | console | 腾讯云短信 |
| 推送 | `PushAdapter` | console | OneSignal |
| 支付 | `PaymentAdapter` | dummy（直接成功）| Paddle / 微信支付 |
| Captcha | `CaptchaAdapter` | always-pass | Turnstile |
| 数据查询 | `WebSearchAdapter` | **走 Tavily MCP**（agent 侧）| 同 |

---

## 七、可观测性（本地栈）

| 用途 | 技术 | 备注 |
|---|---|---|
| 日志 | pino → JSON → docker logs / `*.log` | 字段：ts/level/service/env/req_id/user_id/msg |
| 指标 | `prom-client` 暴露 `/metrics` | 仅内网；后续接 Prometheus |
| 错误聚合 | 自建 `error_events` 表 + 后端写入 | 前端 `/api/v1/_telemetry/error` |
| 行为 | 自建 `events` 表 | 后台 Metabase 看板（v1.5）|
| 健康 | `/health` `/ready` | 容器 healthcheck |
| 状态页 | 自建（v1.5）| — |

> **禁用**：Sentry / PostHog / Better Stack / PagerDuty / UptimeRobot 等托管服务。

---

## 八、部署 / 基础设施

| 层 | 技术 | 备注 |
|---|---|---|
| 容器编排 | docker compose | dev / stg / prod 三套 yml |
| 反向代理 | nginx (`global-gateway` 容器) | 现有，配置在 `/opt/gateway/conf.d/` |
| TLS | Let's Encrypt + nginx | 仅后期生产上线时由用户自行配置，本规划不覆盖 |
| 数据库迁移 | drizzle-kit | 容器启动自检 |
| 备份 | pg_dump cron → `/opt/backups/zhiyu/` | 30 天 |
| 服务器 | 腾讯云 `115.159.109.23` 单台 | — |

> **禁用**：Cloudflare Pages / R2 / Workers / Render / Fly.io / Vercel / Netlify。

---

## 九、Auth / Security

| 用途 | 技术 | 备注 |
|---|---|---|
| 用户 Auth | Supabase Auth | 见 §四 |
| 后台 Auth | 同上 + RBAC 表 + TOTP | — |
| Session | Supabase JWT + httpOnly cookie | refresh 走 supabase |
| 加密 | Node crypto + libsodium | 关键字段加密存储 |
| 密钥管理 | `system/docker/.env` 单文件 + Zod 校验 | 不入 git |
| WAF | nginx 限流 + 自建中间件 | 未来再评估 Cloudflare |
| Captcha | Adapter 占位 | — |
| Rate Limit | `express-rate-limit` + Redis 后端 | — |

---

## 十、支付 / 商业（占位）

| 用途 | 本期 | 未来 |
|---|---|---|
| 订阅支付 | `PaymentAdapter` dummy | Paddle (MoR) |
| 国内支付 | 同上 | 微信支付 |
| 发票 | 落表占位 | 接通后由 PSP 提供 |
| 分销跟踪 | 自实现 cookie | 同 |

---

## 十一、开发 / 协作

| 用途 | 工具 |
|---|---|
| Repo | GitHub（仅托管代码，**不**用其 Actions）|
| 包管理 | pnpm 9.x |
| Monorepo | pnpm workspace + Turborepo |
| Hooks | husky + lint-staged |
| Lint | ESLint + Prettier |
| 提交 | Conventional Commits（**不强制** commitlint，可选）|
| 文档 | 仓库内 markdown |
| 流程 | BMAD |

---

## 十二、测试

| 层 | 工具 | 触发 |
|---|---|---|
| 单元 | Vitest + RTL | `docker compose run --rm app-fe pnpm test` |
| 集成 | Vitest + Supertest + Supabase（test schema）| `docker compose run --rm app-be pnpm test:int` |
| E2E | **MCP Puppeteer**（agent 驱动）→ `http://115.159.109.23:3100` `/4100` | agent 触发 |
| 视觉 | Storybook 截图（可选）| 容器内 |

---

## 十三、版本锁定原则

- 主框架锁主版本（`react@^19.0.0`）。
- 业务依赖锁次版本（`^x.y.0`）。
- 不接 Renovate Bot 自动 PR；季度人工 review。

---

## 十四、检查清单

- [ ] 全部依赖许可证 MIT/Apache
- [ ] 全部服务可在 docker compose 内启动
- [ ] 缺 key 时所有 Adapter 走 fake，启动不阻塞
- [ ] 不出现禁用关键词（Cloudflare/Render/Doppler/Sentry/PostHog/Better Stack/Dify）
