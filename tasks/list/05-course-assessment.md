# 05 — 系统课程-考核 (Course Assessment)

> **优先级**: P0
> **目标文件夹**: `/tasks/05-course-assessment/`
> **产品依据**: `product/apps/04-course-assessment/` 全部文件
> **内容参考**: `/course/` 12 级课程（了解每级考核范围）
> **前置依赖**: 04-系统课程-学习 完成
> **预计任务数**: 11

---

## 一、分类概述

三级递进考核体系：课时小测验（第一级）→ 单元阶段测评（第二级）→ 级别综合考核（第三级）。还包括题型引擎（支持选择题/拼音标注/排序组句/听力选择/填空等）、电子证书生成与展示。

**核心业务规则**：
- 课时小测验：3-5 题，无通过门槛，答错加入 SRS
- 单元测评：10-15 题，70 分通过，不通过可立即重考
- 级别综合考核：总分 85 分 + 单项不低于 60 分，不通过需等 24 小时
- 通过级别考核 → 电子证书（标注 HSK + CEFR 等级）

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T05-001 | 数据库 Schema — 题库 | L | T04-001 | questions 表 + question_options 表 + 题型枚举 + 难度标签 + RLS |
| T05-002 | 数据库 Schema — 考核记录 | L | T05-001 | quiz_attempts + quiz_answers + 成绩统计 + RLS |
| T05-003 | 数据库 Schema — 证书 | M | T05-002 | user_certificates 表 + HSK/CEFR 等级 + 签发日期 |
| T05-004 | 后端 API — 题型引擎 | L | T05-001 | 服务端出题（随机/按知识点）+ 题目渲染数据 + 防作弊 |
| T05-005 | 后端 API — 课时小测验 | M | T05-004 | 出题 + 提交答案 + 即时判分 + 错题写入 SRS |
| T05-006 | 后端 API — 单元测评 | M | T05-004 | 出题 + 提交 + 评分 + 解锁下一单元逻辑 |
| T05-007 | 后端 API — 级别综合考核 | L | T05-004 | 多模块出题 + 评分 + 24 小时重考间隔 + 证书签发 |
| T05-008 | 前端 — 题型组件库 | L | T05-004 | 选择题/拼音标注/排序组句/听力选择/填空 5 种题型 UI 组件 |
| T05-009 | 前端 — 课时小测验 + 单元测评页面 | L | T05-005, T05-006, T05-008 | 考试界面 + 进度条 + 即时反馈 + 结果页 |
| T05-010 | 前端 — 级别综合考核 + 证书 | L | T05-007, T05-008 | 多模块考核 UI + 庆祝动画 + 证书展示 + 证书分享 |
| T05-011 | 考核系统集成验证 | M | 全部 | 完整流程：学完课时→小测→学完单元→测评→学完Level→综合考核→证书 |

---

## 三、详细任务文件命名

```
/tasks/05-course-assessment/
├── T05-001-db-question-bank.md
├── T05-002-db-quiz-records.md
├── T05-003-db-certificates.md
├── T05-004-api-question-engine.md
├── T05-005-api-lesson-quiz.md
├── T05-006-api-unit-test.md
├── T05-007-api-level-exam.md
├── T05-008-fe-question-components.md
├── T05-009-fe-quiz-exam-pages.md
├── T05-010-fe-level-exam-certificate.md
└── T05-011-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」中文学习平台的「系统课程-考核」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构
2. /grules/04-api-design.md — API 设计规约
3. /grules/05-coding-standards.md — 编码规范
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/apps/04-course-assessment/ — 考核系统 PRD（全部 6 个文件）
   - 00-index.md → 考核系统总览
   - 01-question-types.md → 题型定义
   - 02-lesson-quiz.md → 课时小测验 PRD
   - 03-unit-test.md → 单元测评 PRD
   - 04-level-exam.md → 级别综合考核 PRD
   - 05-certificate.md → 电子证书 PRD
   - 06-data-nonfunctional.md → 数据模型与非功能需求
7. /product/00-product-overview.md §五.3 — 三级考核体系规则
8. /course/ — 12 级课程定义（每级的考核范围和 HSK 对标）

【任务目标】
生成任务 T05-{NNN} 的详细任务文件。

【特别要求】
- 题型引擎必须支持：选择题、拼音标注、排序组句、听力选择、填空 5 种题型
- 出题必须在服务端完成（防作弊），客户端只负责渲染和提交
- 三级考核的通过标准必须精确实现（无门槛/70分/85分+单项60分）
- 级别综合考核包含多模块（听力/阅读/词汇语法/书写），需按 Level 逐步增加模块
- 24 小时重考间隔必须在服务端校验
- 错题必须自动写入 SRS 复习队列（关联 T04-004）
- 电子证书需要 Canvas 生成图片，标注 HSK 等级和 CEFR 等级
- 考核结果页需要展示各题正误详情和薄弱知识点

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
