# Sprint S09 · 游戏引擎共享层（MVP 优先）

> Epic：[E09](../epics/09-game-engine.md) · 阶段：M3 · 周期：W15-W18 · 优先级：P0
> Story 数：11（MVP 子集 6 + V1 增强 5） · 状态：[sprint-status.yaml](./sprint-status.yaml#epic-9)

## Sprint 目标
PixiJS v8 + Matter + Howler 共享引擎包，**MVP 优先**：W15-W16 交付足以驱动 G1-G12 MVP 的最小子集；W17-W18 迭代到完整能力。

> **全局约束**：engine `Round` 默认 `durationMs = 60_000`，统一 60s 倒计时与「再玩一局」状态机；不存在 Victory / NextLevel。

## Story 列表（按 MVP / V1 切分）

### MVP 子集（W15-W16）

| 序 | Story Key | 标题 | 估 | 依赖 | 周次 |
|:-:|---|---|:-:|---|:-:|
| 1 | 9-1-game-engine-package-skeleton | packages/game-engine 骨架 | M | S01 1-1 | W15 |
| 2 | 9-2-pixijs-application-wrapper | PixiJS Application 封装 | M | 9-1 | W15 |
| 3 | 9-3-scene-manager-mvp | SceneManager (Loading/Game/GameOver, 无 Victory/NextLevel) | M | 9-2 | W16 |
| 4 | 9-4-asset-loader-mvp | AssetLoader（图 / 音） | M | 9-1 | W16 |
| 5 | 9-5-input-manager-mvp | InputManager（键盘 + 拼音键盘） | S | 9-2 | W16 |
| 6 | 9-9-landscape-fullscreen | 强制横屏 + 全屏 API | M | 9-2 | W16 |

### V1 增强（W17-W18）

| 序 | Story Key | 标题 | 估 | 依赖 | 周次 |
|:-:|---|---|:-:|---|:-:|
| 7 | 9-11-input-manager-v1 | InputManager 完整（触屏 / 多指） | M | 9-5-mvp | W17 |
| 8 | 9-6-audio-manager | AudioManager（Howler） | M | 9-4 | W17 |
| 9 | 9-7-physics-world | PhysicsWorld（Matter） | M | 9-2 | W17 |
| 10 | 9-8-wordpack-pinyin-renderer | WordPack + 拼音 BitmapFont | L | 9-4 | W17-W18 |
| 11 | 9-10-analytics-leaderboard | GameAnalytics + 排行榜 | M | 9-1, S01 1-9 | W18 |

## 风险
- 浏览器 PixiJS WebGL 兼容 → 矩阵测试
- BitmapFont 生成时机 → 预生成 + 增量补充
- MVP 子集与 G1-G5 MVP 紧耦合 → S10 W21 启动前必须 engine MVP 全绿

## DoD

### MVP（W16 末）
- [ ] 6 个 MVP stories 完成
- [ ] G1-G12 MVP 可基于 engine MVP 起步，均遵循 **60s 单局 / 无限连玩 / 无关卡** 状态机

### V1（W18 末）
- [ ] 全部 11 stories 完成（含 V1 增强 5 个）
- [ ] demo 游戏 60fps 中端机
- [ ] 接口稳定 → 复用于 S10 全部 12 游戏
- [ ] 测试覆盖 ≥ 70%
- [ ] retrospective 完成
