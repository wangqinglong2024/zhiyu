# 知语 Zhiyu — 中文学习平台

面向东南亚的中文学习平台（PWA 应用端 + 管理后台）

## 技术栈

- **前端**: Vite + React 19 + TypeScript + Tailwind CSS v4
- **后端**: Express + TypeScript + Node.js 22
- **数据库**: Supabase (PostgreSQL + Auth)
- **容器化**: Docker + Docker Compose
- **网关**: Nginx

## 快速启动

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 一键启动
docker compose up -d --build

# 3. 访问
# 前端: http://localhost:3100
# 后端: http://localhost:8100/api/v1/health
```

## 项目结构

```
zhiyu/
├── frontend/       # 前端项目 (Vite + React)
├── backend/        # 后端项目 (Express + TS)
├── supabase/       # 数据库迁移
└── scripts/        # 运维脚本
```
