# LE-06 · 错题专攻

## 任务目标

实现 `/learn/wrong-set` 错题专攻，让用户按课程/游戏来源与 HSK 等级筛选错题、练习并将连续答对的错题标记 resolved。

## PRD 原文引用

- `US-LE-02`：“错题集中专项练习”
- `LE-FR-002`：“路径 `/learn/wrong-set`”
- `LE-FR-002`：“来源筛选：全部 / 课程 / 游戏”
- `LE-FR-002`：“HSK 等级筛选”
- `LE-FR-002`：“答对 2 次 → 标记 resolved（出错题集，但仍在 SRS 中循环）”

## 需求拆解

- 建立 `/learn/wrong-set` 页面。
- 建立错题列表 API，支持 source、hsk、分页、状态筛选。
- 列表展示题目摘要、来源、错误次数、最近错误时间、当前 SRS 状态。
- 支持进入专项练习流，复用 QuestionRenderer。
- 答对累计 2 次后设置 `is_resolved=true`，但不删除 `srs_cards`。
- 支持手动标记已解决，记录审计/日志。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/wrong-set` |
| 组件 | `WrongSetTable/List`、`SourceFilter`、`HskFilter`、`WrongPracticeRunner` |
| API | `GET /api/le/wrong-set`、`POST /api/le/cards/:id/resolve` |
| 数据表 | `srs_cards`、`srs_reviews`、`learning_wrong_set` 或等价 view |
| 状态逻辑 | unresolved → practice → correct_count++ → resolved；resolved 仍保留 SRS |

## 内容规则与边界

- 课程：节小测、章测、阶段考错题进入错题专攻。
- 游戏：wrong/miss 进入错题专攻。
- 小说/发现中国：不显示来源，不参与筛选，不进入列表。

## 不明确 / 不支持 / 风险

- PRD 同时有 `srs_cards.is_resolved` 与课程 `learning_wrong_set`；实现需决定单表或 view，避免双写不一致。
- “答对 2 次”是错题专攻练习中的 2 次，还是任意 review 中 Good/Easy 2 次；建议服务层统一按 SRS review 记录判断。

## 技术假设

- HSK 等级从 question 或 knowledge point 元数据获取。
- source=course 聚合 `lesson_quiz`、`chapter_test`、`stage_exam`、`manual_course`。
- source=game 仅为游戏 wrong/miss。

## 验收清单

- [ ] 错题列表可按全部/课程/游戏筛选。
- [ ] HSK 等级筛选生效。
- [ ] 答对 2 次后从默认错题列表消失。
- [ ] resolved 卡片仍会按 FSRS 到期出现在复习队列。
- [ ] UI 不出现小说/发现中国筛选项。
