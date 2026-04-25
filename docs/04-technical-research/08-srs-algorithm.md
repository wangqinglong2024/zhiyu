# 4.8 · SRS 算法（FSRS-5）· 温故知新

## 一、为什么选 FSRS-5

### 1.1 SRS 算法演进
- SM-2（Anki 默认）：1985 年算法，简单但保留率有限
- HLR、ML-based：复杂但难落地
- **FSRS-5**：2024 最新版，开源、有理论基础、效果优于 SM-2 30%+

### 1.2 FSRS 优势
- 三状态变量：稳定性 (Stability) / 难度 (Difficulty) / 可提取性 (Retrievability)
- 显式建模"遗忘曲线"
- 可针对每个用户自适应优化（虽 v1 用默认参数）

## 二、用户原始诉求映射

> 用户原话：
> "我今天学了 10 个知识点，这 10 点分别在什么时间再次考核。"
> "每个知识点、每小节、每章学完都分别考。但是这一次行就结束了，为了巩固记忆，必须反复考。"

### 2.1 三个层次的考核

| 层次 | 时机 | 内容 | 与 SRS 关系 |
|---|---|---|---|
| 节小测 | 学完 1 节 | 12 题（对应 12 知识点） | 错题入 SRS |
| 章测 | 学完 1 章 | 36 题（覆盖 12 节） | 错题入 SRS |
| 阶段考 | 学完 1 阶段 | 80-150 题 | 错题入 SRS + 重要题入 |
| 温故知新 | 每天首页 | 由 FSRS 调度 | **核心** |

### 2.2 当下与未来的桥接
- 当下："学完一次行就结束"
- 加上 SRS：所有学过的知识点都在"温故知新"队列中
- 用户每天可选"今日复习" → 看到几条到期的卡片

## 三、FSRS-5 算法核心

### 3.1 三个变量

- **Difficulty (D)**：知识点对该用户的难度，初始 5（范围 1-10）
- **Stability (S)**：当前记忆稳定性（天），决定下次复习间隔
- **Retrievability (R)**：当前回忆概率，由时间和 S 决定

```
R = e^(ln(0.9) × t / S)
```

- t = 距离上次复习的天数
- 0.9 = 期望保留率（90%）

### 3.2 核心公式（简化）

```
更新 D：
  D_new = D_old + a × (rating - 3)
  其中 rating ∈ {1=Again, 2=Hard, 3=Good, 4=Easy}
  
更新 S（不同状态使用不同公式）：
  - new state: S = w[0..3][rating-1]
  - learning state: 同上
  - review state（pass）: S × (e^(w[8] × (11-D))) × ...
  - review state（fail/Again）: S = w[12] × ...
  
计算下一次到期：
  next_due = now + S × ln(0.9) / ln(目标 R)
  目标 R = 0.9（默认）
```

### 3.3 默认权重 w（FSRS-5 官方）

```
w = [0.2172, 1.1771, 3.2602, 16.1507, 7.0114, 0.57, 2.0966,
     0.0069, 1.5261, 0.112, 1.0178, 1.849, 0.1133, 0.3127, 2.2934, 0.2191, 3.0004, 0.7536, 0.3332]
```

v1 直接采用，v1.5 引入个性化调参。

## 四、TypeScript 实现

### 4.1 库选择
- **首选**：开源 `ts-fsrs` (npm package)
- 维护活跃 + TypeScript 原生 + 配合 FSRS-5

### 4.2 调度示例

```typescript
import { FSRS, generatorParameters, Rating } from 'ts-fsrs';

const params = generatorParameters({ enable_fuzz: true });
const fsrs = new FSRS(params);

// 复习卡片
const card = await db.user_srs_queue.findOne({
  user_id, kpoint_id,
});

// 用户答题后获得 rating（Again/Hard/Good/Easy）
const result = fsrs.next(card, new Date(), Rating.Good);

// 更新 DB
await db.user_srs_queue.update(card.id, {
  difficulty: result.card.difficulty,
  stability: result.card.stability,
  state: result.card.state,
  due: result.card.due,
  last_review: new Date(),
  reps: card.reps + 1,
  lapses: rating === Rating.Again ? card.lapses + 1 : card.lapses,
});

// 写入 review_logs（用于将来个性化调参）
await db.user_srs_logs.insert({
  user_id, kpoint_id, rating, ...
});
```

