---
stepsCompleted: ["init","context-scan","tech-stack","frontend","backend","data","ai","integrations","deployment","security","observability","factory"]
inputDocuments:
  - planning/prds/**
  - planning/ux/**
---

# 知语 Zhiyu · 技术架构总目录（Solution Architecture）

> **作者**：Architect Agent (BMAD `bmad-create-architecture`)
> **日期**：2026-04-25
> **依据**：`planning/prds/**` 全 15 模块 + `planning/ux/**` 16 文件
> **目标**：为 12-15 月内交付 v1（4 国 SEA 上线）+ v1.5（功能扩展）+ v2（规模化）的完整技术方案

---

## 文件结构

| # | 文件 | 内容 | 状态 |
|:---:|---|---|:---:|
| 00 | [00-index.md](./00-index.md) | 总目录 | ✅ |
| 01 | [01-overview.md](./01-overview.md) | 系统总览、上下文图、关键架构决策（ADR 索引） | ✅ |
| 02 | [02-tech-stack.md](./02-tech-stack.md) | 技术选型矩阵 + 版本锁定 + 替代方案理由 | ✅ |
| 03 | [03-frontend.md](./03-frontend.md) | 前端架构（应用 PWA + 后台 Web + 共享 packages） | ✅ |
| 04 | [04-backend.md](./04-backend.md) | 后端架构（Node/Express/Fastify + REST/RPC + Job） | ✅ |
| 05 | [05-data-model.md](./05-data-model.md) | 数据库 Schema 全表、RLS 策略、索引、迁移流程 | ✅ |
| 06 | [06-ai-factory.md](./06-ai-factory.md) | LangGraph 内容工厂 + Claude/DeepSeek 编排 + 评估 | ✅ |
| 07 | [07-integrations.md](./07-integrations.md) | Paddle / LemonSqueezy / OAuth / TTS / OneSignal 等第三方 | ✅ |
| 08 | [08-deployment.md](./08-deployment.md) | 多环境部署、CI/CD、Cloudflare、监控、回滚 | ✅ |
| 09 | [09-security.md](./09-security.md) | 认证授权、加密、合规、隐私、风控 | ✅ |
| 10 | [10-observability.md](./10-observability.md) | 日志、监控、追踪、告警、SLO | ✅ |
| 11 | [11-game-engine.md](./11-game-engine.md) | PixiJS 游戏引擎共享层 + 12 游戏插件接入 | ✅ |
| 12 | [12-realtime-and-im.md](./12-realtime-and-im.md) | 客服 IM、实时通知、WebSocket / SSE | ✅ |

---

## 关键架构决策（ADR 索引）

| ADR # | 决策 | 理由 |
|:---:|---|---|
| 001 | 单体 monorepo (pnpm workspace) | 团队规模 ≤ 20，复用度高 |
| 002 | TypeScript strict 全栈 | 类型安全 + IDE 体验 |
| 003 | Vite + React 19 + TanStack Router | 快、类型安全、SSR 可选 |
| 004 | Tailwind v4 + shadcn/ui + 自研 packages/ui | 快速搭建 + 可控 |
| 005 | Express + Fastify 混合（v1 Express，v1.5 评估 Fastify） | 团队熟 + 性能 |
| 006 | Supabase Postgres 16 (托管) | RLS + Auth + Storage 一站 |
| 007 | LangGraph + Claude Sonnet 4.5（写作）+ DeepSeek V3（审稿） | 编排 + 多模型分工 |
| 008 | PixiJS v8 + Matter.js + Howler.js | 游戏 60fps + 物理 + 音频 |
| 009 | Cloudflare（CDN/WAF/Workers/R2） | 全球 + 东南亚低延迟 |
| 010 | Paddle MoR + LemonSqueezy 备份 | 全球结税 + 备份 |
| 011 | i18next 4 语 + 内容多语言独立表 | UI 与内容分离 |
| 012 | OneSignal 推送 + Server-Sent Events | 简单 + 跨平台 |
| 013 | Redis（Upstash 托管）作 cache + queue | 轻量 + serverless 友好 |
| 014 | BullMQ 作业队列 | 内容工厂 / 报表生成 |
| 015 | Sentry 错误 + PostHog 行为 + Better Stack 日志 | 三件套 |

## 上下游消费

- **前端开发**：03 / 11 / 12
- **后端开发**：04 / 05 / 07 / 12
- **AI 工程师**：06
- **DevOps**：08 / 10
- **安全 / 合规**：09
- **产品 / PM**：01 / 06（理解工厂能力边界）

## Change Log

| 日期 | 版本 | 作者 | 变更 |
|---|---|---|---|
| 2026-04-25 | v1.0 | Architect Agent | 初版完整技术架构（12 文件） |
