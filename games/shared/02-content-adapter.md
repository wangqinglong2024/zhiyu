# shared · 内容适配器（题库 → 游戏单元）

> 12 款游戏共用此适配器。**禁止**游戏内自造内容、禁止硬编码字符。

---

## 1. 输入

```ts
interface FetchParams {
  track: 'ec' | 'factory' | 'hsk' | 'daily';
  stage: 1..12;
  unitTypes?: UnitType[];      // 缺省=该阶段全部可用
  size: number;                // = roundSize × 1.5（多取 50% 用于干扰项）
  excludeIds?: string[];       // 本局已用过的，避免重复
  prioritizeSrs?: boolean;     // true=优先抽错过题
}
```

数据源：`/course/shared/05-question-bank.md` §6 定义的 CSV/JSONL，字段：
`id, track, stage, chapter, lesson, kpoint, unit_type, chinese, pinyin, vi, th, key_point`

---

## 2. 输出（GameItem 通用结构）

```ts
interface GameItem {
  id: string;                  // 知识点 id，用于回传 SRS
  chinese: string;             // "老板" / "你好" / "请问厕所在哪里？"
  pinyin: string;              // "lǎobǎn"
  pinyinNoTone: string;        // "laoban"  (供声调题用)
  toneSeq: number[];           // [3, 3]    (1-4, 5=轻声)
  translation: string;         // 按用户母语自动选 vi/th/en
  unitType: UnitType;
  audioUrl: string;            // TTS URL
  radicals?: string[];         // 仅 char 类型有
  charCount: number;
  meta: { chapter, lesson, kpoint, keyPoint };
}
```

---

## 3. 干扰项生成

复用 [`/course/shared/05-question-bank.md`](../../course/shared/05-question-bank.md) §3 规则：

| 题型 | 干扰项策略 |
|---|---|
| Q1 / Q3 / Q5 / Q6 | 同章其他节、同 unit_type 池随机 N |
| Q2 / Q9 | 该字易错音 / 易错调表 |
| Q4 | 同声母不同调 / 同韵母不同声母 / 替换 1 个调 |
| Q7 | 同词性近义词 |
| Q8 | 原句分词打乱 |
| Q10 | 字形相近部首（氵/冫/丬 …） |

---

## 4. 游戏 ↔ 题型 映射

| 游戏 | 题型基底 | 适配做法 |
|---|---|---|
| 01 汉字忍者 | Q3 / Q5 / Q6 / Q10 | 飞出 1 正 + N 干扰，"切对的" |
| 02 拼音射击 | Q3 / Q4 | 飞船持"拼音弹"打"汉字怪" |
| 03 声调泡泡 | Q4 / Q9 | 4 色泡泡 = 4 声调，匹配汉字色 |
| 04 汉字俄罗斯方块 | Q10 | 方块=偏旁，目标字提示在右侧 |
| 05 打字地鼠 | Q1 / Q5 / Q6 | 题面顶端，地鼠头顶汉字 |
| 06 汉字消消乐 | Q9 / Q10 / Q5 | 三连消同声调 / 同部首 / 同义 |
| 07 贪吃字蛇 | Q7 / Q8 | 按词序吃出完整短句 |
| 08 节奏汉字 | Q1 / Q2 | 拼音从天而降，听音点对应 |
| 09 跑酷拾字 | Q7 / Q8 | 路上字捡对组成句 |
| 10 拼音塔防 | Q4 / Q9 | 怪物头顶汉字，输入拼音击毙 |
| 11 翻牌记忆 | Q3-Q6 / Q10 | 配对汉字 ↔ 拼音/翻译/部首 |
| 12 汉字弹弓 | Q5 / Q6 | 弹"正确字"砸"错误字塔" |

---

## 5. 内容池构造算法

```
1. 按 (track, stage) 取候选集 C
2. 若 prioritizeSrs：从 SRS 待复习池抽 30%，C 抽 70%
3. 过滤 excludeIds、过滤 unit_type 不在 game 支持范围
4. shuffle 取 size 条 → 主集 M
5. 对每条 m 生成对应题型的干扰项 distractors[m]
6. 输出 { items: M, distractors }
```

---

## 6. 缓存与离线

- 主流程进入游戏时一次性预取 1 局所需的全部 `GameItem`（含 audioUrl 预下载）。
- 弱网下允许使用上次缓存内容池开局，但状态栏标灰提示"离线模式"。
