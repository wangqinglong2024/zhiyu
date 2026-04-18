# 02 — 全局框架 (Global Framework)

> **优先级**: P0
> **目标文件夹**: `/tasks/02-global-framework/`
> **产品依据**: `product/apps/01-global-framework/` 全部文件
> **前置依赖**: 01-基础架构搭建 完成
> **预计任务数**: 14

---

## 一、分类概述

全局框架是应用端所有业务模块的公共基础设施。包含底部 Tab 导航、登录注册认证系统、多语言切换（UI 三语 + 内容拼音/中文/解释语言）、明暗主题、推送通知、全局状态管理、通用 UI 组件库、PWA 配置等。

**此分类完成后的交付物**：
- 四 Tab 底部导航框架可正常切换
- Google/Apple/邮箱登录注册全流程跑通
- 三语（中/英/越）UI 切换 + 内容语言模式切换
- Light/Dark 主题切换 + 跟随系统
- 通用组件（Button/Input/Modal/Toast/Skeleton）可用
- PWA 可安装

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T02-001 | 底部 Tab 导航 — 数据库与路由 | M | T01-012 | Tab 路由配置 + 页面骨架 + 导航守卫 |
| T02-002 | 认证系统 — 数据库 Schema | M | T01-006 | auth 相关扩展字段 + OAuth provider 配置 |
| T02-003 | 认证系统 — 后端 API | L | T02-002 | Supabase Auth 集成 + JWT 验签中间件 + 登录/注册/重置密码 |
| T02-004 | 认证系统 — 前端登录注册 | L | T02-003 | 登录弹窗 + Google/Apple OAuth + 邮箱登录 + 注册 + 推荐码 |
| T02-005 | 认证系统 — 登录墙与路由守卫 | M | T02-004 | 未登录拦截 + 登录后回跳 + 权限层级判断 |
| T02-006 | 多语言系统 — 后端 i18n 接口 | M | T01-007 | i18n 表 CRUD API + 语言包加载 |
| T02-007 | 多语言系统 — 前端 i18n 框架 | M | T02-006 | i18n 框架集成 + 语言切换 + 内容语言模式（拼音+中文/纯中文/解释语言） |
| T02-008 | 主题系统 — Light/Dark 切换 | M | T01-010 | ThemeProvider + CSS 变量切换 + 跟随系统 + 持久化 |
| T02-009 | 推送通知系统 — 基础架构 | M | T02-003 | 推送订阅 + 服务端推送能力 + 通知权限管理 |
| T02-010 | 全局状态管理 | M | T02-004 | 用户状态 + 语言状态 + 主题状态 + 全局 Loading/Error |
| T02-011 | 通用 UI 组件库 — 基础原子组件 | L | T01-010 | Button/Input/Modal/Toast/Skeleton/Card + 毛玻璃样式 |
| T02-012 | 通用 UI 组件库 — 布局组件 | M | T02-011 | Header/Sidebar/PageContainer/LoadingScreen |
| T02-013 | PWA 配置与离线能力 | M | T02-012 | manifest.json + Service Worker + 离线缓存策略 |
| T02-014 | 全局框架集成验证 | M | 全部 | 四 Tab 切换 + 登录流程 + 多语言 + 主题 + Docker 验证 |

---

## 三、详细任务文件命名

```
/tasks/02-global-framework/
├── T02-001-tab-navigation.md
├── T02-002-auth-db-schema.md
├── T02-003-auth-backend-api.md
├── T02-004-auth-frontend-login.md
├── T02-005-auth-login-wall.md
├── T02-006-i18n-backend.md
├── T02-007-i18n-frontend.md
├── T02-008-theme-system.md
├── T02-009-push-notification.md
├── T02-010-global-state.md
├── T02-011-ui-components-atomic.md
├── T02-012-ui-components-layout.md
├── T02-013-pwa-config.md
└── T02-014-global-integration.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」中文学习平台的全局框架模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/00-index.md — 规范索引
2. /grules/01-rules.md — 全局架构白皮书（§一 前端 CSS 参数、§三 后端架构、§五 开发纪律）
3. /grules/02-project-structure.md — 项目目录结构标准
4. /grules/04-api-design.md — API 设计规约（统一响应格式、鉴权、分页）
5. /grules/05-coding-standards.md — 编码规范（Supabase Auth 集成、JWT 验签）
6. /grules/06-ui-design.md — UI/UX 设计规范（Cosmic Refraction 完整体系）
7. /grules/09-task-workflow.md — 任务执行工作流（任务卡片模板）
8. /product/apps/01-global-framework/ — 全局框架 PRD（全部 9 个文件）
   - 00-index.md → 模块总览
   - 01-tab-navigation.md → 底部导航 PRD
   - 02-auth-system.md → 认证系统 PRD
   - 03-language-system.md → 多语言系统 PRD
   - 04-theme-mode.md → 主题模式 PRD
   - 05-push-notification.md → 推送通知 PRD
   - 06-global-states.md → 全局状态 PRD
   - 07-common-components.md → 通用组件 PRD
   - 08-pwa.md → PWA 配置 PRD
   - 09-nonfunctional.md → 非功能需求
9. /product/00-product-overview.md — 产品全景（用户角色、权限层级、多语言体系）

【任务目标】
生成任务 T02-{NNN} 的详细任务文件，严格遵循 /tasks/list/00-index.md §四.3 的任务文件模板。

【特别要求】
- 认证系统必须完整覆盖 Supabase Auth 的 Google/Apple/邮箱三种方式
- JWT 验签必须遵循 grules/01-rules.md §三 的本地无状态验签规则
- 多语言系统必须覆盖 UI 三语（中/英/越）+ 内容语言模式（拼音+中文/纯中文 + 解释语言开关）
- 登录墙必须精确覆盖 product/00-product-overview.md §三.1 的三层用户权限
- 通用组件必须遵循 grules/01-rules.md §一 的毛玻璃样式参数
- 所有组件必须支持 Light/Dark 双模式
- 每个任务遵循 DB → Zod → Repo → Service → Router → 前端类型 → 前端 Service → Hook → UI 的依赖序

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
