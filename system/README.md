# 知语 Zhiyu — System Monorepo

> 唯一开发根目录。所有 `pnpm` / `docker compose` / `supabase` 命令都在 `system/` 内执行。
> 顶层 `/opt/projects/zhiyu/` 仅放文档（`grules/` / `prds/` / `content/` ...）。
> 详见 `../grules/G1-架构与技术规范/`。

## 一键启动（Docker only）

```bash
cd /opt/projects/zhiyu/system
cp docker/env/.env.example docker/env/.env.dev   # 已提交占位版本，可直接用
pnpm dev                                          # = free-ports + docker compose up --build
```

启动后端口（dev 直接 IP:端口，无反向代理）：

| 服务 | URL |
|------|-----|
| 应用端前端 | http://localhost:3100 |
| 管理端前端 | http://localhost:4100 |
| 应用端 API | http://localhost:8100/api/v1/health |
| 管理端 API | http://localhost:9100/admin/v1/health |
| Supabase 网关（GoTrue + PostgREST） | http://localhost:8000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

## 默认账号（dev seed）

- 超级管理员：`admin@zhiyu.local` / `Admin@123456`（仅 dev；生产改 `.env`）。

## 工作目录约定

```
system/
├── apps/{web-app, web-admin, api-app, api-admin}
├── packages/{shared-config, shared-schemas, shared-i18n, shared-utils, supabase-client, ui-kit, ai-adapters}
├── supabase/{migrations, seed.sql, functions/}
├── docker/{compose.yaml, Dockerfile.api, Dockerfile.web, env/, nginx/}
└── scripts/{dev, db}
```

## 当前阶段

最小可运行骨架（M0）：登录 / 注册（mock）+ 发现中国前 3 主题 + 管理端登录与用户列表。

延后项见 [docker/DEFERRED.md](./docker/DEFERRED.md)。
