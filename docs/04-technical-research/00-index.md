# 04 · 技术研究（Technical Research）

> **研究范围**：知语技术栈端到端选型、架构、关键算法与合规
> **目标**：在用户既定的技术栈（TS+React / Node / Supabase / LangGraph / Vercel AI SDK / Paddle）下，验证可行性并细化关键决策
> **方法**：BMAD `bmad-technical-research` workflow，AI 自主推进
> **约束遵守**：项目规范 `grules/`（端口、Schema、容器命名、视觉禁紫色等）

## 文件结构

| 编号 | 文件 | 内容 |
|:---:|---|---|
| 01 | [01-architecture-overview.md](./01-architecture-overview.md) | 三环境架构、模块边界、调用链 |
| 02 | [02-frontend-stack.md](./02-frontend-stack.md) | Vite+React+TS、PWA、Tailwind、组件库、响应式 |
| 03 | [03-backend-supabase.md](./03-backend-supabase.md) | Express+TS API 层、Supabase（DB/Auth/Vector）、RLS、Edge Functions |
| 04 | [04-ai-pipeline-langgraph.md](./04-ai-pipeline-langgraph.md) | LangGraph(TS) 内容生成流水线 + Vercel AI SDK 简单调用 |
| 05 | [05-data-model-content.md](./05-data-model-content.md) | 数据库 schema（4 模块 + 用户体系），统一内容数据格式 |
| 06 | [06-payment-paddle-compliance.md](./06-payment-paddle-compliance.md) | Paddle MoR 接入、Webhook、退款、税务 |
| 07 | [07-anti-scrape-security.md](./07-anti-scrape-security.md) | 反爬技术栈、API 鉴权、内容水印、DDOS 防护 |
| 08 | [08-srs-algorithm.md](./08-srs-algorithm.md) | FSRS-5 算法详细实现 + 温故知新调度 |
| 09 | [09-game-tech-mobile.md](./09-game-tech-mobile.md) | 12 款游戏 H5 引擎选型、强制横屏、性能优化、移动端策略 |

## 关键技术决策摘要

| 维度 | 决策 |
|---|---|
| 前端 Web | Vite + React 18 + TS + Tailwind v4 + shadcn/ui + React Router 6 |
| PWA | Workbox + Service Worker，离线学习卡 |
| 状态管理 | Zustand + React Query（TanStack Query） |
| 国际化 | i18next（4 语种 v1：英 / 越 / 泰 / 印尼） |
| 后端 API | Express + TS + tsoa（自动 OpenAPI） |
| 数据库 | Supabase Postgres，三 schema（dev_zhiyu / stg_zhiyu / public） |
| 认证 | Supabase Auth（邮箱 + Google OAuth） |
| 向量 | Supabase pgvector（v2 用于 RAG 答疑） |
| 文件存储 | Supabase Storage（音频 / 图片 / 海报） |
| Edge Functions | Supabase Edge Functions（鉴权 + 限流 + 反爬关键路径） |
| AI 工作流 | LangGraph(TS) 用于内容生产工厂；Vercel AI SDK 用于简单调用 |
| LLM | Claude Sonnet（高质量）+ DeepSeek V3（大批量）双供应商 |
| TTS | Azure Speech（首选）+ ElevenLabs（备选） |
| 支付 | Paddle MoR + LemonSqueezy 备援 |
| 部署 | Vercel（前端）+ Docker（后端，遵循 grules 端口规则） |
| 监控 | Sentry + Plausible + Supabase Logs + Uptime Robot |
| CDN / WAF | Cloudflare（含 Turnstile 反爬验证） |
| 游戏引擎 | PixiJS（Canvas/WebGL，最轻量）+ Howler（音频） |
| 移动 | v1 PWA（Add to Home Screen）；v2 用 Capacitor 包成 App |

## 与 grules 对齐

- 端口：dev 前端 3000-3099 / dev 后端 8000-8099 / staging +100 / prod 不暴露
- Schema 隔离：dev_zhiyu / stg_zhiyu / public
- 容器命名：zhiyu-fe / zhiyu-be（prod）/ zhiyu-dev-fe / zhiyu-dev-be / zhiyu-stg-fe / zhiyu-stg-be
- 视觉规范：Cosmic Refraction 设计系统，Rose / Sky / Amber 三色，禁止紫色

进入 [`01-architecture-overview.md`](./01-architecture-overview.md)。
