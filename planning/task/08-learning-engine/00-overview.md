# 08 · 学习引擎任务清单

## 单任务文件

- 具体任务已拆分到 `tasks/`，每个任务单独一个文件。
- 索引：`tasks/00-task-index.md`。

## 来源覆盖

- PRD：`planning/prds/07-learning-engine/01-functional-requirements.md`、`02-data-model-api.md`。
- 关联：学习系统、游戏错题来源，经济模块 streak freeze 与奖励。
- 用户裁决：复习系统数据仅来自学习系统和游戏错误；小说与发现中国无关。PRD 中旧的“小说来源筛选”已按本裁决调整。

## 任务清单

- [ ] LE-01 数据模型与 RLS。
- [ ] LE-02 FSRS-5 评分引擎。
- [ ] LE-03 复习来源边界。
- [ ] LE-04 温故知新页面。
- [ ] LE-05 复习 API。
- [ ] LE-06 错题专攻。
- [ ] LE-07 今日新题。
- [ ] LE-08 自由练习。
- [ ] LE-09 学习仪表板。
- [ ] LE-10 streak 与 freeze。
- [ ] LE-11 学习提醒。
- [ ] LE-12 FSRS 参数管理。
- [ ] LE-13 薄弱点诊断。
- [ ] LE-14 统一题目组件与反馈。
- [ ] LE-15 调度优先级与性能。
- [ ] LE-16 seed、测试与验收闭环。

## 验收与测试

- [ ] LE-T01 完成课程小测错题 → SRS 到期 → review 评分 → due 更新。来源句：`LE-FR-001` 与 `LE-FR-002`。
- [ ] LE-T02 游戏错题能进入统一错题集；小说与发现中国不会进入统一错题集。来源句：用户裁决“复习系统，它复习的数据，仅来自于学习系统和游戏错误。跟小说与发现中国无关。”
- [ ] LE-T03 SRS 调度查询 P95 < 200ms、题目加载 < 300ms。来源句：`planning/prds/07-learning-engine/01-functional-requirements.md` “性能”章节。
