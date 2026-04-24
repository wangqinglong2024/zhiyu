# shared · 12 款游戏的通用规范

> **强制遵守**：任一款游戏的 PRD 都必须先满足本目录定义的 5 份规范，再写自己的玩法差异。

| 文件 | 内容 |
|---|---|
| [01-unified-settings.md](./01-unified-settings.md) | 统一设置面板：主题轨道 / 课程阶段 / 难度 / 题量 |
| [02-content-adapter.md](./02-content-adapter.md) | 题库 → 游戏内容适配器：如何把字/词/句变成"可切的水果""可射的怪物" |
| [03-scoring-system.md](./03-scoring-system.md) | 评分、连击、星级、SRS 回传 |
| [04-visual-effects.md](./04-visual-effects.md) | 漫画风视觉的"无美术"实现方案：形状 + Emoji + 粒子 + Shader |
| [05-round-loop.md](./05-round-loop.md) | 回合制状态机：Lobby → Round → Settle → Lobby |

> 任一规范变更需同步更新 12 款游戏 PRD 的"依赖版本"字段。
