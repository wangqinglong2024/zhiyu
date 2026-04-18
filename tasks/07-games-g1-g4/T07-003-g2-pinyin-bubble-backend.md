# T07-003: G2 拼音泡泡龙 — 后端题库与游戏逻辑

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10+

## 需求摘要

实现 G2 拼音泡泡龙的后端游戏逻辑：出题 API、泡泡阵列生成、拼音-汉字匹配校验、连锁消除判定（服务端验证）、垃圾泡泡机制（PK 模式）、服务端计分引擎。题库 100% 来自 L2 课程累计 600 字 + 80 个常用部首。支持单人生存/清屏、1v1 PK（垃圾泡泡互送）、多人对战（4 人竞速清屏）四种子模式。特殊泡泡（彩虹/炸弹/冰冻）的触发条件与效果由服务端控制。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/02-g2-pinyin-bubble.md` — G2 完整 PRD
  - §二 子模式规则（生存/清屏/PK/多人）
  - §四 核心交互（瞄准发射、匹配消除、连锁反应 cascade、未匹配吸附、特殊泡泡）
  - §五 难度递增（下降间隔、汉字难度、干扰比例）
  - §六 生命值系统（触底判定、死亡预警、最后机会 3 秒缓冲）
  - §七 PK 模式（垃圾泡泡 ⌈N/3⌉ 转化规则）
- 游戏设计: `game/02-pinyin-bubble.md` — G2 完整玩法设计
  - §二 核心玩法（声调颜色系统、特殊泡泡、连消规则）
  - §二.4 难度递进（下降速度、泡泡种类、特殊规则）
- 课程内容: `course/level-02.md` — L2 识字起步
  - 累计 600 字认读、400 字会写、80 个常用部首、1200 词词汇量、30 个成语入门
- 通用系统: `product/apps/05-game-common/` — 匹配、结算、段位规则
- 编码规范: `grules/05-coding-standards.md` §三 — 后端 Express 规范
- API 设计: `grules/04-api-design.md` — 统一响应格式
- 关联任务: T06-013 → 本任务 → T07-004（G2 前端）

## 技术方案

### 数据库设计

#### 1. G2 题库表

```sql
-- 拼音泡泡龙题库（从 L2 课程内容导入）
CREATE TABLE g2_question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hanzi VARCHAR(4) NOT NULL,
  pinyin VARCHAR(20) NOT NULL,
  tone INTEGER NOT NULL CHECK (tone BETWEEN 1 AND 5),
  meaning_en VARCHAR(100),
  radical VARCHAR(4),
  radical_name VARCHAR(20),           -- 部首名称（如 "木字旁"）
  stroke_count INTEGER,
  similar_hanzi TEXT[] DEFAULT '{}',
  homophone_hanzi TEXT[] DEFAULT '{}',
  same_radical_hanzi TEXT[] DEFAULT '{}',
  same_tone_hanzi TEXT[] DEFAULT '{}', -- 同声调字列表
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  frequency_rank INTEGER,
  is_polyphonic BOOLEAN DEFAULT false, -- 是否多音字
  polyphonic_readings JSONB,           -- 多音字读音列表 [{pinyin, meaning}]
  course_level INTEGER NOT NULL DEFAULT 2,
  course_module VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g2_qb_difficulty ON g2_question_bank(difficulty);
CREATE INDEX idx_g2_qb_tone ON g2_question_bank(tone);
CREATE INDEX idx_g2_qb_radical ON g2_question_bank(radical);
CREATE INDEX idx_g2_qb_frequency ON g2_question_bank(frequency_rank);

ALTER TABLE g2_question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g2_qb_read" ON g2_question_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g2_qb_admin" ON g2_question_bank FOR ALL TO service_role USING (true);
```

#### 2. 用户掌握度表（复用架构，G2 专用）

```sql
CREATE TABLE g2_user_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hanzi_id UUID NOT NULL REFERENCES g2_question_bank(id) ON DELETE CASCADE,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hanzi_id)
);

CREATE INDEX idx_g2_mastery_user ON g2_user_mastery(user_id);
ALTER TABLE g2_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g2_mastery_own" ON g2_user_mastery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 生成泡泡阵列（游戏会话创建时）

