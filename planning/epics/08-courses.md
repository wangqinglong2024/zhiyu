# Epic E08 · 课程模块（Courses）

> 阶段：M3 · 优先级：P0 · 估算：4 周
>
> 顶层约束：[planning/00-rules.md](../00-rules.md)

## 摘要
4 轨道（日常 / 电商 / 工厂 / HSK）× 12 阶段，全步骤化学习；与 E07 学习引擎深度集成。

## 范围
- 轨道 / 阶段 / 章 / 节 / 步骤 数据模型
- 节内 10 种步骤类型
- 课程列表 / 详情 / 节学习页
- 与学习引擎对接
- 付费墙（节级；接 E13 支付 Adapter）

## 非范围
- AI 生成步骤（未来 E16）
- 跟读 ASR（用 `ASRAdapter` fake，本期固定通过；真实接入未来）

## Stories（按需 6）

### ZY-08-01 · course_* 表 + 步骤类型规范
**AC**
- [ ] schema `zhiyu`：`tracks`、`stages`、`chapters`、`lessons`、`lesson_steps`
- [ ] 索引 + RLS（published 可读）
- [ ] `step_type` 枚举 + Zod payload 规范文档（10 种）
- [ ] scoring schema 规范
**Tech**：spec/05
**估**：M

### ZY-08-02 · 课程 + 节 API
**AC**
- [ ] GET `/api/v1/tracks`、`/tracks/:slug`、`/stages/:id`、`/lessons/:id`
- [ ] 付费校验（接 E13 `entitlements` 表）
- [ ] 步骤回答 / 完成接 E07
**估**：M

### ZY-08-03 · 课程列表 + 阶段详情页
**AC**
- [ ] 4 轨道选择；阶段进度环；锁定 / 解锁视觉
- [ ] 章节卡片 + 完成状态 + 总进度
**Tech**：ux/10
**估**：M

### ZY-08-04 · 节学习页核心 UI
**AC**
- [ ] 顶部进度条 + 步骤切换动画
- [ ] 答错反馈、暂停 / 退出确认
- [ ] 步骤组件分发器
**估**：L

### ZY-08-05 · 10 种步骤组件
**AC**
- [ ] sentence / word_card / choice / order / match / listen / read（用 `ASRAdapter` fake）/ translate / type_pinyin / dialog
- [ ] 每种组件含独立 Storybook story
**估**：L

### ZY-08-06 · 节完成结算 + 付费墙
**AC**
- [ ] 结算页：正确率 / 时长 / XP / ZC、错题快速回顾
- [ ] 付费墙弹窗 → 套餐选择（调 E13 Adapter）；ZC 解锁单节备选
**估**：M

## DoD
- [ ] 4 轨道各 ≥ 1 阶段可学（fixture 内容）
- [ ] 节学习流畅；付费墙弹出可用 fake PaymentAdapter 完成
- [ ] MCP Puppeteer：从课程列表点入完成 1 节并升级
- [ ] **种子数据（§11.1 CR）**：总 lesson ≥ 24（4 轨道 × stage1 × ≥ 6 lesson），含 1 个阶段考题库，JSON 置于 `system/packages/db/seed/courses/lessons.json` 与 `seed/courses/quizzes.json`
- [ ] **ZY-08-07** 已完成（拼音入门 3 模块 + 阶段考题型 P1-P3 + 75% 通过线）
