# 11 — 管理后台-登录与仪表盘 (Admin Dashboard)

> **优先级**: P0
> **目标文件夹**: `/tasks/11-admin-dashboard/`
> **产品依据**: `product/admin/01-admin-dashboard/` 全部文件
> **前置依赖**: 01-基础架构搭建 完成
> **预计任务数**: 10

---

## 一、分类概述

管理后台的入口模块。包含管理员登录（邮箱+密码+二次验证）、角色权限体系（超级管理员/内容运营/用户运营/游戏运营）、全局侧边栏导航、数据看板首页（DAU/MAU/付费转化/收入等核心指标）。

**技术要点**：
- 桌面端优先（1280px 起）
- UI 语言：仅中文 + 英文
- 与应用端共享同一设计系统（Cosmic Refraction），但布局为左侧导航 + 右侧内容区
- 管理员账号独立于应用端用户，存储在 admin_users 表

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T11-001 | 数据库 Schema — 管理员与角色 | M | T01-012 | admin_users 表 + admin_roles 表 + 权限矩阵 + RLS |
| T11-002 | 后端 API — 管理员认证 | L | T11-001 | 登录 + 二次验证 + JWT + Session 管理 + 密码重置 |
| T11-003 | 后端 API — 角色权限管理 | M | T11-001 | 角色 CRUD + 权限分配 + 接口级鉴权中间件 |
| T11-004 | 后端 API — 数据看板 | L | T11-002 | DAU/MAU/注册/付费/收入/留存 聚合查询 + 缓存 |
| T11-005 | 前端 — 管理后台项目脚手架 | M | T01-009 | 独立前端入口（或同项目路由隔离）+ 桌面端布局 |
| T11-006 | 前端 — 登录页面 | M | T11-002 | 登录表单 + 二次验证 + 错误提示 + 记住登录 |
| T11-007 | 前端 — 全局导航与布局 | M | T11-003 | 左侧边栏 + 顶部栏 + 面包屑 + 权限路由守卫 |
| T11-008 | 前端 — 数据看板页面 | L | T11-004 | 核心指标卡片 + 图表（折线/柱状/饼图）+ 日期筛选 |
| T11-009 | 前端 — 管理员管理页面 | M | T11-003 | 管理员列表 + 新增/编辑 + 角色分配 + 禁用/启用 |
| T11-010 | 管理后台登录与仪表盘集成验证 | M | 全部 | 登录 → 权限验证 → 看板数据 → 管理员管理 |

---

## 三、详细任务文件命名

```
/tasks/11-admin-dashboard/
├── T11-001-db-admin-roles.md
├── T11-002-api-admin-auth.md
├── T11-003-api-admin-permissions.md
├── T11-004-api-dashboard-metrics.md
├── T11-005-fe-admin-scaffold.md
├── T11-006-fe-admin-login.md
├── T11-007-fe-admin-navigation.md
├── T11-008-fe-admin-dashboard.md
├── T11-009-fe-admin-management.md
└── T11-010-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」管理后台的「登录与仪表盘」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构
2. /grules/02-project-structure.md — 项目目录结构
3. /grules/04-api-design.md — API 设计规约
4. /grules/05-coding-standards.md — 编码规范
5. /grules/06-ui-design.md — UI/UX 设计规范（管理后台同样遵循 Cosmic Refraction）
6. /grules/09-task-workflow.md — 任务执行工作流
7. /product/admin/01-admin-dashboard/ — 管理后台仪表盘 PRD（全部 5 个文件）
   - 00-index.md → 模块总览
   - 01-login.md → 登录页 PRD
   - 02-permissions.md → 权限系统 PRD
   - 03-navigation.md → 导航系统 PRD
   - 04-dashboard.md → 数据看板 PRD
   - 05-data-nonfunctional.md → 数据模型与非功能需求
8. /product/admin/00-admin-overview.md — 管理后台总览（角色权限矩阵）
9. /product/00-product-overview.md §二.2 — 管理后台六大模块 + §三.2 — 管理后台角色

【任务目标】
生成任务 T11-{NNN} 的详细任务文件。

【特别要求】
- 管理员账号体系独立于应用端用户
- 登录必须支持二次验证（邮箱验证码或 TOTP）
- 四种角色权限必须精确实现：超级管理员/内容运营/用户运营/游戏运营
- 权限控制粒度到接口级别（后端中间件）和页面/按钮级别（前端路由守卫）
- 数据看板聚合查询必须使用 PostgreSQL 函数 + 缓存（Redis/node-cache）
- 图表使用 Chart.js 或 Recharts（React 生态）
- 管理后台前端可以是同项目不同路由前缀（/admin），也可以是独立前端项目
- 布局：左侧可收缩侧边栏（240px 展开 / 64px 收缩）+ 顶部信息栏 + 面包屑

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
