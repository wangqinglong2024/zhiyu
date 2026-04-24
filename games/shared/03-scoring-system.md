# shared · 评分 / 连击 / 星级 / SRS 回传

---

## 1. 通用评分公式

```
score(item) = base(unitType) × difficultyMul × comboMul × speedBonus − penalty
```

| 项 | 取值 |
|---|---|
| `base(char)` | 10 |
| `base(word)` | 15 |
| `base(phrase)` | 20 |
| `base(short_sentence)` | 30 |
| `base(mid_sentence)` | 45 |
| `base(long_sentence)` | 60 |
| `base(complex_sentence)` | 80 |
| `difficultyMul` | easy 0.8 / normal 1.0 / hard 1.5 |
| `comboMul` | 1 + 0.1 × min(combo, 20) |
| `speedBonus` | 反应时 < 1s × 1.3，< 2s × 1.1，否则 ×1.0 |
| `penalty` | 错答 = base × 0.5；漏答 = base × 0.3 |

---

## 2. 连击规则

- 连续答对 +1 combo；答错或漏答归零。
- combo ≥ 5 触发"火焰特效"；≥ 10 触发"屏幕震动+慢动作 0.3s"；≥ 20 触发"暴击模式"，下一题分数 ×2。

---

## 3. 局末星级

按"准确率 + combo 长度"双轴：

| 星 | 条件 |
|:--:|---|
| ⭐ | 准确率 ≥ 50% |
| ⭐⭐ | 准确率 ≥ 75% 或 最长 combo ≥ 8 |
| ⭐⭐⭐ | 准确率 ≥ 90% 且 最长 combo ≥ 15 |

3 星首次达成 → 解锁该游戏新皮肤 / 新粒子色板（见 [04-visual-effects.md](./04-visual-effects.md)）。

---

## 4. SRS 回传

每题结算后写入：

```ts
interface SrsLog {
  userId: string;
  itemId: string;          // GameItem.id
  game: string;            // 'hanzi-ninja' …
  result: 'correct' | 'wrong' | 'miss';
  reactionMs: number;
  timestamp: number;
  difficulty: 'easy'|'normal'|'hard';
}
```

- 写入端：游戏内 `roundEnd` 钩子批量上传。
- 服务端：错过的 itemId 进入下一次复习池，权重 ×3（按难度再乘 1.0/1.2/1.5）。

---

## 5. 排行榜与社交

| 维度 | 范围 | 周期 |
|---|---|---|
| 单局最高分 | 全球 / 国家 / 好友 | 周榜 |
| 准确率 | 全球 / 国家 / 好友 | 周榜 |
| 连击王 | 全球 / 国家 / 好友 | 月榜 |

排行榜仅展示登录用户，匿名用户成绩本地保存。
