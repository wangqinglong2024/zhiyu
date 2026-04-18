# T08-003: G6 汉字华容道 — 后端题库与游戏逻辑

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12+

## 需求摘要

实现 G6 汉字华容道的后端游戏逻辑：题目生成引擎（4×4/5×5 棋盘、目标文本拆字、随机打乱并保证有解）、最优解预计算（A*/IDA* 算法）、滑动合法性校验、四种子模式服务端逻辑（单人无尽/极速/1v1 PK/多人竞速）、步数计分系统、提示逻辑。题库从 L6 课程内容导入（成语 150 个 + 缩句扩句 + 古诗句 + 语序练习），每题标注难度。所有棋盘状态和计分由服务端管理。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/02-g6-hanzi-puzzle.md` — G6 完整 PRD
  - §二 子模式规则（无尽/极速/1v1 PK/多人竞速）
  - §三 游戏画面布局（目标区、棋盘区、信息区、倒计时条）
  - §四 核心交互（题目生成、拖拽滑动、提示、解题成功/失败）
  - §五 PK 模式（同题竞速、Bo3、进度实时同步）
  - §六 上瘾机制（最少步数挑战、每日一题、难度递增）
- 游戏设计: `game/06-hanzi-puzzle.md` — G6 完整玩法设计
  - §二 核心玩法（滑块规则、题目类型、辅助系统）
  - §三 游戏模式（四种模式规则）
  - §七 技术要点（棋盘状态、合法性、最优解算法、同步）
  - §八 题库与课程联动（L6 成语 120+、古诗句 50+、句子 100+）
- 课程内容: `course/level-06.md` — L6 综合提升
- 通用系统: `product/apps/05-game-common/` — 匹配、结算、段位规则
- 编码规范: `grules/05-coding-standards.md` §三 — 后端分层规范
- API 设计: `grules/04-api-design.md` — 统一响应格式
- 关联任务: T06-013（游戏通用系统集成）→ 本任务 → T08-004（G6 前端）

## 技术方案

### 数据库设计

#### 1. G6 题库表

```sql
-- 汉字华容道题库（从 L6 课程内容导入）
CREATE TABLE g6_puzzle_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_text VARCHAR(50) NOT NULL,           -- 目标文本（如 "同舟共济" 或 "床前明月光"）
  target_pinyin VARCHAR(100),                 -- 拼音
  target_meaning TEXT,                        -- 释义
  text_type VARCHAR(20) NOT NULL CHECK (text_type IN ('idiom', 'poem', 'sentence', 'compound')),
  -- idiom=四字成语 poem=古诗句 sentence=句子 compound=复合
  grid_size INTEGER NOT NULL CHECK (grid_size IN (4, 5)),  -- 棋盘规格 4×4 或 5×5
  char_count INTEGER NOT NULL,                -- 文本字数
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  -- 1=简单 2=中等 3=困难 4=大师 5=超难
  course_level INTEGER NOT NULL DEFAULT 6,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g6_puzzle_type ON g6_puzzle_bank(text_type);
CREATE INDEX idx_g6_puzzle_grid ON g6_puzzle_bank(grid_size);
CREATE INDEX idx_g6_puzzle_diff ON g6_puzzle_bank(difficulty);
CREATE INDEX idx_g6_puzzle_active ON g6_puzzle_bank(is_active);

ALTER TABLE g6_puzzle_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g6_puzzle_read" ON g6_puzzle_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g6_puzzle_admin" ON g6_puzzle_bank FOR ALL TO service_role USING (true);
```

#### 2. 每日一题表

```sql
CREATE TABLE g6_daily_challenge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  puzzle_id UUID NOT NULL REFERENCES g6_puzzle_bank(id),
  grid_size INTEGER NOT NULL DEFAULT 5,       -- 每日一题固定 5×5
  shuffle_seed INTEGER NOT NULL,              -- 打乱随机种子（保证全服同题同状态）
  optimal_steps INTEGER NOT NULL,             -- 预计算最优步数
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g6_daily_date ON g6_daily_challenge(challenge_date);

ALTER TABLE g6_daily_challenge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g6_daily_read" ON g6_daily_challenge FOR SELECT TO authenticated USING (true);
CREATE POLICY "g6_daily_admin" ON g6_daily_challenge FOR ALL TO service_role USING (true);
```

#### 3. 用户解题记录表

```sql
CREATE TABLE g6_user_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES g6_puzzle_bank(id),
  session_id UUID NOT NULL,
  steps_taken INTEGER NOT NULL,
  optimal_steps INTEGER NOT NULL,
  time_seconds NUMERIC(6,2) NOT NULL,
  is_perfect BOOLEAN NOT NULL DEFAULT false,  -- 步数 = 最优解
  hints_used INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g6_solutions_user ON g6_user_solutions(user_id);
