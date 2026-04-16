# 游戏模块 — 详细设计索引

> 知语 Zhiyu 12 款 2D 学习游戏完整设计文档
> 版本：v6.0（终版） | 日期：2026-04-16
> **关联**: [游戏汇总](../04-game-design.md) | [课程体系](../03-course-system.md) | [技术架构](../05-tech-architecture.md)

---

## 概述

知语 12 款游戏与 12 级课程一一对应，所有游戏**完全免费**，采用**横屏模式**，同时支持 Web 桌面和移动端 H5。

- 游戏引擎：Phaser 3（HTML5 2D）
- 屏幕方向：**强制横屏**（landscape）
- 平台：Web + 移动端 H5（未来打包进 App）
- 对战：WebSocket 实时 PK
- 变现：皮肤 / 特效 / 赛季通行证（游戏本体免费）

---

## 游戏列表

| # | 文件 | 游戏名称 | 对应课程 | 优先级 | 上线时间 |
|---|------|---------|----------|--------|---------|
| 1 | [01-hanzi-slash.md](01-hanzi-slash.md) | 汉字切切切 | L1（启蒙） | P0 | M1-M2 |
| 2 | [02-pinyin-bubble.md](02-pinyin-bubble.md) | 拼音泡泡龙 | L2（基础读写） | P0 | M3 |
| 3 | [03-word-match.md](03-word-match.md) | 词语消消乐 | L3（段落理解） | P1 | M3-M4 |
| 4 | [04-grammar-chef.md](04-grammar-chef.md) | 语法大厨 | L4（篇章理解） | P1 | M5 |
| 5 | [05-idiom-chain.md](05-idiom-chain.md) | 成语接龙大战 | L5（深度阅读） | P1 | M5-M6 |
| 6 | [06-hanzi-puzzle.md](06-hanzi-puzzle.md) | 汉字华容道 | L6（综合提升） | P2 | M7 |
| 7 | [07-poem-flyorder.md](07-poem-flyorder.md) | 古诗飞花令 | L7（文言入门） | P2 | M7-M8 |
| 8 | [08-reading-detective.md](08-reading-detective.md) | 阅读侦探社 | L8（文学赏析） | P2 | M9 |
| 9 | [09-wenyan-adventure.md](09-wenyan-adventure.md) | 文言大冒险 | L9（综合冲刺） | P2 | M10 |
| 10 | [10-debate-arena.md](10-debate-arena.md) | 辩论擂台 | L10（高中语文） | P3 | M12 |
| 11 | [11-poetry-contest.md](11-poetry-contest.md) | 诗词大会 | L11（学术深化） | P3 | M14 |
| 12 | [12-literary-master.md](12-literary-master.md) | 文豪争霸 | L12（母语精通） | P3 | M16 |

---

## 通用规则

所有 12 款游戏共享以下规则，详见各游戏文档：

1. **完全免费** — 游戏解锁条件为完成对应 Level 课程（或非会员完成前 3 级可玩的范围内）
2. **横屏模式** — 所有游戏强制横屏，进入游戏时自动提示旋转设备
3. **4 种模式** — 单人经典 / 单人限时 / 1v1 PK / 多人对战
4. **段位系统** — 青铜→白银→黄金→钻石→王者→传奇（ELO）
5. **皮肤系统** — 纯装饰性付费，不影响游戏平衡
6. **课程联动** — 题库 100% 来自对应 Level 课程内容
7. **防作弊** — 服务端出题 + 服务端计分 + 时间校验
