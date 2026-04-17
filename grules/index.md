# 规范文件索引 (Standards Index)

> **版本**: v2.0 | **最后更新**: 2026-04-17
>
> **AI 请先阅读此文件**，了解本项目的完整规范体系，然后按需深入阅读具体文件。
>
> **架构概要**：单服务器（`115.159.109.23`）三环境架构。基础设施（Supabase/Dify/NocoBase）仅一套，前后端按 dev/staging/prod 独立容器。

---

## 文件清单

### 🔴 全局必读（每个项目启动时）

| 文件 | 内容 | 什么时候读 |
|------|------|-----------|
| [rules.md](rules.md) | 全局架构白皮书（技术栈声明 + Cosmic Refraction 设计系统技术参数 + Supabase/Express/测试哲学 + AI 开发工作流） | **每个项目启动时必读** |
| [env.md](env.md) | 项目凭证与配置（Supabase/Dify/微信支付等） | 需要配置连接信息时 |

### 🟠 产品与设计阶段

| 文件 | 内容 | 什么时候读 |
|------|------|-----------|
| [product-design.md](product-design.md) | 产品需求文档全维度规范 + Stitch 原型工作流 + MCP API 调用手册 + 竞品分析/用户旅程模板 | 写需求、审查原型、管理设计系统时 |
| [ui-design.md](ui-design.md) | **UI/UE 设计规范**（视觉体系、字体/色彩/间距/圆角/阴影、交互范式、动效设计、响应式策略、无障碍、设计交付规范） | **设计页面、审查 UI、评审原型时必读** |

### 🟡 编码与开发阶段

| 文件 | 内容 | 什么时候读 |
|------|------|-----------|
| [coding-standards.md](coding-standards.md) | 编码规范（命名约定、前后端规范、Git 规范、**纵深安全体系**、**支付资金安全**、**数据库设计铁律**、审查检查表） | **写任何代码前必读** |
| [documentation-standards.md](documentation-standards.md) | **代码注释与文档规范**（注释语言、密度、格式模板、Markdown 文档标准、README/CHANGELOG 模板、AI 生成内容规范） | **写代码/生成文档/交付任务时必读** |
| [api-design.md](api-design.md) | RESTful API 设计规约（URL 规范、响应格式、错误码、分页、鉴权） | 设计或开发 API 时 |
| [project-structure.md](project-structure.md) | 项目目录结构标准模板（前端/后端/数据库/脚本） | 创建新项目或新模块时 |

### 🟢 测试与质量阶段

| 文件 | 内容 | 什么时候读 |
|------|------|-----------|
| [qa-testing.md](qa-testing.md) | QA 测试规范（Browser MCP 测试方法、Docker 强制规则、Bug 报告格式、健康评分） | 测试任何功能时必读 |

---

## 技术栈速查

```
前端：Vite + React + TypeScript + Tailwind CSS v4
后端：Express + TypeScript + Node.js（全异步）
数据库：Supabase（PostgreSQL + Auth + Storage + Realtime）
容器化：Docker + Docker Compose
网关：Nginx 反向代理
AI 工作流：Dify
原型设计：Stitch（通过 MCP 集成，支持原型审查/创建/修改）
```

---

## AI 标准开发流水线

> 这是 AI 从需求到交付的完整工作流。每个阶段有明确的输入、输出和门禁，严禁跳过或合并阶段。

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 标准开发流水线                          │
│                                                             │
│  ❶ 需求理解   读取 PRD / 用户描述                            │
│      ↓        输出：结构化需求确认                            │
│  ❷ PRD 优化   按 product-design.md 8 维度检查                │
│      ↓        输出：优化后 PRD → product/ 目录               │
│  ❸ 原型审查   Stitch 原型 ↔ PRD 一致性 + UI 规范合规         │
│      ↓        输出：审查报告 → product/ 目录                  │
│  ❹ 技术分析   功能模块拆解 + 数据库设计 + API 清单            │
│      ↓        输出：技术方案（含数据流图）                     │
│  ❺ 任务拆解   按依赖关系拆分原子任务                          │
│      ↓        输出：任务清单（含优先级和验收标准）              │
│  ❻ 逐任务开发  基础设施 → 数据库 → 后端 → 前端 → 集成         │
│      ↓        每个任务完成后立即 Docker 构建验证               │
│  ❼ QA 测试    Docker 环境 + Browser MCP 全链路验证            │
│      ↓        输出：测试报告 + 健康评分                       │
│  ❽ 交付确认   代码审查检查表 + 完成状态声明                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 阶段详解

