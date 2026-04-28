---
stepsCompleted: ["init","tech-stack","frontend","backend","data","integrations","deployment","security","observability","game-engine","realtime"]
inputDocuments:
  - planning/00-rules.md
  - planning/prds/**
  - planning/ux/**
---

# 知语 Zhiyu · 技术架构总目录

> **顶层约束**：[planning/00-rules.md](../00-rules.md)（Docker only / Supabase first / AI mock 期）。
>
> **作者**：Architect Agent
> **日期**：2026-04-26（v2.0，按新规则全面重写）

---

## 文件结构

| # | 文件 | 内容 | 状态 |
|:---:|---|---|:---:|
| 00 | [00-index.md](./00-index.md) | 总目录 + ADR 索引 | ✅ |
| 01 | [01-overview.md](./01-overview.md) | 系统总览、单服务器拓扑 | ✅ |
| 02 | [02-tech-stack.md](./02-tech-stack.md) | 技术选型矩阵（Docker only） | ✅ |
| 03 | [03-frontend.md](./03-frontend.md) | 前端架构（应用 + 后台 PWA） | ⚠️ 待对齐新规则 |
| 04 | [04-backend.md](./04-backend.md) | 后端（Express，REST + Supabase） | ⚠️ 待对齐新规则 |
| 05 | [05-data-model.md](./05-data-model.md) | Supabase Postgres schema、RLS、索引 | ✅ |
| 06 | [06-ai-factory.md](./06-ai-factory.md) | AI 工厂接口（本期 mock） | ⚠️ 待降级为 Adapter 占位 |
| 07 | [07-integrations.md](./07-integrations.md) | 第三方 Adapter 接口 | ⚠️ 待对齐新规则 |
| 08 | [08-deployment.md](./08-deployment.md) | docker-compose 部署 | ✅ |
| 09 | [09-security.md](./09-security.md) | Auth、加密、风控 | ⚠️ 小修 |
| 10 | [10-observability.md](./10-observability.md) | 本地栈日志/指标/告警 | ✅ |
| 11 | [11-game-engine.md](./11-game-engine.md) | PixiJS 游戏引擎 | ⚠️ 小修 |
| 12 | [12-realtime-and-im.md](./12-realtime-and-im.md) | Supabase Realtime IM | ⚠️ 小修 |

> ⚠️ 标记的文件保留主体内容，**仅替换违规段落**（Cloudflare/Render/Doppler/Sentry/PostHog/Better Stack/Dify → 对应本地等价物或 Adapter 占位）。下一波次专项处理。

---

## 关键架构决策（ADR 索引）

| ADR # | 决策 | 理由 |
|:---:|---|---|
| 001 | 单体 monorepo (pnpm + Turborepo) | 团队 ≤ 20，复用度高 |
| 002 | TypeScript strict 全栈 | 类型安全 |
| 003 | Vite + React 19 + TanStack Router | 类型安全 + 速度 |
| 004 | Tailwind v4 + shadcn/ui | 快速搭建 |
| 005 | Express（v1）；Fastify v1.5 评估 | 团队熟 |
| 006 | **Supabase 自托管**（DB+Auth+Storage+Realtime+Edge+pgvector） | 一站式，单服务器自治 |
| 007 | **本期 AI = Adapter mock**；未来 LangGraph + Vercel AI SDK | 新规则要求 |
| 008 | PixiJS v8 + Matter.js + Howler.js | 60fps + 物理 + 音频 |
| 009 | **唯一编排 = docker compose**（dev/stg/prod 三 yml） | 新规则要求 |
| 010 | **支付 Adapter 占位**；未来 Paddle / 微信 | 新规则要求 |
| 011 | i18next 4 语 + 内容多语言独立表 | UI 与内容分离 |
| 012 | **通知/推送 Adapter 占位**（本期 console）；未来 OneSignal | 新规则要求 |
| 013 | **Redis 自托管 docker** + BullMQ | 不依赖 Upstash |
| 014 | **可观测性本地栈**（pino + prom-client + 自建表） | 不依赖 Sentry/PostHog/Better Stack |
| 015 | **Web 数据查询走 Tavily MCP**（agent 侧） | 新规则要求 |
| 016 | **Dify 全局禁用** | 新规则要求 |

---

## 上下游消费

- **前端开发**：03 / 11 / 12
- **后端开发**：04 / 05 / 07 / 12
- **DevOps**：08 / 10
- **安全 / 合规**：09
- **产品 / PM**：01 / 06

## Change Log

| 日期 | 版本 | 作者 | 变更 |
|---|---|---|---|
| 2026-04-25 | v1.0 | Architect Agent | 初版 |
| 2026-04-26 | v2.0 | Architect Agent | 全面重写以符合 00-rules.md：移除 Cloudflare/Render/Doppler/Sentry/PostHog/Better Stack/Dify；落实 Docker-only、Supabase 全功能优先、AI mock 期。03/04/06/07/09/11/12 待下一波次精修。 |
