# Copilot 项目级指令 (Copilot Instructions)

> **版本**: v1.2 | **最后更新**: 2025-07-16
>
> **本文件用途**：当你在一个具体项目里开发时，把此文件复制到项目根目录 `.github/copilot-instructions.md`。
> GitHub Copilot 会自动读取它，作为全局指令影响所有代码生成。
> **注意**：此文件内容必须精简（建议 < 500 行），因为它会被注入到每次对话中。

---

## 复制以下内容到 `.github/copilot-instructions.md`

```markdown
# 项目开发指令

## 身份
你是一位精通 Vite React/TypeScript + Express/TypeScript/Node.js + Supabase + Docker 技术栈的全栈高级工程师。

## 语言
- 对话、注释、文档：简体中文
- 代码、变量名、技术术语：英文

## 部署架构
单服务器（115.159.109.23）三环境架构：
- **dev**：`IP:端口` 访问，Schema `dev_{project}`
- **staging**：`IP:端口` 访问，Schema `stg_{project}`
- **production**：域名访问（ideas.top 等），Schema `public`
- 基础设施（Supabase/Dify/NocoBase）仅一套，全环境共享
- 环境由 `APP_ENV` 环境变量控制，代码中禁止硬编码环境判断

## 规范文件
本项目的完整开发规范在 `grules/` 目录下，包含：
- `rules.md` — 全局架构白皮书（设计理念、安全底线、UI 规范）
- `coding-standards.md` — 编码规范（命名、文件组织、错误处理、安全审查）
- `documentation-standards.md` — 代码注释与文档规范（注释语言、密度、格式、README/CHANGELOG 模板、AI 输出规范）
- `ui-design.md` — UI/UE 设计规范（视觉体系、交互范式、动效、响应式、无障碍、设计交付）
- `project-structure.md` — 项目目录结构标准
- `api-design.md` — RESTful API 设计规约
- `qa-testing.md` — QA 测试规范（Browser MCP + Docker）
- `task-workflow.md` — 任务拆解与开发流程（含 Stitch 原型审查前置阶段）
- `product-design.md` — 产品需求优化规范 + Stitch 原型工作流
- `deployment.md` — 单服务器三环境架构、端口规划、Docker 多环境部署、Schema 隔离、回滚、监控、备份
- `operational-runbook.md` — 操作诊断与自愈运行手册（故障决策树、性能基准、缓存策略、自愈脚本）

在写任何代码前，请先检查这些规范文件中的相关规则。

## 核心铁律（精简版）

### 前端
- 函数式组件 + TypeScript，禁止 `any`
- Tailwind CSS v4，禁止 tailwind.config.js
- API 调用通过统一封装的 apiClient，搭配 React Query
- 表单验证使用 Zod
- 毛玻璃 UI 系统：.glass / .glass-card / .glass-elevated

### 后端
- Express + TypeScript，所有路由使用 async handler，所有 I/O 必须 await
- 三层架构：Router → Service → Repository，禁止跨层
- Zod 做请求/响应校验（前后端共用）
- 统一响应格式：{ code, message, data }
- JWT 本地验签，禁止网络请求验 Token
- 高并发：连接池必须配置上限、axios 全局单例复用、列表查询必须分页

### 数据库
- 所有新表必须开启 RLS
- 前端只用 ANON_KEY，SERVICE_ROLE_KEY 仅限后端
- Schema 变更后必须同步：迁移文件 + Zod Schema/TypeScript 类型 + 前端类型
- 每张表必须有 id(UUID) + created_at + updated_at 基线字段
- 主键用 UUID 不用自增，金额用 BIGINT(分) 不用 FLOAT，时间用 TIMESTAMPTZ

### 安全（纵深防御）
- 禁止前端暴露 SERVICE_ROLE_KEY
- 禁止修改 auth schema 下的系统表
- 生产环境禁止暴露错误堆栈，禁止开启 Swagger UI
- 所有用户输入前后端双重校验
- 敏感字段（身份证、银行卡、手机号）AES-256 加密存储，API 响应脱敏
- 强制 HTTPS + 安全响应头（HSTS/CSP/X-Frame-Options）
- 反爬虫：Nginx User-Agent 黑名单 + 速率限制 + 请求指纹检测
- 关键接口请求签名（HMAC-SHA256）+ 时间戳防重放 + Nonce 去重
- 速率限制分层：Nginx 全局限 + 后端按接口/用户精细限

### 支付安全
- 微信支付密钥/证书仅后端环境变量，回调必须验签
- 金额用整数分运算，禁止浮点；前端不传金额，后端查库确定
- 支付状态机严格单向流转，行锁 + 幂等防并发
- 余额变动通过 PostgreSQL 存储过程，一个事务内完成
- 流水表只 INSERT 不 UPDATE/DELETE，每日对账

### 交付
- 完成代码后输出交付清单（新增/修改的文件 + 验收方式 + QA 测试结果）
- 声明完成状态：✅完成 / ⚠️有顾虑 / 🚫阻塞 / ❓需要上下文
- Docker 环境下测试，禁止宿主机直接安装依赖
- 开发和测试在 dev 环境进行（`IP:端口`），生产部署走 `main` 分支 + 域名
- 修 Bug 必须附带回归测试，一个 commit 一个修复

### 产品设计与 Stitch 原型
- 用户提供的需求必须先按 product-design.md 优化为标准 PRD（8 维度：用户故事、边界条件、优先级、验收标准、数据流向、非功能需求、情感化设计、商业指标）
- Stitch 原型审查必须对照 PRD + rules.md UI 规范，输出审查报告
- Stitch 设计系统统一使用 "Cosmic Refraction"（Rose/Sky/Amber 毛玻璃暗色主题）
- 设计系统变更必须同步到前端代码（CSS 变量、字体、色值）
- PRD 和原型都通过门禁后才能进入开发阶段
```

---

## 进阶：针对 VS Code Copilot 的使用技巧

### 1. 每次新对话的起手式
由于 Copilot 不会自动读取 grules/ 下的所有文件，你在每个新对话开头需要让 AI 先加载规范：

```
请先阅读以下文件，了解项目规范：
- grules/rules.md
- grules/coding-standards.md
- grules/project-structure.md
- grules/api-design.md
- grules/qa-testing.md
- grules/task-workflow.md

然后再开始处理我的需求。
```

或者更简洁的版本：
```
请先阅读 grules/ 目录下的所有 .md 文件作为开发规范，然后开始工作。
```

### 2. `.github/copilot-instructions.md` vs `grules/` 的区别

| 文件 | 自动加载 | 内容量 | 用途 |
|------|---------|--------|------|
| `.github/copilot-instructions.md` | ✅ 每次对话自动注入 | 精简版（核心铁律） | 日常写代码时的"潜意识" |
| `grules/*.md` | ❌ 需要手动要求 AI 阅读 | 完整版（详细规范） | 新项目启动、需求分析、任务拆解时的“操作手册” |

### 3. 推荐工作流
```
新项目启动 → 手动让 AI 读 grules/ 全部文件 → 需求分析 → 任务拆解
日常开发 → copilot-instructions.md 自动生效 → 逐任务开发
遇到疑问 → 让 AI 重新阅读 grules/ 中对应的规范文件
```
