# Epic E01 · 平台基础设施（Platform Foundation）

> **阶段**：M0 · **优先级**：P0 · **估算**：2 周
>
> **顶层约束**：[planning/00-rules.md](../00-rules.md)。本 Epic 所有 story 必须满足 Docker-only / Supabase 优先 / 端口约定 / AI mock。

## 摘要

搭建 monorepo 基础与本地 Docker 编排，让 4 个业务容器（app-fe/app-be/admin-fe/admin-be）+ worker 在 `115.159.109.23` 一条命令拉起，并通过既有 supabase 自托管栈完成数据/认证连通。

## 价值

- 第二天起所有团队即可在 Docker 内并行开发。
- 后续业务 Epic 不必再处理基础设施细节。

## 范围

- pnpm + Turborepo monorepo 骨架
- 4 apps + 共享 packages（仅占位 + 类型 + 基础工具）
- TypeScript strict 全链路
- ESLint + Prettier + husky + lint-staged（不引入 commitlint）
- `system/docker/docker-compose.dev.yml` 一键拉起
- `.env.example` + Zod 启动校验（缺非关键 key 走 fake adapter）
- Supabase schema `dev_zhiyu` 初始化 + 连通性验证
- Redis 容器 + BullMQ 骨架（一个 demo job）
- `/health` `/ready` `/metrics` 三端点 + pino JSON 日志
- E2E 烟雾测试通过 MCP Puppeteer 检查 4 个端口可访问

## 非范围

- 业务功能（用户、内容、游戏等）
- UI 实现（仅占位首页）
- 真实 AI 调用（仅 Adapter 接口 + fake）
- 任何托管 SaaS（CI / 部署 / 监控 / Secrets）→ 永久禁用
- nginx prod 域名 vhost（待生产域名敲定后单独 epic 处理）

## Stories（按需 6 个，不再硬凑 10）

### ZY-01-01 · 初始化 Monorepo 骨架
**As a** 开发者 **I want** pnpm + Turborepo 标准骨架 **So that** 后续可直接增加业务包。
**AC**
- [ ] 根 `package.json` + `pnpm-workspace.yaml` + `turbo.json`
- [ ] 4 apps 占位：`apps/web`（app-fe）、`apps/api`（app-be）、`apps/admin`、`apps/admin-api`、`apps/worker`
- [ ] 共享 packages：`packages/ui`（占位）、`packages/sdk`（API client + supabase wrapper 占位）、`packages/i18n`（占位）、`packages/config`（eslint/tsconfig 共享）
- [ ] 根 `tsconfig.base.json` strict + `noUncheckedIndexedAccess`，各 app extend
- [ ] `pnpm i && pnpm turbo build` 在容器内全绿
- [ ] 路径别名 `@zhiyu/*`
**Tech**：spec/02 §一、§十一；spec/03 §一
**测试**：`docker compose run --rm app-be pnpm -w typecheck`
**估**：M

### ZY-01-02 · 代码风格与本地 hooks
**AC**
- [ ] `packages/config` 提供共享 ESLint + Prettier + tsconfig
- [ ] husky + lint-staged：`pre-commit` 跑 lint/format 范围内
- [ ] 不引入 commitlint / 不接 GitHub Actions
- [ ] README 写明本地 hooks 安装步骤
**测试**：手动改一个文件触发 hook 通过
**估**：S

### ZY-01-03 · Docker Compose 一键拉起（dev）
**As a** 开发者 **I want** 一条命令启动整套环境 **So that** 30 分钟内新人可本地跑通。
**AC**
- [ ] `system/docker/docker-compose.dev.yml`：服务 `zhiyu-app-fe`(3100)、`zhiyu-app-be`(8100)、`zhiyu-admin-fe`(4100)、`zhiyu-admin-be`(9100)、`zhiyu-worker`、`zhiyu-redis`
- [ ] 加入 `gateway_net`（external，与 supabase 互通）+ `zhiyu-internal`
- [ ] 4 apps 各有多阶段 Dockerfile（deps / build / runtime / dev target）
- [ ] `.dockerignore` 排除 `.github`、`.agents`、`.claude`、`_bmad`、`planning`、`docs`、`china`、`course`、`games`、`novels`、`research`
- [ ] 镜像运行用户为非 root
- [ ] `docker compose up -d --build` 后所有容器 healthy
**Tech**：spec/08 §三~§五
**测试**：`docker compose ps` 全 healthy；`curl http://115.159.109.23:8100/health` 返回 200
**估**：L

