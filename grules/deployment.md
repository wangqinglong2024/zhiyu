# 部署与运维规范 (Deployment & Operations)

> **版本**: v2.0 | **最后更新**: 2025-07-16
>
> **本文件覆盖**：单服务器三环境架构、端口规划、Docker 部署策略、回滚机制、监控告警、日志聚合、数据库备份。
> 与 `coding-standards.md` 互补 — 后者管"怎么写代码"，本文件管"怎么部署和运行代码"。

---

## 一、单服务器架构总览

### 1. 核心约束

本系统运行在**单台服务器**（`115.159.109.23`，内存有限）上，因此采用**"共享基础设施 + 前后端多环境隔离"**架构：

```
┌─────────────────────────────────────────────────────────────────┐
│                     115.159.109.23 单服务器                       │
│                                                                   │
│  ┌─────────────── 共享基础设施（仅一套，全环境共用）──────────────┐  │
│  │  Supabase (DB/Auth/Storage/Realtime)                         │  │
│  │  Dify (AI 工作流)                                            │  │
│  │  NocoBase (低代码后台)                                       │  │
│  │  OpenClaw (企业服务)                                         │  │
│  │  Nginx 网关 (/opt/gateway/)                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──── dev 环境 ────┐  ┌── staging 环境 ──┐  ┌── prod 环境 ───┐  │
│  │ ideas-dev-fe     │  │ ideas-stg-fe     │  │ ideas-fe       │  │
│  │ ideas-dev-be     │  │ ideas-stg-be     │  │ ideas-be       │  │
│  │ 端口: 3100/8100  │  │ 端口: 3200/8200  │  │ ideas.top 域名 │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                   │
│  ┌──── dev 环境 ────┐  ┌── staging 环境 ──┐  ┌── prod 环境 ───┐  │
│  │ foryou-dev-fe    │  │ foryou-stg-fe    │  │ foryou-fe      │  │
│  │ foryou-dev-be    │  │ foryou-stg-be    │  │ foryou-be      │  │
│  │ 端口: 3300/8300  │  │ 端口: 3400/8400  │  │ foryoutech.top │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 三环境定义

| 环境 | 用途 | 访问方式 | 数据库隔离 | Git 分支 |
|------|------|---------|-----------|---------|
| **dev** | 开发调试 | `http://115.159.109.23:{端口}` | Schema `dev_` 前缀 | `dev` 分支 |
| **staging** | 提测验收 | `http://115.159.109.23:{端口}` | Schema `stg_` 前缀 | `staging` 分支 |
| **production** | 线上正式 | `https://{域名}` (ideas.top 等) | Schema `public` (默认) | `main` 分支 |

**核心铁律**：
- **域名只给生产**：`ideas.top`、`foryoutech.top` 等域名**仅**指向生产环境容器。开发和测试一律用 `IP:端口` 访问。
- **基础设施只有一套**：Supabase、Dify、NocoBase、Redis 等 `apps/` 下的服务**不重复部署**，三个环境共用同一实例（通过数据库 Schema 隔离业务数据）。
- **前后端按环境独立容器**：每个项目的每个环境都是独立的 Docker 容器，互不干扰。

### 3. 为什么不在本机开发？

你只有一台服务器，没有本地开发机。所有开发、测试、生产都在这台服务器上完成。这意味着：
- 不存在 `local` 环境，最低就是 `dev`（也在服务器上）
- AI 编程助手通过 SSH 连接服务器，直接在 dev 环境的代码目录开发
- 开发完成后合并分支 → 部署到 staging → 验收通过 → 部署到 production

---

## 二、端口规划（全局统一）

### 1. 基础设施端口（固定，不可更改）

| 服务 | 内部端口 | 外部/宿主机端口 | 访问方式 |
|------|---------|---------------|---------|
| **Supabase Kong (API)** | 8000 | 不暴露（Docker 内部） | `http://supabase-kong:8000` |
| **Supabase Studio** | 3000 | 不暴露 | 通过 `supabase.ideas.top` 访问 |
| **Supabase PostgreSQL** | 5432 | 不暴露 | Docker 内部 `db:5432` |
| **Dify** | 80 | 9000 | 通过 `dify.ideas.top` 访问 |
| **NocoBase** | 80 | 不暴露 | 通过 `nocobase.ideas.top` 访问 |
| **Redis** | 6379 | 不暴露 | Docker 内部 `redis:6379` |
| **Nginx 网关** | 80/443 | **80/443** | 公网入口（仅生产域名） |

