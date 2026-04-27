# 05 · 系统课程任务清单

## 来源覆盖

- PRD：`planning/prds/03-courses/01-structure-content.md` 到 `05-acceptance-criteria.md`。
- 内容规则：`content/course/00-index.md`、`content/course/shared/*.md`、四轨 `00-index.md` 与 stage 文件。
- 全局种子：`planning/rules.md` §11。

## 内容区规则覆盖

- 4 轨必须是电商、工厂、HSK、日常。来源句：`content/course/00-index.md` 写明“4 条独立轨道（电商 / 工厂 / HSK / 日常）”。
- 结构必须是 4 轨 × 12 阶段 × 12 章 × 12 节 × 12 知识点。来源句：`content/course/00-index.md` 写明“4 条独立轨道 × 12 阶段 × 12 章 × 12 节 × 12 知识点”。
- 课程内容不得收文章/段落。来源句：`content/course/shared/04-knowledge-point-format.md` 写明“不允许整段 / 多句组合 / 文章。最大单位 = 单行复合长句 ≤ 40 字。”
- 不做真实 ASR 跟读评分。来源句：`content/course/shared/03-assessment-system.md` 写明“本平台不为用户跟读做 AI 评分”。

## 任务清单

- [ ] CR-01 建立 `content_tracks`、`content_stages`、`content_chapters`、`content_lessons`、`content_knowledge_points`、`content_quizzes`。来源句：`planning/prds/03-courses/04-data-model-api.md` 逐表定义这些数据模型。
- [ ] CR-02 建立 4 轨道与 12 阶段 seed，写入每轨阶段主题和 HSK/能力里程碑。来源句：`planning/prds/03-courses/01-structure-content.md` 四个表分别列出电商、工厂、HSK、日常 12 阶段。
- [ ] CR-03 实现欢迎流程轨道选择/推荐，可跳过。来源句：`CR-FR-001` 写明“Step 1 选学习目标……系统推荐 1-2 轨道 + 起始阶段；可跳过”。
- [ ] CR-04 实现拼音入门前置：声母/韵母/声调/综合练习，P1/P2/P3，≥80% 完成，可跳过提醒。来源句：`CR-FR-002` 写明“3 模块（声母 / 韵母 / 声调）+ 综合练习”。
- [ ] CR-05 拼音内容遵循 GB/T 16159-2012、23 声母、24 韵母、16 整体认读、四声轻声、变调、儿化、隔音符号。来源句：`content/course/shared/01-pinyin-system.md` 写明“严格遵循 GB/T 16159-2012 汉语拼音正词法基本规则”并列出这些内容。
- [ ] CR-06 实现课程首页 `/learn` Dashboard：当前轨道、继续学习、今日任务、本周时长、切换轨道。来源句：`CR-FR-003` 元素列表。
- [ ] CR-07 实现阶段总览 `/learn/:track/:stage`：介绍、12 章网格、阶段进度、阶段考入口。来源句：`CR-FR-004` 元素列表。
- [ ] CR-08 实现章节总览 `/learn/:track/:stage/:chapter`：介绍、12 节列表、章测入口。来源句：`CR-FR-005` 元素列表。
- [ ] CR-09 实现节学习页：12 知识点切换、中/拼音/母语/TTS/例句/key_point、进度、开始小测。来源句：`CR-FR-006` 元素列表。
- [ ] CR-10 知识点字段支持 type、zh、pinyin、pinyin_tones、translations、audio、key_point、example_sentences、tags。来源句：`planning/prds/03-courses/01-structure-content.md` “知识点字段”表。
- [ ] CR-11 实现知识点批量导入校验：id 正则、track/stage/chapter/lesson/kpoint、unit_type、中文 ≤40 字、vi/th 审校、key_point ≤30 字。来源句：`content/course/shared/04-knowledge-point-format.md` 字段表。
- [ ] CR-12 实现节小测：10 题混合、即时反馈、错题最多重试 2 次、≥60% 通过、错题入 SRS。来源句：`CR-FR-007` 行为与通过标准。
- [ ] CR-13 同时兼容内容区节小测 12 题/75% 规则，作为内容生产与后续版本配置项；MVP 产品验收按 PRD 10 题/60%。来源句：`content/course/00-index.md` 写明“节小测 | 12 | 75%”，`CR-FR-007` 写明“10 题……≥60%”。
- [ ] CR-14 实现章测 36 题、60min、可暂停 1 次、≥70% 通过、错题入 SRS。来源句：`CR-FR-008`。
- [ ] CR-15 实现阶段考 80-150 题、120-180min、≥75% 通过、证书 PDF。来源句：`CR-FR-009`。
- [ ] CR-16 实现 Q1-Q10 与 P1-P3 题型渲染和数据结构。来源句：`planning/prds/03-courses/03-question-types.md` 写明“知语共定义 13 种题型（Q1-Q10 标准 + P1-P3 拼音入门）”。
- [ ] CR-17 实现题目生成约束：干扰项合理、等级不高于题目、解释 4 语、质量审核。来源句：`planning/prds/03-courses/03-question-types.md` “题目生成约束”和“题目质量审核”。
- [ ] CR-18 实现付费墙：阶段 4+，单段/9 段/月/年/半年促销展示，试看不计完成；支付动作走 PaymentAdapter fake。来源句：`CR-FR-010` 与 `planning/spec/02-tech-stack.md` “PaymentAdapter dummy”。
- [ ] CR-19 实现进度同步：知识点 1s 防抖、测验立即写、跨设备登录拉取。来源句：`CR-FR-011`。
- [ ] CR-20 实现错题集 `learning_wrong_set`：课程/游戏/阶段考来源，同题去重。来源句：`CR-FR-012` 写明入库时机和去重。
- [ ] CR-21 实现节/章/阶段学习报告，含得分、错题、掌握度、推荐、证书、下阶段预告。来源句：`CR-FR-013`。
- [ ] CR-22 实现跳过节：确认弹窗、标记 skipped、报告标注、可后补小测。来源句：`CR-FR-014`。
- [ ] CR-23 实现学习时长统计与日 30min +10 知语币。来源句：`CR-FR-016`。
- [ ] CR-24 实现多轨并行与轨道切换。来源句：`CR-FR-017` 写明“用户可同时学多轨道（不限）”。
- [ ] CR-25 实现知识点收藏、笔记 500 字、内容报错进入审校工作台。来源句：`CR-FR-018~020`。
- [ ] CR-26 后台课程管理使用树形结构：4 轨道 → 12 阶段 → 12 章 → 12 节 → 知识点/步骤。来源句：`planning/ux/11-screens-admin.md` 写明“内容管理 - 课程：4 轨道 / 12 阶段 / 12 章 / 12 节”。
- [ ] CR-27 按铁律提供最小开发 seed：4 轨 × 每轨 ≥2 stage × 每 stage ≥3 lessons = ≥24 lessons，每 lesson ≥5 题且 ≥3 题型，至少 1 套阶段考试 ≥10 题。来源句：`planning/rules.md` 系统课程 seed 表。
- [ ] CR-28 seed 覆盖 ≥6 种题型，并使用统一 JSON Schema、`seed://` 协议、幂等 upsert。来源句：`planning/rules.md` 写明“覆盖 PRD 03-courses/03-question-types.md 中 ≥6 种题型”。

## 验收与测试

- [ ] CR-T01 覆盖欢迎引导、拼音入门、Dashboard、阶段、节学习、小测、章测、阶段考、付费墙、进度、错题、报告、跳过、多轨、收藏笔记、报错。来源句：`planning/prds/03-courses/05-acceptance-criteria.md` CR-AC-001 到 CR-AC-017。
- [ ] CR-T02 非功能覆盖节页 LCP、切换、测验渲染、离线、RLS、答案不泄露、4 语、红线、埋点。来源句：`CR-NFR-001~006`。
- [ ] CR-T03 Docker 内执行 `pnpm seed:courses` 干净库一次跑通，并在 3100 完成“课程首页 → 轨道 → 阶段 → 节 → 小测 → 报告”链路。来源句：`planning/rules.md` §11.4。
