# 08 · 部署（Docker Only · 单一 dev 环境）

> **本文档受 [planning/00-rules.md](../00-rules.md) 强约束**：唯一编排=docker compose；唯一服务器=`115.159.109.23`；**只有一个环境 = dev**；不产出 staging/prod；禁用任何托管 CI/CD/部署 SaaS。

---

## 一、环境

| 环境 | 触发方式 | Compose 文件 | 访问 |
|---|---|---|---|
| **dev（唯一）** | 人工 SSH `docker compose up` | `system/docker/docker-compose.yml` | `http://115.159.109.23:{3100,8100,4100,9100}` |

> 生产上线由用户自行处理，不在本规划范围；不存在 `docker-compose.stg.yml` / `docker-compose.prod.yml`。

---

## 二、端口与容器

| 角色 | 容器名 | 主机端口 |
|---|---|---|
| 应用前端 | `zhiyu-app-fe` | 3100 |
| 应用后端 | `zhiyu-app-be` | 8100 |
| 管理前端 | `zhiyu-admin-fe` | 4100 |
| 管理后端 | `zhiyu-admin-be` | 9100 |
| Worker | `zhiyu-worker` | — 内网 |
| Redis | `zhiyu-redis` | — 内网 |

防火墙：4 个对外端口在腾讯云安全组与 ufw 已放行。

---

## 三、网络与依赖

```
┌────────────────────────────────────────────┐
│ Docker host (115.159.109.23)               │
│                                            │
│  network: gateway_net (external)           │
│   ├─ global-gateway (nginx)                │
│   ├─ supabase-kong (8000) ── 数据/Auth    │
│   ├─ supabase-studio                       │
│   └─ zhiyu-* 业务容器                      │
│                                            │
│  network: zhiyu-internal                   │
│   ├─ zhiyu-app-be ── zhiyu-redis           │
│   ├─ zhiyu-admin-be                        │
│   └─ zhiyu-worker                          │
└────────────────────────────────────────────┘
```

- 所有 zhiyu 业务容器同时加入 `gateway_net`（访问 supabase）与 `zhiyu-internal`（内部互通）。
- Redis：自带 `zhiyu-redis`（不复用其他项目的 redis）。
- DB：复用 `supabase-db`，schema `zhiyu`。

---

## 四、Compose 结构

```
system/docker/
├── docker-compose.yml
├── .env.example
└── .env                          # gitignored
```

`docker-compose.yml`：

```yaml
name: zhiyu

networks:
  gateway_net:
    external: true
  zhiyu-internal:
    driver: bridge

x-app-env: &app-env
  APP_ENV: dev
  PROJECT_NAME: zhiyu
  SUPABASE_URL: http://supabase-kong:8000
  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
  DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/postgres?search_path=zhiyu
  REDIS_URL: redis://zhiyu-redis:6379/0
  JWT_SECRET: ${JWT_SECRET}

services:
  zhiyu-app-be:
    build: { context: .., dockerfile: apps/api/Dockerfile, target: dev }
    container_name: zhiyu-app-be
    environment: { <<: *app-env, ROLE: app-api }
    ports: ["8100:8080"]
    networks: [gateway_net, zhiyu-internal]
    depends_on: [zhiyu-redis]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
      interval: 30s

  zhiyu-app-fe:
    build: { context: .., dockerfile: apps/web/Dockerfile, target: dev }
    container_name: zhiyu-app-fe
    environment:
      VITE_API_BASE: http://115.159.109.23:8100
      VITE_SUPABASE_URL: http://115.159.109.23:8000
      VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    ports: ["3100:80"]
    networks: [gateway_net, zhiyu-internal]
    depends_on: [zhiyu-app-be]

  zhiyu-admin-be:
    build: { context: .., dockerfile: apps/admin-api/Dockerfile, target: dev }
    container_name: zhiyu-admin-be
    environment: { <<: *app-env, ROLE: admin-api }
    ports: ["9100:8080"]
    networks: [gateway_net, zhiyu-internal]
    depends_on: [zhiyu-redis]

  zhiyu-admin-fe:
    build: { context: .., dockerfile: apps/admin/Dockerfile, target: dev }
    container_name: zhiyu-admin-fe
    environment:
      VITE_API_BASE: http://115.159.109.23:9100
      VITE_SUPABASE_URL: http://115.159.109.23:8000
      VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    ports: ["4100:80"]
    networks: [gateway_net, zhiyu-internal]
    depends_on: [zhiyu-admin-be]

  zhiyu-worker:
    build: { context: .., dockerfile: apps/worker/Dockerfile, target: dev }
    container_name: zhiyu-worker
    environment: { <<: *app-env, ROLE: worker }
    networks: [gateway_net, zhiyu-internal]
    depends_on: [zhiyu-redis]

  zhiyu-redis:
    image: redis:7-alpine
    container_name: zhiyu-redis
    networks: [zhiyu-internal]
    volumes: [zhiyu-redis-data:/data]

volumes:
  zhiyu-redis-data:
```