```
POST /api/v1/games/g2-pinyin-bubble/board
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "mode": "solo_survival" | "solo_clear" | "pk_1v1" | "multiplayer",
  "player_ids": ["uuid1", "uuid2?"],
  "difficulty_preset": "auto"
}

Response 201:
{
  "code": 0,
  "data": {
    "initial_board": {
      "rows": 6,
      "cols": 10,
      "layout": "hexagonal",       // 蜂巢排列
      "bubbles": [
        {
          "row": 0, "col": 0,
          "hanzi_id": "uuid", "hanzi": "猫", "pinyin": "māo", "tone": 1,
          "type": "normal"          // normal | obstacle | rainbow | bomb | frozen
        }
      ]
    },
    "shoot_sequence": [
      {
        "seq": 1,
        "pinyin": "māo", "tone": 1,
        "target_hanzi_ids": ["uuid1", "uuid2"],  // 阵列中可匹配的汉字
        "type": "normal"
      }
    ],
    "game_config": {
      "descent_interval_ms": 15000,     // 泡泡下降间隔
      "bubble_diameter": 64,
      "death_line_y": 920,              // 死亡线 Y 坐标
      "last_chance_seconds": 3,         // 最后机会缓冲时间
      "max_swaps": 3,                   // 交换次数
      "special_bubble_rules": {
        "rainbow_combo_threshold": 5,
        "bomb_combo_threshold": 10,
        "frozen_clear_screens": 2
      },
      "difficulty_curve": [
        { "time_sec": 0, "descent_interval_ms": 15000, "hanzi_pool": "top100" },
        { "time_sec": 60, "descent_interval_ms": 12000, "hanzi_pool": "top200" },
        { "time_sec": 120, "descent_interval_ms": 10000, "hanzi_pool": "top400" },
        { "time_sec": 180, "descent_interval_ms": 8000, "hanzi_pool": "all" },
        { "time_sec": 240, "descent_interval_ms": 6000, "hanzi_pool": "all_with_polyphonic" }
      ]
    }
  }
}
```

#### 2. 提交发射结果

```
POST /api/v1/games/g2-pinyin-bubble/sessions/:sessionId/shoot
Headers: Authorization: Bearer {token}
Body: {
  "shoot_seq": 1,
  "landing_position": { "row": 3, "col": 5 },
  "matched_bubble_ids": ["uuid1"],       // 客户端预判匹配（服务端二次验证）
  "cascade_bubble_ids": ["uuid2", "uuid3"],  // 连锁掉落泡泡
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "verified": true,                     // 服务端验证结果
    "match_correct": true,
    "score_delta": 50,
    "current_score": 350,
    "combo_count": 3,
    "cascade_count": 5,
    "cascade_score": 75,                  // 连锁掉落分数
    "garbage_sent": 2,                    // PK 模式：发送给对手的垃圾泡泡数
    "special_bubble_earned": null,        // 获得的特殊泡泡
    "board_state_hash": "sha256...",      // 棋盘状态哈希（客户端校验一致性）
    "server_timestamp": 1714000000040
  }
}
```

#### 3. PK 模式垃圾泡泡（WebSocket 事件）

```typescript
// 服务端 → 被攻击方
interface GarbageBubbleEvent {
  type: 'g2_garbage_incoming'
  session_id: string
  from_player_id: string
  garbage_count: number               // 垃圾泡泡数量 = ⌈消除数/3⌉
  garbage_positions: { row: number; col: number }[]  // 服务端计算好的落入位置
  timestamp: number
}

// 服务端 → 所有客户端
interface G2BoardSyncEvent {
  type: 'g2_board_sync'
  session_id: string
  player_states: Record<string, {
    score: number
    remaining_bubbles: number
    screens_cleared: number           // 多人模式：清屏数
    is_game_over: boolean
  }>
  timestamp: number
}
```

### 服务端核心逻辑

#### 泡泡阵列生成器

```typescript
// backend/src/services/games/g2/board-generator.ts

class G2BoardGenerator {
  /**
   * 生成蜂巢排列泡泡阵列
   * - 奇数行 10 个泡泡，偶数行 9 个（交错排列）
   * - 保证每个拼音泡泡在阵列中有对应汉字
   * - 同声调泡泡按颜色分组
   * - 初始阵列保证至少有 3 组可直接匹配消除
   */
  generateBoard(config: BoardConfig): BubbleBoard

  /**
   * 生成发射泡泡序列
   * - 拼音泡泡与阵列中汉字一一对应
   * - 穿插特殊泡泡（达到 Combo 阈值时）
   * - 自适应：用户经常匹配错误的拼音更多出现
   */
  generateShootSequence(board: BubbleBoard, userMastery: MasteryData): ShootItem[]

  /**
   * 清屏模式：每清完一屏生成新阵列
   * - 每新屏行数 +1（最多 12 行）
   * - 第 5 屏开始出现石头障碍泡泡
   */
  generateNextScreen(screenNumber: number): BubbleBoard
}
```

