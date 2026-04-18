# 03 — 发现中国 (Discover China)

> **优先级**: P0
> **目标文件夹**: `/tasks/03-discover-china/`
> **产品依据**: `product/apps/02-discover-china/` 全部文件
> **内容参考**: `/china/` 全部 12 个类目文件
> **前置依赖**: 02-全局框架 完成
> **预计任务数**: 13

---

## 一、分类概述

「发现中国」是应用端 Tab 1，用户打开 App 的第一个页面，是流量入口和转化漏斗的起点。包含 12 大文化类目浏览、每日金句展示与分享、文章列表与详情、收藏体系、分享功能等。

**核心业务规则**：
- 未登录访客：仅可浏览前 3 类目（中国历史、中国美食、名胜风光）
- 登录用户：全部 12 类目免费浏览
- 内容来源：Dify 工作流生成 → 运营后台审核上架 → 用户端展示

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T03-001 | 数据库 Schema — 文章与类目 | L | T02-014 | categories 表 + articles 表 + article_translations 表 + 索引 + RLS |
| T03-002 | 数据库 Schema — 每日金句 | M | T03-001 | daily_quotes 表 + 多语言字段 + 排期字段 + RLS |
| T03-003 | 数据库 Schema — 收藏 | S | T03-001 | user_favorites 表 + 联合唯一索引 + RLS |
| T03-004 | 后端 API — 文章与类目 | L | T03-001 | 类目列表 + 文章列表（分页/排序）+ 文章详情 + 浏览量统计 |
| T03-005 | 后端 API — 每日金句 | M | T03-002 | 获取当日金句 + 金句历史列表 |
| T03-006 | 后端 API — 收藏 | M | T03-003 | 收藏/取消收藏 + 我的收藏列表 |
| T03-007 | 前端 — 类目首页 | L | T03-004, T03-005 | 每日金句卡片 + 12 类目网格 + 未登录遮罩 + 登录解锁标签 |
| T03-008 | 前端 — 文章列表页 | M | T03-004 | 类目封面 + 文章卡片流 + 下拉刷新 + 触底加载 + 排序切换 |
| T03-009 | 前端 — 文章详情页 | L | T03-004, T03-006 | 多语言内容渲染 + 音频播放 + 长按选词 + 字体调节 + 收藏 |
| T03-010 | 前端 — 每日金句与分享 | M | T03-005 | 金句卡片组件 + 分享图片生成（Canvas）+ 保存/分享 |
| T03-011 | 前端 — 收藏系统 | M | T03-006 | 收藏按钮动画 + 我的收藏列表页 |
| T03-012 | 前端 — 分享系统 | M | T03-009 | 文章分享卡片生成 + 二维码 + Web Share API |
| T03-013 | 发现中国集成验证 | M | 全部 | 全链路测试：类目浏览 → 文章阅读 → 收藏 → 金句分享 |

---

## 三、详细任务文件命名

```
/tasks/03-discover-china/
├── T03-001-db-articles-categories.md
├── T03-002-db-daily-quotes.md
├── T03-003-db-favorites.md
├── T03-004-api-articles-categories.md
├── T03-005-api-daily-quotes.md
├── T03-006-api-favorites.md
├── T03-007-fe-category-homepage.md
├── T03-008-fe-article-list.md
├── T03-009-fe-article-detail.md
├── T03-010-fe-daily-quote-share.md
├── T03-011-fe-favorites.md
├── T03-012-fe-share-system.md
└── T03-013-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」中文学习平台的「发现中国」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构白皮书（§一 毛玻璃 CSS、§二 Supabase）
2. /grules/04-api-design.md — API 设计规约
3. /grules/05-coding-standards.md — 编码规范（三层分离、Zod、RLS）
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/apps/02-discover-china/ — 发现中国 PRD（全部 6 个文件）
   - 00-index.md → 模块总览
   - 01-category-homepage.md → 类目首页 PRD
   - 02-article-list.md → 文章列表 PRD
   - 03-article-detail.md → 文章详情 PRD
   - 04-share-system.md → 分享系统 PRD
   - 05-favorite-system.md → 收藏系统 PRD
   - 06-data-nonfunctional.md → 数据模型与非功能需求
7. /product/00-product-overview.md §二.1 — 发现中国模块说明 + §五.5 — 12 大类目
8. /china/ — 12 大类目内容详情（理解每个类目的内容结构和数据字段）
   - 01-chinese-history.md ~ 12-myths-legends.md

【任务目标】
生成任务 T03-{NNN} 的详细任务文件，严格遵循 /tasks/list/00-index.md §四.3 的任务文件模板。

【特别要求】
- 文章内容必须支持多语言存储（pinyin, zh, en, vi 四个字段）
- 访问权限必须精确实现：未登录仅前 3 类目，登录全部 12 类目
- 类目卡片必须区分已解锁/未解锁状态，未解锁卡片有半透明遮罩 + "登录解锁"标签
- 文章详情的内容渲染必须根据用户设置动态切换（拼音+中文/纯中文/解释语言）
- 分享功能需要 Canvas 生成精美图片（金句/文章卡片 + 二维码 + logo）
- 收藏按钮需要心形弹跳动画
- 参考 /china/ 下的内容文件理解每个类目的数据结构，确保数据库设计能承载所有类目内容

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
