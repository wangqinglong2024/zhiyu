# LE-01 · 数据模型与 RLS

## 任务目标

建立学习引擎最小可运行数据层：SRS 卡片、复习记录、连续学习、每日统计，并保证用户只能访问自己的学习数据。

## PRD 原文引用

- `planning/prds/07-learning-engine/02-data-model-api.md`：“CREATE TABLE srs_cards ... UNIQUE(user_id, question_id)”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“CREATE TABLE srs_reviews ... rating INT NOT NULL CHECK (rating BETWEEN 1 AND 4)”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“CREATE TABLE learning_streaks ... current_streak ... longest_streak ... freeze_count”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“CREATE TABLE learning_daily_stats ... reviews_count ... game_plays ... total_time_seconds ... coins_earned”
- `planning/prds/07-learning-engine/03-acceptance-criteria.md`：“LE-AC-001：错题入 SRS 立即生效（状态 learning，due=now）”

## 需求拆解

- 建立 `srs_cards`，字段覆盖 user、question、FSRS 状态、due、stability、difficulty、reps、lapses、source、is_resolved。
- 建立 `srs_reviews`，记录每次评分、评分前后状态、调度天数变化和作答耗时。
- 建立 `learning_streaks`，记录当前/最长 streak、最后活跃日期、freeze 数量。
- 建立 `learning_daily_stats`，按用户与本地日期聚合 review、新题、quiz、game、学习时长、知语币。
- 为所有用户私有表开启 RLS，策略限定 `user_id = auth.uid()`。
- 建立索引：到期题查询、用户错题/未解决查询、用户日期统计查询。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | 无直接页面；支撑 `/learn/review`、`/learn/wrong-set`、`/me/dashboard` |
| 组件 | 无直接组件；支撑 QuestionRenderer、ReviewQueue、DashboardHeatmap |
| API | 所有 `/api/le/*` 接口依赖这些表 |
| 数据表 | `srs_cards`、`srs_reviews`、`learning_streaks`、`learning_daily_stats` |
| 状态逻辑 | `new`、`learning`、`review`、`relearning`；`is_resolved` 不等于删除 SRS 卡 |

## 内容规则与边界

- 系统课程：`content/course/shared/05-question-bank.md` 定义题库字段，`question_id` 必须能追溯到课程题库。
- 游戏专区：`content/games/shared/03-scoring-system.md` 的 wrong/miss 可写入 `srs_cards`。
- 发现中国：只读文章/句子，不作为 `source`。
- 小说专区：不作为 `source`；不得保留 `novel_quiz` 枚举。

## 不明确 / 不支持 / 风险

- PRD 使用 `users(id)`，项目可能实际复用 Supabase Auth 用户表；实现时需统一外键策略。
- `content_questions` 表需要与课程任务产物对齐；若名称不同，必须创建兼容 view 或 repository 映射。
- Drizzle 0.30 jsonb 插入存在历史坑，涉及 JSONB 字段时按项目记忆使用 raw postgres-js 或验证类型。

## 技术假设

- `question_id` 是题目级 ID，不是知识点 ID。
- `source` 采用受控 enum：`lesson_quiz`、`chapter_test`、`stage_exam`、`game`、`manual_course`。
- 所有 migration 在 `system/packages/db` 内维护，Docker 中执行。

## 验收清单

- [ ] 干净 dev 数据库执行 migration 成功。
- [ ] RLS 打开后，用户 A 无法读取用户 B 的 SRS、review、daily stats。
- [ ] 同一用户同一题目重复入库只更新同一张 `srs_cards`。
- [ ] `source` 写入小说或发现中国相关值时被 schema 或服务层拒绝。
- [ ] 到期题、未解决错题、dashboard 聚合查询均命中索引。
