# E09 · 游戏引擎 代码审查报告

> 范围：ZY-09-01 ~ ZY-09-10（含 09-05-MVP 与 09-05-V1）
> 审查日期：2025-12-04
> 审查者：3 路并行视角（Blind Hunter / Edge Case Hunter / Acceptance Auditor）
> 关联：[planning/epics/09-game-engine.md](../epics/09-game-engine.md)

## 摘要

整体实现紧扣 epic 目标：PixiJS v8 + Matter + Howler 三大依赖按 lazy-import 装入；引擎/场景/输入/音频/物理/词包/分析/排行榜模块边界清晰；`Round` 60s 状态机覆盖「再玩一局」需求；BE 三个新接口 + Worker 排行榜 cron 已上线；32 个单测通过；Docker 端到端验证通过。

发现 **2 个真实问题**（已修复）、**3 个小风险**（已标注）、**0 个阻塞缺陷**。整体可以进入 E10 的游戏实现阶段。

---

## Lens 1 · Blind Hunter（"看不见的 bug"）

| # | 位置 | 现象 | 严重度 | 状态 |
|---|------|------|--------|------|
| B-1 | `apps/api/src/routes/games.ts` `recent: Map` | 进程内速率限制 Map 永不清空，长时间运行下 key 数 = 历史用户总数 | Low | 接受（MVP 单实例；下个版本切到 Redis） |
| B-2 | `packages/game/src/analytics/analytics.ts` `flush()` | `keepalive: true` 在 Node fetch polyfill 下被忽略；浏览器端 OK | Info | 接受（仅浏览器侧使用） |
| B-3 | `apps/worker/src/leaderboard-cron.ts` `INSERT ... ON CONFLICT` | `period_start` 取 `now() - 7d`，每次 cron 跑都是新值，**永远不会命中 ON CONFLICT**，导致 leaderboards 表行数无限增长 | **High** | **已修复** ✅ |

### B-3 修复细节

`period_start` 现改为常量 `1970-01-01T00:00:00Z`（rolling-window 的稳定 bucket key）。聚合截止时间通过 `scopeCutoff()` 单独传给 SQL `WHERE created_at >= ${since}`。这样保证每个 (game_id, scope) 在缓存表里只有一行，cron 每 5 分钟 UPDATE 而不是 INSERT。

---

## Lens 2 · Edge Case Hunter（"每条分支"）

走查清单（× = 未处理；✓ = 已覆盖；⚠ = 已知风险/可接受）：

### 引擎核心

- ✓ `Engine.start()` 重复调用：`raf` 已检查 null guard。
- ✓ `Engine.destroy()` 后再 `tick`：被 `destroyed` 标志拦截。
- ✓ `Round.start()` 后再次调用：内部 reset，等价于 restart。
- ⚠ 长时间标签页后台 → `requestAnimationFrame` 暂停 → 恢复后第一帧 `dt` 巨大；当前用 `Math.min(rawDt, 100ms)` 截断，可接受。

### 输入

- ✓ `KeyboardInput`：blur 事件清空所有按键状态。
- ✓ `TouchInput`：单指 → 多指切换中 pinch 起点正确。
- ✓ `PinyinKeyboardController`：connect 之间不 reset 现有 buffer（已显式 clear-on-mount）。
- ⚠ iOS Safari `pointercancel` 不一定触发 `pointerup`，已监听两者。

### 音频

- ✓ `AudioManager.fadeIn` 上限 500ms（spec 要求 ≤ 500ms）。
- ✓ mute 与 group volume 的乘法叠加正确。

### 词包

- ✓ `parsePinyin`：声调符号、数字格式、不带声调 3 种输入路径全覆盖。
- ✓ `layoutHanziWithPinyin`：500 字 < 100ms（已断言 perf budget）。
- ✓ 空词包 → `loader.fetch` 返回 `{items: []}`，UI 端需判空（已在 `play-game.tsx` 处理）。

### 分析

- ✓ 5xx 重排队上限（capped at `maxBatchSize * 4`），防止内存爆炸。
- ✓ 4xx 直接丢弃（避免无限重试已损坏的事件）。
- ✓ `destroy()` 之后 `track()` 直接 no-op。
- ⚠ 浏览器关闭瞬间若 batch 在路上，`keepalive: true` 尽力而为；丢失少量事件可接受。

### 排行榜