### 2. 业务项目端口分配规则

**端口段划分**：

```
┌───────────────────────────────────────────────────────┐
│ 3000-3099   基础设施前端面板（Supabase Studio 等）       │
│ 3100-3199   ideas 项目 dev 环境前端                      │
│ 3200-3299   ideas 项目 staging 环境前端                  │
│ 3300-3399   foryou 项目 dev 环境前端                     │
│ 3400-3499   foryou 项目 staging 环境前端                 │
│ 3500-3599   （预留：新项目 dev 前端）                     │
│ 3600-3699   （预留：新项目 staging 前端）                 │
│                                                         │
│ 8000-8099   基础设施后端 API（Supabase Kong 等）          │
│ 8100-8199   ideas 项目 dev 环境后端                      │
│ 8200-8299   ideas 项目 staging 环境后端                  │
│ 8300-8399   foryou 项目 dev 环境后端                     │
│ 8400-8499   foryou 项目 staging 环境后端                 │
│ 8500-8599   （预留：新项目 dev 后端）                     │
│ 8600-8699   （预留：新项目 staging 后端）                 │
│                                                         │
│ 生产环境不暴露端口，统一通过 Nginx 网关 + 域名访问         │
└───────────────────────────────────────────────────────┘
```

### 3. 当前项目完整端口映射

| 项目 | 环境 | 前端端口 | 后端端口 | 前端访问 | 后端 API |
|------|------|---------|---------|---------|---------|
| **ideas** | dev | 3100 | 8100 | `http://115.159.109.23:3100` | `http://115.159.109.23:8100/api/v1/` |
| **ideas** | staging | 3200 | 8200 | `http://115.159.109.23:3200` | `http://115.159.109.23:8200/api/v1/` |
| **ideas** | prod | — | — | `https://ideas.top` | `https://ideas.top/api/` |
| **foryou** | dev | 3300 | 8300 | `http://115.159.109.23:3300` | `http://115.159.109.23:8300/api/v1/` |
| **foryou** | staging | 3400 | 8400 | `http://115.159.109.23:3400` | `http://115.159.109.23:8400/api/v1/` |
| **foryou** | prod | — | — | `https://foryoutech.top` | `https://foryoutech.top/api/` |

### 4. 新项目端口申请规则

新项目按以下公式分配：
```
项目序号 = 1 (ideas), 2 (foryou), 3, 4, ...
dev  前端 = 3000 + 序号 * 200 - 100   →  3100, 3300, 3500, 3700 ...
dev  后端 = 8000 + 序号 * 200 - 100   →  8100, 8300, 8500, 8700 ...
stg  前端 = dev前端 + 100              →  3200, 3400, 3600, 3800 ...
stg  后端 = dev后端 + 100              →  8200, 8400, 8600, 8800 ...
prod      = 域名 + Nginx 网关，不暴露端口
```

---

## 三、数据库隔离策略（共享 Supabase，Schema 分离）

### 1. Schema 命名规范

由于只有一个 Supabase 实例，三个环境通过 PostgreSQL Schema 隔离：

| 环境 | Schema | 示例表 |
|------|--------|-------|
| **production** | `public`（默认） | `public.users`、`public.orders` |
| **staging** | `stg_{project}` | `stg_ideas.users`、`stg_ideas.orders` |
| **dev** | `dev_{project}` | `dev_ideas.users`、`dev_ideas.orders` |

### 2. 初始化环境 Schema

```sql
-- 每个新项目的 dev/staging 环境需要手动创建一次 Schema
CREATE SCHEMA IF NOT EXISTS dev_ideas;
CREATE SCHEMA IF NOT EXISTS stg_ideas;

-- GRANT 给对应的用户角色
GRANT USAGE ON SCHEMA dev_ideas TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA dev_ideas TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA dev_ideas GRANT ALL ON TABLES TO service_role;
-- staging 同理
```

