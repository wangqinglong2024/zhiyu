# 08 学习引擎 · 最终验收清单

## 功能验收

- [ ] `/learn/review` 可展示今日待复习题，默认 20 张，支持 50/100 偏好。
- [ ] Again/Hard/Good/Easy 四档评分调用 `ts-fsrs` 并更新 due。
- [ ] 到期错题优先于到期复习，到期复习优先于新题。
- [ ] `/learn/wrong-set` 支持全部/课程/游戏来源筛选和 HSK 筛选。
- [ ] 错题连续答对 2 次后 resolved，退出错题集但仍在 SRS 中循环。
- [ ] `/learn/new` 每日最多 10 题，来源为当前主题下一节预习题。
- [ ] `/learn/practice` 支持 HSK、主题、题型筛选，答错才入 SRS。
- [ ] `/me/dashboard` 展示今日、本周、累计、掌握度热力图、current/longest streak。
- [ ] streak 按用户时区计算，freeze 消耗 50 知语币，7/30/100 天奖励幂等。
- [ ] 学习提醒在用户到点未学习时通过邮件 Adapter/console outbox 发送，已学习不发。
- [ ] 用户可重置个人 SRS；管理员可调全局 FSRS 参数并写审计。
- [ ] 薄弱点诊断按 learning 状态或重错次数 > 2 聚合，并可一键专项练习。

## 来源边界验收

- [ ] 课程节小测、章测、阶段考错题能进入 SRS。
- [ ] 游戏 wrong/miss 能进入 SRS。
- [ ] 小说阅读、小说句子、生词收藏、章节听书不写入 SRS。
- [ ] 发现中国主题、文章、句子阅读、收藏、分享、报错不写入 SRS。
- [ ] UI 中不出现“小说”或“发现中国”作为错题来源筛选项。
- [ ] API 拒绝 `novel_quiz`、`article_sentence`、`discover` 等非法 source。

## 页面与组件验收

- [ ] 所有学习引擎页面使用 shadcn/ui + `zy-glass-*` 毛玻璃组件。
- [ ] 题目组件复用课程 QuestionRenderer，不复制四套答题 UI。
- [ ] 每题反馈包含对/错、解释、正确答案、知识点跳转。
- [ ] 完成总结包含正确率、用时、复习数、奖励或无奖励说明。
- [ ] loading、empty、error、offline 状态完整。
- [ ] 360px 宽度无文本溢出，所有交互可键盘操作。

## API 与数据验收

- [ ] `srs_cards`、`srs_reviews`、`learning_streaks`、`learning_daily_stats` 建表并启用 RLS。
- [ ] `GET /api/le/review/today`、`POST /api/le/review/:card_id/rate`、`GET /api/le/review/preview` 可用。
- [ ] `GET /api/le/wrong-set`、`POST /api/le/cards/:id/resolve` 可用。
- [ ] `GET /api/le/dashboard`、`GET /api/le/heatmap?range=30d` 可用。
- [ ] 关键写操作事务完整，失败不半写。
- [ ] 用户 A 无法读写用户 B 的学习数据。

## 性能验收

- [ ] SRS 调度查询 P95 < 200ms。
- [ ] 题目加载 < 300ms。
- [ ] rate 提交 P95 < 300ms。
- [ ] dashboard P95 < 500ms。
- [ ] 500 张错题测试数据下 wrong-set 查询满足本地性能门槛。

## Docker 与测试验收

- [ ] 所有实现位于 `system/`。
- [ ] Docker compose 内 migration 成功。
- [ ] `pnpm seed:learning` 或 `pnpm seed:all` 幂等跑通。
- [ ] 单元测试覆盖 FSRS、source 边界、streak、resolved。
- [ ] 集成测试覆盖 review、wrong-set、new、practice、dashboard API。
- [ ] MCP Puppeteer 完成 `dashboard → review → rate → summary → wrong-set` 主链路。
- [ ] 缺邮件、支付、推送等外部 key 时 fake/console Adapter 不阻塞测试。

## 文档冲突处理验收

- [ ] 学习引擎文档不再把小说作为错题来源。
- [ ] 发现中国和小说内容规则仅用于边界核对，不被误实现为复习来源。
- [ ] 课程 UI 术语使用“主题”，内部 track 仅作为兼容字段。
- [ ] 课程免费范围使用“每个主题 Stage 1-3 全部章节免费”。
