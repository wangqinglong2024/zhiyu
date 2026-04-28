# LE-03 · 复习来源边界

## 任务目标

把学习引擎的数据入口限制为学习系统和游戏错误，彻底排除小说与发现中国，避免复习池污染。

## PRD 原文引用

- `planning/prds/07-learning-engine/00-index.md`：“错题来源：节小测 / 章测 / 阶段考 / 游戏错误 / 学习系统内用户主动加入”
- `LE-FR-002`：“来源筛选：全部 / 课程 / 游戏”
- `planning/prds/07-learning-engine/01-functional-requirements.md`：“排除：小说与发现中国不作为复习数据来源”
- 用户裁决：“复习系统，它复习的数据，仅来自于学习系统和游戏错误。跟小说与发现中国无关。”

## 需求拆解

- 定义 `LearningReviewSource` enum：`lesson_quiz`、`chapter_test`、`stage_exam`、`game`、`manual_course`。
- 服务层拒绝 `article`、`discover`、`novel`、`novel_quiz`、`novel_sentence`、`article_sentence` 等来源。
- 错题专攻筛选只展示“全部 / 课程 / 游戏”。
- 手动加入只允许课程题库问题；如果未来小说生词要加入，必须先转化为课程题库题目并走 `manual_course`。
- 写入审计/日志时记录被拒绝来源，便于发现错误调用。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/wrong-set` 来源筛选无“小说”“发现中国” |
| 组件 | `SourceFilter` 只提供 all/course/game |
| API | 所有入 SRS API 校验 source；`manual-add` 校验 question 来源 |
| 数据表 | `srs_cards.source`、`learning_wrong_set.source` 使用受控 enum |
| 状态逻辑 | 非法 source 返回 400，不写 card，不写 wrong-set |

## 内容规则与边界

- 发现中国：`content/china/00-index.md` 是主题/文章/句子阅读体系，不产生复习题。
- 系统课程：课程知识点与题库是主来源。
- 游戏专区：`content/games/shared/03-scoring-system.md` 定义 wrong/miss 回传。
- 小说专区：`content/novels/00-index.md` 的“长按汉字加入生词本”不等于进入 LE；v1 不实现小说到 SRS。

## 不明确 / 不支持 / 风险

- 小说内容文档有“生词收藏 → 课程 SRS 复习池”旧联动，已被本次用户裁决覆盖；任务中标为不支持。
- 发现中国文章底部可引导课程/游戏，但不能把文章句子转题写入复习。
- 游戏结果只应回传错/漏题，不应把全部正确题强行入 SRS。

## 技术假设

- `content_questions` 每题带 `origin_module` 或可由关联表追溯来源。
- 游戏回传 `itemId` 可映射到课程知识点/题库题目。
- 前端筛选文案本地化键不包含小说/发现中国来源。

## 验收清单

- [ ] API 尝试以 `novel_quiz` 写入 SRS 返回 400。
- [ ] API 尝试以 `article_sentence` 写入 SRS 返回 400。
- [ ] `/learn/wrong-set` 只有全部、课程、游戏筛选。
- [ ] 小说阅读、发现中国阅读、收藏、报错不会创建 SRS 卡。
- [ ] 课程测验错题与游戏 wrong/miss 正常进入 SRS。