### 3. 后端如何切换 Schema

```typescript
// backend/src/core/config.ts
const ENV = process.env.APP_ENV ?? 'dev'  // dev / staging / production
const PROJECT = process.env.PROJECT_NAME ?? 'ideas'

const schemaMap: Record<string, string> = {
  production: 'public',
  staging: `stg_${PROJECT}`,
  dev: `dev_${PROJECT}`,
}

export const DB_SCHEMA = schemaMap[ENV] ?? `dev_${PROJECT}`
```

```typescript
// Supabase 客户端初始化时指定 Schema
import { createClient } from '@supabase/supabase-js'
import { config } from '@/core/config'

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_KEY,
  { db: { schema: DB_SCHEMA } },
)
```

### 4. RLS 策略跨 Schema

- **生产 Schema (`public`)**：RLS 策略正常配置，与现有规范一致
- **开发/测试 Schema**：RLS 策略需要**复制**到对应 Schema（迁移脚本中同步）
- **Auth 系统**：Supabase Auth (`auth` Schema) 全环境共用。dev/staging 可以注册测试账号，但必须使用 `+dev` / `+stg` 邮箱后缀区分：
  ```
  dev 测试账号: user+dev@example.com
  staging 测试: user+stg@example.com
  生产真实用户: user@example.com
  ```

### 5. 数据隔离铁律

- **禁止 dev/staging 读写 `public` Schema** — 后端代码中的 Schema 选择完全由 `APP_ENV` 环境变量控制，不允许硬编码
- **生产数据不下放** — 开发和测试环境使用种子数据（`scripts/seed-dev-data.sql`），絕不从生产环境复制真实用户数据
- **定期清理** — dev Schema 每周可以 DROP 重建；staging Schema 在每轮测试结束后清理脏数据

---

## 四、 服务器目录规划

```
/opt/
├── apps/                        # 共享基础设施（仅一套）
│   ├── supabase/                # Supabase 全家桶
│   ├── dify/                    # Dify AI 工作流
│   ├── nocobase/                # NocoBase 低代码
│   └── redis/                   # Redis（如独立部署）
│
├── gateway/                     # Nginx 网关（统一入口）
│   ├── conf.d/
│   │   ├── ideas.top.conf       # 生产：ideas.top → prod 容器
│   │   ├── foryoutech.top.conf  # 生产：foryoutech.top → prod 容器
│   │   ├── supabase.ideas.top.conf
│   │   ├── dify.ideas.top.conf
│   │   └── nocobase.ideas.top.conf
│   ├── cert/                    # SSL 证书
│   └── docker-compose.yml
│
├── projects/                    # 业务项目
│   ├── ideas/                   # ideas 项目
│   │   ├── docker-compose.yml         # 生产环境
│   │   ├── docker-compose.dev.yml     # dev 环境（覆盖端口+环境变量）
│   │   ├── docker-compose.stg.yml     # staging 环境
│   │   ├── .env.dev                   # dev 环境变量
│   │   ├── .env.stg                   # staging 环境变量
│   │   ├── .env.prod                  # 生产环境变量
│   │   ├── frontend/
│   │   └── backend/
│   │
│   └── foryou/                  # foryou 项目（结构同上）
│
├── scripts/                     # 运维脚本
│   ├── backup-db.sh
│   ├── deploy.sh                # 统一部署脚本
│   ├── seed-dev-data.sql        # 开发环境种子数据
│   └── health-watchdog.sh
│
└── backups/                     # 备份目录
    └── supabase/
```

---

## 五、Docker Compose 多环境配置

### 1. 基础 docker-compose.yml（生产环境）

```yaml
# /opt/projects/ideas/docker-compose.yml
# 生产环境 — 通过 Nginx 网关 + 域名访问，不暴露端口到宿主机

services:
  frontend:
    build: ./frontend
    container_name: ideas-fe
    restart: unless-stopped
    networks:
      - gateway_net

  backend:
    build: ./backend
    container_name: ideas-be
    restart: unless-stopped
    env_file: .env.prod
    environment:
      - APP_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - gateway_net
      - global-data-link
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

networks:
  gateway_net:
    external: true
  global-data-link:
    external: true
```