CREATE INDEX idx_g6_solutions_puzzle ON g6_user_solutions(puzzle_id);

ALTER TABLE g6_user_solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g6_solutions_own" ON g6_user_solutions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 生成题目（含打乱后的棋盘状态）

```
POST /api/v1/games/g6-hanzi-puzzle/generate
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "mode": "solo_endless" | "solo_speed" | "pk_1v1" | "multiplayer_race",
  "player_ids": ["uuid1", "uuid2?"],
  "difficulty_preset": "auto",
  "grid_size": 4
}

Response 201:
{
  "code": 0,
  "data": {
    "puzzle_id": "uuid",
    "target_text": "同舟共济",
    "target_pinyin": "tóng zhōu gòng jì",
    "target_meaning": "比喻在困难时共同努力",
    "grid_size": 4,
    "correct_layout": [
      ["同", "舟", "共", "济"],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null]
    ],
    "shuffled_layout": [
      [null, "共", "同", "舟"],
      ["济", null, null, null],
      [null, null, "济", null],
      [null, null, null, null]
    ],
    "empty_position": { "row": 0, "col": 0 },
    "optimal_steps": 8,
    "time_limit_seconds": 120
  }
}
```

#### 2. 提交滑动操作（逐步实时提交）

```
POST /api/v1/games/g6-hanzi-puzzle/sessions/:sessionId/move
Headers: Authorization: Bearer {token}
Body: {
  "player_id": "uuid",
  "from_position": { "row": 0, "col": 1 },
  "to_position": { "row": 0, "col": 0 },
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "valid": true,
    "steps_taken": 5,
    "current_layout": [...],
    "correct_positions": 2,
    "total_positions": 4,
    "is_solved": false,
    "server_timestamp": 1714000000030
  }
}
```

#### 3. 请求提示

```
POST /api/v1/games/g6-hanzi-puzzle/sessions/:sessionId/hint
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "data": {
    "hint_block": { "row": 1, "col": 0, "char": "济" },
    "target_position": { "row": 0, "col": 0 },
    "direction": "up",
    "hints_remaining": 2
  }
}
```

#### 4. PK 模式进度同步（WebSocket）

```typescript
// 服务端 → 所有客户端：对手进度更新
interface PuzzleProgressBroadcast {
  type: 'g6_progress'
  player_id: string
  correct_positions: number
  total_positions: number
  steps_taken: number
  completion_percent: number
  timestamp: number
}

// 服务端 → 所有客户端：对手完成
interface PuzzleCompleteBroadcast {
  type: 'g6_complete'
  player_id: string
  steps_taken: number
  time_seconds: number
  is_perfect: boolean
  timestamp: number
}

// 服务端 → 所有客户端：局间结算
interface PuzzleRoundEndBroadcast {
  type: 'g6_round_end'
  round: number
  winner_id: string | null
  player_results: Record<string, { steps: number; time: number; solved: boolean }>
  overall_wins: Record<string, number>
  timestamp: number
}
```

### 服务端核心逻辑

#### 题目生成引擎

```typescript
// backend/src/services/games/g6/puzzle-generator.ts

class G6PuzzleGenerator {
  /**
   * 生成棋盘题目
   * 1. 从题库中按难度抽取目标文本
   * 2. 将文本字符分配到棋盘格（按阅读顺序：左→右、上→下）
   * 3. 随机选一格设为空位
   * 4. 通过随机滑动打乱（确保有解）
   * 5. 用 A*/IDA* 计算最优步数
   */
  async generatePuzzle(config: PuzzleConfig): Promise<PuzzleData>

  /**
   * 打乱算法
   * 从正确状态出发，随机执行 N 步合法滑动（N 按难度递增）
   * 确保打乱后与正确状态不同
   * 记录打乱过程以便计算逆操作
   */
  private shuffle(correctLayout: string[][], emptyPos: Position, steps: number): ShuffleResult

  /**
   * 最优解计算（IDA* 算法）
   * 对 4×4 棋盘使用 IDA* + Manhattan Distance 启发函数
   * 对 5×5 棋盘使用 IDA* + Pattern Database 启发
   * 超时兜底：若 5 秒内未算出精确值，返回估计值
   */
  calculateOptimalSteps(layout: string[][], target: string[][], emptyPos: Position): number
}
```

#### 滑动验证引擎

