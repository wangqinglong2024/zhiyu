# LE-08 · 自由练习

## 任务目标

实现 `/learn/practice` 自由练习，用户可按 HSK、主题、题型筛选课程题库进行随机练习；自由练习不计入 SRS，除非答错。

## PRD 原文引用

- `LE-FR-004`：“路径 `/learn/practice`”
- `LE-FR-004`：“用户选筛选：HSK 等级 / 主题 / 题型 / 轨道”
- `LE-FR-004`：“系统从学习系统 question 库随机出题”
- `LE-FR-004`：“不计入 SRS（除非答错）”

## 需求拆解

- 建立自由练习筛选页，产品文案使用“主题”。
- 筛选项：HSK 等级、主题、电商/日常/工厂/HSK、题型 Q1-Q10/P1-P3、数量。
- 随机抽题时只读课程 question 库。
- 答对只记录 attempt/daily stats，不创建 SRS。
- 答错创建或更新 SRS card，source=`manual_course` 或 `practice_wrong` 等受控课程来源。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/practice` |
| 组件 | `PracticeFilters`、`QuestionRenderer`、`PracticeSummary` |
| API | `GET /api/le/practice/questions`、`POST /api/le/practice/submit` |
| 数据表 | `content_questions`、`learning_daily_stats`、`srs_cards`、`srs_reviews` |
| 状态逻辑 | configure → generate → answering → summary；wrong → SRS |

## 内容规则与边界

- 课程题库遵守 `content/course/shared/05-question-bank.md` 的 Q1-Q10/P1-P3。
- 游戏不作为自由练习题源；游戏有自己的 Round。
- 发现中国/小说不作为自由练习题源。

## 不明确 / 不支持 / 风险

- PRD 同时写“主题 / 轨道”，本次统一产品文案为“主题”。
- P1-P3 只适合阶段 1 拼音入门，需要筛选时按内容可用性控制。
- 随机抽题需防止答案泄露与缓存污染。

## 技术假设

- 题型元数据存在于 `content_questions.question_type`。
- 答错创建 SRS card 的初始状态为 `learning`，due=now。

## 验收清单

- [ ] HSK、主题、题型筛选均生效。
- [ ] 答对不创建新 SRS 卡。
- [ ] 答错立即创建或更新 SRS 卡。
- [ ] 页面文案使用“主题”而非“轨道”。
- [ ] 无小说/发现中国题源。