### 2. dev 覆盖文件

```yaml
# /opt/projects/ideas/docker-compose.dev.yml
# 用法: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

services:
  frontend:
    container_name: ideas-dev-fe
    ports:
      - "3100:80"
    environment:
      - NODE_ENV=development

  backend:
    container_name: ideas-dev-be
    ports:
      - "8100:8000"
    env_file: .env.dev
    environment:
      - APP_ENV=dev
```

### 3. staging 覆盖文件

```yaml
# /opt/projects/ideas/docker-compose.stg.yml
# 用法: docker compose -f docker-compose.yml -f docker-compose.stg.yml up -d

services:
  frontend:
    container_name: ideas-stg-fe
    ports:
      - "3200:80"
    environment:
      - NODE_ENV=production

  backend:
    container_name: ideas-stg-be
    ports:
      - "8200:8000"
    env_file: .env.stg
    environment:
      - APP_ENV=staging
```

### 4. 环境变量文件差异

```bash
# .env.dev
APP_ENV=dev
PROJECT_NAME=ideas
SUPABASE_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=<同 env.md>
SUPABASE_SERVICE_ROLE_KEY=<同 env.md>
JWT_SECRET=<同 env.md>
VITE_API_BASE=http://115.159.109.23:8100
VITE_SUPABASE_URL=http://115.159.109.23:8000

# .env.stg
APP_ENV=staging
PROJECT_NAME=ideas
SUPABASE_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=<同上>
SUPABASE_SERVICE_ROLE_KEY=<同上>
JWT_SECRET=<同上>
VITE_API_BASE=http://115.159.109.23:8200
VITE_SUPABASE_URL=http://115.159.109.23:8000

# .env.prod
APP_ENV=production
PROJECT_NAME=ideas
SUPABASE_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=<同上>
SUPABASE_SERVICE_ROLE_KEY=<同上>
JWT_SECRET=<同上>
VITE_API_BASE=https://ideas.top
VITE_SUPABASE_URL=https://supabase.ideas.top:9443
```

---

## 六、部署流程（三环境工作流）

### 1. 日常开发流程

```
┌─────────────────────────────────────────────────────────────┐
│                     开发 → 测试 → 上线 流程                   │
│                                                               │
│  1. AI 在 dev 分支写代码                                      │
│     └─ 代码目录: /opt/projects/ideas/                         │
│     └─ 启动 dev: docker compose -f docker-compose.yml         │
│                  -f docker-compose.dev.yml up -d --build      │
│     └─ 自测: http://115.159.109.23:3100 (前端)                │
│              http://115.159.109.23:8100/api/v1/health (后端)  │
│                                                               │
│  2. 开发完成 → git merge dev → staging 分支                   │
│     └─ 启动 staging: docker compose -f docker-compose.yml     │
│                       -f docker-compose.stg.yml up -d --build │
│     └─ 验收: http://115.159.109.23:3200 (前端)                │
│              http://115.159.109.23:8200/api/v1/health (后端)  │
│                                                               │
│  3. 验收通过 → git merge staging → main 分支                  │
│     └─ 部署生产: docker compose up -d --build                  │
│     └─ 验证: https://ideas.top                                │
└─────────────────────────────────────────────────────────────┘
```

### 2. 统一部署脚本