## 五、与产品体验融合

### 5.1 用户初次学完一节
- 节小测（12 题）
- 错题：对应知识点 → 创建 user_srs_queue 记录，state=learning，初始 due=now+1d
- 全对题：对应知识点 → 创建记录，state=review，due=now+3d

### 5.2 温故知新（首页入口）
- 显示"今日待复习 X 题"
- 点击 → 拉取 due ≤ now 的卡片，最多 20 张
- 每张卡用 1 道题（题型从 10 类轮换，避免单调）
- 用户答题 → 评分（系统自动按对错 + 反应速度评 Again/Hard/Good/Easy）
- 答完一张 → 调度下次

### 5.3 显式 vs 隐式评分
- v1：用户只看到对错（不要求自评）
- 系统自评：
  - 答对 + 反应快 → Good
  - 答对 + 反应慢 → Hard
  - 答错 → Again
- v1.5 引入显式：让用户答完后选 "简单 / 一般 / 难"

### 5.4 Daily 配额
- 默认每天 20 张（避免压力）
- 用户可在设置改 5 / 10 / 20 / 30 / 50
- Streak 解锁：连续 7 天达标 → 解锁皮肤

## 六、与考核题型的关系

### 6.1 题型轮换（10 类 + 3 类拼音入门）
- Q1: 选词义（中→母语）
- Q2: 选词义（母语→中）
- Q3: 听音选字
- Q4: 看字选音
- Q5: 选拼音
- Q6: 排序句子
- Q7: 填空
- Q8: 翻译选择
- Q9: 短句听写选择
- Q10: 综合问答
- P1-P3：拼音入门专用（声母 / 韵母 / 声调）

### 6.2 SRS 复习时随机选 3 类不同题型
- 防止用户"只记答案不记知识点"
- 多模态强化记忆

## 七、性能与扩展性

### 7.1 查询模式
- 高频："给我下一道复习题"
  - SQL: `SELECT ... WHERE user_id=? AND due<=now() ORDER BY due ASC LIMIT 1`
  - 索引：(user_id, due)
- 高频："今日复习数量"
  - SQL: `SELECT COUNT(*) WHERE user_id=? AND due<=now()`
  - 缓存：Redis 5 分钟

### 7.2 数据量估算
- 100 万用户 × 平均 500 知识点学过 = 5 亿条 SRS 记录
- 分区策略：按 user_id hash 分区（v2 评估）

### 7.3 性能 SLA
- "下一道复习题" P95 < 200ms
- "今日复习数量" P95 < 100ms

## 八、监控

### 8.1 算法效果
- 用户保留率（实际答对率 vs 期望 90%）
- 卡片到期分布（避免 burst）
- 用户日复习完成率

### 8.2 告警
- 单用户 SRS 队列 > 1000 张未复习 → 提醒精简
- 算法保留率 < 80% → 触发参数调整评审

## 九、用户教育

### 9.1 首次进入温故知新
- 弹引导：3 步说明"为什么要复习"
- 演示：1 道示例题

### 9.2 Streak / 激励
- 7 天连续完成温故知新 → 100 知语币
- 30 天 → 限定皮肤
- 100 天 → 1 个月会员

## 十、与原有"考试体系"的关系

- 节小测 / 章测 / 阶段考 = 一次性"刚学完时检验"
- 温故知新 / SRS = 持续性"长期记忆巩固"
- 二者不互斥，叠加使用

## 十一、风险与缓解

| 风险 | 缓解 |
|---|---|
| 用户 SRS 队列暴雷（积累过多） | 设置 daily 配额上限 + 智能裁剪老到期 |
| 算法效果不及预期 | 监控保留率 + 季度参数复盘 |
| 性能瓶颈（5 亿数据） | 分区 + 物化视图 + 缓存 |
| 用户感知"枯燥" | 题型轮换 + 游戏化 + 分享激励 |
| ts-fsrs 维护风险 | 自建 fallback 实现（FSRS-5 算法本身开源） |

进入 [`09-game-tech-mobile.md`](./09-game-tech-mobile.md)。
