# CR-02 · 章 / 节 / 知识点 / 题目 / 测验数据模型

## PRD 原文引用

- `planning/prds/03-courses/04-data-model-api.md` §1.3 `content_chapters`、§1.4 `content_lessons`、§1.5 `content_knowledge_points`、§1.6 题目（指向 §17 `content_questions`）、§1.7 `content_quizzes`。
- `03-question-types.md` §17：`content_questions` 全字段定义。
- `01-structure-content.md` §2.1：知识点 12 字段表（kpoint_no/type/zh/pinyin/pinyin_tones/translations/audio/key_point/example_sentences/tags）。

## 需求落实

- 数据表：`content_chapters`、`content_lessons`、`content_knowledge_points`、`content_questions`、`content_quizzes`。
- Schema 位置：`system/packages/db/src/schema/courses.ts`。
- 索引：
  - `idx_kp_lesson(lesson_id, kpoint_no)`。
  - `idx_questions_lesson(lesson_id, status)`、`idx_questions_kpoint(knowledge_point_id)`、`idx_questions_type(type, hsk_level)`。
- 唯一约束：`(stage_id, chapter_no)`、`(chapter_id, lesson_no)`、`(lesson_id, kpoint_no)`。
- API（与 CR-09/CR-12 共用）：`GET /api/learn/lessons/:id`、`GET /api/learn/quizzes/:id`。
- 后台：`/admin/content/courses/lessons/:id`、`/admin/content/courses/questions`。

## 字段细则

- `content_chapters.is_free=TRUE` 覆盖每条主题轨（电商/日常/工厂/HSK）下 Stage 1、Stage 2、Stage 3 全部 12 章；Stage 4 起 FALSE。
- `content_chapters.free_reason ∈ {'login_trial','manual','promo'}`。
- `content_knowledge_points.translations` 为 JSONB，覆盖已启用 4 语；缺失语种 `needs_translation=true` 标志保留在 `translations.<lang>.status`。
- `content_questions.options` JSONB 数组；`correct_answer` JSONB（index / array / text）。
- `content_quizzes.type ∈ {'lesson_quiz','chapter_test','stage_exam'}`，`pass_threshold` 60/70/75。

## 不明确 / 风险

- 风险：`content_quizzes.question_ids UUID[]` 与 `selection_strategy JSONB` 可二选一；若并存可能产生歧义。
- 处理：MVP 节小测使用静态 `question_ids`，章测/阶段考使用 `selection_strategy`，schema 加 CHECK：二者必有其一。
- 风险：`example_sentence_ids UUID[]` 引用 `content_sentences` 表（DC 模块共享），存在跨模块耦合。
- 处理：本期复用 DC 句子表；若不存在自建轻量句子表 `content_sentences` 字段对齐。

## 技术假设

- JSONB 写入统一走原生 postgres-js 客户端（参照用户记忆 `drizzle-jsonb.md`），避免 drizzle 双重编码。
- 所有表启用 `created_at` 默认 NOW；写操作均经后台审计。

## 最终验收清单

- [ ] 6 张表全部 migrate 通过，索引和唯一约束生效。
- [ ] 插入一条 lesson + 12 knowledge_points + 10 questions + 1 lesson_quiz，`SELECT jsonb_typeof(translations)='object'`。
- [ ] `content_quizzes` CHECK 拒绝 question_ids 与 selection_strategy 同时为 NULL 的记录。
- [ ] 后台可在树形结构下 CRUD chapter/lesson/knowledge_point/question。
