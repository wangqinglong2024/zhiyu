# 01 · 基础平台与工程骨架任务清单

## 来源覆盖

- `planning/rules.md`：Docker-only、唯一代码根、Supabase first、Adapter/fake、测试与种子数据铁律。
- `planning/spec/01-overview.md`：单服务器拓扑、子系统、端口、AI mock、v1 范围。
- `planning/spec/02-tech-stack.md`：React/Vite/Express/Drizzle/BullMQ/Supabase/Redis/pino/prom-client 等选型。
- `planning/spec/03-frontend.md`、`planning/spec/04-backend.md`、`planning/spec/05-data-model.md`：前端、后端、数据分层结构。
- `planning/spec/08-deployment.md`、`planning/spec/10-observability.md`：docker compose、健康检查、指标、日志。
- `planning/prds/01-overall/04-scope-mvp.md`、`09-release-plan.md`：W0 范围与发布门禁。

## 冲突裁决

- 多环境、托管 CI/CD、真实 AI、真实支付、外部监控等旧描述不落任务；统一转为 dev-only、Docker-only、自托管/Adapter/fake。
- 来源句：`planning/rules.md` 写明“Docker 是唯一开发与部署形态；Supabase 是唯一数据/认证/存储/向量底座；本期不集成任何外部托管 SaaS。”

## 任务清单

