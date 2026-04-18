# T07-005: G3 词语消消乐 — 后端题库与游戏逻辑

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10+

## 需求摘要

实现 G3 词语消消乐的后端游戏逻辑：语义配对关系库（近义词/反义词/搭配词）、7×7 棋盘生成（保证至少 3 组可消除配对）、语义匹配验证引擎（服务端裁决）、连锁消除（Cascade）层级计算、特殊方块生成条件与效果（炸弹/彩虹/横扫）、计分引擎（含连锁倍率）、PK 同棋盘机制。题库 100% 来自 L3 课程累计 2200 词汇 + 200+ 近义词对 + 150+ 反义词对 + 300+ 搭配词组。支持单人无尽/限步、1v1 PK（同棋盘比分）、多人对战（4 人同棋盘竞速）四种子模式。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/03-g3-word-match.md` — G3 完整 PRD
  - §四.1 语义匹配规则（近义词/反义词/搭配词三类配对）
  - §四.4 特殊方块系统（炸弹 4 消、彩虹 5 消、横扫 L 型消）
  - §四.5 连锁消除 Cascade（分层间隔 300ms、倍率递增）
  - §五 难度递增（石头方块、底部上推）
  - §七 PK 模式（同棋盘机制、分数同步）
- 游戏设计: `game/03-word-match.md` — G3 完整玩法设计
  - §二 核心玩法（8×8 棋盘、语义配对 2 消、特殊方块）
  - §二.3 词语分类显示（颜色标记词性：名词🔵、动词🟢、形容词🟠、副词🔴）
  - §七 技术要点（配对数据 JSON 格式、MatchDetector、CascadeEngine）
- 课程内容: `course/level-03.md` — L3 段落理解
  - 累计 2200 词汇、600 字会写、150 个成语、近反义词辨析
- 通用系统: `product/apps/05-game-common/` — 匹配、结算、段位规则
- 编码规范: `grules/05-coding-standards.md` §三 — 后端 Express 规范
- API 设计: `grules/04-api-design.md` — 统一响应格式
- 关联任务: T06-013 → 本任务 → T07-006（G3 前端）

## 技术方案

### 数据库设计

#### 1. G3 语义配对关系库

```sql
-- 语义配对关系表（核心：近义词/反义词/搭配词三类关系）
CREATE TABLE g3_semantic_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_a VARCHAR(20) NOT NULL,
  word_a_pinyin VARCHAR(40),
  word_b VARCHAR(20) NOT NULL,
  word_b_pinyin VARCHAR(40),
  pair_type VARCHAR(20) NOT NULL CHECK (pair_type IN ('synonym', 'antonym', 'collocation')),
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  word_a_pos VARCHAR(10),              -- 词性: noun / verb / adj / adv / other
  word_b_pos VARCHAR(10),
  example_sentence TEXT,               -- 例句
  meaning_a_en VARCHAR(100),
  meaning_b_en VARCHAR(100),
  frequency_rank INTEGER,
  course_level INTEGER NOT NULL DEFAULT 3,
  course_module VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g3_sp_type ON g3_semantic_pairs(pair_type);
CREATE INDEX idx_g3_sp_difficulty ON g3_semantic_pairs(difficulty);
CREATE INDEX idx_g3_sp_word_a ON g3_semantic_pairs(word_a);
CREATE INDEX idx_g3_sp_word_b ON g3_semantic_pairs(word_b);

ALTER TABLE g3_semantic_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g3_sp_read" ON g3_semantic_pairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "g3_sp_admin" ON g3_semantic_pairs FOR ALL TO service_role USING (true);
```

#### 2. G3 词库表

```sql
-- 词语表（供棋盘填充用，含词性和匹配类型标记）
CREATE TABLE g3_word_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(20) NOT NULL,
  pinyin VARCHAR(40),
  pos VARCHAR(10) NOT NULL,            -- noun / verb / adj / adv / other
  meaning_en VARCHAR(100),
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  pair_ids UUID[] DEFAULT '{}',        -- 所有关联的配对 ID
  pair_count INTEGER NOT NULL DEFAULT 0,
  is_idiom BOOLEAN DEFAULT false,      -- 是否成语（四字词占 1 格）
  course_level INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g3_wb_difficulty ON g3_word_bank(difficulty);
CREATE INDEX idx_g3_wb_pos ON g3_word_bank(pos);

ALTER TABLE g3_word_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g3_wb_read" ON g3_word_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g3_wb_admin" ON g3_word_bank FOR ALL TO service_role USING (true);
```

#### 3. 用户掌握度表

```sql
CREATE TABLE g3_user_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES g3_semantic_pairs(id) ON DELETE CASCADE,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pair_id)
);

