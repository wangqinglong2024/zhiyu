# 06 · 游戏专区任务清单

## 来源覆盖

- PRD：`planning/prds/04-games/01-functional-requirements.md`、`02-data-model-api.md`、`03-acceptance-criteria.md`。
- 内容规则：`content/games/00-index.md`、`content/games/shared/*.md`、12 款游戏 `prd.md`。
- 技术/UX：`planning/spec/11-game-engine.md`、`planning/ux/10-game-ux.md`。
- 全局种子：`planning/rules.md` §11。

## 冲突裁决

- MVP 以“12 款全部 active、60s 单局、无限连玩、无关卡/三星/排行榜/奖励”为准。
- 来源句：`planning/prds/04-games/01-functional-requirements.md` 写明“12 款游戏均为 60s 单局 · 无限连玩 · 无关卡 / 章节 / 下一关 / 多波”。

## 内容区规则覆盖

- 12 款游戏必须全部覆盖。来源句：`content/games/00-index.md` “12 款游戏一览”列出汉字忍者、拼音射击、声调泡泡、汉字俄罗斯方块、打字地鼠、汉字消消乐、贪吃字蛇、节奏汉字、跑酷拾字、拼音塔防、翻牌记忆、汉字弹弓。
- 游戏不得自造内容。来源句：`content/games/shared/02-content-adapter.md` 写明“禁止游戏内自造内容、禁止硬编码字符”。
- 数据来源唯一。来源句：`content/games/00-index.md` 写明“所有字 / 词 / 句全部来自课程题库 CSV/JSONL，按 track + stage 过滤”。

## 任务清单

