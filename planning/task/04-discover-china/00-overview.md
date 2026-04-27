# 04 · 发现中国任务清单

## 来源覆盖

- PRD：`planning/prds/02-discover-china/01-functional-requirements.md`、`02-data-model-api.md`、`03-acceptance-criteria.md`。
- 内容规则：`content/china/00-index.md` 与 12 个类目文件。
- 全局种子：`planning/rules.md` §11 内容种子数据。

## 内容区规则覆盖

- 12 类目必须按 `content/china/00-index.md` 建模和后台配置。来源句：该表列出“中国历史、中国美食、名胜风光、传统节日、艺术非遗、音乐戏曲、文学经典、成语典故、哲学思想、当代中国、趣味汉字、中国神话传说”。
- 页面与后台不得只做泛文化分类；每类目要支持定位、内容范围、内容边界、MVP 内容清单。来源句：每个 `content/china/*.md` 均包含“类目定位”“内容范围”“MVP 内容清单”。
- 跨模块入口要落页面规则。来源句：`content/china/00-index.md` 写明“每篇文章底部均展示跨模块入口卡片，引导用户从文化阅读进入系统学习”。

## 任务清单

- [ ] DC-01 建立 `content_categories`（module=discover）与 12 类目 seed，含多语名、描述、封面、主题色、排序、状态。来源句：`planning/prds/02-discover-china/02-data-model-api.md` 写明 `content_categories` 字段与 `module IN ('discover','novel')`。
- [ ] DC-02 实现 `/discover` 类目首页：12 类目卡片、母语类目名、封面图、文章总数、最近 3 篇标题。来源句：`DC-FR-001` 写明“展示 12 类目卡片，每张卡片显示类目名（母语）、封面图、文章总数、最近 3 篇标题”。
- [ ] DC-03 实现类目列表 `/discover/:category_slug`，按发布时间倒序，分页 20/页，支持 HSK 难度与长度筛选。来源句：`DC-FR-002` 写明“展示该类目所有文章，按发布时间倒序，分页 20/页；筛选：HSK 难度、长度”。
- [ ] DC-04 实现文章详情 `/discover/:category_slug/:article_slug` 的句子级阅读。来源句：`DC-FR-003` 写明“句子列表（中文 + 拼音 + 母语 + 音频按钮）”。
- [ ] DC-05 建立 `content_articles`、`content_sentences`，支持标题、摘要、key_points、HSK、字数、状态、音频、多语翻译。来源句：`planning/prds/02-discover-china/02-data-model-api.md` 写明 `content_articles` 与 `content_sentences` DDL。
- [ ] DC-06 实现句子点击播放 TTS、长按菜单、拼音显示模式、字号/行高偏好。来源句：`DC-FR-004` 写明“句子点击 → 播放 TTS；长按句子 → 显示菜单；拼音显示模式……”。
- [ ] DC-07 实现阅读进度保存与恢复，登录写 `learning_reading_progress`，未登录 localStorage。来源句：`DC-FR-005` 写明“滚动到第 N 句时自动保存（防抖 5s），未登录则用 localStorage”。
- [ ] DC-08 实现完读判定与阅读统计，个人中心展示已读文章数、累计字数、收藏数。来源句：`DC-FR-005` 写明“完读判定：滚到末尾 + 停留 > 30s”，`DC-FR-015` 写明统计字段。
- [ ] DC-09 实现文章/句子收藏，复用 `user_favorites`。来源句：`DC-FR-006` 写明“右上角心形按钮，点击收藏 / 取消；存储：user_favorites（type=article）”。
- [ ] DC-10 实现句子笔记，500 字限制，多设备同步。来源句：`DC-FR-007` 写明“弹出文本框（限 500 字）”与“多设备同步：是”。
- [ ] DC-11 实现文章评分 1-5 星，每用户每文章 1 票。来源句：`DC-FR-008` 写明“5 星；限制：每用户每文章 1 票”。
- [ ] DC-12 实现分享卡片 1080×1920、标题、金句、QR 含分销码，结果存储 90 天。来源句：`DC-FR-009` 写明“生成 1080×1920 图卡……QR 含分销码；缓存：Storage 90 天”。
- [ ] DC-13 实现未登录预览 3 篇，第 4 篇返回预览限制并引导注册。来源句：`DC-FR-010` 写明“同 IP / 同设备指纹累计 3 篇文章 → 弹注册解锁更多”。
- [ ] DC-14 将旧外部 WAF/Captcha 叙述替换为 nginx/自建限流与 CaptchaAdapter always-pass/fake。来源句：`planning/spec/02-tech-stack.md` 写明“CaptchaAdapter | always-pass”。
- [ ] DC-15 实现搜索：标题、正文中文、关键点、句子 zh，Postgres FTS/pg_trgm，高亮，分页 20/页。来源句：`DC-FR-011` 写明“关键词匹配标题 / 正文中文 / 关键点；后端 PostgreSQL FTS（pg_trgm）”。
- [ ] DC-16 实现相关推荐 4 篇：同类目、相近 HSK、高评分。来源句：`DC-FR-012` 写明“显示 4 篇同类目其他热门文章；算法 v1：同类目 + 相近 HSK 难度 + 高评分”。
- [ ] DC-17 实现母语切换与缺失回退英文。来源句：`DC-FR-013` 写明“用户切换 UI 语言时，所有文章翻译实时切换；缺失语种则回退英文”。
- [ ] DC-18 实现 HSK 难度自动计算与列表筛选。来源句：`DC-FR-014` 写明“每篇文章计算 HSK 难度等级……用户可按难度筛”。
- [ ] DC-19 实现内容预热任务为本地 nginx/cache header/SW 预取，避免外部 CDN 依赖。来源句：`DC-FR-016` 写明“热门文章自动……缓存”，`planning/spec/01-overview.md` 写明“v1 不走外部 CDN；静态资源由 nginx 直接 gzip + 长 cache header”。
- [ ] DC-20 实现 SEO：独立 URL、title/description/og、JSON-LD、sitemap、4 语 URL。来源句：`DC-FR` SEO 段写明“每篇文章独立 URL”“JSON-LD”“4 语种独立 URL”。
- [ ] DC-21 实现后台 DC 内容管理：类目、文章、句子 CRUD，批量发布/撤回/复制/版本/预览。来源句：`AD-FR-006` 写明“DC：类目 + 文章 + 句子 CRUD”与“通用功能：批量发布 / 撤回 / 复制 / 版本历史 / 预览”。
- [ ] DC-22 后台文章编辑器必须暴露 12 类目规则字段和红线校验，不允许发布内容边界外主题。来源句：`content/china/01-chinese-history.md` 内容边界表写明“包含历史故事和人物；不包含政治敏感话题”等，12 个类目文件均有内容边界。
- [ ] DC-23 按铁律提供最小开发 seed：12 类目 × 每类 ≥ 3 篇，正文 ≥ 300 字，4 语标题，≥ 6 篇 TTS 占位音频。来源句：`planning/rules.md` 写明“发现中国 (DC) | 12 类目 × 每类 ≥ 3 篇 = ≥ 36 篇 articles……至少 6 篇带 TTS 占位音频 URL”。
- [ ] DC-24 seed 数据使用统一 JSON Schema、`seed://` 协议、幂等 upsert。来源句：`planning/rules.md` 写明“所有内容模块的种子 JSON 必须符合统一字段约束”和“后端必须实现 seed:// 协议解析”。

## 验收与测试

- [ ] DC-T01 页面验收覆盖类目首页、列表页、单篇阅读、进度、收藏、笔记、分享、搜索。来源句：`planning/prds/02-discover-china/03-acceptance-criteria.md` DC-AC-001 到 DC-AC-009。
- [ ] DC-T02 非功能验收覆盖 LCP、音频加载、SEO、可访问性、安全、合规、事件。来源句：`DC-NFR-001~006` 写明这些指标。
- [ ] DC-T03 Docker 内执行 `pnpm seed:discover-china`，干净 dev 库一次跑通。来源句：`planning/rules.md` 写明“pnpm seed:<module> 在干净的 dev 数据库上一次性跑通，零报错”。
- [ ] DC-T04 MCP Puppeteer 直连 3100 完成“列表 → 详情 → 播放/收藏/笔记/分享/搜索”主链路。来源句：`planning/rules.md` 写明“列表 → 详情 → 关键交互”主链路验收。