```bash
#!/bin/bash
# /opt/scripts/deploy.sh — 统一部署入口
# 用法: deploy.sh <project> <env>
# 示例: deploy.sh ideas dev
#       deploy.sh ideas staging
#       deploy.sh ideas prod

set -e

PROJECT=$1
ENV=$2

if [ -z "$PROJECT" ] || [ -z "$ENV" ]; then
  echo "用法: $0 <project> <env>"
  echo "  project: ideas | foryou"
  echo "  env:     dev | staging | prod"
  exit 1
fi

PROJECT_DIR="/opt/projects/$PROJECT"
cd "$PROJECT_DIR"

case $ENV in
  dev)
    echo "🔧 部署 $PROJECT → dev 环境"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    echo "✅ dev 前端: http://115.159.109.23:$(grep -oP 'ports.*"\K\d+' docker-compose.dev.yml | head -1)"
    ;;
  staging)
    echo "🧪 部署 $PROJECT → staging 环境"
    docker compose -f docker-compose.yml -f docker-compose.stg.yml up -d --build
    echo "✅ staging 前端: http://115.159.109.23:$(grep -oP 'ports.*"\K\d+' docker-compose.stg.yml | head -1)"
    ;;
  prod)
    echo "🚀 部署 $PROJECT → production 环境"
    # 生产部署前先备份数据库
    /opt/scripts/backup-db.sh
    docker compose up -d --build
    echo "✅ 生产环境已更新，通过域名访问验证"
    ;;
  *)
    echo "❌ 未知环境: $ENV (可选: dev | staging | prod)"
    exit 1
    ;;
esac

# 等待容器启动
sleep 5

# 健康检查
echo ""
echo "=== 健康检查 ==="
docker compose ps
```

### 3. 数据库迁移（必须先于服务更新）

```bash
# 迁移脚本需要同时处理三个 Schema
# 例：新增 orders 表

# supabase/migrations/20260408_create_orders.sql
-- 生产 Schema
CREATE TABLE IF NOT EXISTS public.orders ( ... );
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- dev Schema（自动复制结构）
CREATE TABLE IF NOT EXISTS dev_ideas.orders (LIKE public.orders INCLUDING ALL);
ALTER TABLE dev_ideas.orders ENABLE ROW LEVEL SECURITY;

-- staging Schema
CREATE TABLE IF NOT EXISTS stg_ideas.orders (LIKE public.orders INCLUDING ALL);
ALTER TABLE stg_ideas.orders ENABLE ROW LEVEL SECURITY;
```

**迁移铁律**：
- 迁移必须向后兼容（新代码能跑旧 Schema，旧代码能跑新 Schema）
- 大表变更（ALTER TABLE > 100 万行）必须在低峰期执行
- 每个迁移文件必须附带回滚 SQL（`-- DOWN:` 注释块）

---

## 七、Nginx 网关配置（生产域名路由）

### 1. 核心规则

- **Nginx 网关只为生产环境服务** — `ideas.top` → `ideas-fe:80` / `ideas-be:8000`
- **dev/staging 直接暴露端口** — 不经过 Nginx，通过 `IP:端口` 直接访问
- **dev/staging 禁止绑定域名** — 域名是生产的唯一凭证

### 2. 生产 Nginx 配置示例

```nginx
# /opt/gateway/conf.d/ideas.top.conf
server {
    listen 443 ssl http2;
    server_name ideas.top www.ideas.top;
    
    ssl_certificate     cert/ideas.top_bundle.crt;
    ssl_certificate_key cert/ideas.top.key;
    
    # 前端 → 生产容器（不带端口映射，通过 Docker 网络直连）
    location / {
        proxy_pass http://ideas-fe:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 后端 API → 生产容器
    location /api/ {
        proxy_pass http://ideas-be:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name ideas.top www.ideas.top;
    return 301 https://$host$request_uri;
}
```

### 3. 安全：禁止通过 IP 直接访问生产容器

```nginx
# /opt/gateway/conf.d/default.conf — 拦截无域名的请求
server {
    listen 443 ssl default_server;
    server_name _;
    ssl_certificate     cert/ideas.top_bundle.crt;
    ssl_certificate_key cert/ideas.top.key;
    return 444;  # 直接关闭连接
}
```

---

## 八、Docker 镜像策略

### 1. 镜像标签规范

| 环境 | 标签格式 | 示例 |
|------|---------|------|
| dev | `{project}-{service}:dev` | `ideas-backend:dev` |
| staging | `{project}-{service}:stg-{git-sha7}` | `ideas-backend:stg-a1b2c3d` |
| prod | `{project}-{service}:v{Major}.{Minor}.{Patch}` | `ideas-backend:v1.2.0` |
| prod latest | `{project}-{service}:latest` | 仅 release 后更新 |

### 2. 构建优化

