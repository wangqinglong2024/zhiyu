# Story 09 索引 · 游戏引擎共享层（Game Engine）

> Epic：[E09](../../epics/09-game-engine.md) · Sprint：[S09](../../sprint/09-game-engine.md) · 阶段：M3 · 周期：W15-W18

## MVP 子集（W15-W16，S10 启动前必须 done）

| Story | 标题 | 估 | 状态 |
|---|---|:-:|---|
| [9-1](./9-1-game-engine-package-skeleton.md) | packages/game-engine 骨架 | M | ready-for-dev |
| [9-2](./9-2-pixijs-application-wrapper.md) | PixiJS Application 封装 | M | ready-for-dev |
| [9-3](./9-3-scene-manager-mvp.md) | SceneManager MVP（无 Victory/NextLevel） | M | ready-for-dev |
| [9-4](./9-4-asset-loader-mvp.md) | AssetLoader MVP | M | ready-for-dev |
| [9-5](./9-5-input-manager-mvp.md) | InputManager MVP（键盘 + 拼音键盘） | S | ready-for-dev |
| [9-9](./9-9-landscape-fullscreen.md) | 强制横屏 + 全屏 API | M | ready-for-dev |

## V1 增强（W17-W18）

| Story | 标题 | 估 | 状态 |
|---|---|:-:|---|
| [9-11](./9-11-input-manager-v1.md) | InputManager V1（多指 / 缩放 / 旋转 / 长按） | M | ready-for-dev |
| [9-6](./9-6-audio-manager.md) | AudioManager（Howler） | M | ready-for-dev |
| [9-7](./9-7-physics-world.md) | PhysicsWorld（Matter） | M | ready-for-dev |
| [9-8](./9-8-wordpack-pinyin-renderer.md) | WordPack + 拼音 BitmapFont | L | ready-for-dev |
| [9-10](./9-10-analytics-leaderboard.md) | GameAnalytics + 排行榜 | M | ready-for-dev |

> 注：原 `9-5-input-manager-v1.md` 已重命名为 `9-11-input-manager-v1.md`，避免与 9-5 MVP 重复 Key。
