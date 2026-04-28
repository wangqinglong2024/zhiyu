# LE-07 · 今日新题

## 任务目标

实现 `/learn/new` 今日新题，从当前主题下一节预习题中推荐每日最多 10 题，避免与课程节小测冲突。

## PRD 原文引用

- `LE-FR-003`：“路径 `/learn/new`”
- `LE-FR-003`：“推荐来源：当前轨道下一节预习题”
- `LE-FR-003`：“限：每日 10 题（避免与课程节小测冲突）”

## 需求拆解

- 建立 `/learn/new` 页面，展示今日可做新题数量与来源主题/阶段/章/节。
- 推荐算法读取用户当前课程进度，定位下一节或当前节未掌握知识点。
- 每日最多 10 题，超过后显示完成态。
- 今日新题完成后写 `learning_daily_stats.new_questions_count`。
- 答错题进入 SRS；答对题不强制入 SRS，除非业务已创建 card。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/new` |
| 组件 | `NewQuestionIntro`、`QuestionRenderer`、`DailyLimitBanner` |
| API | `GET /api/le/new/today`、`POST /api/le/new/:question_id/answer` 或复用 quiz submit |
| 数据表 | `content_questions`、`learning_progress`、`learning_daily_stats`、`srs_cards` |
| 状态逻辑 | available → answering → feedback → complete；每日计数到 10 后 lock |

## 内容规则与边界

- 来源只能是系统课程题库。
- “当前轨道”在产品 UI 改称“当前主题”；代码可保留 track。
- 游戏、小说、发现中国不作为今日新题来源。

## 不明确 / 不支持 / 风险

- PRD 未给新题 API，需按后端 REST 规范补充。
- 如果用户未选择主题，需要从推荐主题或课程首页引导选择。
- 今日新题与课程节小测同题去重需要统一 question attempt 记录。

## 技术假设

- 每个用户有 `user_track_enrollments` 或等价 enrollment 记录。
- “下一节预习题”可由当前进度 + 课程排序确定。
- 每日限额按用户时区自然日计算。

## 验收清单

- [ ] 每日最多返回 10 题。
- [ ] 当前主题下一节推荐正确。
- [ ] 未选择主题时出现选择主题引导。
- [ ] 答错的新题进入 SRS。
- [ ] 不会从小说/发现中国抽题。
