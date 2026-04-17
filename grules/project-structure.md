# 项目目录结构标准 (Project Structure Template)

> **版本**: v1.0 | **最后更新**: 2025-07-16
>
> **适用范围**：所有基于 Vite React/TS + Express/TS/Node.js + Supabase + Docker 技术栈的项目。
> **使用方法**：新项目启动时，AI 按此模板生成目录骨架，再填充业务代码。

---

## 一、完整目录结构

```
project-name/
│
├── docker-compose.yml          # 容器编排入口
├── .env.example                # 环境变量模板（不含真实值，提交到 Git）
├── .env                        # 真实环境变量（.gitignore 忽略）
├── README.md                   # 项目说明
│
├── frontend/                   # ====== 前端（Vite + React + TS） ======
│   ├── Dockerfile              # 前端容器构建
│   ├── nginx.conf              # 前端生产环境 Nginx 配置
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   │
│   └── src/
│       ├── main.tsx            # 入口文件
│       ├── App.tsx             # 根组件（路由挂载点）
│       ├── vite-env.d.ts       # Vite 类型声明
│       │
│       ├── assets/             # 静态资源（图片、字体、SVG）
│       │
│       ├── styles/             # 全局样式
│       │   ├── index.css       # Tailwind 入口 + 全局样式（.glass 等）
│       │   └── animations.css  # 动效定义
│       │
│       ├── types/              # 全局类型定义
│       │   ├── supabase.ts     # Supabase 自动生成的数据库类型
│       │   ├── api.ts          # API 响应/请求通用类型
│       │   └── index.ts        # 类型统一导出
│       │
│       ├── lib/                # 基础设施（不含业务逻辑）
│       │   ├── supabase.ts     # Supabase Client 初始化
│       │   ├── api-client.ts   # Axios/Fetch 封装（拦截器、token 注入）
│       │   └── constants.ts    # 全局常量
│       │
│       ├── hooks/              # 自定义 Hooks
│       │   ├── use-auth.ts     # 认证相关
│       │   ├── use-toast.ts    # 通知提示
│       │   └── use-theme.ts    # 主题切换
│       │
│       ├── components/         # 通用组件（不含业务逻辑）
│       │   ├── ui/             # 基础 UI 原子组件
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   └── Toast.tsx
│       │   ├── layout/         # 布局组件
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── PageContainer.tsx
│       │   └── shared/         # 跨页面共享的业务组件
│       │       ├── UserAvatar.tsx
│       │       └── LoadingScreen.tsx
│       │
│       ├── features/           # ★ 业务功能模块（按功能域划分）
│       │   ├── auth/           # 认证模块
│       │   │   ├── components/ # 模块私有组件
│       │   │   │   ├── LoginForm.tsx
│       │   │   │   └── RegisterForm.tsx
│       │   │   ├── hooks/      # 模块私有 Hook
│       │   │   │   └── use-login.ts
│       │   │   ├── services/   # 模块 API 调用
│       │   │   │   └── auth-service.ts
│       │   │   ├── types.ts    # 模块类型
│       │   │   └── index.ts    # 模块统一导出
│       │   │
│       │   ├── chat/           # 对话模块（示例）
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   ├── services/
│       │   │   ├── types.ts
│       │   │   └── index.ts
│       │   │
│       │   └── dashboard/      # 仪表盘模块（示例）
│       │       └── ...
│       │
│       ├── pages/              # 页面组件（仅做组装，不写业务逻辑）
│       │   ├── HomePage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── ChatPage.tsx
│       │   └── NotFoundPage.tsx
│       │
│       ├── router/             # 路由配置
│       │   ├── index.tsx       # 路由定义
│       │   └── guards.tsx      # 路由守卫（鉴权拦截）
│       │
│       └── providers/          # Context Providers
│           ├── AuthProvider.tsx
│           └── ThemeProvider.tsx
│
├── backend/                    # ====== 后端（Express + TypeScript + Node.js） ======
│   ├── Dockerfile              # 后端容器构建
│   ├── package.json            # Node.js 依赖
│   ├── tsconfig.json           # TypeScript 配置
│   │
│   └── src/
│       ├── main.ts             # Express 应用入口（挂载路由、中间件）
│       │
│       ├── core/               # 核心基础设施
│       │   ├── config.ts       # 配置管理（从环境变量读取）
│       │   ├── auth.ts         # JWT 验签 + authMiddleware 中间件
│       │   ├── exceptions.ts   # 自定义异常类 + 全局错误处理中间件
│       │   ├── response.ts     # 统一响应格式封装
│       │   ├── supabase.ts     # Supabase Client 初始化
│       │   └── middleware.ts   # CORS、日志、请求 ID 等中间件
│       │
│       ├── models/             # Zod Schema + TypeScript 数据类型（请求/响应/内部）
│       │   ├── user.ts         # UserCreateSchema, UserResponse
│       │   ├── chat.ts
│       │   └── common.ts       # 通用模型（分页、统一响应体等）
│       │
│       ├── routers/            # 路由层（API Endpoint 定义）
│       │   ├── v1/
│       │   │   ├── users.ts
│       │   │   ├── auth.ts
│       │   │   ├── chats.ts
│       │   │   └── index.ts    # v1 路由汇总注册
│       │   └── health.ts       # 健康检查端点
│       │
│       ├── services/           # 服务层（业务逻辑）
│       │   ├── user-service.ts
│       │   └── chat-service.ts
│       │
│       └── repositories/       # 数据访问层（直接与 DB 交互）
│           ├── user-repo.ts
│           └── chat-repo.ts
│
├── supabase/                   # ====== 数据库迁移 ======
│   └── migrations/
│       ├── 20260101000000_init_schema.sql
│       └── ...
│
└── scripts/                    # ====== 运维/工具脚本 ======
    ├── gen-types.sh            # 一键生成前端 Supabase 类型
    └── seed-data.sql           # 初始化种子数据
```

