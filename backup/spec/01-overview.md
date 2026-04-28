# 01 · 系统总览（System Overview）

> **顶层约束**：[planning/00-rules.md](../00-rules.md)。所有部署都在腾讯云 `115.159.109.23` 单台服务器、docker compose 编排。

---

## 一、上下文图（C4 Level 1，单服务器拓扑）

```
              ┌─────────────────────────────────────────┐
              │           SEA Learners (4 countries)    │
              │     Vietnam · Thailand · Indonesia · MY │
              └────┬────────────────────┬───────────────┘
                   │ HTTPS (prod) / HTTP+IP (dev/stg)   │
                   ▼                    ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  Mobile PWA      │  │  Browser PWA     │
        │  zhiyu-app-fe    │  │  zhiyu-admin-fe  │
        │  (3100)          │  │  (4100)          │
        └────────┬─────────┘  └────────┬─────────┘
                 │ /api/v1            │ /api/v1
                 ▼                     ▼
        ┌─────────────────────────────────────┐
        │  global-gateway (nginx)               │   ← 可选反代
        └──────────────────┬───────────────────┘
                           │ docker network: gateway_net
                           ▼
        ┌────────────────────────────────────────────────────┐
        │ Tencent Cloud single host  115.159.109.23          │
        │                                                    │
        │  zhiyu-app-be (8100)   zhiyu-admin-be (9100)       │
        │  zhiyu-worker (BullMQ)                             │
        │       │                                            │
        │       ├──► supabase-kong (8000) ── supabase-db     │
        │       │                       └─ supabase-auth     │
        │       │                       └─ supabase-storage  │
        │       │                       └─ supabase-realtime │
        │       │                       └─ supabase-edge-fn  │
        │       │                       └─ pgvector (in DB)  │
        │       │                                            │
        │       └──► zhiyu-redis (6379)                      │
        │                                                    │
        │  All services in docker; logs via pino → docker    │
        │  logs / files; metrics via /metrics (内网).         │
        └────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │ Agent / dev tools (在本地 IDE / CI 工程师机器)  │
  │  - Tavily MCP   → 数据/选题/资讯查询             │
  │  - Puppeteer MCP → E2E 浏览器测试 (端口直连)     │
  │  - Future LangGraph + Vercel AI SDK (本期不用)   │
  └─────────────────────────────────────────────────┘
```

---

## 二、子系统划分（C4 Level 2）

### 2.1 前端

| 应用 | 目录 | 端口 | 说明 |
|---|---|---|---|
| App PWA (C 端) | `apps/web` | 3100 | React 19 SPA + PixiJS 画布 |
| Admin Web (B 端) | `apps/admin` | 4100 | React 19 SPA |
| 共享 UI | `packages/ui` | — | 组件库 + Tokens（Storybook 可选）|
| 共享 SDK | `packages/sdk`、`packages/i18n` | — | API client、Supabase wrapper、i18n |

### 2.2 后端

| 服务 | 目录 | 端口 | 说明 |
|---|---|---|---|
| App API | `apps/api` | 8100 | Express，REST `/api/v1/*` |
| Admin API | `apps/admin-api` | 9100 | Express，REST `/api/v1/admin/*`（可与 App API 复用 codebase，按入口拆容器）|
| Worker | `apps/worker` | — | BullMQ 消费、定时任务、AI mock 编排 |

### 2.3 数据层（统一 Supabase 自托管）

- Postgres 16（主库 + pgvector + FTS）
- supabase-auth（用户与后台共用，role 区分）
- supabase-storage（4 桶：images / audio / uploads / backups）
- supabase-realtime（IM、推送）
- supabase-edge-functions（webhook 转发等）
- zhiyu-redis（cache + BullMQ）

### 2.4 AI 层（本期占位）

- `LLMAdapter`、`TTSAdapter`、`ASRAdapter`、`WorkflowAdapter`：接口契约 + fixture，缺 key 自动 fake。
- 未来：编排 LangGraph (TS)，模型走 Vercel AI SDK，供应商占位 Anthropic Claude / DeepSeek。

---

## 三、运行时拓扑