```typescript
// backend/src/services/games/g6/move-validator.ts

class G6MoveValidator {
  /**
   * 验证滑动合法性
   * 1. from_position 必须有方块（非空位）
   * 2. to_position 必须是空位
   * 3. from 和 to 必须水平或垂直相邻
   */
  validateMove(currentLayout: string[][], from: Position, to: Position): boolean

  /**
   * 检查是否已解出
   * 比较当前棋盘与正确答案
   */
  checkSolved(currentLayout: string[][], correctLayout: string[][]): boolean

  /**
   * 计算正确位置数（用于进度百分比）
   */
  countCorrectPositions(currentLayout: string[][], correctLayout: string[][]): number
}
```

#### 计分引擎

```typescript
// backend/src/services/games/g6/scoring-engine.ts

class G6ScoringEngine {
  /**
   * 解题得分计算（PRD §4.5）
   * 基础分 500
   * + 步数奖励：步数 ≤ 最优解 → +200 / ≤ 1.5× → +100 / > 1.5× → 0
   * + 速度奖励：<30s → +100 / +50 / +30
   * - 提示惩罚：每用 1 次提示扣 50 分（最低不低于 500）
   */
  calculateScore(params: {
    stepsTaken: number
    optimalSteps: number
    timeSeconds: number
    hintsUsed: number
  }): { total: number; stepBonus: number; speedBonus: number; hintPenalty: number; rating: string }
}
```

#### 难度曲线管理

```typescript
// backend/src/services/games/g6/difficulty-manager.ts

class G6DifficultyManager {
  /**
   * 无尽模式难度递增（PRD §6.4）
   * 题 1-5: 4×4 简单（四字成语，6-10 步最优）
   * 题 6-10: 4×4 中等（形近字干扰，10-15 步）
   * 题 11-15: 5×5 挑战（七字古诗句，15-25 步）
   * 题 16+: 5×5 大师（长句+复杂语序，25-40 步）
   */
  getDifficultyForQuestion(questionNumber: number): DifficultyConfig
}
```

#### 游戏状态管理

```typescript
// backend/src/services/games/g6/game-state.ts

interface G6GameState {
  sessionId: string
  mode: 'solo_endless' | 'solo_speed' | 'pk_1v1' | 'multiplayer_race'
  players: Map<string, G6PlayerState>
  currentPuzzle: PuzzleData
  questionNumber: number           // 连续解题编号
  failureCount: number             // 无尽模式超时次数（3 次 Game Over）
  speedModeEndTime: number         // 极速模式结束时间
  round: number                    // PK Bo3 当前局
  roundWins: Record<string, number>
  startedAt: number
}

interface G6PlayerState {
  userId: string
  currentLayout: string[][]
  stepsTaken: number
  hintsUsed: number
  totalScore: number
  solvedCount: number
  perfectCount: number
  startedAt: number
}

class G6GameStateManager {
  initSession(sessionId: string, config: SessionConfig): G6GameState
  handleMove(sessionId: string, playerId: string, from: Position, to: Position): MoveResult
  handleHint(sessionId: string, playerId: string): HintResult
  handleTimeout(sessionId: string): TimeoutResult
  checkGameOver(sessionId: string): GameOverResult | null
  nextPuzzle(sessionId: string): PuzzleData
  getSettlementData(sessionId: string): SettlementData
  cleanup(sessionId: string): void
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g6/anti-cheat.ts

class G6AntiCheat {
  /** 棋盘状态校验：客户端提交的 from/to 必须与服务端维护的棋盘状态一致 */
  validateBoardState(serverLayout: string[][], from: Position, to: Position): boolean

  /** 步数校验：客户端累计步数必须与服务端计数一致 */
  validateStepCount(serverSteps: number, clientSteps: number): boolean

  /** 完成时间校验：解题时间不可能小于最优步数 × 0.3 秒 */
  validateCompletionTime(timeSeconds: number, optimalSteps: number): boolean
}
```

## 范围（做什么）

- 创建 G6 题库表 + 每日一题表 + 用户解题记录表（Migration）
- 从 L6 课程导入成语 150 个 + 古诗句 50+ + 句子 100+（含拼音、释义、难度、棋盘规格）
- 实现题目生成引擎（文本拆字 → 棋盘分配 → 随机打乱 → 保证有解）
- 实现 IDA* 最优解预计算
- 实现滑动合法性校验（相邻判定、空位检查）
- 实现解题判定（棋盘状态比对）
- 实现计分引擎（步数奖励 + 速度奖励 - 提示惩罚）
- 实现难度曲线管理（无尽模式递增）
- 实现提示逻辑（高亮下一步应移动的方块）
- 实现 PK 模式同题竞速（进度百分比实时推送）
- 实现游戏状态管理器
- 实现防作弊模块
- 实现每日一题发布逻辑
- 与 T06-006 结算 API 对接

## 边界（不做什么）

