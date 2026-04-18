# 01 — 基础架构搭建 (Foundation Infrastructure)

> **优先级**: P0（最高优先级，一切模块的前提）
> **目标文件夹**: `/tasks/01-foundation/`
> **产品依据**: `product/00-product-overview.md` + `grules/02-project-structure.md` + `grules/01-rules.md`
> **预计任务数**: 12

---

## 一、分类概述

基础架构是整个知语平台的地基。包含项目脚手架初始化、Docker 容器编排、Supabase 数据库基础 Schema、Nginx 网关配置、Cosmic Refraction 设计系统落地、Three.js 粒子背景、全局样式体系等。

**此分类所有任务完成后的交付物**：
- 可通过 `docker compose up -d --build` 一键启动的前后端 + 数据库环境
- 前端展示 Cosmic Refraction 设计系统（毛玻璃、渐变网格、粒子背景）
- 后端 Express 框架可响应健康检查
- Supabase 基础 Schema（用户表、配置表）已建立
- Nginx 网关正常代理前后端流量

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T01-001 | 项目脚手架初始化 | M | 无 | 按 `grules/02-project-structure.md` 创建完整目录骨架 |
| T01-002 | Docker Compose 容器编排 | M | T01-001 | docker-compose.yml + 前后端 Dockerfile + 网络配置 |
| T01-003 | Nginx 网关配置 | S | T01-002 | 反向代理、CORS、SSL、静态资源 |
| T01-004 | 环境变量与配置管理 | S | T01-001 | .env.example + 后端 config.ts + 前端 env 变量 |
| T01-005 | Supabase 基础连接与配置 | M | T01-004 | Supabase Client 初始化（前后端）+ 健康检查 |
| T01-006 | 数据库基础 Schema — 用户与认证 | L | T01-005 | users 表 + profiles 表 + RLS + Migration |
| T01-007 | 数据库基础 Schema — 系统配置 | M | T01-005 | system_configs 表 + i18n 表 + Migration |
| T01-008 | 后端 Express 框架搭建 | M | T01-004 | main.ts + 中间件 + 统一响应 + 错误处理 + 健康检查 |
| T01-009 | 前端 Vite + React 框架搭建 | M | T01-004 | main.tsx + App.tsx + 路由骨架 + Tailwind v4 配置 |
| T01-010 | Cosmic Refraction 设计系统实现 | L | T01-009 | 全局 CSS 变量 + .glass 类库 + 渐变网格 Blob + 动画 |
| T01-011 | Three.js 粒子背景组件 | M | T01-010 | ParticleBackground 组件 + 性能降级 + 响应式 |
| T01-012 | 全链路集成验证 | M | T01-001~011 | Docker 构建 + 前后端联通 + 设计系统渲染验证 |

---

## 三、详细任务文件命名