#### 匹配与连锁验证引擎

```typescript
// backend/src/services/games/g2/match-engine.ts

class G2MatchEngine {
  /**
   * 验证拼音-汉字匹配
   * - 射出泡泡吸附后检查六方向相邻泡泡
   * - 拼音（含声调）与汉字正确读音完全一致 → 匹配成功
   */
  verifyMatch(shootBubble: ShootBubble, adjacentBubbles: Bubble[]): MatchResult

  /**
   * 连锁反应（Cascade）计算
   * - 消除匹配泡泡后，从顶部做连通性检测（flood fill）
   * - 所有无法通向顶部的泡泡标记为悬空 → 掉落消除
   * - 返回分层掉落数据（按距离分层，前端每层间隔 80ms）
   */
  calculateCascade(board: BubbleBoard, removedPositions: Position[]): CascadeResult

  /**
   * 垃圾泡泡计算（PK 模式）
   * - 消除 N 个泡泡 → 向对手发送 ⌈N/3⌉ 个垃圾泡泡
   * - 垃圾泡泡从顶部落入，无文字、灰色，只能通过相邻消除清理
   */
  calculateGarbage(eliminatedCount: number): number

  /**
   * 特殊泡泡效果计算
   * - 彩虹泡泡：消除所有同声调泡泡
   * - 炸弹泡泡：消除半径 2 格内所有泡泡
   * - 冰冻泡泡：冻结下降 30 秒（生存）/ 冻结对方 15 秒（PK）
   */
  applySpecialBubble(type: SpecialType, position: Position, board: BubbleBoard): SpecialResult
}
```

#### 计分引擎

```typescript
// backend/src/services/games/g2/scoring-engine.ts

class G2ScoringEngine {
  private readonly MATCH_SCORE = 20        // 单个匹配消除
  private readonly CASCADE_SCORE = 15      // 连锁掉落每个泡泡
  private readonly COMBO_MULTIPLIERS = { 3: 1.5, 5: 2, 10: 3 }

  calculateShootScore(params: {
    matchCount: number
    cascadeCount: number
    currentCombo: number
    specialBubbleUsed: boolean
  }): { totalScore: number; comboMultiplier: number; newCombo: number }
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g2/anti-cheat.ts

class G2AntiCheat {
  /** 棋盘状态一致性校验：比对服务端棋盘哈希与客户端上报 */
  validateBoardState(serverHash: string, clientHash: string): boolean

  /** 发射频率校验：两次发射间隔 < 200ms 标记可疑 */
  validateShootFrequency(lastShootTs: number, currentTs: number): boolean

  /** 连锁合法性校验：客户端上报的连锁泡泡是否确实无连通路径 */
  validateCascade(board: BubbleBoard, claimedCascade: Position[]): boolean
}
```

## 范围（做什么）

- 创建 G2 题库表 + 用户掌握度表（Migration）
- 从 L2 课程内容导入 600 字 + 80 个部首数据（Seed）
- 实现泡泡阵列生成器（蜂巢排列、声调分组、可匹配保证）
- 实现发射泡泡序列生成（自适应权重、特殊泡泡触发）
- 实现匹配验证引擎（拼音-汉字匹配、六方向相邻检测）
- 实现连锁反应（Cascade）计算（flood fill 连通性、分层掉落数据）
- 实现垃圾泡泡转化机制（PK 模式 ⌈N/3⌉ 规则）
- 实现特殊泡泡效果（彩虹/炸弹/冰冻）
- 实现计分引擎（匹配分 + 连锁分 + Combo 倍率）
- 实现清屏模式下一屏生成逻辑
- 实现防作弊模块（棋盘哈希、频率校验、连锁合法性）
- 实现出题 API + 发射提交 API
- 与 T06-006 结算 API 对接

## 边界（不做什么）

- 不写 Phaser 前端游戏场景（T07-004）
- 不写匹配系统（T06-005）
- 不写结算/段位逻辑（T06-006）
- 不写皮肤系统（T06-008）

