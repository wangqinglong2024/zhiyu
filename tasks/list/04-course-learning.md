# 04 — 系统课程-学习 (Course Learning)

> **优先级**: P0
> **目标文件夹**: `/tasks/04-course-learning/`
> **产品依据**: `product/apps/03-course-learning/` 全部文件
> **内容参考**: `/course/` 全部 12 级课程定义
> **前置依赖**: 02-全局框架 完成
> **预计任务数**: 14

---

## 一、分类概述

系统课程-学习模块是应用端 Tab 2，包含入学测试、12 级关卡地图、付费墙、Level 详情（单元/课时结构）、课时学习页面（教学内容 + 重点词汇 + 语法点）、SRS 间隔重复复习系统等。

**核心业务规则**：
- L1-L3 免费，L4-L12 每级 $6（3 年有效）
- 课程结构：Level → Unit（单元）→ Lesson（课时）
- 学习路径强制线性：前一单元测评通过 → 解锁下一单元
- 入学测试可选，完成奖励 100 知语币

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T04-001 | 数据库 Schema — 课程结构 | L | T02-014 | levels/units/lessons 三级表 + 多语言 + 索引 + RLS |
| T04-002 | 数据库 Schema — 学习进度 | L | T04-001 | user_course_progress + user_lesson_progress + 状态机 |
| T04-003 | 数据库 Schema — 课程购买与权限 | M | T04-001 | user_course_purchases 表 + 有效期 + RLS |
| T04-004 | 数据库 Schema — SRS 复习队列 | M | T04-002 | srs_review_items 表 + 间隔算法参数 |
| T04-005 | 后端 API — 课程结构查询 | L | T04-001 | Level 列表 + Unit 列表 + Lesson 列表 + 权限过滤 |
| T04-006 | 后端 API — 学习进度 | L | T04-002 | 进度记录 + 进度查询 + 解锁判断 + 状态更新 |
| T04-007 | 后端 API — 入学测试 | M | T04-001 | 出题 + 提交答案 + 推荐 Level + 知语币奖励 |
| T04-008 | 后端 API — 课程购买 | L | T04-003 | 购买接口 + Paddle Webhook + 知语币兑换 + 有效期管理 |
| T04-009 | 后端 API — SRS 复习 | M | T04-004 | 获取待复习项 + 提交复习结果 + 间隔算法 |
| T04-010 | 前端 — 课程首页与 Level 地图 | L | T04-005, T04-006 | 入学测试引导卡片 + 纵向关卡地图 + 各 Level 状态 |
| T04-011 | 前端 — 付费墙弹窗 | M | T04-008 | 购买弹窗 + Paddle 支付集成 + 知语币兑换选项 |
| T04-012 | 前端 — Level 详情与单元列表 | M | T04-005, T04-006 | 单元列表 + 课时列表 + 进度展示 + 解锁状态 |
| T04-013 | 前端 — 课时学习页面 | L | T04-006 | 教学内容渲染 + 重点词汇卡片 + 语法点 + 音频播放 + "开始测验"入口 |
| T04-014 | 前端 — SRS 复习系统 | M | T04-009 | 复习卡片界面 + 间隔提示 + 复习完成反馈 |

---

## 三、详细任务文件命名

```
/tasks/04-course-learning/
├── T04-001-db-course-structure.md
├── T04-002-db-learning-progress.md
├── T04-003-db-course-purchase.md
├── T04-004-db-srs-review.md
├── T04-005-api-course-query.md
├── T04-006-api-learning-progress.md
├── T04-007-api-placement-test.md
├── T04-008-api-course-purchase.md
├── T04-009-api-srs-review.md
├── T04-010-fe-course-homepage.md
├── T04-011-fe-paywall.md
├── T04-012-fe-level-detail.md
├── T04-013-fe-lesson-page.md
└── T04-014-fe-srs-review.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」中文学习平台的「系统课程-学习」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构（§二 Supabase、§三 后端高并发）
2. /grules/04-api-design.md — API 设计规约
3. /grules/05-coding-standards.md — 编码规范（Zod、三层分离、并发安全）
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/apps/03-course-learning/ — 课程学习 PRD（全部 7 个文件）
   - 00-index.md → 模块总览
   - 01-course-homepage.md → 课程首页 PRD
   - 02-placement-test.md → 入学测试 PRD
   - 03-paywall.md → 付费墙 PRD
   - 04-level-detail.md → Level 详情 PRD
   - 05-lesson-page.md → 课时学习页 PRD
   - 06-srs-review.md → SRS 复习系统 PRD
   - 07-data-nonfunctional.md → 数据模型与非功能需求
7. /product/00-product-overview.md — §二.1 课程模块 + §五.1 课程购买规则 + §五.3 三级考核
8. /course/ — 12 级课程体系详细定义
   - 00-index.md → 课程总览（双轨对标、12 级结构）
   - level-01.md ~ level-12.md → 每级详细内容（单元/课时/知识点/词汇量）

【任务目标】
生成任务 T04-{NNN} 的详细任务文件。

【特别要求】
- 课程结构必须支持 Level → Unit → Lesson 三级层级
- 每个 Lesson 必须包含：教学内容、重点词汇、语法点、音频资源
- 学习进度必须精确到每个 Lesson，支持断点续学
- 付费逻辑：L1-L3 免费，L4-L12 每级 $6，知语币兑换（600 币/级）
- 课程购买必须有有效期管理（3 年），到期前 30/7/1 天提醒
- SRS 间隔重复算法参数需要可配置
- Level 地图需要纵向路径展示，类似游戏关卡地图
- 参考 /course/ 下的 12 级课程文件，理解每级的单元划分、知识点和词汇量
- 涉及金额的接口必须有签名验证 + 幂等处理

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
