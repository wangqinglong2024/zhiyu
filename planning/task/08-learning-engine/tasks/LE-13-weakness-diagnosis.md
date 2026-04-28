# LE-13 · 薄弱点诊断

## 任务目标

实现仪表板“薄弱知识点”卡片，并支持一键开始专项练习。

## PRD 原文引用

- `LE-FR-009`：“仪表板‘薄弱知识点’卡片”
- `LE-FR-009`：“算法：SRS 状态为 'learning' 或重错次数 > 2 的 KP”
- `LE-FR-009`：“一键‘开始专项练习’”
- `planning/prds/07-learning-engine/03-acceptance-criteria.md`：“LE-AC-014：薄弱点诊断卡片”

## 需求拆解

- 聚合用户 SRS 中 `state='learning'` 或 `wrong_count > 2` 的课程知识点/题目。
- 按主题、HSK、题型、错误次数分组排序。
- Dashboard 展示 Top N 薄弱项，支持查看全部。
- 一键开始专项练习，进入 filtered practice/review flow。
- 练习完成后更新 SRS 与 dashboard 数据。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/me/dashboard`、`/learn/practice?mode=weakness` |
| 组件 | `WeaknessCard`、`WeaknessList`、`StartPracticeButton` |
| API | `GET /api/le/weaknesses`、复用 practice/review submit |
| 数据表 | `srs_cards`、`learning_wrong_set`、`content_knowledge_points`、`content_questions` |
| 状态逻辑 | detect → rank → start practice → update SRS → recalc |

## 内容规则与边界

- 薄弱点只来自课程知识点与游戏回传映射到的课程知识点。
- 发现中国句子与小说句子不出现在薄弱点卡片中。

## 不明确 / 不支持 / 风险

- PRD 说“重错次数 > 2 的 KP”，但 SRS 调度对象是 question_id；需要通过 question → knowledge point 映射聚合。
- 游戏 itemId 可能是知识点 ID，不是 question ID；需要适配层统一。

## 技术假设

- 每个 question 可追溯到 `knowledge_point_id`。
- Top N 默认 5，查看全部分页。

## 验收清单

- [ ] learning 状态卡片出现在薄弱点列表。
- [ ] wrong_count > 2 的知识点被聚合展示。
- [ ] 一键专项练习带入筛选条件。
- [ ] 练习后薄弱点排序会变化。
- [ ] 小说/发现中国内容不会出现在薄弱点。