```dockerfile
# 后端 — 利用层缓存，依赖不变时不重装
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 前端 — 同理，node_modules 层缓存
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

- 基础镜像锁定版本：前后端均使用 `node:20-alpine`
- 生产镜像必须是多阶段构建（builder → runner），最终镜像不含 devDependencies
- 每次构建打印 `IMAGE_TAG` 和 `GIT_SHA` 到日志

### 3. 内存节约措施

由于单服务器内存有限，必须严格控制容器资源：

```yaml
# docker-compose.yml 中为每个服务设置内存上限
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
  frontend:
    deploy:
      resources:
        limits:
          memory: 128M
        reservations:
          memory: 64M
```

**内存管理铁律**：
- dev + staging 环境在不用时可以关闭（`docker compose -f ... down`），释放内存给生产
- 生产环境必须始终运行
- 不允许同时跑超过 **4 个业务容器 + 基础设施**（内存预算：基础设施 ~4GB + 业务 ~2GB）
- 定期 `docker system prune -f` 清理无用镜像和缓存

---

## 九、回滚策略

### 1. 代码回滚（最常用）

```bash
# 回滚到上一个版本
git log --oneline -5                         # 确认目标 commit
git checkout {commit-sha} -- .               # 回到目标版本
docker compose up -d --build {service}       # 重建
```

### 2. 快速回退（Docker 镜像级）

```bash
# 如果之前的镜像还在本地
docker compose down {service}
docker tag ideas-backend:v1.1.0 ideas-backend:latest
docker compose up -d {service}
```

### 3. 数据库回滚

```bash
# 执行迁移文件对应的 DOWN 回滚语句
# 每个 migration 文件必须在末尾注释中包含回滚 SQL：
# -- DOWN:
# -- DROP TABLE IF EXISTS xxx;
# -- ALTER TABLE yyy DROP COLUMN zzz;
```

### 回滚决策矩阵

| 症状 | 判断 | 动作 |
|------|------|------|
| API 返回 500 | 新代码 Bug | 代码回滚 |
| 页面白屏 | 前端构建问题 | 前端镜像回退 |
| 数据库连接失败 | 迁移破坏 Schema | 数据库回滚 + 代码回滚 |
| 性能骤降 | 新查询无索引 | 紧急加索引 / 回滚 |
| 用户投诉数据错误 | 业务逻辑 Bug | 代码回滚 + 数据修复脚本 |

---

## 十、健康检查与监控

### 1. 健康检查端点（必须实现）

```typescript
// backend/src/routers/health.ts
import { Router, Request, Response } from 'express'
import { checkDbConnection } from '@/core/supabase'
import { config } from '@/core/config'

const router = Router()

router.get('/api/v1/health', async (req: Request, res: Response) => {
  /** 供部署脚本调用，判断服务是否就绪 */
  const dbStatus = await checkDbConnection()
  const checks = {
    api: 'ok',
    database: dbStatus,
    env: config.APP_ENV,
    schema: config.DB_SCHEMA,
    timestamp: new Date().toISOString(),
  }
  const allOk = checks.api === 'ok' && checks.database === 'ok'
  res.status(allOk ? 200 : 503).json(checks)
})

export default router
```

### 2. Docker 容器健康检查

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### 3. 关键监控指标

| 指标 | 正常范围 | 告警阈值 | 监控方式 |
|------|---------|---------|---------|
| API 响应时间 (P95) | < 500ms | > 1000ms | Nginx access log 分析 |
| 错误率 (5xx) | < 0.1% | > 1% | Nginx error log 计数 |
| 容器内存 | < 80% limit | > 90% limit | `docker stats` |
| 容器 CPU | < 50% | > 80% | `docker stats` |
| 数据库连接数 | < 15 | > 18（池上限 20） | Supabase 监控 |
| 磁盘使用率 | < 70% | > 85% | `df -h` |
| 宿主机总内存 | < 80% | > 90% | `free -h` |

### 4. 日志聚合策略

```yaml
# 所有容器统一配置日志限制（防止磁盘爆满）
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
```

**日志查看常用命令**：
```bash
# 实时跟踪（指定环境）
docker logs -f ideas-dev-be --tail=50     # dev 环境后端
docker logs -f ideas-stg-be --tail=50     # staging 环境后端
docker logs -f ideas-be --tail=50         # 生产环境后端