#### ❶ 需求理解
- 读取用户提供的需求描述或 PRD 文件
- 用自己的话复述需求，确认理解无偏差
- 如有歧义，**立即提问**，不擅自假设

#### ❷ PRD 优化（参照 `product-design.md`）
- 按 8 维度检查矩阵逐项审查
- 补全信息架构、状态矩阵、用户动线
- 输出优化后的 PRD 保存到 `product/prd-{项目名}.md`
- **Gate 1**：8 维度全部达标后方可进入下一阶段

#### ❸ 原型审查（参照 `product-design.md` + `ui-design.md`）
- 检查 Stitch 原型与 PRD 的一致性
- 检查 Cosmic Refraction 设计系统合规性
- 如无原型，从 PRD 生成原型
- **Gate 2**：原型审查通过后方可进入技术分析

#### ❹ 技术分析
- 从 PRD 功能清单推导出：功能模块划分、数据库表设计、API 端点清单
- 绘制核心数据流图
- 标记技术风险点和依赖关系
- **参照**：`rules.md`（架构哲学）+ `coding-standards.md`（安全/数据库铁律）

#### ❺ 任务拆解
- 每个任务 = 一个可独立验证的最小功能单元
- 任务按依赖关系排序：基础设施 → 数据库 → 后端 API → 前端页面 → 集成联调
- 每个任务必须包含：范围描述、涉及文件、验收标准

任务拆解模板：
```markdown
### T-{模块}.{序号}: {任务标题}
- **范围**：{具体要做什么}
- **涉及文件**：
  - 前端：`src/features/{module}/...`
  - 后端：`src/services/{module}-service.ts`
  - 数据库：`supabase/migrations/...`
- **验收标准**：
  1. {可测量的完成条件}
  2. {可测量的完成条件}
- **依赖**：T-{x}.{y}（如有）
```

#### ❻ 逐任务开发
严格按以下顺序执行每个任务：

```
1. 创建数据库迁移文件 → MCP 执行 → 同步类型
2. 编写后端 Repository → Service → Router
3. 编写前端 Service → Hook → 组件 → 页面
4. Docker 构建验证：docker compose up -d --build
5. 代码审查检查表自查（coding-standards.md §七）
6. 标记任务完成
```

**开发纪律**：
- 一个任务一个 commit，禁止跨任务混合提交
- 每个 commit 后 Docker 构建必须成功（零编译错误）
- 前端代码必须通过 `npm run build`
- 后端代码必须通过 TypeScript 编译

#### ❼ QA 测试（参照 `qa-testing.md`）
- 所有测试基于 Docker 环境，**严禁宿主机裸跑**
- 使用 Browser MCP 执行端到端验证
- 输出健康评分，≥ 90 分方可交付

#### ❽ 交付确认
输出交付清单：

```markdown
## 交付清单

### 新增/修改文件
- `file-path` — 说明

### 验收方式
1. 启动命令
2. 访问地址
3. 预期效果

### 完成状态
✅ 完成 / ⚠️ 完成但有顾虑 / 🚫 阻塞 / ❓ 需要上下文
```

---

## 全流程覆盖验证

```
💡 想法 ──→ product-design.md（PRD 优化 + 8 维度门禁）
🎨 设计 ──→ ui-design.md（视觉/交互/动效/响应式/无障碍设计标杆）
         + rules.md §一（Cosmic Refraction 技术参数）
         + product-design.md §二-三（Stitch 原型工作流 + 设计系统同步）
💻 编码 ──→ coding-standards.md（命名/安全/Git/支付）
         + documentation-standards.md（注释/文档/AI 输出规范）
         + api-design.md（API 设计规约）
         + project-structure.md（目录结构模板）
🧪 测试 ──→ qa-testing.md（Browser MCP + Docker 强制规则）
⚙️ 配置 ──→ env.md（凭证）
```

---

## 新项目启动快速指引

```
1. 把 grules/ 整个目录复制到新项目（或保持在公共位置引用）
2. 在 product/ 目录写好产品需求文档（按 product-design.md 规范优化）
3. 页面设计按 ui-design.md 的视觉体系和交互规范执行
4. 如有 Stitch 原型，按 product-design.md 的流程审查
5. 所有代码遵循 coding-standards.md + documentation-standards.md 的规范
6. 按 project-structure.md 创建项目骨架 + Docker 基础设施
7. 开始按本文件「AI 标准开发流水线」的 8 个阶段推进
```