CREATE INDEX idx_g3_mastery_user ON g3_user_mastery(user_id);
ALTER TABLE g3_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g3_mastery_own" ON g3_user_mastery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 生成棋盘

```
POST /api/v1/games/g3-word-match/board
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "mode": "solo_endless" | "solo_limited" | "pk_1v1" | "multiplayer",
  "player_ids": ["uuid1", "uuid2?", ...],
  "difficulty_preset": "auto"
}

Response 201:
{
  "code": 0,
  "data": {
    "board": {
      "rows": 7,
      "cols": 7,
      "cells": [
        {
          "row": 0, "col": 0,
          "word_id": "uuid",
          "word": "美丽",
          "pinyin": "měilì",
          "pos": "adj",
          "pair_type_hint": "synonym",
          "type": "normal"               // normal | obstacle | bomb | rainbow | sweep
        }
      ]
    },
    "pair_lookup": {
      "word_id_1": ["word_id_2", "word_id_3"],
      "word_id_2": ["word_id_1"]
    },
    "game_config": {
      "max_steps": null,                  // 无尽模式 null，限步模式 30
      "time_limit_sec": null,             // PK 模式 90，其他 null
      "shuffle_count": 3,                 // 无尽模式 3 次免费洗牌
      "hint_count": 3,
      "difficulty_curve": [
        { "eliminate_count": 0, "pool": "top500", "obstacle_count": 0 },
        { "eliminate_count": 30, "pool": "top1000", "obstacle_count": 0 },
        { "eliminate_count": 60, "pool": "top1500", "obstacle_count": 3 },
        { "eliminate_count": 100, "pool": "top2000_with_idiom", "obstacle_count": 5 },
        { "eliminate_count": 150, "pool": "all", "obstacle_count": 6, "push_interval_sec": 30 }
      ]
    }
  }
}
```

#### 2. 提交交换操作

```
POST /api/v1/games/g3-word-match/sessions/:sessionId/swap
Headers: Authorization: Bearer {token}
Body: {
  "step": 5,
  "pos_a": { "row": 2, "col": 3 },
  "pos_b": { "row": 2, "col": 4 },
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "valid": true,                         // 是否构成有效配对
    "matches": [
      {
        "pair_type": "synonym",
        "positions": [{ "row": 2, "col": 3 }, { "row": 2, "col": 4 }],
        "words": ["美丽", "漂亮"],
        "score": 30
      }
    ],
    "special_block_generated": {
      "type": "bomb",                      // 4 消产生炸弹
      "position": { "row": 2, "col": 3 }
    },
    "cascade_layers": [
      {
        "layer": 1,
        "matches": [
          { "pair_type": "antonym", "positions": [...], "words": ["大", "小"], "score": 45 }
        ]
      },
      {
        "layer": 2,
        "matches": [...]
      }
    ],
    "fill_data": [
      { "col": 3, "new_words": [{ "word_id": "uuid", "word": "快乐", ... }] }
    ],
    "total_score_delta": 120,
    "current_score": 850,
    "combo_count": 4,
    "remaining_steps": 25,                 // 限步模式
    "board_state_hash": "sha256...",
    "server_timestamp": 1714000000050
  }
}
```

#### 3. 洗牌 / 提示

```
POST /api/v1/games/g3-word-match/sessions/:sessionId/shuffle
→ 返回重排后的完整棋盘，保证至少 1 组可消除

POST /api/v1/games/g3-word-match/sessions/:sessionId/hint
→ 返回一组可消除配对的位置（供客户端高亮）
```

#### 4. PK 模式分数同步（WebSocket）

```typescript
// 服务端 → 所有客户端
interface G3ScoreSyncEvent {
  type: 'g3_score_sync'
  session_id: string
  player_scores: Record<string, {
    score: number
    eliminate_count: number
    combo: number
    last_match_type: 'synonym' | 'antonym' | 'collocation'
    special_triggered: string | null       // 'bomb' | 'rainbow' | 'sweep' | null
  }>
  timestamp: number
}
```

### 服务端核心逻辑

#### 棋盘生成器

```typescript
// backend/src/services/games/g3/board-generator.ts

class G3BoardGenerator {
  /**
   * 生成 7×7 语义配对棋盘
   * - 从 pair_lookup 中选取当前难度的配对
   * - 保证至少 3 组可消除配对（相邻放置）
   * - 三种匹配类型均匀分布
   * - 无尽模式动态提升难度（石头方块、成语）
   */
  generateBoard(config: BoardConfig, userMastery: MasteryData): WordBoard

  /**
   * 填充新词（消除后空位补入）
   * - 从当前难度词池随机选取
   * - 优先选取与周围词有配对关系的词（增加连锁可能）
   * - 补入后全棋盘扫描是否产生自动配对（用于 cascade 计算）
   */
  fillEmptyCells(board: WordBoard, emptyPositions: Position[]): FillResult

  /**
   * 洗牌（保证可解）
   * - 重排所有非石头方块位置
   * - 洗牌后保证至少 1 组可消除配对
   */
  shuffleBoard(board: WordBoard): WordBoard

  /**
   * 石头方块注入（无尽模式 60 消除后）
   * - 石头方块不可移动、不可消除
   * - 不占据配对位置
   */
  injectObstacles(board: WordBoard, count: number): WordBoard
}
```

