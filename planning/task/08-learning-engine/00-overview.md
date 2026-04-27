# 08 · 学习引擎任务清单

## 来源覆盖

- PRD：`planning/prds/07-learning-engine/01-functional-requirements.md`、`02-data-model-api.md`。
- 关联：课程、游戏、小说错题来源，经济模块 streak freeze 与奖励。

## 任务清单

- [ ] LE-01 建立 `srs_cards`、`srs_reviews`、`learning_streaks`、`learning_daily_stats`，启用 RLS。来源句：`planning/prds/07-learning-engine/02-data-model-api.md` DDL 定义这些表。
- [ ] LE-02 集成 `ts-fsrs`，实现 FSRS-5 评分 Again/Hard/Good/Easy 与下次到期。来源句：`LE-FR-001` 写明“后端用 ts-fsrs 计算下次到期”。
- [ ] LE-03 实现温故知新 `/learn/review`，入口显示“今日待复习 N 张”，默认 20 题，可调 50/100。来源句：`LE-FR-001`。
- [ ] LE-04 实现 `GET /api/le/review/today`、`POST /api/le/review/:card_id/rate`、`GET /api/le/review/preview`。来源句：`planning/prds/07-learning-engine/02-data-model-api.md` “复习”API。
- [ ] LE-05 实现错题专攻 `/learn/wrong-set`，按来源/HSK 筛选，答对 2 次 resolved。来源句：`LE-FR-002`。
- [ ] LE-06 错题来源支持课程、游戏、小说、手动。来源句：`planning/prds/07-learning-engine/02-data-model-api.md` `source TEXT` 注释写明 `'lesson_quiz','chapter_test','game','novel_quiz','manual'`。
- [ ] LE-07 实现今日新题 `/learn/new`：当前轨道下一节预习题，每日 10 题。来源句：`LE-FR-003`。
- [ ] LE-08 实现自由练习 `/learn/practice`：HSK、主题、题型、轨道筛选，答错才入 SRS。来源句：`LE-FR-004`。
- [ ] LE-09 实现学习仪表板 `/me/dashboard`：今日、本周热力图、累计、掌握度、streak。来源句：`LE-FR-005`。
- [ ] LE-10 实现 streak：当日完成 review/quiz/lesson 任一算 1 天，按用户时区，里程碑奖励与徽章。来源句：`LE-FR-006`。
- [ ] LE-11 实现 streak freeze 使用接口，调用 EC 扣 50 币。来源句：`LE-FR-006` 写明“streak freeze 道具（EC，50 币 / 张）”，API 写明 `POST /api/le/streak/freeze/use`。
- [ ] LE-12 实现学习提醒：v1 邮件提醒，v1.5 Web Push 占位；已学完不发。来源句：`LE-FR-007`。
- [ ] LE-13 实现 FSRS 参数管理：默认标准参数、用户可重置个人 SRS、管理员可调全局参数。来源句：`LE-FR-008`。
- [ ] LE-14 实现薄弱点诊断：learning 状态或重错 >2，支持一键专项练习。来源句：`LE-FR-009`。
- [ ] LE-15 统一复用课程 QuestionRenderer，反馈展示对/错、解释、KP 跳转，完成总结含正确率/用时/币奖励。来源句：学习引擎 PRD “UX”章节。
- [ ] LE-16 实现调度优先级：已到期错题、已到期复习、新题。来源句：`planning/prds/07-learning-engine/02-data-model-api.md` “调度优先级”。
- [ ] LE-17 建立 daily stats 物化/增量更新，支撑仪表板 P95 < 500ms。来源句：同文件“仪表板 P95 < 500ms（聚合用 daily_stats 物化）”。

## 验收与测试

- [ ] LE-T01 完成课程小测错题 → SRS 到期 → review 评分 → due 更新。来源句：`LE-FR-001` 与 `LE-FR-002`。
- [ ] LE-T02 游戏错题和小说快测错题均能进入统一错题集。来源句：`LE-FR-002` 写明“来源筛选：全部 / 课程 / 游戏 / 小说”。
- [ ] LE-T03 SRS 调度查询 P95 < 200ms、题目加载 < 300ms。来源句：`planning/prds/07-learning-engine/01-functional-requirements.md` “性能”章节。