## 涉及文件

- 新建: `backend/src/services/games/g2/board-generator.ts`
- 新建: `backend/src/services/games/g2/match-engine.ts`
- 新建: `backend/src/services/games/g2/scoring-engine.ts`
- 新建: `backend/src/services/games/g2/anti-cheat.ts`
- 新建: `backend/src/services/games/g2/types.ts`
- 新建: `backend/src/routers/v1/games/g2-pinyin-bubble.ts`
- 新建: `backend/src/repositories/g2-question-bank.repo.ts`
- 新建: `backend/src/repositories/g2-user-mastery.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g2_pinyin_bubble.sql`
- 新建: `scripts/seed-g2-questions.sql`
- 修改: `backend/src/routers/v1/index.ts` — 注册 G2 路由

## 依赖

- 前置: T06-013（游戏通用系统集成验证完成）
- 前置: T06-005（匹配系统 — WebSocket 基础）
- 前置: T06-006（会话/结算 API）
- 后续: T07-004（G2 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** G2 题库已导入  
   **WHEN** 调用阵列生成 API（生存模式，6 行 × 10 列）  
   **THEN** 返回蜂巢排列泡泡阵列，奇数行 10 个、偶数行 9 个，每个泡泡含汉字 + 拼音 + 声调

2. **GIVEN** 泡泡阵列已生成  
   **WHEN** 检查发射序列  
   **THEN** 每个拼音泡泡在阵列中至少有 1 个对应汉字可匹配

3. **GIVEN** 发射拼音泡泡 "māo" 吸附到"猫"字泡泡旁  
   **WHEN** 提交发射结果  
   **THEN** `match_correct: true`，`score_delta ≥ 20`

4. **GIVEN** 消除后有 5 个泡泡失去与顶部连接  
   **WHEN** 服务端计算连锁  
   **THEN** 返回 5 个悬空泡泡的分层掉落数据，`cascade_score = 75`（15 × 5）

5. **GIVEN** PK 模式，我方消除了 9 个泡泡  
   **WHEN** 计算垃圾泡泡  
   **THEN** 向对手发送 3 个垃圾泡泡（⌈9/3⌉ = 3）

6. **GIVEN** 连续正确匹配 5 次，获得彩虹泡泡  
   **WHEN** 彩虹泡泡命中一个二声（绿色）泡泡  
   **THEN** 消除阵列中所有二声泡泡

7. **GIVEN** 清屏模式，已清完 4 屏  
   **WHEN** 请求第 5 屏阵列  
   **THEN** 返回 8 行阵列，包含 2 个石头障碍泡泡

8. **GIVEN** 防作弊开启  
   **WHEN** 客户端上报的连锁泡泡实际仍有连通路径  
   **THEN** 验证失败，该次消除不计分

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration + Seed G2 数据
5. 验证阵列生成 API：返回正确的蜂巢布局
6. 模拟发射-匹配-连锁流程
7. 验证 PK 模式垃圾泡泡 WebSocket 事件
8. 验证特殊泡泡效果
9. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] API 端点返回正确数据
- [ ] 600 字 + 80 部首题库完整导入
- [ ] 蜂巢排列生成正确（奇/偶行数量交替）
- [ ] 匹配验证引擎六方向检测正确
- [ ] 连锁反应 flood fill 算法正确
- [ ] 垃圾泡泡 ⌈N/3⌉ 计算正确
- [ ] 特殊泡泡效果全部验证
- [ ] 防作弊棋盘哈希校验通过
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/07-games-g1-g4/` 下创建同名结果文件

结果文件路径: `/tasks/result/07-games-g1-g4/T07-003-g2-pinyin-bubble-backend.md`

## 自检重点

- [ ] 安全: 匹配判定在服务端完成，客户端不可伪造消除结果
- [ ] 安全: 棋盘状态哈希校验防止客户端篡改
- [ ] 安全: RLS 策略正确
- [ ] 性能: 蜂巢阵列生成 < 100ms
- [ ] 性能: 连锁 cascade 计算（最坏情况 100 泡泡）< 50ms
- [ ] 算法: flood fill 连通性检测正确无遗漏
- [ ] 数据: 发射序列与阵列汉字严格对应，无死局
- [ ] 并发: PK 模式垃圾泡泡双向发送无竞态