# 搜索错误
docker logs ideas-be 2>&1 | grep -i error | tail -20

# 查看特定时间段
docker logs --since="2h" ideas-be
```

---

## 十一、数据库备份

### 1. 自动备份策略

```bash
# crontab -e
# 每天凌晨 3 点自动备份（包含所有 Schema）
0 3 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### 2. 备份脚本

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh
set -e

BACKUP_DIR="/opt/backups/supabase"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# 备份所有 Schema（包含 dev_*/stg_*/public）
docker exec supabase-db pg_dump -U postgres -d postgres | gzip > "$BACKUP_FILE"

# 保留最近 30 天
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
```

### 3. 恢复流程

```bash
# 1. 停止所有后端服务
docker stop ideas-be ideas-dev-be ideas-stg-be

# 2. 恢复备份
gunzip -c /opt/backups/supabase/postgres_20260407_030000.sql.gz | \
  docker exec -i supabase-db psql -U postgres -d postgres

# 3. 重启服务
docker start ideas-be ideas-dev-be ideas-stg-be
```

**备份铁律**：
- 每月至少手动验证一次备份可恢复
- 关键数据变更前必须手动触发即时备份
- 备份文件建议同步到腾讯云 COS（防止磁盘故障丢失）

---

## 十二、事故响应（Incident Response）

### 1. 严重等级定义

| 等级 | 定义 | 响应时间 | 示例 |
|------|------|---------|------|
| **P0 致命** | 核心功能完全不可用 | 立即 | 全站白屏、支付不可用、数据丢失 |
| **P1 严重** | 核心功能部分异常 | 30 分钟内 | 登录偶发失败、列表加载超慢 |
| **P2 一般** | 非核心功能异常 | 4 小时内 | 头像上传失败、样式错位 |
| **P3 轻微** | 不影响使用 | 下一工作日 | 文案笔误、console warning |

### 2. P0/P1 事故处理流程

```
发现问题（监控告警 / 用户反馈）
    ↓
1. 初步判断：是什么坏了？影响范围？
    ↓
2. 止血：能快速回滚就先回滚（< 5 分钟决策）
    ↓
3. 定位：查日志 → 查最近变更 → 定位代码/配置/数据库
    ↓
4. 修复：最小化修复（不顺手重构！）
    ↓
5. 验证：Docker 重建 → 健康检查 → 核心流程测试
    ↓
6. 事后复盘：记录到 incident-log（下方模板）
```

### 3. 事故记录模板

```markdown
# INCIDENT-NNN: [简短标题]

## 概要
- **时间**: 发现时间 ~ 恢复时间（持续时长）
- **等级**: P0/P1/P2
- **影响范围**: 多少用户受影响 / 哪些功能不可用
- **环境**: production / staging / dev

## 时间线
- HH:MM — 发现问题（如何发现的）
- HH:MM — 初步判断
- HH:MM — 执行止血/回滚
- HH:MM — 确认恢复

## 根因分析
简述根本原因。

## 修复方案
做了什么修复。附 commit hash。

## 后续改进
- [ ] 加监控告警防止复发
- [ ] 补充测试用例覆盖此场景
- [ ] 更新文档/规范
```

---

## 附录：快速命令速查

```bash
# === 环境管理 ===
# 启动 dev 环境
cd /opt/projects/ideas
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 启动 staging 环境
docker compose -f docker-compose.yml -f docker-compose.stg.yml up -d --build

# 部署生产
docker compose up -d --build

# 关闭 dev 环境（释放内存）
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# 关闭 staging 环境（释放内存）
docker compose -f docker-compose.yml -f docker-compose.stg.yml down

# === 统一部署脚本 ===
/opt/scripts/deploy.sh ideas dev
/opt/scripts/deploy.sh ideas staging
/opt/scripts/deploy.sh ideas prod

# === 查看所有容器状态 ===
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | sort

# === 查看资源使用 ===
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | sort

# === 手动备份 ===
/opt/scripts/backup-db.sh

# === 清理释放空间 ===
docker system prune -f --filter "until=72h"
```
