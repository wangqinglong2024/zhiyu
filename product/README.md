# 产品文档索引

> **使用规则：** 每次对话必须加载 `GLOBAL.md`，然后根据当前开发任务按需加载对应模块文件。

---

## 全局配置（每次对话必带）

| 文件 | 内容 | 大小 |
|------|------|------|
| [GLOBAL.md](GLOBAL.md) | 产品定位、技术栈、系统架构、数据库Schema、安全规则、状态机、UI规范、合规要求、API总览 | ~核心 |

---

## 应用端模块

| 文件 | 内容 | 开发场景 |
|------|------|----------|
| [app/auth.md](app/auth.md) | 登录注册、短信验证码、微信登录、JWT、邀请码绑定 | 做认证相关功能时加载 |
| [app/order-payment.md](app/order-payment.md) | 创建订单、支付流程、Webhook回调、幂等性 | 做订单/支付相关功能时加载 |
| [app/ai-report.md](app/ai-report.md) | Dify调用、报告生成、报告展示UI、海报分享 | 做AI生成/报告展示时加载 |
| [app/commission-wallet.md](app/commission-wallet.md) | 佣金结算、钱包余额、提现申请（用户端） | 做佣金/钱包/提现功能时加载 |
| [app/pages.md](app/pages.md) | 首页、输入页、我的页面、邀请落地页的UI布局 | 做前端页面时加载 |

---

## 管理端模块

| 文件 | 内容 | 开发场景 |
|------|------|----------|
| [admin/login.md](admin/login.md) | 管理员认证方式 | 做管理员登录时加载 |
| [admin/dashboard.md](admin/dashboard.md) | 核心指标卡片、收入折线图、成本估算 | 做Dashboard时加载 |
| [admin/orders.md](admin/orders.md) | 订单列表、详情、退款操作 | 做订单管理时加载 |
| [admin/withdrawals.md](admin/withdrawals.md) | 提现审核、打款确认、税务处理 | 做提现管理时加载 |
| [admin/users.md](admin/users.md) | 用户列表、详情、冻结/解封 | 做用户管理时加载 |
| [admin/settings.md](admin/settings.md) | 价格配置、AI成本系数、公告 | 做系统设置时加载 |

---

## 工程文档（开发时按需加载）

| 文件 | 内容 | 开发场景 |
|------|------|----------|
| [engineering/backend-structure.md](engineering/backend-structure.md) | FastAPI 目录结构、模块划分、核心依赖注入、响应格式约定 | 搭建后端骨架时加载 |
| [engineering/frontend-structure.md](engineering/frontend-structure.md) | React 目录结构、路由配置、状态管理、支付跳转流程、管理端技术选型 | 搭建前端骨架时加载 |
| [engineering/database-migrations.md](engineering/database-migrations.md) | 完整建表 SQL、RLS 策略、索引设计、约束规则 | 初始化数据库时加载 |
| [engineering/deployment.md](engineering/deployment.md) | Docker Compose、Nginx 配置、Dockerfile、SSL、部署流程 | 部署上线时加载 |
| [engineering/environment.md](engineering/environment.md) | 所有环境变量清单、.env 模板、开发/生产区分 | 配置环境时加载 |

---

## 原始完整文档（归档，日常开发不需要）

| 文件 | 说明 |
|------|------|
| [../应用端.md](../应用端.md) | 应用端完整PRD原文 |
| [../管理端.md](../管理端.md) | 管理端完整PRD原文 |
