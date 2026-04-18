# 12 — 管理后台-内容管理 (Admin Content Management)

> **优先级**: P0
> **目标文件夹**: `/tasks/12-admin-content/`
> **产品依据**: `product/admin/02-admin-content/` 全部文件
> **内容参考**: `/china/` 全部类目 + `/course/` 全部课程
> **前置依赖**: 11-管理后台-登录仪表盘 完成 + 03-发现中国数据库 + 04-课程数据库
> **预计任务数**: 11

---

## 一、分类概述

内容管理是运营人员最核心的日常工作模块。管理三类内容：
1. **发现中国文章管理**：文章 CRUD + 多语言编辑 + 上架/下架 + 排期/热点
2. **课程内容管理**：Level → Unit → Lesson 三级结构管理 + 题库管理
3. **每日金句管理**：金句 CRUD + 多语言 + 日历排期 + 节日金句

**核心流程**：Dify 工作流生成内容 → 写入 Supabase → 后台审核/编辑 → 手动上架 → 用户端可见

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T12-001 | 后端 API — 文章管理 | L | T03-001, T11-003 | 文章 CRUD + 多语言字段 + 上架/下架 + 批量操作 + 管理员鉴权 |
| T12-002 | 后端 API — 课程内容管理 | L | T04-001, T11-003 | Level/Unit/Lesson CRUD + 排序 + 课时内容编辑 + 题库关联 |
| T12-003 | 后端 API — 题库管理 | L | T05-001, T11-003 | 题目 CRUD + 五种题型配置 + 批量导入 + 按 Level/知识点筛选 |
| T12-004 | 后端 API — 每日金句管理 | M | T03-002, T11-003 | 金句 CRUD + 多语言 + 排期（日历式）+ 节日标签 |
| T12-005 | 前端 — 文章管理列表页 | L | T12-001 | 文章表格 + 筛选（类目/状态/日期）+ 搜索 + 批量上架/下架 |
| T12-006 | 前端 — 文章编辑页 | L | T12-001 | 富文本编辑器 + 四语言字段（pinyin/zh/en/vi）+ 封面上传 + 预览 |
| T12-007 | 前端 — 课程内容管理页 | L | T12-002 | 三级树形结构 + 拖拽排序 + 课时编辑 + 内容预览 |
| T12-008 | 前端 — 题库管理页 | L | T12-003 | 题目列表 + 五种题型编辑表单 + 批量导入 + 预览答题效果 |
| T12-009 | 前端 — 每日金句管理页 | M | T12-004 | 金句列表 + 日历排期视图 + 四语言编辑 + 预览金句卡片 |
| T12-010 | 前端 — 内容审核工作流 | M | T12-005 | 待审核列表 + 审核通过/驳回 + 审核历史 + 状态流转 |
| T12-011 | 内容管理集成验证 | M | 全部 | 完整流程：创建文章 → 编辑 → 审核 → 上架 → 用户端可见 |

---

## 三、详细任务文件命名

```
/tasks/12-admin-content/
├── T12-001-api-article-management.md
├── T12-002-api-course-management.md
├── T12-003-api-question-management.md
├── T12-004-api-daily-quote-management.md
├── T12-005-fe-article-list.md
├── T12-006-fe-article-editor.md
├── T12-007-fe-course-management.md
├── T12-008-fe-question-management.md
├── T12-009-fe-daily-quote.md
├── T12-010-fe-content-review.md
└── T12-011-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」管理后台的「内容管理」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构
2. /grules/04-api-design.md — API 设计规约（CRUD、分页、筛选）
3. /grules/05-coding-standards.md — 编码规范
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/admin/02-admin-content/ — 内容管理 PRD（全部 4 个文件）
   - 00-index.md → 模块总览
   - 01-article-management.md → 文章管理 PRD
   - 02-course-management.md → 课程管理 PRD
   - 03-daily-quote.md → 每日金句管理 PRD
   - 04-data-nonfunctional.md → 数据模型与非功能需求
7. /product/admin/00-admin-overview.md — 管理后台总览
8. /product/00-product-overview.md §1.2 — 核心运营流程（Dify → 后台 → 上架）
9. /china/ — 12 大类目内容详情（理解文章数据结构和多语言字段）
10. /course/ — 12 级课程体系（理解 Level→Unit→Lesson 三级结构）

【任务目标】
生成任务 T12-{NNN} 的详细任务文件。

【特别要求】
- 文章管理必须支持四语言字段编辑（pinyin, zh, en, vi）
- 富文本编辑器需要支持中文+拼音+解释语言的对照排版
- 课程内容管理是三级树形结构（Level→Unit→Lesson），需要拖拽排序
- 题库管理必须支持五种题型的可视化配置
- 每日金句需要日历排期功能（在日历上拖拽安排金句）
- 所有管理操作必须有操作日志
- 批量导入功能需要支持 CSV/Excel 格式
- 内容审核需要状态流转：草稿 → 待审核 → 审核通过/驳回 → 已上架/已下架
- 参考 /china/ 和 /course/ 的内容结构确保管理界面能完整承载所有数据字段
- 管理员权限：仅内容运营和超级管理员可操作

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