- 不写 Phaser 前端游戏场景（T08-004）
- 不写匹配/结算页面（T06 已完成）
- 不实现步数排行榜前端（T14 管理后台系列）
- 不做 5×5 以上的棋盘规格

## 涉及文件

- 新建: `backend/src/services/games/g6/puzzle-generator.ts`
- 新建: `backend/src/services/games/g6/move-validator.ts`
- 新建: `backend/src/services/games/g6/scoring-engine.ts`
- 新建: `backend/src/services/games/g6/difficulty-manager.ts`
- 新建: `backend/src/services/games/g6/game-state.ts`
- 新建: `backend/src/services/games/g6/anti-cheat.ts`
- 新建: `backend/src/services/games/g6/types.ts`
- 新建: `backend/src/services/games/g6/solver.ts` — IDA* 最优解算法
- 新建: `backend/src/routers/v1/games/g6-hanzi-puzzle.ts`
- 新建: `backend/src/repositories/g6-puzzle-bank.repo.ts`
- 新建: `backend/src/repositories/g6-daily-challenge.repo.ts`
- 新建: `backend/src/repositories/g6-user-solutions.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g6_hanzi_puzzle.sql`
- 新建: `scripts/seed-g6-puzzles.sql`
- 修改: `backend/src/routers/v1/index.ts` — 注册 G6 路由

## 依赖

- 前置: T06-013（游戏通用系统集成验证完成）
- 前置: T06-005（匹配系统 — WebSocket 基础）
- 前置: T06-006（会话/结算 API）
- 后续: T08-004（G6 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** G6 题库已导入  
   **WHEN** 请求生成 4×4 简单难度题目  
   **THEN** 返回四字成语题目 + 打乱后棋盘状态 + 最优步数（6-10 步），棋盘有解

2. **GIVEN** 棋盘已生成  
   **WHEN** 提交一个空位相邻方块的合法滑动  
   **THEN** 返回 `valid: true` + 更新后的棋盘状态 + `steps_taken` 递增

3. **GIVEN** 棋盘已生成  
   **WHEN** 提交一个非空位相邻方块的非法滑动  
   **THEN** 返回 `valid: false`，棋盘状态不变

4. **GIVEN** 方块全部就位  
   **WHEN** 最后一步滑动完成  
   **THEN** `is_solved: true` + 返回得分（含步数奖励/速度奖励）

5. **GIVEN** 步数恰好等于最优解  
   **WHEN** 解题成功  
   **THEN** `is_perfect: true` + 步数奖励 +200

6. **GIVEN** 使用 1 次提示  
   **WHEN** 请求提示  
   **THEN** 返回应移动方块位置 + 目标方向 + `hints_remaining` 减 1

7. **GIVEN** PK 模式双方同题  
   **WHEN** 一方每步操作后  
   **THEN** 对手收到进度更新广播（完成百分比 + 步数）

8. **GIVEN** 无尽模式已连续解出 5 题  
   **WHEN** 请求第 6 题  
   **THEN** 难度升级为 4×4 中等（形近字干扰，10-15 步最优）

9. **GIVEN** 无尽模式已超时 3 次  
   **WHEN** 第 3 次超时  
   **THEN** 游戏结束，返回结算数据

10. **GIVEN** IDA* 算法执行  
    **WHEN** 计算 4×4 棋盘最优解  
    **THEN** 在 5 秒内返回精确最优步数

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration + Seed
5. 验证题目生成：请求不同难度题目，确认棋盘有解 + 最优步数合理
6. 模拟完整解题流程：生成 → 逐步滑动 → 验证正确位置计数 → 完成
7. 验证提示功能：3 次提示限制 + 扣分
8. 验证 PK 同题竞速 + 进度同步
9. 验证难度曲线递增
10. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 题库完整导入（成语 + 古诗句 + 句子）
- [ ] 打乱算法保证有解
- [ ] IDA* 最优解计算正确（4×4 < 5s）
- [ ] 滑动校验严格（非法操作被拒绝）
- [ ] 计分规则正确（步数/速度/提示三项）
- [ ] PK 进度百分比实时同步
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-003-g6-hanzi-puzzle-backend.md`

## 自检重点

- [ ] 安全: 棋盘状态服务端维护，客户端无法伪造步数
- [ ] 安全: 防作弊（状态/步数/时间校验）
- [ ] 安全: RLS 策略正确
- [ ] 性能: 题目生成 < 500ms（含打乱 + 最优解计算）
- [ ] 性能: 滑动校验 < 20ms
- [ ] 性能: IDA* 对 4×4 棋盘 < 5s，对 5×5 < 10s（超时有兜底）
- [ ] 算法: 打乱后棋盘保证有解
- [ ] 算法: 最优步数计算准确
- [ ] 数据: 题库字数与棋盘规格匹配
