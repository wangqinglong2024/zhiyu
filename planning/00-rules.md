# Zhiyu 项目工程铁律（Source of Truth）

> **生效日期**：2026-04-26 · **版本**：v1.0
>
> **本文档高于一切其它 spec/epic/story**。任何文档与本文冲突，以本文为准。
> 任何 PR/story 在落地前必须自证不违反本文。

---

## 0. 用一句话概括

> **Docker 是唯一开发与部署形态；Supabase 是唯一数据/认证/存储/向量底座；本期不集成任何外部托管 SaaS。**

---

## 1. 唯一开发环境 = Docker

### 1.1 强约束

- 本项目**只有一个环境**：dev。不产出 staging / prod 配置与文档；生产由用户自行处理。
- 所有 app / api / admin / worker 必须以 docker compose 启动；**禁止**「主机直接 `pnpm dev`」作为开发主流程。
- 不得引入：GitHub Actions / GitLab CI / CircleCI 等任何托管 CI；不得引入 Cloudflare Pages / Render / Vercel / Fly.io / Netlify 等任何托管部署；不得引入 Doppler / Vault Cloud 等托管 secrets。
- 唯一服务器：腾讯云 `115.159.109.23`；外网通过 IP+端口直连（防火墙已开）。
- 项目根目录提供 `system/docker/docker-compose.yml` 一键拉起整套环境；新人 30 分钟可跑通。

### 1.1.1 唯一代码根 = `/opt/projects/zhiyu/system/`【强铁律】

- **所有可执行代码（`apps/`、`packages/`、`turbo.json`、`package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`tsconfig.base.json`、`docker/` 等）必须落在 `/opt/projects/zhiyu/system/` 子目录下**。
- **禁止**在 `/opt/projects/zhiyu/` 仓库根直接放业务代码；根目录只允许：规划与文档目录（`planning/`、`docs/`、`china/`、`course/`、`games/`、`novels/`）、agent 配置（`.github/`、`.agents/`、`.claude/`、`_bmad/`）、`env.md`、`.gitignore`、`README.md`、`system/`。
- 在所有 spec / epic / story 内出现的 `apps/web`、`packages/ui`、`turbo.json` 等相对路径，**实际物理路径 = `/opt/projects/zhiyu/system/<相对路径>`**。
- Docker compose `context` 一律以 `system/` 为根；任何 `cd /opt/projects/zhiyu` 后跑 `pnpm install` 的写法均视为错误，正确写法是 `cd /opt/projects/zhiyu/system && pnpm install`。
- `.dockerignore` 与 `.gitignore` 必须位于 `system/` 内。仓库根的 `.gitignore` 仅规避 `system/node_modules`、`system/dist`、`system/.env` 等。

### 1.2 镜像构建规则

- 多阶段 Dockerfile（deps / build / runtime）。
- 镜像内**不得**包含：`.github/`、`.agents/`、`.claude/`、`_bmad/`、`planning/`、`docs/`、`china/`、`course/`、`games/`、`novels/`、`research/` 等非运行期资产；通过 `.dockerignore` 强制排除。
- 缺失第三方 API key 时使用 mock/fake 适配器，**禁止**因缺 key 阻塞容器启动或测试。

---

## 2. 端口、容器、域名约定

| 角色 | 容器名 | 端口（容器内）| 端口（主机）| 外网访问 |
|---|---|---|---|---|
| 应用前端 (C 端 PWA) | `zhiyu-app-fe` | 80 | **3100** | `http://115.159.109.23:3100` |
| 应用后端 API | `zhiyu-app-be` | 8080 | **8100** | `http://115.159.109.23:8100` |
| 管理后台前端 | `zhiyu-admin-fe` | 80 | **4100** | `http://115.159.109.23:4100` |
| 管理后台后端 | `zhiyu-admin-be` | 8080 | **9100** | `http://115.159.109.23:9100` |
| Worker（队列消费）| `zhiyu-worker` | — | — | 内网 |

- **本项目只有一个环境 = dev**。不设 staging / prod；不设 `docker-compose.stg.yml` / `docker-compose.prod.yml`。生产上线事项由用户自行处理，不在本规划范围。
- 4 个对外端口主机已防火墙放行。
- Compose 项目名：`zhiyu`，唯一 compose 文件：`system/docker/docker-compose.yml`；网络：`gateway_net`（与 Supabase / nginx 互通）+ `zhiyu-internal`。

---

## 3. Supabase 全功能优先

本期所有「数据/认证/存储/向量/实时/边缘函数」需求**默认走 Supabase 自托管**（已部署在 `supabase-*` 容器）：

| 需求 | 必走 | 备注 |
|---|---|---|
| 关系型数据 | `supabase-db` (Postgres 16) | schema：`zhiyu`（唯一环境） |
| 用户认证 | `supabase-auth` (GoTrue) | 邮箱 + OAuth + Phone；后台管理员复用同实例不同 role |
| 文件存储 | `supabase-storage` | 4 桶（images/audio/uploads/backups）|
| 向量检索 | Postgres `pgvector` | RAG / 推荐；不另搭 Pinecone/Weaviate |
| 全文搜索 | Postgres FTS | v1；Meilisearch 在 v1.5 评估 |
| 实时通道 | `supabase-realtime` | 客服 IM / 通知推送，不再独立 Socket.io |
| Edge Functions | `supabase-edge-functions` | 轻量边缘逻辑（如 webhook 转发）|
| 后台管理 UI | `supabase-studio` (`https://supabase.ideas.top`) | 直接复用 |