- ✓ 缓存命中 → 直接返回；缓存未命中 → live aggregate（top 50）。
- ✓ 自身 rank 仅在已登录时计算。
- ✓ `?range` / `?scope` 参数都接受。
- ✓ `?range=weekly` / `?range=monthly` 别名。
- ⚠ live aggregate 没有 LIMIT user_id pagination；MVP 期 50 行足够。

### Telemetry

- ✓ 单批最大 100 事件（zod 校验）。
- ✓ 匿名事件允许（`user_id = null`）。
- ✓ jsonb 双重编码已通过 `rawClient.json(... as never)` 解决。

### Worker cron

- ✓ `connection.duplicate()` 防止 BullMQ blocking-mode 阻塞主连接。
- ✓ 优雅关闭顺序：worker → events → queue → sql.end。
- ✓ `repeat: { every: 5min }` + 固定 `jobId` → 保证只有一个 repeatable schedule。

---

## Lens 3 · Acceptance Auditor（AC 逐条复核）

| Story | AC 摘要 | 实现状态 |
|-------|---------|----------|
| ZY-09-01 骨架 | tsup build；入口导出 | ✅ `packages/game/src/index.ts` 导出 10 个子模块；vite/vitest 通 |
| ZY-09-02 Pixi 封装 | letterbox / DPR / destroy | ✅ `pixi-renderer.ts` lazy-load；`detectDeviceProfile` 高低端区分 |
| ZY-09-03 SceneManager | push/pop/replace；MVP 仅 3 场景 | ✅ `scenes/manager.ts` + `BaseScene`；GameOver 复用 `Round.onEnd` |
| ZY-09-04 AssetLoader | 进度回调 / 重试 / cache | ✅ `assets/loader.ts` 3 都覆盖，含 monotonic progress 单测 |
| ZY-09-05-MVP 输入 | 键盘 + 拼音键盘 | ✅ `input/keyboard.ts` + `pinyin-keyboard.ts`；`/play/$slug` 页面已挂载 |
| ZY-09-05-V1 输入 | tap/drag/swipe/pinch + 多指 | ✅ `input/touch.ts` 5 种手势 + 单测 |
| ZY-09-06 Audio | 分类音量 / 静音 / 淡入淡出 ≤500ms | ✅ `audio/manager.ts` |
| ZY-09-07 Physics | Matter step + Pixi 同步 | ✅ `physics/world.ts` lazy import；调试渲染留 dev hook |
| ZY-09-08 词包 + Pinyin | `/api/v1/wordpacks/:id` + 声调色 | ✅ BE GET 接口 + FE `wordpack/{loader,pinyin,renderer}` |
| ZY-09-09 强制横屏 + 全屏 | 检测 / 提示 / API | ✅ `fullscreen/{fullscreen,safe-area}.ts` + 页面按钮 |
| ZY-09-10 埋点 + 排行榜 | 写 events + leaderboard API（**禁 PostHog**） | ✅ POST `/api/v1/_telemetry/event` + GET leaderboard + worker cron 5min；**0 PostHog 引用** |

### Spec 偏差（已修正）

- 原 spec：`?range=daily|weekly|all`。原实现：`?scope=daily|week|month|all`。
- **已修复**：`normalizeScope()` 接受 `range`/`scope` 两参数及 `weekly`/`monthly` 别名。

### DoD 复核

- [x] 09-01/02/03/04/05-MVP/09 完成（MVP DoD）
- [x] 09-05-V1/06/07/08/10 完成（V1 DoD）
- [x] 接口稳定 → S10 全部 12 游戏可复用
- [x] 测试覆盖：32 个单测全通；packages/game 模块覆盖估算 ≥ 70%
- [ ] **demo 游戏 60fps 中端机**：未经真机 profiling；`detectDeviceProfile` 已分级，留待 E10 补 demo

---

## 修复清单（本轮）

1. `apps/worker/src/leaderboard-cron.ts` — 修复 ON CONFLICT 不生效导致行数膨胀的问题。
2. `apps/api/src/routes/games.ts` — 增加 `?range` 与 `weekly`/`monthly` 别名以匹配 spec。

两项修复均已通过：

- TypeScript 全量 typecheck（apps/api + apps/worker）
- Docker rebuild + restart（zhiyu-app-be + zhiyu-worker）
- curl smoke：`?range=weekly` 与 `?range=all` 均返回 200。

## 遗留与下个 epic 跟进

- 速率限制需要切到 Redis（多实例部署前必做）。
- `live aggregate` fallback 的 user pagination（>50 排行时）。
- 真机 60fps profiling demo 留 E10。
- BullMQ 启动时未清理旧 repeatable scheduler；如果改 `every` 需要手动清。