### ZY-01-04 · Secrets 与启动校验
**AC**
- [ ] `system/docker/.env.example` 列全所有变量（DB URL、Supabase keys、JWT secret、可选 API key）
- [ ] `.env` 在 `.gitignore`
- [ ] 后端 `packages/config/env.ts` 用 Zod 校验，必填缺失则启动失败 + 清晰错误
- [ ] 可选 key 缺失：fallback 到 fake adapter + WARN 日志，不阻塞
**测试**：删除 `RESEND_API_KEY` 后启动应仅 WARN 而非崩溃
**估**：S

### ZY-01-05 · Supabase 接入与 schema 初始化
**AC**
- [ ] BE 通过 `SUPABASE_URL=http://supabase-kong:8000` + service role key 连通
- [ ] Drizzle 配置指向 `DATABASE_URL`，`search_path=dev_zhiyu`
- [ ] 启动时自动创建 schema `dev_zhiyu`（若不存在），并跑迁移
- [ ] 一张占位表 `_meta`（id / version / created_at）作为连通测试
- [ ] FE 通过 `VITE_SUPABASE_URL=http://115.159.109.23:8000` + anon key 可调用 supabase JS（demo：取 `_meta` 行数）
- [ ] Auth 连通验证：BE 调用 supabase admin API 列出 users（应为 0）
**Tech**：spec/02 §四；spec/05
**测试**：`docker compose run --rm app-be pnpm db:check`
**估**：M

### ZY-01-06 · Redis + BullMQ 骨架 + 健康端点 + 日志
**AC**
- [ ] BullMQ 连 `zhiyu-redis`，注册一个 demo queue `noop`，worker 每 30s 触发并打 INFO 日志
- [ ] BE 暴露 `/health`（200 + version + uptime）
- [ ] BE 暴露 `/ready`（依赖检查 DB + Redis + supabase-kong；任一 fail → 503）
- [ ] BE 暴露 `/metrics`（Prometheus 文本，仅内网；nginx 不暴露公网）
- [ ] pino 配置：JSON、字段 `ts/level/service/env/req_id/user_id?/msg`，request_id 中间件贯穿
- [ ] 前端全局 `window.onerror` + `unhandledrejection` POST `/api/v1/_telemetry/error`
- [ ] Adapter 占位：`EmailAdapter`、`SmsAdapter`、`PushAdapter`、`PaymentAdapter`、`CaptchaAdapter`、`LLMAdapter`、`TTSAdapter`、`ASRAdapter`、`WorkflowAdapter`，缺 key fall back to console fake
**Tech**：spec/02 §五~§七；spec/10
**测试**：`/ready` 200；停 redis 后 `/ready` 503；删 LLM key 启动 OK
**估**：M

## DoD（Definition of Done，整个 Epic）

- [ ] `git pull && cd system/docker && docker compose -f docker-compose.dev.yml up -d --build` 一条命令成功
- [ ] 4 个端口（3100 / 8100 / 4100 / 9100）从外网 `115.159.109.23` 可访问
- [ ] MCP Puppeteer 烟雾测试：访问 4 个 URL 各得到合理响应（首页/JSON）
- [ ] 缺第三方 API key 启动不报错，仅 WARN
- [ ] 不引用任何禁用 SaaS 关键词（自检：`grep -RE "Cloudflare|Render|Doppler|Sentry|PostHog|Better Stack|Dify" apps/ packages/ system/` 应只出现在 `.env.example` 注释或允许列表）
- [ ] backup cron 装好（`/opt/backups/zhiyu/<ts>/`）

## 风险

- supabase 单实例故障 → 每日 pg_dump + 演练恢复
- 端口被占用 → 启动前自动检测 + 清晰报错

## 引用

- [planning/00-rules.md](../00-rules.md)
- [spec/02-tech-stack.md](../spec/02-tech-stack.md)
- [spec/08-deployment.md](../spec/08-deployment.md)
- [spec/10-observability.md](../spec/10-observability.md)