```
/tasks/01-foundation/
├── T01-001-project-scaffold.md
├── T01-002-docker-compose.md
├── T01-003-nginx-gateway.md
├── T01-004-env-config.md
├── T01-005-supabase-setup.md
├── T01-006-db-schema-user-auth.md
├── T01-007-db-schema-system-config.md
├── T01-008-backend-express-setup.md
├── T01-009-frontend-vite-react-setup.md
├── T01-010-cosmic-refraction-design-system.md
├── T01-011-threejs-particle-background.md
└── T01-012-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

> 使用以下提示词让 AI 逐个展开上述任务为详细的任务文件。

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」中文学习平台的基础架构搭建生成详细的任务文件。

【必须先阅读的文件】
1. /grules/00-index.md — 规范索引
2. /grules/01-rules.md — 全局架构白皮书（重点：§一 前端 CSS 参数、§二 Supabase 哲学、§三 后端架构）
3. /grules/02-project-structure.md — 项目目录结构标准（完整目录模板）
4. /grules/05-coding-standards.md — 编码规范（命名约定、三层分离、Supabase 规则）
5. /grules/09-task-workflow.md — 任务执行工作流（任务卡片模板、验收标准格式）
6. /grules/env.md — 环境配置（端口、域名、Docker 网络）
7. /product/00-product-overview.md — 产品全景（技术栈、数据流、多语言体系）

【任务目标】
生成任务 T01-{NNN} 的详细任务文件，严格遵循 /tasks/list/00-index.md §四.3 的任务文件模板。

【特别要求】
- 数据库 Schema 必须包含完整的建表 SQL（含字段类型、索引、RLS 策略）
- Docker 配置必须包含完整的 Dockerfile 和 docker-compose.yml 内容
- 前端设计系统必须精确复制 grules/01-rules.md §一 中的所有 CSS 变量和动画参数
- Three.js 粒子组件必须满足 grules/01-rules.md 中的性能红线
- 每个任务的验收标准必须是可执行的 GIVEN-WHEN-THEN 格式
- 涉及文件路径必须严格遵循 grules/02-project-structure.md 的目录结构

【🚨 强制规则 — 以下规则适用于本分类所有任务，不可跳过】

1. **Docker 测试铁律**（参考 grules/08-qa-testing.md）:
   - ⛔ 绝对禁止在宿主机环境安装依赖或运行测试
   - ⛔ 绝对禁止使用 npm run dev / npm start 在宿主机直接启动服务
   - 所有测试必须通过 `docker compose up -d --build` 构建后，在容器内验证
   - Browser MCP（Puppeteer）做真实浏览器端到端测试
   - Docker 构建失败 = 任务未完成，必须修复后重新构建

2. **UI 设计规范铁律**（参考 grules/01-rules.md §一 + grules/06-ui-design.md）:
   - 严格遵循 Cosmic Refraction（宇宙折射）毛玻璃设计系统
   - 色彩仅限 Rose/Sky/Amber + 中性色，严禁出现紫色 (Purple)
   - 毛玻璃基线参数：blur(24px) saturate(1.8)
   - Tailwind CSS v4（@import "tailwindcss" + @theme），禁止存在 tailwind.config.js
   - Light/Dark 双模式必须验证
   - 响应式必须覆盖 375px / 768px / 1280px 三个断点

3. **自动化验证闭环**:
   - 编码完成 → Docker 构建 → 容器健康检查 → 功能验证 → 验收标准逐条验证
   - 发现问题 → 修复 → 重新 Docker 全量构建 → 重新全量测试（不能只测修复部分）
   - 所有 GIVEN-WHEN-THEN 验收标准 ✅ 通过 + 自检清单全绿 → 才能声明完成
   - 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

4. **结果报告铁律**:
   - 任务完成后，必须在 `/tasks/result/{分类文件夹}/` 下创建同名结果报告
   - 报告格式严格遵循 `/tasks/list/00-index.md` §八.2 结果文件模板
   - 报告必须包含：执行摘要、新增/修改文件、Docker 测试结果、验收标准检验、问题修复记录
   - 明确告知用户需要做什么（或"无需用户操作"）
   - ⚠️ 没有写结果报告 = 任务未完成
```

---

## 五、关键技术决策参考

| 决策点 | 选择 | 依据 |
|--------|------|------|
| 样式方案 | Tailwind CSS v4 + CSS 变量 | `grules/01-rules.md` 强制要求 |
| 禁止项 | 无 `tailwind.config.js` | `grules/01-rules.md` 绝对红线 |
| 粒子引擎 | Three.js ^0.160.0 | `grules/01-rules.md` 锁定版本 |
| 数据库 | Supabase (PostgreSQL) | `grules/01-rules.md` §二 |
| 容器化 | Docker + docker-compose | `grules/01-rules.md` §四 |
| 后端框架 | Express + TypeScript | `grules/02-project-structure.md` |
| 前端框架 | Vite + React + TypeScript | `grules/02-project-structure.md` |
