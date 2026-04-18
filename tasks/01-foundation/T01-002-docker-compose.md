# T01-002: Docker Compose 容器编排

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 4

## 需求摘要

创建 Docker Compose 编排配置，实现前后端一键构建和启动。包含前端 Dockerfile（多阶段构建 → Nginx 托管）、后端 Dockerfile（TypeScript 编译 → Node.js 运行）、docker-compose.yml（服务定义、网络配置、健康检查）。构建完成后可通过 `docker compose up -d --build` 一键启动所有服务。

## 相关上下文

- 环境配置: `grules/env.md` §2 — 端口映射（dev 前端 3100、后端 8100）、容器名、Docker 网络
- 项目结构: `grules/02-project-structure.md` — Dockerfile 位置
- 测试规范: `grules/08-qa-testing.md` §一 — Docker 强制规则
- 架构白皮书: `grules/01-rules.md` §四 — Docker 环境唯一性
- 关联任务: 前置 T01-001 → 后续 T01-003

## 技术方案

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    container_name: ideas-dev-fe
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "${FRONTEND_PORT:-3100}:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - app-net
    restart: unless-stopped

  backend:
    container_name: ideas-dev-be
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "${BACKEND_PORT:-8100}:3000"
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - app-net
      - global-data-link
    restart: unless-stopped

networks:
  app-net:
    driver: bridge
  global-data-link:
    external: true
```

### frontend/Dockerfile（多阶段构建）

```dockerfile
# ===== 阶段 1: 构建 =====
FROM node:22-alpine AS builder

WORKDIR /app

# 利用 Docker 缓存层：先复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# 复制源码并构建
COPY . .
RUN npm run build

# ===== 阶段 2: 生产运行 =====
FROM nginx:1.27-alpine AS production

# 复制构建产物到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（T01-003 提供）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### backend/Dockerfile（多阶段构建）

```dockerfile
# ===== 阶段 1: 构建 =====
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ===== 阶段 2: 生产运行 =====
FROM node:22-alpine AS production

# 安全：使用非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

WORKDIR /app

# 只复制生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --omit=dev && npm cache clean --force

# 复制编译产物
COPY --from=builder /app/dist ./dist

# 安装健康检查工具
RUN apk add --no-cache wget

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Node.js 版本 | 22-alpine | 符合 grules 要求 Node.js 22+，alpine 镜像小 |
| 前端运行环境 | Nginx 1.27-alpine | 生产环境静态资源托管，非 dev server |
| 后端内部端口 | 3000 | Express 默认端口，通过 docker-compose 映射为 8100 |
| 网络模式 | bridge + external | app-net 前后端互通，global-data-link 连 Supabase |
| 健康检查 | wget spider | 轻量，不引入 curl（alpine 默认无 curl） |
| 非 root 运行 | adduser appuser | 安全最佳实践，防止容器逃逸提权 |

## 范围（做什么）

- 创建 `docker-compose.yml` 编排文件
- 创建 `frontend/Dockerfile`（多阶段构建 → Nginx）
- 创建 `backend/Dockerfile`（多阶段构建 → Node.js）
- 配置 Docker 健康检查
- 配置 Docker 网络（内部 + 外部 Supabase 网络）

## 边界（不做什么）

- 不配置 Nginx 反向代理细节（T01-003）
- 不配置 SSL/HTTPS（T01-003）
- 不编写 Express 服务代码（T01-008）
- 不配置 CI/CD 管道
- 不配置 Redis 服务（后续横切任务）

## 涉及文件

- 新建: `zhiyu/docker-compose.yml`
- 新建: `zhiyu/frontend/Dockerfile`
- 新建: `zhiyu/backend/Dockerfile`
- 修改: `zhiyu/.env.example`（添加 FRONTEND_PORT、BACKEND_PORT 变量）

## 依赖

- 前置: T01-001（项目脚手架必须存在）
- 后续: T01-003（Nginx 配置）、T01-008（后端框架依赖 Dockerfile）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** docker-compose.yml 和两个 Dockerfile 已创建  
   **WHEN** 执行 `docker compose config`  
   **THEN** 配置解析无错误，输出有效的 YAML

2. **GIVEN** 前端 Dockerfile 存在  
   **WHEN** 检查 Dockerfile 内容  
   **THEN** 采用多阶段构建（builder → production），最终镜像基于 nginx:1.27-alpine

3. **GIVEN** 后端 Dockerfile 存在  
   **WHEN** 检查 Dockerfile 内容  
   **THEN** 采用多阶段构建，使用非 root 用户运行，最终镜像基于 node:22-alpine

4. **GIVEN** docker-compose.yml 配置了端口映射  
   **WHEN** 检查 ports 配置  
   **THEN** 前端映射 ${FRONTEND_PORT:-3100}:80，后端映射 ${BACKEND_PORT:-8100}:3000

5. **GIVEN** 后端服务配置了健康检查  
   **WHEN** 检查 healthcheck 配置  
   **THEN** 包含 test、interval、timeout、retries、start_period 五项

6. **GIVEN** Docker 网络配置完成  
   **WHEN** 检查 networks 配置  
   **THEN** 包含内部 app-net（bridge）和外部 global-data-link

7. **GIVEN** 前后端代码和 Dockerfile 均就绪（配合 T01-008/T01-009 完成后）  
   **WHEN** 执行 `docker compose up -d --build`  
   **THEN** 所有容器状态为 Running，无构建错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose config` — 验证配置语法正确
2. `docker compose build` — 构建镜像（需配合 T01-008/T01-009 有实际代码后）
3. `docker compose up -d` — 启动容器
4. `docker compose ps` — 确认所有容器 Running
5. `docker compose logs --tail=30 backend` — 后端无报错
6. `docker compose logs --tail=30 frontend` — 前端 Nginx 启动正常
7. 访问 `http://localhost:3100` — 前端可访问
8. 访问 `http://localhost:8100/api/v1/health` — 后端健康检查通过

### 测试通过标准

- [ ] docker compose config 无错误
- [ ] Docker 构建零错误
- [ ] 所有容器 Running
- [ ] 前端 Nginx 正常响应
- [ ] 后端健康检查返回 200
- [ ] 容器日志无 Error 级别输出

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-002-docker-compose.md`

## 自检重点

- [ ] 安全：后端容器使用非 root 用户
- [ ] 安全：无敏感信息硬编码在 Dockerfile 中
- [ ] 性能：多阶段构建减小镜像体积
- [ ] 性能：利用 Docker 缓存层（先 COPY package.json 再 COPY 源码）
- [ ] 可维护：端口通过环境变量配置，非硬编码
