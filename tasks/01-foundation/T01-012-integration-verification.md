# T01-012: 全链路集成验证

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 2

## 需求摘要

对基础架构搭建阶段（T01-001 ~ T01-011）的全部成果进行端到端集成验证。通过 `docker compose up -d --build` 一键构建，验证前后端联通、数据库连接、设计系统渲染、Nginx 代理、健康检查、Light/Dark 模式、响应式布局全部正常。本任务是基础架构的最终交付验收关。

## 相关上下文

- 测试规范: `grules/08-qa-testing.md` — 完整测试方法论
- 任务流程: `grules/09-task-workflow.md` §四.3 — 增量验证策略
- 任务清单: `/tasks/list/00-index.md` §六 — Docker 自动化测试铁律
- 关联任务: 前置 T01-001 ~ T01-011（全部完成后执行本任务）

## 技术方案

### 验证链路

```
docker compose up -d --build
       ↓
┌─── 构建阶段 ───────────────────────────────────┐
│  前端: npm ci → tsc → vite build → nginx 镜像   │
│  后端: npm ci → tsc → node 镜像                  │
│  验证: 构建零错误                                │
└────────────────────────────────────────────────┘
       ↓
┌─── 启动阶段 ───────────────────────────────────┐
│  docker compose ps → 所有容器 Running            │
│  后端: 连接 Supabase → 健康检查 OK              │
│  前端: Nginx 启动 → 静态资源可访问              │
└────────────────────────────────────────────────┘
       ↓
┌─── 联通验证 ───────────────────────────────────┐
│  前端 → Nginx → 后端 API → Supabase             │
│  前端 → Nginx → 静态资源                         │
│  Nginx → SPA 路由回退                            │
└────────────────────────────────────────────────┘
       ↓
┌─── 视觉验证 ───────────────────────────────────┐
│  渐变网格 Blob 漂移动画                          │
│  Three.js 粒子层叠加                             │
│  毛玻璃面板效果                                   │
│  Light/Dark 模式切换                              │
│  375px / 768px / 1280px 三断点                   │
└────────────────────────────────────────────────┘
```

### 详细验证清单

#### A. Docker 构建验证

```bash
# A1. 全量构建
docker compose up -d --build

# A2. 容器状态
docker compose ps
# 预期：frontend = Running, backend = Running (healthy)

# A3. 后端日志
docker compose logs --tail=50 backend
# 预期：无 Error，输出 "✅ 知语后端已启动"

# A4. 前端日志
docker compose logs --tail=50 frontend
# 预期：Nginx 启动成功，无错误
```

#### B. API 联通验证

```bash
# B1. 后端健康检查（直接访问）
curl -s http://localhost:8100/api/v1/health | jq
# 预期：{ code: 0, data: { database: "connected" } }

# B2. 前端通过 Nginx 代理访问后端（关键：验证反向代理）
curl -s http://localhost:3100/api/v1/health | jq
# 预期：与 B1 相同结果

# B3. 404 路由
curl -s http://localhost:8100/api/v1/nonexistent | jq
# 预期：{ code: 40400, message: "路由不存在: ..." }
```

#### C. 前端页面验证（Browser MCP）

```
# C1. 首页加载
→ 导航到 http://localhost:3100
→ 截图：确认"知语 Zhiyu"欢迎页显示
→ 检查控制台：无 Error

# C2. 渐变网格 Blob
→ 截图：确认 3 个模糊 Blob 可见
→ 等待 3 秒后再截图：确认 Blob 在漂移

# C3. Three.js 粒子
→ 截图：确认粒子可见（在 Blob 之上）
→ 检查控制台：无 WebGL 错误

# C4. Light/Dark 模式
→ 截图 Light 模式
→ 执行 JS: document.documentElement.classList.toggle('dark')
→ 截图 Dark 模式
→ 对比：Blob 颜色变化、背景色变化、文字颜色变化

# C5. 响应式
→ 设置视口 375px → 截图
→ 设置视口 768px → 截图
→ 设置视口 1280px → 截图

# C6. SPA 路由
→ 导航到 http://localhost:3100/nonexistent
→ 截图：确认 404 页面显示
→ 点击"返回首页" → 确认导航回首页

# C7. 安全头
→ 检查响应头：X-Frame-Options, X-Content-Type-Options 存在
```

#### D. 数据库验证

```
# D1. profiles 表
→ 查询 \d profiles → 确认表结构完整
→ 查询 RLS 策略 → 确认已启用

# D2. system_configs 表
→ 查询种子数据 → 确认 ≥ 7 条配置

# D3. i18n_translations 表
→ 查询表结构 → 确认存在
```

#### E. 设计系统验证

```
# E1. 无 tailwind.config.js
→ find . -name "tailwind.config.js" → 无结果

# E2. 无紫色
→ grep -r "purple\|violet\|#7c3aed\|#8b5cf6" frontend/src/ → 无结果

# E3. 毛玻璃类
→ 确认 .glass / .glass-card / .glass-elevated 在 CSS 中定义

# E4. CSS 变量
→ 确认 :root 和 .dark 中包含所有必要变量
```

## 范围（做什么）