#### 语义匹配验证引擎

```typescript
// backend/src/services/games/g3/match-engine.ts

class G3MatchEngine {
  /**
   * 验证交换是否构成有效配对
   * 1. 检查 pos_a 与 pos_b 是否相邻（上下左右，不含对角）
   * 2. 模拟交换后，检查 pos_a 新位置的四方向相邻词是否存在配对关系
   * 3. 同时检查 pos_b 新位置
   * 4. 支持 3 消：3 个存在配对关系的词排成一行/列
   */
  validateSwap(board: WordBoard, posA: Position, posB: Position, pairLookup: PairLookup): MatchResult

  /**
   * 全棋盘扫描可消除配对（用于 cascade + 检测死局）
   */
  scanAllMatches(board: WordBoard, pairLookup: PairLookup): MatchResult[]

  /**
   * 特殊方块生成判定
   * - 4 消 → 炸弹（消除 3×3）
   * - 5 消 → 彩虹（消除所有同匹配类型方块）
   * - L/T 型消 → 横扫（消整行或整列）
   */
  determineSpecialBlock(matchCount: number, matchShape: MatchShape): SpecialBlockType | null

  /**
   * 特殊方块效果计算
   * - 炸弹 + 炸弹 = 5×5
   * - 炸弹 + 横扫 = 十字 3 行 + 3 列
   * - 彩虹 + 任意 = 两种类型全消
   * - 彩虹 + 彩虹 = 全屏清除
   */
  applySpecialBlock(type: SpecialBlockType, position: Position, board: WordBoard, context?: SpecialContext): SpecialResult

  /**
   * Cascade 层级计算
   * - 消除 → 上方下落 → 顶部补入 → 重新扫描 → 发现新配对 → 继续消除
   * - 每层记录匹配数据（前端按层播放动画，每层间隔 300ms）
   * - 递归直到无新配对
   */
  calculateCascade(board: WordBoard, initialMatches: MatchResult[], pairLookup: PairLookup): CascadeResult
}
```

#### 计分引擎

```typescript
// backend/src/services/games/g3/scoring-engine.ts

class G3ScoringEngine {
  private readonly BASE_MATCH_SCORE = 30       // 单次配对消除基础分
  private readonly CASCADE_MULTIPLIERS: Record<number, number> = {
    1: 1,      // 首次消除 ×1
    2: 1.5,    // 第 2 层 ×1.5
    3: 2,      // 第 3 层 ×2
    4: 3,      // 第 4 层 ×3
    5: 5,      // 第 5 层+ ×5
  }
  private readonly COMBO_EFFECTS = {
    3: { label: 'NICE!', color: 'sky' },
    5: { label: 'BRILLIANT!!', color: 'amber' },
    10: { label: 'GENIUS!!!', color: 'rose_amber_gradient' },
  }

  calculateSwapScore(params: {
    matches: MatchResult[]
    cascadeLayers: CascadeLayer[]
    currentCombo: number
    specialBlockUsed: boolean
  }): { totalScore: number; newCombo: number; comboEffect: ComboEffect | null }
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g3/anti-cheat.ts

class G3AntiCheat {
  /** 棋盘状态哈希一致性校验 */
  validateBoardState(serverHash: string, clientHash: string): boolean

  /** 交换频率校验：两次交换间隔 < 300ms 标记可疑 */
  validateSwapFrequency(lastSwapTs: number, currentTs: number): boolean

  /** PK 模式：验证双方棋盘初始一致 */
  validatePKBoardIntegrity(boardSeed: string, playerBoards: string[]): boolean
}
```

## 范围（做什么）

- 创建 G3 语义配对关系表 + 词库表 + 用户掌握度表（Migration）
- 从 L3 课程导入 200+ 近义词对、150+ 反义词对、300+ 搭配词组（Seed）
- 实现 7×7 棋盘生成器（语义配对分布、可消除保证、三类型均匀）
- 实现语义匹配验证引擎（相邻交换配对判定、3 消检测）
- 实现 Cascade 层级计算（递归扫描 + 分层数据）
- 实现特殊方块生成与效果（炸弹/彩虹/横扫 + 组合叠加）
- 实现计分引擎（Cascade 倍率递增、Combo 效果）
- 实现洗牌/提示 API
- 实现 PK 同棋盘机制（服务端生成种子，双方接收相同棋盘）
- 实现石头方块注入（无尽模式难度递增）
- 实现防作弊模块
- 与 T06-006 结算 API 对接