---

## 五、Dockerfile 规范

- 多阶段：`deps` → `build` → `runtime`，可选 `dev` target（启动 vite/tsx watch）。
- 基础镜像：`node:20-alpine`。
- runtime 阶段以非 root `node` 用户运行。
- `.dockerignore` 必含：

```
.git
.github
.agents
.claude
_bmad
planning
docs
china
course
games
novels
research
**/node_modules
**/.env
**/.env.*
!**/.env.example
```

示例（apps/api/Dockerfile）：

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml turbo.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/ ./packages/
RUN corepack enable && pnpm i --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm turbo build --filter=api

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
USER app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 8080
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["node", "dist/server.js"]

FROM deps AS dev
COPY . .
ENV NODE_ENV=development
EXPOSE 8080
CMD ["pnpm", "--filter=api", "dev"]
```

---

## 六、部署/重启流程（人工 SSH，不接托管 CI）

```bash
ssh root@115.159.109.23
cd /opt/projects/zhiyu/system
git pull
cd system/docker
docker compose up -d --build
docker compose ps
docker compose run --rm zhiyu-app-be pnpm db:migrate
curl -fsS http://115.159.109.23:8100/health
curl -fsS http://115.159.109.23:9100/health
```

---

## 七、数据库迁移

- 工具：`drizzle-kit`。
- 文件：`apps/api/drizzle/migrations/*.sql`（入 git）。
- 时机：BE 容器启动时执行 `pnpm db:migrate`；失败则容器健康检查不通过。
- 安全：破坏性改动分两步（add → backfill → drop column），单 PR 不混合。

---

## 八、Secrets

- 文件：`system/docker/.env`，模板 `system/docker/.env.example`。
- 启动时后端用 Zod 校验：必填项缺失 → 启动失败；可选项缺失 → fallback fake adapter + WARN 日志。
- 禁止：把 secrets 写入 dockerfile / compose 内联 / 入 git。

---

## 九、备份与恢复

| 对象 | 工具 | 频率 | 保留 | 路径 |
|---|---|---|---|---|
| Supabase 主库 | `pg_dump -Fc` cron | 每日 02:00 | 30 天 | `/opt/backups/zhiyu/<ts>/full.dump` |
| schema `zhiyu` | `pg_dump --schema=zhiyu` | 每日 | 30 天 | `/opt/backups/zhiyu/<ts>/schema-zhiyu.sql` |
| Supabase Storage | rsync 桶目录 | 每日 | 30 天 | `/opt/backups/zhiyu-storage/` |
| Redis | RDB | 每小时 | 24 小时 | `zhiyu-redis-data` volume |

恢复脚本：仓库 `system/scripts/restore.sh`。

---

## 十、回滚

- 应用：保留上一稳定镜像 tag；`docker compose up -d --no-build` 切回。
- 数据库：迁移脚本必带 `down`；对破坏性回滚从最近 dump 还原。

---

## 十一、健康检查

每个服务必须暴露：
- `GET /health` → 200 + `{"status":"ok","version":"<git sha>","uptime":<sec>}`
- `GET /ready` → 检查 DB / Redis / Supabase 连通；任一失败 → 503
- `GET /metrics` → Prometheus 文本（仅内网访问）

---

## 十二、检查清单

- [ ] `cd system/docker && docker compose up -d --build` 一条命令拉起整套
- [ ] 4 个对外端口（3100/8100/4100/9100）从 `115.159.109.23` 可访问
- [ ] supabase 连通 OK（schema `zhiyu` 已创建）
- [ ] 所有镜像 < 300MB
- [ ] `.dockerignore` 排除 agent 工具与 planning 资产
- [ ] 缺第三方 key 时启动不阻塞
- [ ] 备份 cron 在跑
- [ ] 不引用 staging/prod / 任何禁用 SaaS