- 执行完整的 Docker 构建和启动
- 验证所有容器健康状态
- 验证前后端 API 联通（包括 Nginx 代理）
- 验证前端页面渲染和设计系统
- 验证 Light/Dark 模式
- 验证 375/768/1280 三断点响应式
- 验证数据库 Schema 完整性
- 验证设计系统合规性（无紫色、无 tailwind.config.js）
- 生成集成验证结果报告

## 边界（不做什么）

- 不开发新功能
- 不修改已完成任务的代码（发现问题时记录，由对应任务修复）
- 不进行性能压测
- 不测试认证流程（T02 全局框架）

## 涉及文件

- 不修改: 任何源码文件
- 新建: `zhiyu/scripts/health-check.sh`（可选：自动化健康检查脚本）
- 新建: `/tasks/result/01-foundation/T01-012-integration-verification.md`（结果报告）

## 依赖

- 前置: T01-001 ~ T01-011（全部完成）
- 后续: T02-全局框架（基础架构验证通过后方可开始）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 执行 `docker compose up -d --build`  
   **WHEN** 构建完成  
   **THEN** 零错误，所有镜像构建成功

2. **GIVEN** 所有容器启动  
   **WHEN** 执行 `docker compose ps`  
   **THEN** frontend 和 backend 容器均为 Running，backend 为 healthy

3. **GIVEN** 后端容器运行中  
   **WHEN** 访问 `http://localhost:8100/api/v1/health`  
   **THEN** 返回 `{ code: 0, data: { service: "zhiyu-backend", database: "connected" } }`

4. **GIVEN** Nginx 反向代理配置完成  
   **WHEN** 访问 `http://localhost:3100/api/v1/health`  
   **THEN** 请求被代理到后端，返回与直接访问相同的结果

5. **GIVEN** 前端页面加载  
   **WHEN** Browser MCP 导航到 `http://localhost:3100`  
   **THEN** 显示"知语 Zhiyu"欢迎页，渐变 Blob 和粒子可见，控制台无 Error

6. **GIVEN** 前端加载完成  
   **WHEN** 切换 Dark 模式  
   **THEN** 背景、Blob 颜色、文字颜色全部正确切换

7. **GIVEN** 前端加载完成  
   **WHEN** 调整视口至 375px  
   **THEN** 页面正常渲染，无溢出或错位

8. **GIVEN** 所有验证完成  
   **WHEN** 检查设计系统合规  
   **THEN** 无紫色元素、无 tailwind.config.js、毛玻璃参数正确

9. **GIVEN** 数据库 Migration 已执行  
   **WHEN** 查询 profiles、system_configs、i18n_translations 表  
   **THEN** 三张表存在，RLS 已开启，种子数据完整

10. **GIVEN** SPA 路由配置  
    **WHEN** 访问 `http://localhost:3100/any-deep-route`  
    **THEN** Nginx 返回 index.html，React Router 显示 404 页面

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

**完整执行上述 A ~ E 所有验证项**。

### 测试通过标准

```
构建阶段:
  ✅ docker compose build 零错误
  ✅ 前后端镜像构建成功

启动阶段:
  ✅ 所有容器 Running (healthy)
  ✅ 后端日志无 Error
  ✅ 前端 Nginx 启动正常

API 联通:
  ✅ 直接访问后端健康检查 → 200
  ✅ 通过 Nginx 代理访问 → 200
  ✅ 404 路由返回标准格式
  ✅ 数据库状态 connected

前端渲染:
  ✅ 首页正常显示
  ✅ 渐变网格 Blob 可见且漂移
  ✅ Three.js 粒子可见
  ✅ 控制台无 Error
  ✅ Light/Dark 切换正常
  ✅ 375px / 768px / 1280px 响应式正常
  ✅ 404 页面正常

数据库:
  ✅ profiles 表完整 + RLS
  ✅ system_configs 种子数据完整
  ✅ i18n_translations 表完整

设计合规:
  ✅ 无 tailwind.config.js
  ✅ 无紫色元素
  ✅ 毛玻璃参数正确
  ✅ CSS 变量完整
```

### 测试不通过处理

- 记录所有未通过项，创建修复清单
- 回到对应任务进行修复
- 修复后重新执行完整 T01-012 验证（不可部分验证）
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-012-integration-verification.md`

### 报告要求

本任务的结果报告是整个基础架构分类的**总结性报告**，需额外包含：

1. **完整截图记录**：Light/Dark 模式各 1 张 + 375/768/1280 各 1 张 = 至少 5 张
2. **API 响应截图**：健康检查 JSON 响应
3. **所有 10 条验收标准的逐条结果**
4. **遗留问题汇总**（如有）
5. **对 T02 全局框架的建议**（如发现需要调整的架构决策）

## 自检重点

- [ ] Docker 构建零错误
- [ ] 全链路联通（前端 → Nginx → 后端 → Supabase）
- [ ] 设计系统完整渲染
- [ ] Light/Dark 双模式
- [ ] 响应式三断点
- [ ] 数据库 Schema 完整
- [ ] 安全头存在
- [ ] 无合规问题（紫色/tailwind.config.js）