## 边界（不做什么）

- 不写 Phaser 前端游戏场景（T07-006）
- 不写匹配系统（T06-005）
- 不写结算/段位逻辑（T06-006）
- 不写皮肤系统（T06-008）

## 涉及文件

- 新建: `backend/src/services/games/g3/board-generator.ts`
- 新建: `backend/src/services/games/g3/match-engine.ts`
- 新建: `backend/src/services/games/g3/scoring-engine.ts`
- 新建: `backend/src/services/games/g3/anti-cheat.ts`
- 新建: `backend/src/services/games/g3/types.ts`
- 新建: `backend/src/routers/v1/games/g3-word-match.ts`
- 新建: `backend/src/repositories/g3-semantic-pairs.repo.ts`
- 新建: `backend/src/repositories/g3-word-bank.repo.ts`
- 新建: `backend/src/repositories/g3-user-mastery.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g3_word_match.sql`
- 新建: `scripts/seed-g3-semantic-pairs.sql`
- 修改: `backend/src/routers/v1/index.ts` — 注册 G3 路由

## 依赖

- 前置: T06-013（游戏通用系统集成验证完成）
- 前置: T06-005（匹配系统 — WebSocket 基础）
- 前置: T06-006（会话/结算 API）
- 后续: T07-006（G3 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** G3 语义配对库已导入  
   **WHEN** 调用棋盘生成 API（无尽模式，7×7）  
   **THEN** 返回 49 个词语方块，至少 3 组相邻可消除配对，三种匹配类型均有出现

2. **GIVEN** "美丽" 在 (2,3)、"漂亮" 在 (2,4) 且为近义词配对  
   **WHEN** 提交交换 (2,3)↔(2,4)  
   **THEN** `valid: true`，`pair_type: "synonym"`，`score ≥ 30`

3. **GIVEN** 交换后的两个方块不存在任何配对关系  
   **WHEN** 提交交换  
   **THEN** `valid: false`，不计分，限步模式不扣步数

4. **GIVEN** 消除后上方方块下落形成新配对  
   **WHEN** 计算 Cascade  
   **THEN** 返回分层数据，第 2 层倍率 ×1.5，第 3 层倍率 ×2

5. **GIVEN** 一次消除了 4 个相邻方块  
   **WHEN** 判定特殊方块  
   **THEN** 在消除位置生成炸弹方块

6. **GIVEN** 炸弹方块与彩虹方块交换  
   **WHEN** 计算特殊方块叠加效果  
   **THEN** 消除棋盘上两种匹配类型的所有方块

7. **GIVEN** PK 模式 2 人匹配成功  
   **WHEN** 双方请求棋盘  
   **THEN** 双方收到完全相同的初始 7×7 棋盘

8. **GIVEN** 无尽模式累计消除 60 次  
   **WHEN** 请求棋盘更新  
   **THEN** 棋盘中出现 2-3 个石头方块（不可移动、不可消除）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration + Seed 语义配对数据
5. 验证棋盘生成 API：7×7 布局 + 可消除保证
6. 模拟交换-匹配-Cascade 完整流程
7. 验证特殊方块生成与叠加效果
8. 验证 PK 同棋盘机制
9. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] API 端点返回正确数据
- [ ] 200+ 近义词对 + 150+ 反义词对 + 300+ 搭配词组完整导入
- [ ] 棋盘生成保证至少 3 组可消除配对
- [ ] 语义匹配验证引擎正确区分三种配对类型
- [ ] Cascade 递归计算正确，分层数据完整
- [ ] 特殊方块 4 消/5 消/L 型判定正确
- [ ] 特殊方块组合叠加效果正确
- [ ] PK 同棋盘种子一致性验证通过
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/07-games-g1-g4/T07-005-g3-word-match-backend.md`

## 自检重点

- [ ] 安全: 配对验证 100% 在服务端完成，客户端仅提交交换位置
- [ ] 安全: PK 模式棋盘种子不下发给客户端
- [ ] 安全: RLS 策略正确
- [ ] 性能: 棋盘生成（含可消除保证检查）< 200ms
- [ ] 性能: 全棋盘扫描 49 格 < 50ms
- [ ] 性能: Cascade 递归（最坏 10 层）< 100ms
- [ ] 算法: 棋盘死局检测正确，洗牌后保证可解
- [ ] 数据: 三种匹配类型均匀分布，不偏科