后端连接：`SUPABASE_URL=http://supabase-kong:8000`；前端：`VITE_SUPABASE_URL=http://115.159.109.23:8000`（dev）。

---

## 4. AI 与第三方集成

### 4.1 AI（本期不实施真功能）

- **本期 dev 不集成任何真实 AI 调用**。所有 AI 相关接口（内容工厂、AI 评分、AI 客服辅助、翻译辅助等）以**接口契约 + mock 适配器**落地，返回 fixture 数据，便于前后端联调。
- 未来技术方向（不影响本期）：编排用 **LangGraph (TS)**，模型调用统一走 **Vercel AI SDK**；模型供应商占位 Anthropic Claude / DeepSeek。
- **全局禁用 Dify**：任何 spec/story 中提及 Dify 一律视为待清除。

### 4.2 数据查询/抓取

- 需要外部知识/资讯查询（如内容工厂选题、市场情报）一律走 **Tavily MCP**；不内嵌爬虫；不集成 SerpAPI / Bing API。

### 4.3 其它第三方

| 类目 | 选型 | 状态 |
|---|---|---|
| 邮件 | 后端预留 `EmailAdapter` 接口；本期默认 console 输出 | 占位 |
| 短信 | 同上 `SmsAdapter` | 占位 |
| 推送 | 同上 `PushAdapter`；未来接 OneSignal | 占位 |
| 支付 | 同上 `PaymentAdapter`；未来接 Paddle / 微信支付 | 占位 |
| OAuth | 走 Supabase Auth 提供的 Google/Apple/GitHub | 启用 |
| Captcha | 占位接口；未来接 Cloudflare Turnstile 或自建 | 占位 |

> 所有 Adapter 接口必须可在缺 key 时回落到 fake 实现，**测试与本地不得因此卡住**。

---

## 5. 测试

| 层 | 工具 | 跑法 |
|---|---|---|
| 单元 | vitest | 容器内 `pnpm test` |
| 集成 | vitest + supertest + 测试库（真 supabase 实例 + schema `test_zhiyu_<run>`）| docker compose run --rm api-test |
| E2E | **MCP Puppeteer**（浏览器自动化）→ 直连 `http://115.159.109.23:3100` 与 `:4100` | agent 驱动 |
| 视觉 | Storybook 截图（可选）| 容器内 |
| 负载 | 暂不强制 | — |

- **禁止**新增基于 Playwright Cloud / BrowserStack 的远程测试。
- 任何 story 的 DoD 必须包含「测试方法」+「跑过的命令/截图」。

---

## 6. 可观测性（本地栈）

- 错误：禁用 Sentry SaaS；后端用 `pino` 输出 JSON，错误入 `error.log`，前端用全局 `window.onerror` + `unhandledrejection` POST 到 `/api/v1/_telemetry/error`。
- 指标：`/metrics` Prometheus 格式（仅内网）；可选拉一个 `prometheus + grafana` docker（v1.5 决定）。
- 日志聚合：先 docker logs；P1 阶段引入 Loki + Promtail（自托管 docker，可选）。
- 行为分析：禁用 PostHog SaaS；自建 `events` 表 + 后端写入接口；后台报表用 Supabase + Metabase（可选 v1.5）。
- 上线必须的：`/health`、`/ready`、`/metrics`、结构化 JSON 日志、错误前后端关联 (request_id)。

---

## 7. CI/CD

- 不接任何托管 CI。
- 本地预提交：`husky` + `lint-staged`（lint / typecheck / unit test 范围内）。
- 每次部署/重启：人工 SSH 到 `115.159.109.23`，进入 `system/docker`，执行 `docker compose up -d --build`。不存在 staging/prod 分支。
- 数据库迁移：`drizzle-kit migrate`，在 `zhiyu-app-be` 容器启动时自检；破坏性迁移分两步（add → backfill → drop）。
- 备份：`pg_dump -Fc` cron 写到 `/opt/backups/zhiyu/<ts>/`，30 天保留；外加 supabase 自带 PITR（若启）。

---

## 8. Secrets 管理

- 单一 `.env` 文件位于 `system/docker/.env`，不进 git（`.gitignore`）。
- `.env.example` 入 git，覆盖所有必填字段。
- 启动时后端用 Zod 强校验环境变量；缺失非关键 key 时 fallback mock 适配器并打 WARN 日志。

---

## 9. Story 写作约束（覆盖所有 epic）

- 故事数量按需出，不再硬凑 10。每个 story 必须有明确 AC + DoD + 测试方法。
- 每个 story 必须可在 Docker 内独立验证（提供 `docker compose run` 命令或 MCP 浏览器步骤）。
- 禁止出现：GitHub Actions、Cloudflare Pages、Render、Doppler、Sentry、PostHog、Better Stack、Dify、Pulumi、Terraform 等关键词；如必须提及作为「未来评估」请明确标 `(deferred)`。

---

## 10. 自检清单（任何 spec/story PR 合入前）

- [ ] 不引入禁用 SaaS（见 §1.1 / §6 / §9）
- [ ] 端口符合 §2
- [ ] 数据/认证/存储/向量需求走 Supabase（见 §3）
- [ ] AI 相关用 mock 适配器（见 §4.1）
- [ ] 测试方法明确（见 §5）
- [ ] 可在 docker compose 内验证
- [ ] 缺 key 不阻塞启动（见 §1.2）
