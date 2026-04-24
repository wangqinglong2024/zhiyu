# shared · 回合制循环与状态机

> 12 款游戏统一遵守此状态机；玩法差异只在 `Round.tick()` 内部实现。

---

## 1. 顶层状态机

```
        ┌──────────────┐
   ────►│   Lobby      │  ← 启动 / 局间默认状态
        └──────┬───────┘
               │ openSettings
               ▼
        ┌──────────────┐
        │   Settings   │  统一设置面板
        └──────┬───────┘
               │ start
               ▼
        ┌──────────────┐
        │  Preload     │  调 ContentAdapter 拉内容 + 预下载音频
        └──────┬───────┘
               │ ready
               ▼
        ┌──────────────┐  pause/resume
        │  Round       │◄────────────┐
        │  (gameplay)  │             │
        └──────┬───────┘             │
               │ all items done OR timeUp
               ▼                     │
        ┌──────────────┐             │
        │  Settle      │  星级结算 + SRS 回传 + 排行榜
        └──────┬───────┘             │
               │ playAgain ──────────┘
               │ exit
               ▼
            Lobby
```

---

## 2. Round 内部循环（每款游戏自定义）

```ts
interface RoundConfig {
  items: GameItem[];      // ContentAdapter 输出
  distractors: GameItem[];
  durationMs?: number;    // 可选：限时模式
  perItemMs?: number;     // 可选：单题限时
}

abstract class GameRound {
  state: 'running'|'paused'|'over';
  index = 0;
  combo = 0;
  score = 0;
  log: SrsLog[] = [];

  abstract tick(dt: number): void;          // 60fps 帧循环
  abstract onInput(e: InputEvent): void;    // 触摸/键鼠
  abstract render(ctx: CanvasRenderingContext2D): void;

  submit(item: GameItem, ok: boolean, ms: number) {
    this.combo = ok ? this.combo + 1 : 0;
    this.score += scoring.calc(item, ok, this.combo, ms);
    this.log.push({ ...buildLog(item, ok, ms) });
    if (++this.index >= this.config.items.length) this.end();
  }
}
```

---

## 3. 通用钩子

| 钩子 | 触发时机 | 默认行为 |
|---|---|---|
| `onRoundStart` | Preload → Round | 播放 1.0s 倒计时 3-2-1-GO |
| `onCorrect` | submit ok=true | 触发 L1+ 特效 |
| `onWrong` | submit ok=false | 触发 ❌ 大叉 + 扣分 |
| `onCombo(n)` | combo 升到 5/10/20 | 升级特效 |
| `onPause` | 玩家点暂停 / app 失焦 | 停所有 RAF + 音频 |
| `onRoundEnd` | 所有题答完 / 时间到 | 进 Settle |
| `onSettle` | 进入结算页 | SRS 上传 + 写排行榜 |

---

## 4. 暂停 / 恢复

- 任何时候按"暂停"或 app 切到后台 → 立即冻结时间、暂停音频。
- 恢复时显示 1.0s 倒计时再继续。
- 连续暂停 ≥ 30 分钟自动放弃本局，分数不计入。

---

## 5. 异常恢复

| 场景 | 处理 |
|---|---|
| 网络断开 | Round 内全部本地运行，Settle 时若网络仍断，缓存日志，下次启动重传 |
| App Crash | 重启回 Lobby，弹"上次未完成游戏"的恢复入口（仅 SRS 已记录的题保留） |
| 内容包损坏 | 回 Lobby 提示重选阶段 |