- [ ] GM-01 建立 `games`、`game_sessions`、`game_user_stats` 最小表，移除排行榜/HMAC/发币在 MVP 主链路中的依赖。来源句：`planning/prds/04-games/02-data-model-api.md` 写明“MVP 收敛：仅保留 games / game_sessions / game_user_stats 三张表的最小子集”。
- [ ] GM-02 修正游戏 API：`GET /api/games` 只返回 12 active 游戏和个人最近得分，不返回 coming_soon、排行榜、奖励。来源句：`GM-FR-001` 写明“12 张游戏卡片，全部可玩，无 coming_soon 占位；个人最近一次得分（无最高分 / 无玩家数 / 无评分）”。
- [ ] GM-03 实现游戏中心 `/games` 12 卡片固定推荐顺序。来源句：`GM-FR-001` 写明“排序：固定推荐顺序”。
- [ ] GM-04 实现强制横屏：竖屏遮罩、桌面 16:9 居中、退出解除横屏。来源句：`GM-FR-002` 与 `planning/ux/10-game-ux.md` “强制横屏机制”。
- [ ] GM-05 实现词包选择：MVP 仅 HSK1 / 当前学习轨道，词包不足 50 回退 HSK1。来源句：`GM-FR-003`。
- [ ] GM-06 实现 60 秒固定倒计时，本局结算只显示用时、得分、错题、再玩一局、返回游戏中心。来源句：`GM-FR-004`。
- [ ] GM-07 明确不实现奖励、知语币、经验、道具、三星、排行榜、分享、下一关、解锁。来源句：`GM-FR-004` 写明“不发放任何奖励 / 知语币 / 经验 / 道具”与“不展示：三星评级 / 排行榜跳转 / 分享按钮 / 奖励动画 / 下一关 / 解锁”。
- [ ] GM-08 游戏错题在本局结束后批量推 SRS，并在结算页只读展示。来源句：`GM-FR-005` 写明“本局结束（60s）后批量推 SRS”。
- [ ] GM-09 实现拼音射击：汉字下落，拼音击落，键盘/屏幕拼音键盘输入，拼错/未击落入 SRS。来源句：`planning/prds/04-games/01-functional-requirements.md` “游戏 1：拼音射击”。
- [ ] GM-10 实现声调泡泡：按声调 4 色点击对应桶，错放入 SRS。来源句：同文件“游戏 2：声调泡泡”。
- [ ] GM-11 实现打地鼠：5×3 洞，按母语提示打对应字，打错入 SRS。来源句：同文件“游戏 3：打地鼠”。
- [ ] GM-12 实现汉字消消乐：6×8 网格，音模式 MVP，错配入 SRS。来源句：同文件“游戏 4：汉字消消乐”。
- [ ] GM-13 实现翻牌记忆：4×4 汉字+拼音配对，连续错 3 次入 SRS。来源句：同文件“游戏 5：翻牌记忆”。
- [ ] GM-14 实现汉字忍者：飞字切割，拼音提示切对应字，切错入 SRS。来源句：同文件“游戏 6：汉字忍者”。
- [ ] GM-15 实现汉字俄罗斯方块 MVP：经典方块 + 同字水平消除，消错组合入 SRS。来源句：同文件“游戏 7：汉字俄罗斯方块”。
- [ ] GM-16 实现拼音塔防 MVP：1 地图/3 波/单塔类型，但外层仍按 60s MVP 结算裁决收敛。来源句：同文件“游戏 8：拼音塔防”和全局玩法句。
- [ ] GM-17 实现汉字贪吃蛇：吃字组词，组错词入 SRS。来源句：同文件“游戏 9：汉字贪吃蛇”。
- [ ] GM-18 实现汉字节奏：1 BPM/1 曲目，漏点/点错入 SRS。来源句：同文件“游戏 10：汉字节奏”。
- [ ] GM-19 实现汉字跑酷：横版跑酷 + 选字过门，选错入 SRS。来源句：同文件“游戏 11：汉字跑酷”。
- [ ] GM-20 实现汉字弹弓：Matter 物理抛物，射错入 SRS。来源句：同文件“游戏 12：汉字弹弓”。
- [ ] GM-21 建立 `packages/game-engine`：Pixi App、SceneManager、AssetLoader、InputManager、AudioManager、PhysicsWorld、HUD/Pause。来源句：`planning/spec/11-game-engine.md` monorepo 结构列出这些模块。
- [ ] GM-22 建立统一 `GameModule` 插件接口与 12 游戏注册。来源句：`planning/spec/11-game-engine.md` 写明 `GameModule` 标准接口和 `registerGame` 示例。
- [ ] GM-23 建立 ContentAdapter：FetchParams、GameItem、干扰项生成、题型映射、缓存离线。来源句：`content/games/shared/02-content-adapter.md` 定义输入、输出、干扰项、映射和缓存。
- [ ] GM-24 建立回合状态机：Lobby → Settings → Preload → Round → Settle → Lobby。来源句：`content/games/shared/05-round-loop.md` “顶层状态机”。
- [ ] GM-25 评分只用于本局得分和错题权重，不触发星级/皮肤/排行榜。来源句：`planning/prds/04-games/03-acceptance-criteria.md` 写明“不存在关卡切换 / 下一关 / 多波 / 三星 UI”和“不存在排行榜 / 分享 / 奖励 UI”。
- [ ] GM-26 后台实现游戏配置 + 词包绑定 + CSV 导入，但不允许游戏内自造词。来源句：`AD-FR-006` 写明“GM：游戏配置 + 词包绑定”，`content/games/shared/02-content-adapter.md` 写明“禁止硬编码字符”。
- [ ] GM-27 按铁律提供最小 seed：12 款每款 ≥1 关卡配置 + ≥1 WordPack（≥30 词条），leaderboard 至少 5 条假成绩仅用于 seed/后台联调，不在 C 端 MVP 展示。来源句：`planning/rules.md` 游戏 seed 表与 `GM-FR-004` 不展示排行榜裁决。

## 验收与测试

- [ ] GM-T01 12 游戏卡片全部 active，无 coming_soon。来源句：`GM-AC-001`。
- [ ] GM-T02 任一游戏竖屏进入显示横屏遮罩，横屏进入 16:9 画布。来源句：`GM-AC-002` 与 `planning/ux/10-game-ux.md`。
- [ ] GM-T03 新用户首次玩拼音射击 → 60s 结算 → 错题入 SRS，不发币/奖励。来源句：`planning/prds/04-games/03-acceptance-criteria.md` 关键测试用例 1。
- [ ] GM-T04 连玩 5 局，每局状态互不影响且均 60s。来源句：同文件关键测试用例 2。
- [ ] GM-T05 Docker 内执行 `pnpm seed:games` 干净库一次跑通，并在 3100 完成“游戏中心 → 选词包 → 开局 → 结算 → 再玩一局”。来源句：`planning/rules.md` §11.4。
