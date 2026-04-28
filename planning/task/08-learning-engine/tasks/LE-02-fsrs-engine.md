# LE-02 · FSRS-5 评分引擎

## 任务目标

集成 `ts-fsrs`，实现 Again/Hard/Good/Easy 四档评分，正确更新 SRS 卡片状态与下次到期时间。

## PRD 原文引用

- `LE-FR-001`：“用户答题后选评分：忘了 / 困难 / 一般 / 简单（FSRS 4 档）”
- `LE-FR-001`：“后端用 ts-fsrs 计算下次到期”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“const f = fsrs(generatorParameters({ enable_fuzz: true }));”
- `planning/prds/07-learning-engine/03-acceptance-criteria.md`：“LE-AC-002：4 档评分调用 ts-fsrs 正确更新 due”

## 需求拆解

- 封装 `LearningSchedulerService`，只暴露 `rateCard(cardId, rating, durationMs)` 和内部转换函数。
- 将 DB `srs_cards` 转为 `ts-fsrs` card，调用 `repeat`，按 rating 取目标结果。
- 更新 `due`、`state`、`stability`、`difficulty`、`elapsed_days`、`scheduled_days`、`reps`、`lapses`、`last_review`。
- 插入 `srs_reviews`，记录评分前后状态与调度天数。
- 实现连续 Good/Easy 两次且状态进入 review 后的 resolved 判断。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/review` 完成答题后展示四档评分按钮 |
| 组件 | `FsrsRatingBar`：Again/Hard/Good/Easy，使用 shadcn Button 毛玻璃变体 |
| API | `POST /api/le/review/:card_id/rate` 调用评分服务 |
| 数据表 | `srs_cards`、`srs_reviews` |
| 状态逻辑 | 评分后事务更新 card + 插入 review；失败整体回滚 |

## 内容规则与边界

- 课程题目评分进入 FSRS。
- 游戏 wrong/miss 入 SRS 后，可在复习页评分。
- 发现中国和小说没有评分入口，也不得生成 card。

## 不明确 / 不支持 / 风险

- PRD 示例提到 `consecutive_correct`，DDL 未显式定义该字段；实现需补字段或从最近 reviews 计算。
- FSRS 库状态枚举与 DB 文本需要明确映射，防止大小写或版本升级不兼容。
- `enable_fuzz` 会带来非固定 due，单测要控制时间和参数。

## 技术假设

- rating 映射：1=Again，2=Hard，3=Good，4=Easy。
- 后端以用户时区无关的 UTC 时间存储 due，展示时再按用户时区转换。
- resolved 不会移除 SRS 卡，只影响 wrong-set 展示。

## 验收清单

- [ ] Again/Hard/Good/Easy 四档均写入 review 并更新 card。
- [ ] 事务失败时 card 不被半更新。
- [ ] 连续两次 Good/Easy 后按规则标记 resolved。
- [ ] 单元测试覆盖 new、learning、review、relearning 四种状态。
- [ ] 与 `ts-fsrs` 固定参数快照测试一致。