- [ ] FP-01 建立 `system/` monorepo 根，放置 `apps/`、`packages/`、`turbo.json`、`package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`、`docker/`。来源句：`planning/rules.md` 写明“所有可执行代码……必须落在 `/opt/projects/zhiyu/system/` 子目录下。”
- [ ] FP-02 创建 pnpm + Turborepo + TypeScript strict 基础工程。来源句：`planning/spec/02-tech-stack.md` 写明“TypeScript first：全栈 strict。”与“Monorepo | pnpm workspace + Turborepo”。
- [ ] FP-03 建立应用前端、后台前端、应用 API、后台 API、Worker 五个可执行入口。来源句：`planning/spec/01-overview.md` 表格写明“App PWA、Admin Web、App API、Admin API、Worker”。
- [ ] FP-04 固定端口与容器名：app-fe 3100、app-be 8100、admin-fe 4100、admin-be 9100、worker 内网。来源句：`planning/rules.md` 端口表写明这五类角色与主机端口。
- [ ] FP-05 编写 `system/docker/docker-compose.yml`，接入 `gateway_net` 与 `zhiyu-internal`。来源句：`planning/rules.md` 写明“Compose 项目名：zhiyu，唯一 compose 文件：system/docker/docker-compose.yml；网络：gateway_net + zhiyu-internal。”
- [ ] FP-06 编写所有服务 Dockerfile，多阶段 deps/build/runtime/dev，runtime 非 root。来源句：`planning/rules.md` 写明“多阶段 Dockerfile（deps / build / runtime）。”
- [ ] FP-07 编写 `system/.dockerignore`，排除 agent/规划/内容文档和 node_modules/env。来源句：`planning/rules.md` 写明“镜像内不得包含……planning、docs、china、course、games、novels……通过 .dockerignore 强制排除。”
- [ ] FP-08 配置 `system/docker/.env.example` 和 Zod 环境校验，非关键 key 回落 fake。来源句：`planning/rules.md` 写明“单一 .env 文件位于 system/docker/.env”与“缺失非关键 key 时 fallback mock 适配器并打 WARN 日志。”
- [ ] FP-09 接入 Supabase 自托管：Postgres schema `zhiyu`、Auth、Storage、Realtime、Edge Functions、pgvector。来源句：`planning/rules.md` 写明“本期所有数据/认证/存储/向量/实时/边缘函数需求默认走 Supabase 自托管。”
- [ ] FP-10 接入 Redis docker 容器供缓存、限流、BullMQ 使用。来源句：`planning/spec/02-tech-stack.md` 写明“缓存/队列 | Redis（既有 docker 容器，复用）| BullMQ + cache。”
- [ ] FP-11 建立 Express 分层模板：Route → Controller → Service → Repository → DB。来源句：`planning/spec/04-backend.md` 写明“每业务模块遵循同一结构”与“Route → Controller → Service → Repository → DB”。
- [ ] FP-12 建立统一 REST `/api/v1/*` 与 `/admin/api/*` 路由规范、分页、错误响应。来源句：`planning/spec/04-backend.md` 写明“公开 API 仍 REST”与响应格式 `{ data, meta, error }`。
- [ ] FP-13 建立 Drizzle 迁移骨架和 schema 文档策略，迁移随容器自检。来源句：`planning/rules.md` 写明“数据库迁移：drizzle-kit migrate，在 zhiyu-app-be 容器启动时自检。”
- [ ] FP-14 建立共享 SDK、i18n、UI、game-engine、games、config、types 包。来源句：`planning/spec/03-frontend.md` monorepo 包结构列出 `packages/ui`、`sdk`、`i18n`、`games`、`game-engine` 等。
- [ ] FP-15 建立 Adapter 包：Email/Sms/Push/Payment/Captcha/LLM/TTS/ASR/Workflow 全部有 fake 实现。来源句：`planning/spec/02-tech-stack.md` 写明“外部服务（全部 Adapter + 占位）”和“本期 AI = mock 接口”。
- [ ] FP-16 建立 pino JSON 日志、request_id、日志脱敏。来源句：`planning/spec/10-observability.md` 写明“Logs | pino JSON → docker logs / 落盘”与“敏感字段脱敏”。
- [ ] FP-17 建立 `/health`、`/ready`、`/metrics`，并将 `/metrics` 限内网。来源句：`planning/spec/10-observability.md` 写明“/health /ready /metrics 三端点”与“/metrics 仅 docker 内部网络”。
- [ ] FP-18 建立自建 `error_events` 与前端错误上报接口 `_telemetry/error`。来源句：`planning/spec/10-observability.md` 写明“前端全局拦截 → POST `/api/v1/_telemetry/error`”与“后端写入 `error_events` 表”。
- [ ] FP-19 建立自建 `events` 行为表与前端 track SDK。来源句：`planning/spec/10-observability.md` 写明“表：events { id, ts, user_id?, anon_id, type, props jsonb }”。
- [ ] FP-20 建立测试命令：容器内 vitest、supertest、MCP Puppeteer E2E。来源句：`planning/rules.md` 写明“单元 vitest、集成 vitest + supertest、E2E MCP Puppeteer”。
- [ ] FP-21 建立备份脚本：pg_dump 30 天保留，写入 `/opt/backups/zhiyu/<ts>/`。来源句：`planning/rules.md` 写明“备份：pg_dump -Fc cron 写到 /opt/backups/zhiyu/<ts>/，30 天保留。”
- [ ] FP-22 建立发布前自检脚本，检查禁用 SaaS、端口、Supabase、AI mock、Docker 验证、seed AC。来源句：`planning/rules.md` “自检清单（任何 spec/story PR 合入前）”列出这些项。
- [ ] FP-23 建立 W0 发布门禁清单，按 dev Docker 口径替换旧三环境/CI 描述。来源句：`planning/prds/01-overall/09-release-plan.md` 写明“Gate 1：W0 上线门”与 `planning/rules.md` 写明“只有一个环境 = dev”。

## 验收与测试

- [ ] FP-T01 `cd /opt/projects/zhiyu/system && docker compose -f docker/docker-compose.yml up -d --build` 可拉起业务容器。来源句：`planning/rules.md` 写明“system/docker/docker-compose.yml 一键拉起整套环境。”
- [ ] FP-T02 `curl` 校验 app/admin API `/health` 与 `/ready`。来源句：`planning/spec/10-observability.md` 写明“容器 HEALTHCHECK 走 /health；编排级就绪走 /ready。”
- [ ] FP-T03 缺第三方 key 时所有 fake adapter 返回 fixture，容器不退出。来源句：`planning/rules.md` 写明“禁止因缺 key 阻塞容器启动或测试。”
- [ ] FP-T04 docker 镜像内不含 `_bmad`、`planning`、`docs`、`content` 等非运行资产。来源句：`planning/rules.md` 写明“镜像内不得包含……非运行期资产。”