| 服务 | 运行时 | 部署 | 副本 |
|---|---|---|---|
| zhiyu-app-fe | nginx serve dist | docker compose | 1 |
| zhiyu-admin-fe | nginx serve dist | docker compose | 1 |
| zhiyu-app-be | Node 20 | docker compose | 1 |
| zhiyu-admin-be | Node 20 | docker compose | 1 |
| zhiyu-worker | Node 20 | docker compose | 1 |
| supabase-* | 现成镜像 | 既有 docker | — |
| zhiyu-redis | redis:7-alpine | docker compose | 1 |
| global-gateway | nginx | 既有 docker | — |

> 本项目只有一个环境：dev；生产由用户自行处理。

---

## 四、地域与延迟

- 主区域：腾讯云广州（用户主要为东南亚 → 后续 v1.5 评估迁 SG/HK 节点）。
- CDN：v1 不走外部 CDN；静态资源由 nginx 直接 gzip + 长 cache header。
- 目标：API P95 < 300ms（夜间窗口可能含跨境抖动）。

---

## 五、容量规划（v1 上线）

- DAU：1k → 10k
- API QPS 峰值：100
- 数据库：50GB
- Storage 桶：500GB
- AI 调用：本期 0（mock）

> v1.5 / v2 容量目标见 PRD 非功能需求；本架构在 v1 阶段单台主机容量充足。

---

## 六、性能目标

| 指标 | 目标 |
|---|---|
| API P50 | < 80ms |
| API P95 | < 300ms |
| API 错误率 | < 1% |
| 应用首屏 LCP | < 2.5s |
| 游戏加载 | < 3s |
| 可用性 (v1) | 99.5% / 月 |

---

## 七、扩展策略

### 7.1 单机内扩展
- API 多容器副本（compose `deploy.replicas`），nginx 负载均衡。
- Worker 按队列堆积手动扩副本。
- DB 暂垂直；> 200GB 评估读写分离（v2）。

### 7.2 跨机扩展（v2+）
- 增 1 台同 region 主机，主备 DB（supabase 提供 logical replication）。
- 媒体走对象存储（v2 再引入，本期 supabase-storage 足够）。

### 7.3 缓存
- API 响应 → Redis（用户/内容粒度）。
- Browser Service Worker → 静态资产。

---

## 八、单体 vs 微服务

**v1 单体优先**：4 个业务容器（app-be / admin-be / worker / fe×2）共享 codebase 与 Postgres；同 monorepo 多入口。

v2 评估拆分：内容工厂（资源密集）、IM（实时）独立服务。

---

## 九、范围与不做的事

### 9.1 范围

- C 端 PWA（Web / iOS PWA / Android PWA）
- 管理后台（Web）
- 12 款游戏 MVP
- 4 国本地化（vi / th / id / en）
- 商业模型：订阅 + 一次性 + 知语币 + 分销（支付走 Adapter，本期可不通真支付）
- 12 类目内容（中国发现、课程、小说等）

### 9.2 不做（本期）

- 真实 AI 调用（接口和数据流必须就位，模型用 mock）
- 原生 App（PWA 即可）
- 多人实时
- AR / VR
- 直播
- 境内合规深耕（v2+）
- 任何托管 SaaS（CI/CD/监控/部署）

---

## 十、Risk 列表

| Risk | 影响 | 缓解 |
|---|---|---|
| Supabase 单实例故障 | 中 | 每日 pg_dump → /opt/backups/zhiyu/，PITR 视情况开启 |
| 服务器单点 | 中 | 关键流程降级（只读模式）；v1.5 引入备机 |
| iOS PWA 限制 | 中 | 游戏走 PixiJS，避免不兼容 API |
| 4 语翻译质量 | 高 | 母语审稿 + 用户反馈 |
| AI 上线后成本 | 中 | Adapter 设阶梯，本期不发生 |
| 跨境延迟 | 中 | nginx HTTP/2 + 长 cache + gzip |

---

## 十一、技术债策略

- 每 Sprint 留 10% 处理技术债。
- 重大债走 Spike Story。
- AI Adapter 真实接入留作专门 epic（未来）。

---

## 十二、Change Log

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-04-25 | v1.0 | 初版（含 Cloudflare/Render/Sentry 等托管栈）|
| 2026-04-26 | v2.0 | 全面重写：单服务器 + Docker only + Supabase 全功能 + AI mock + 端口约定 |