---

## 二、目录命名铁律

| 规则 | 正确 | 错误 |
|------|------|------|
| 目录名 kebab-case | `user-profile/` | `userProfile/`, `UserProfile/` |
| 组件文件 PascalCase | `UserCard.tsx` | `user-card.tsx`, `userCard.tsx` |
| Hook 文件 kebab-case | `use-auth.ts` | `useAuth.ts` |
| 后端文件 kebab-case | `user-service.ts` | `UserService.ts`, `user_service.ts` |
| 类型文件统一 | `types.ts` | `interfaces.ts`, `models.ts` |

---

## 三、新模块添加规则

当需要新增一个业务功能模块（例如"支付"）时，按以下步骤：

### 前端
```
src/features/payment/
├── components/
│   ├── PaymentForm.tsx
│   └── OrderSummary.tsx
├── hooks/
│   └── use-payment.ts
├── services/
│   └── payment-service.ts
├── types.ts
└── index.ts              # 统一导出公开 API
```

### 后端
```
backend/src/routers/v1/payments.ts       # 路由
backend/src/services/payment-service.ts  # 业务逻辑
backend/src/repositories/payment-repo.ts # 数据访问
backend/src/models/payment.ts            # 数据模型 (Zod Schema + TypeScript 类型)
```

### 数据库
```
supabase/migrations/20260407120000_create_payments_table.sql
```

**必须同步**：建表后立即更新前端类型（`supabase gen types typescript`）和后端 Zod Schema / TypeScript 类型。

---

## 四、Docker 基础设施模板

> 所有项目必须从这些模板出发，禁止从零随意编写。
> 多环境部署详见 `deployment.md`（三环境 Docker Compose 覆盖文件方案）。

### 1. 前端 Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 2. 后端 Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 8000
CMD ["node", "dist/main.js"]
```

### 3. docker-compose.yml（生产基础文件）
```yaml
# docker-compose.yml — 生产环境基础配置
# 生产：docker compose up -d --build
# dev：docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
# staging：docker compose -f docker-compose.yml -f docker-compose.stg.yml up -d --build

services:
  frontend:
    build: ./frontend
    container_name: ${PROJECT_NAME}-fe
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 128M
    networks:
      - gateway_net

  backend:
    build: ./backend
    container_name: ${PROJECT_NAME}-be
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
    deploy:
      resources:
        limits:
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
    networks:
      - gateway_net
      - global-data-link

networks:
  gateway_net:
    external: true
  global-data-link:
    external: true
```

### 3b. docker-compose.dev.yml（dev 覆盖文件）
```yaml
# docker-compose.dev.yml — 覆盖端口 + 环境变量
services:
  frontend:
    container_name: ${PROJECT_NAME}-dev-fe
    ports:
      - "${DEV_FE_PORT:-3100}:80"
  backend:
    container_name: ${PROJECT_NAME}-dev-be
    ports:
      - "${DEV_BE_PORT:-8100}:8000"
    env_file: .env.dev
    environment:
      - APP_ENV=dev
```

### 3c. docker-compose.stg.yml（staging 覆盖文件）
```yaml
# docker-compose.stg.yml — 覆盖端口 + 环境变量
services:
  frontend:
    container_name: ${PROJECT_NAME}-stg-fe
    ports:
      - "${STG_FE_PORT:-3200}:80"
  backend:
    container_name: ${PROJECT_NAME}-stg-be
    ports:
      - "${STG_BE_PORT:-8200}:8000"
    env_file: .env.stg
    environment:
      - APP_ENV=staging
```

### 4. .env.example 标准模板
```bash
# 项目标识
PROJECT_NAME=my-project

# 环境标识（dev / staging / production）— 由 docker-compose 覆盖文件注入
# APP_ENV=dev

# Supabase（从 grules/env.md 获取实际值）
SUPABASE_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=

# 前端（Vite 环境变量必须 VITE_ 前缀）
# dev/staging: http://115.159.109.23:{端口}
# production: https://{域名}
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE=

# 端口（dev/staging 用，生产不暴露端口）
# DEV_FE_PORT=3100
# DEV_BE_PORT=8100
# STG_FE_PORT=3200
# STG_BE_PORT=8200

# 可选：第三方服务
# DIFY_API_KEY=
# WECHAT_PAY_MCH_ID=
# TENCENT_SMS_SECRET_ID=
```

### 5. 前端 nginx.conf 模板
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（开发环境用，生产由外层 Nginx 网关处理）
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 四、关键文件说明（AI 必须首先生成）

每个新项目启动时，AI 必须按以下顺序生成基础设施文件：

```
第 1 步：docker-compose.yml + Dockerfile（前后端）
第 2 步：.env.example + .gitignore
第 3 步：后端 core/ 目录全部文件（config, auth, exceptions, response, supabase, middleware）
第 4 步：前端 lib/ 目录全部文件（supabase, api-client, constants）
第 5 步：前端 styles/ 全局样式 + providers/
第 6 步：前端 router/ + 基础 pages/
第 7 步：数据库初始迁移文件
第 8 步：开始按需求文档开发业务模块
```

---

## 五、.gitignore 必须包含

```gitignore
# 环境变量
.env
.env.local
.env.production

# 依赖
node_modules/

# 构建产物
dist/
build/

# IDE
.idea/
.vscode/settings.json

# 系统
.DS_Store
Thumbs.db

# Supabase 本地
.supabase/
```
