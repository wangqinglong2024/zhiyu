# LE-15 · 调度优先级与性能

## 任务目标

实现 SRS 调度优先级和性能预算：到期错题优先、到期复习其次、新题最后；查询和提交达到 PRD 性能指标。

## PRD 原文引用

- `planning/prds/07-learning-engine/02-data-model-api.md`：“调度优先级 1. 已到期错题（state in ['learning','relearning']） 2. 已到期复习（state='review'） 3. 新题（state='new'，每日新题上限 10）”
- `planning/prds/07-learning-engine/01-functional-requirements.md`：“SRS 调度查询 P95 < 200ms”
- 同段：“题目加载 < 300ms”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“rate 提交 P95 < 300ms”
- 同段：“仪表板 P95 < 500ms（聚合用 daily_stats 物化）”

## 需求拆解

- Repository 查询按优先级排序，避免应用层大数组排序。
- 建立 `(user_id, due, state)` 与 `(user_id, source, due)` 等可执行索引支撑 due 查询。
- 今日新题每日最多 10，且与复习 due 列表分开计数。
- dashboard 使用 daily stats 增量聚合，不做实时重扫全量 reviews。
- 添加性能测试或集成测试，构造至少 500 张错题场景。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/review`、`/me/dashboard` |
| 组件 | 无新增，影响 loading/skeleton |
| API | review today/rate、dashboard、heatmap |
| 数据表 | `srs_cards` 索引、`learning_daily_stats` 聚合 |
| 状态逻辑 | priority queue：learning/relearning due → review due → new |

## 内容规则与边界

- 游戏错题权重可影响优先级，但不得绕过课程/游戏来源边界。
- 小说/发现中国数据不参与性能聚合。

## 不明确 / 不支持 / 风险

- 禁止使用 `due <= NOW()` 作为 partial index 谓词；需要使用稳定列组合索引并在查询条件中比较当前时间。
- P95 需要稳定测试环境，Docker 本地可用粗粒度阈值验证。

## 技术假设

- 使用 Postgres explain analyze 检查关键查询。
- Redis 缓存可用于 preview/dashboard，但写后必须失效。

## 验收清单

- [ ] learning/relearning 到期题排在 review 前。
- [ ] review 到期题排在 new 前。
- [ ] 今日新题最多 10。
- [ ] 500 张错题场景下 due 查询满足本地性能门槛。
- [ ] dashboard 不扫描全量 reviews 才能返回。
