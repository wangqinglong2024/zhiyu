# 07 · 小说专区任务清单

## 来源覆盖

- PRD：`planning/prds/05-novels/01-functional-requirements.md`、`02-data-model-api.md`、`03-acceptance-criteria.md`、`04-v1-launch-titles.md`。
- 内容规则：`content/novels/00-index.md` 与 12 类目文件。
- 全局种子：`planning/rules.md` §11。

## 内容区规则覆盖

- 小说专区 12 类目必须按内容区建模。来源句：`content/novels/00-index.md` 表格列出都市言情、古代言情、仙侠修真、玄幻奇幻、穿越重生、武侠江湖、历史架空、悬疑推理、灵异盗墓、科幻末世、电竞游戏、耽美 BL/百合 GL。
- 小说阅读必须句对照/听书/章节制/音频先行。来源句：`content/novels/00-index.md` 设计原则写明“每句话一行，中文 + 本地语言三语对照”“每部小说按章切分”“所有小说默认提供 TTS 朗读”。
- 各类目后台必须保留内容边界与合规规则。来源句：`planning/prds/05-novels/04-v1-launch-titles.md` 写明“全类目通用红线”和“类目特别约束”。

## 任务清单

- [ ] NV-01 建立 `content_novels`、`content_novel_chapters`，句子复用 `content_sentences`。来源句：`planning/prds/05-novels/02-data-model-api.md` 写明这些表与“句子复用 content_sentences”。
- [ ] NV-02 建立小说类目 seed（module=novel），包含 12 类目并标记 v1 上架状态。来源句：`NV-FR-001` 写明“12 类目卡片 + 推荐位；每类目下显示 v1 是否上架（v1 仅 5 类目）”。
- [ ] NV-03 实现 `/novels` 类目首页，12 卡片与编辑精选推荐位。来源句：`NV-FR-001`。
- [ ] NV-04 实现 `/novels/:category_slug` 列表，含封面、双语标题、简介、HSK、章节数、读者数、评分，并支持最新/热门/评分/我在读排序。来源句：`NV-FR-002`。
- [ ] NV-05 实现小说详情页：封面、标题、作者、简介、HSK、总章节、读者数、评分、章节列表、开始/继续阅读。来源句：`NV-FR-003`。
- [ ] NV-06 实现章节阅读页，复用 DC SentenceCard，支持拼音/母语/TTS/长按菜单、上一章/下一章。来源句：`NV-FR-004`。
- [ ] NV-07 实现小说阅读进度，复用 `learning_reading_progress` target_type=novel_chapter。来源句：`NV-FR-005`。
- [ ] NV-08 实现章末快测 3-5 题 Q1-Q3，答错入 SRS，≥60% 通过，跳过可用；奖励动作按经济模块配置，不因游戏规则误用。来源句：`NV-FR-006`。
- [ ] NV-09 实现收藏/笔记/评分，target_type 支持 novel/chapter/sentence。来源句：`NV-FR-007`。
- [ ] NV-10 实现阅读偏好：字号、拼音模式、母语翻译实时/折叠/隐藏。来源句：`NV-FR-008`。
- [ ] NV-11 实现 HSK 难度建议弹层：“建议先学 X 阶段”与“我要挑战”。来源句：`NV-FR-009`。
- [ ] NV-12 实现章节金句分享卡片，含分销码。来源句：`NV-FR-010` 与 `planning/prds/05-novels/04-v1-launch-titles.md` 写明“每章自动选 1-2 句金句，毛玻璃卡片”。
- [ ] NV-13 评论功能只做 v1.5 backlog/占位，不进入 W0 主任务。来源句：`NV-FR-011` 写明“评论（v1.5）”。
- [ ] NV-14 实现未登录首章预览限制。来源句：`planning/prds/05-novels/02-data-model-api.md` 写明“未登录：仅可读小说前 1 章”。
- [ ] NV-15 实现 v1 五部启动小说：晨光里的咖啡香、长安春日记、九点零八分、二十一岁的赛点、同窗，每部 10 章。来源句：`planning/prds/05-novels/04-v1-launch-titles.md` “v1 五部启动小说详细规格”。
- [ ] NV-16 按排期标记 12 类目上线版本：v1.0 五类、v1.1 两类、v1.5 三类、v2.0 全 12。来源句：`planning/prds/05-novels/04-v1-launch-titles.md` “12 类目详细规划”表。
- [ ] NV-17 实现 BL/GL 地区 Feature Flag 与非露骨边界。来源句：`planning/prds/05-novels/04-v1-launch-titles.md` 写明“仅合规市场显示；严格非露骨；按当地法规配置 Feature Flag”。
- [ ] NV-18 实现小说内容红线：政治隐射、露骨色情/暴力血腥、民族/宗教歧视、自杀/毒品诱导、未成年不当关系拦截。来源句：同文件“全类目通用红线”。
- [ ] NV-19 后台小说管理支持小说列表、章节列表、章节编辑器、角色字典侧栏、上下章导航。来源句：`planning/ux/11-screens-admin.md` “内容管理 - 小说”。
- [ ] NV-20 实现小说 SEO：每章独立 URL 4 语、CreativeWork/Chapter JSON-LD、sitemap。来源句：`planning/prds/05-novels/01-functional-requirements.md` SEO 段。
- [ ] NV-21 按铁律提供最小 seed：≥6 部小说覆盖 12 类目中 ≥6 类，每部 ≥3 章，共 ≥18 chapters，至少 2 部带 VIP/付费章标记。来源句：`planning/rules.md` 小说 seed 表。
- [ ] NV-22 同步 PRD W0 50 章与铁律最小 seed：开发先跑通 ≥18 章 seed，W0 内容验收另要求 5 部 ×10 章。来源句：`planning/prds/05-novels/03-acceptance-criteria.md` 写明“5 部 × 10 章 = 50 章上架”。

## 验收与测试

- [ ] NV-T01 验收类目、列表、详情、章节句子级阅读、进度、快测、收藏笔记评分、偏好、难度建议、分享、未登录首章限制。来源句：`planning/prds/05-novels/03-acceptance-criteria.md` NV-AC-001 到 NV-AC-011。
- [ ] NV-T02 非功能覆盖 LCP < 2s、下一章预加载、SEO、WCAG。来源句：同文件“非功能”。
- [ ] NV-T03 Docker 内执行 `pnpm seed:novels` 干净库一次跑通，并在 3100 完成“类目 → 小说详情 → 章节阅读 → 快测/收藏/分享”链路。来源句：`planning/rules.md` §11.4。
