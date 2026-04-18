# T07-001: G1 汉字切切切 — 后端题库与游戏逻辑

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10+

## 需求摘要

实现 G1 汉字切切切的后端游戏逻辑：出题 API、服务端计分引擎、游戏规则引擎。题库 100% 来自 L1 课程 300 个基础汉字，支持单人经典/限时、1v1 PK、多人混战四种子模式。所有题目由服务端下发，答案由服务端校验，分数由服务端计算（防作弊三件套）。自适应出题根据用户切错频率调整汉字出现概率，与 SRS 系统联动。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/01-g1-hanzi-slash.md` — G1 完整 PRD
  - §二 子模式规则（经典/限时/PK/多人）
  - §四 核心交互（切对/切错/漏切判定规则、Combo 倍率表）
  - §五 难度递增（卡片速度、同屏数量、干扰特征曲线）
  - §六 生命值系统（3 条命规则、限时模式无生命值）
  - §七 PK 模式特殊规则（同题序列、抢答机制、时间同步 < 50ms）
- 游戏设计: `game/01-hanzi-slash.md` — G1 完整玩法设计
  - §二 核心玩法（出题逻辑、干扰项策略）
  - §八 题库与课程联动（自适应出题、SRS 联动）
- 课程内容: `course/level-01.md` — L1 启蒙入门
  - 300 字认读 + 拼音体系 + 8 核心句型 + 500 词词汇量
- 通用系统: `product/apps/05-game-common/` — 匹配、结算、段位规则
- 编码规范: `grules/05-coding-standards.md` §三 — 后端 Express 规范、并发安全
- API 设计: `grules/04-api-design.md` — 统一响应格式、错误码、分页
- 关联任务: T06-006（会话/结算 API）、T06-005（匹配系统）→ 本任务 → T07-002（G1 前端）

## 技术方案

### 数据库设计

#### 1. G1 题库表（复用 game_questions 或独立）

```sql
-- 汉字切切切题库（从 L1 课程内容导入）
CREATE TABLE g1_question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hanzi VARCHAR(4) NOT NULL,              -- 汉字（如 "猫"）
  pinyin VARCHAR(20) NOT NULL,            -- 拼音（如 "māo"）
  tone INTEGER NOT NULL CHECK (tone BETWEEN 1 AND 5), -- 声调 1-5（5=轻声）
  meaning_en VARCHAR(100),                -- 英文释义
  meaning_image_url VARCHAR(500),         -- 释义图片 URL
  radical VARCHAR(4),                     -- 偏旁部首
  stroke_count INTEGER,                   -- 笔画数
  similar_hanzi TEXT[] DEFAULT '{}',      -- 形近字列表（如 {"描","瞄","喵"}）
  homophone_hanzi TEXT[] DEFAULT '{}',    -- 同音字列表（如 {"毛","矛","茅"}）
  same_radical_hanzi TEXT[] DEFAULT '{}', -- 同偏旁字列表
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5), -- 难度 1-5
  frequency_rank INTEGER,                 -- 使用频率排名（越小越常用）
  course_level INTEGER NOT NULL DEFAULT 1,-- 课程等级
  course_module VARCHAR(50),              -- 课程模块（如 "M1-汉字与书写"）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_g1_qb_difficulty ON g1_question_bank(difficulty);
CREATE INDEX idx_g1_qb_tone ON g1_question_bank(tone);
CREATE INDEX idx_g1_qb_frequency ON g1_question_bank(frequency_rank);
CREATE INDEX idx_g1_qb_radical ON g1_question_bank(radical);

-- RLS: 所有认证用户可读
ALTER TABLE g1_question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g1_qb_read" ON g1_question_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g1_qb_admin" ON g1_question_bank FOR ALL TO service_role USING (true);
```

#### 2. 用户汉字掌握度表（自适应出题依据）

```sql
CREATE TABLE g1_user_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hanzi_id UUID NOT NULL REFERENCES g1_question_bank(id) ON DELETE CASCADE,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  -- 0=未见 1=初识 2=认识 3=熟悉 4=掌握 5=精通
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hanzi_id)
);

CREATE INDEX idx_g1_mastery_user ON g1_user_mastery(user_id);
CREATE INDEX idx_g1_mastery_level ON g1_user_mastery(user_id, mastery_level);

ALTER TABLE g1_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g1_mastery_own" ON g1_user_mastery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 生成题目序列（游戏会话创建时调用）

```
POST /api/v1/games/g1-hanzi-slash/questions
Headers: Authorization: Bearer {token} (内部系统调用)
Body: {
  "session_id": "uuid",
  "mode": "solo_classic" | "solo_timed" | "pk_1v1" | "multiplayer",
  "player_ids": ["uuid1", "uuid2?"],
  "duration_seconds": 60,        // 限时/PK 模式时长
  "difficulty_preset": "auto"    // auto=根据用户水平, easy/medium/hard
}

Response 201:
{
  "code": 0,
  "data": {
    "question_sequence": [
      {
        "seq": 1,
        "target_hanzi_id": "uuid",
        "target_hanzi": "猫",
        "target_pinyin": "māo",
        "target_tone": 1,
        "hint_type": "pinyin",      // pinyin | image | meaning
        "hint_content": "māo",
        "distractors": [
          { "hanzi_id": "uuid", "hanzi": "描", "type": "similar_shape" },
          { "hanzi_id": "uuid", "hanzi": "毛", "type": "homophone" }
        ],
        "spawn_delay_ms": 500,       // 与上一题的间隔
        "difficulty_tier": 1         // 当前难度层级
      }
    ],
    "total_questions": 100,
    "game_config": {
      "initial_lives": 3,
      "base_score": 10,
      "combo_multipliers": { "3": 1.5, "5": 2, "10": 3, "20": 5 },
      "speed_curve": [
        { "time_sec": 0, "velocity": 600, "max_concurrent": 2, "interval_ms": 500 },
        { "time_sec": 30, "velocity": 700, "max_concurrent": 3, "interval_ms": 400 },
        { "time_sec": 60, "velocity": 800, "max_concurrent": 4, "interval_ms": 300 },
        { "time_sec": 90, "velocity": 850, "max_concurrent": 4, "interval_ms": 250 },
        { "time_sec": 120, "velocity": 900, "max_concurrent": 5, "interval_ms": 200 }
      ]
    }
  }
}
```

#### 2. 提交切割结果（逐题实时提交）

```
POST /api/v1/games/g1-hanzi-slash/sessions/:sessionId/slash
Headers: Authorization: Bearer {token}
Body: {
  "question_seq": 1,
  "slashed_hanzi_id": "uuid",     // 切割的汉字 ID
  "client_timestamp": 1714000000000,
  "action": "slash"               // slash | miss（漏切由客户端上报）
}

Response 200:
{
  "code": 0,
  "data": {
    "correct": true,
    "score_delta": 15,             // 含 Combo 倍率后的实际得分
    "current_score": 250,
    "combo_count": 3,
    "combo_multiplier": 1.5,
    "lives_remaining": 3,
    "server_timestamp": 1714000000030
  }
}
```

#### 3. PK 模式抢答判定（WebSocket 事件）

```typescript
// WebSocket 消息格式
// 客户端 → 服务端
interface SlashEvent {
  type: 'g1_slash'
  session_id: string
  player_id: string
  question_seq: number
  slashed_hanzi_id: string
  client_timestamp: number
}

// 服务端 → 所有客户端
interface SlashResultBroadcast {
  type: 'g1_slash_result'
  question_seq: number
  winner_id: string | null        // 谁先抢到（null=两人都切错）
  correct: boolean
  scores: Record<string, number>  // 各玩家当前分数
  combos: Record<string, number>  // 各玩家 Combo 数
  lives: Record<string, number>   // 各玩家剩余生命
  timestamp: number
}
```

### 服务端核心逻辑

#### 出题引擎

```typescript
// backend/src/services/games/g1/question-generator.ts

interface G1QuestionGeneratorConfig {
  userId: string
  mode: GameMode
  durationSeconds: number
  difficultyPreset: 'auto' | 'easy' | 'medium' | 'hard'
}

class G1QuestionGenerator {
  /**
   * 生成题目序列
   * 1. 从 L1 题库获取 300 字
   * 2. 根据用户掌握度权重采样（切错多的字更高概率出现）
   * 3. 为每题选择干扰项（形近字优先，同音字次之）
   * 4. 按难度曲线安排题序（前期简单，逐渐加难）
   */
  async generateSequence(config: G1QuestionGeneratorConfig): Promise<QuestionSequence>

  /**
   * 自适应权重计算
   * - 掌握度低（mastery_level 0-1）：权重 3x（多出）
   * - 掌握度中（mastery_level 2-3）：权重 1x（正常）
   * - 掌握度高（mastery_level 4-5）：权重 0.3x（少出，插入新字）
   */
  private calculateWeights(mastery: G1UserMastery[]): Map<string, number>

  /**
   * 干扰项选择策略
   * 难度 1-2：选与目标字外形差异大的字
   * 难度 3：开始出现同偏旁字
   * 难度 4：出现形近字（大/太/犬）
   * 难度 5：形近字 + 同声调 + 同偏旁综合干扰
   */
  private selectDistractors(target: Hanzi, difficulty: number, count: number): Hanzi[]
}
```

#### 计分引擎

```typescript
// backend/src/services/games/g1/scoring-engine.ts

class G1ScoringEngine {
  private readonly BASE_SCORE = 10
  private readonly COMBO_MULTIPLIERS: Record<number, number> = {
    3: 1.5, 5: 2, 10: 3, 20: 5
  }

  /**
   * 计算单次切割得分
   * 切对：base × combo_multiplier
   * 切错：0 分，Combo 归零
   * 漏切：0 分，不影响 Combo
   */
  calculateSlashScore(params: {
    correct: boolean
    currentCombo: number
    mode: GameMode
  }): { scoreDelta: number; newCombo: number; multiplier: number }

  /**
   * 限时模式计分
   * 切错扣 5 分（不扣命）
   */
  calculateTimedScore(params: {
    correct: boolean
    currentCombo: number
  }): { scoreDelta: number; newCombo: number }

  /**
   * PK 模式抢答判定
   * 同一题，先到先得（服务端时间戳比较，50ms 内算同时）
   * 同时切对各得分一半
   */
  judgeRace(events: SlashEvent[]): RaceResult
}
```

#### 游戏状态管理

```typescript
// backend/src/services/games/g1/game-state.ts

interface G1GameState {
  sessionId: string
  mode: GameMode
  players: Map<string, G1PlayerState>
  questionSequence: QuestionItem[]
  currentQuestionIndex: number
  speedCurve: SpeedConfig[]
  startedAt: number
  elapsedMs: number
}

interface G1PlayerState {
  userId: string
  score: number
  combo: number
  lives: number          // 经典模式 3 条命
  correctCount: number
  wrongCount: number
  missCount: number
  isGameOver: boolean
}

class G1GameStateManager {
  private states: Map<string, G1GameState> = new Map()

  /** 初始化游戏状态 */
  initSession(sessionId: string, config: SessionConfig): G1GameState

  /** 处理切割事件 */
  handleSlash(sessionId: string, playerId: string, event: SlashEvent): SlashResult

  /** 检查游戏结束条件 */
  checkGameOver(sessionId: string): GameOverResult | null

  /** 获取游戏结算数据（传给 T06-006 结算 API） */
  getSettlementData(sessionId: string): SettlementData

  /** 清理已结束的游戏状态（防内存泄漏） */
  cleanup(sessionId: string): void
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g1/anti-cheat.ts

class G1AntiCheat {
  /**
   * 时间校验：客户端时间戳与服务端时间差 > 2000ms 则标记可疑
   */
  validateTimestamp(clientTs: number, serverTs: number): boolean

  /**
   * 频率校验：同一玩家两次切割间隔 < 100ms 则标记可疑
   */
  validateFrequency(lastSlashTs: number, currentTs: number): boolean

  /**
   * 正确率校验：准确率 > 98% 且 Combo > 50 标记为可疑（统计异常）
   */
  validateAccuracy(correct: number, total: number, maxCombo: number): boolean

  /**
   * 序列校验：客户端提交的 question_seq 必须递增，不可跳过
   */
  validateSequence(lastSeq: number, currentSeq: number): boolean
}
```

## 范围（做什么）

- 创建 G1 汉字切切切题库表 + 用户掌握度表（Migration）
- 从 L1 课程内容导入 300 个基础汉字数据（Seed）
- 实现出题引擎（自适应权重、干扰项选择、难度曲线）
- 实现计分引擎（Combo 倍率、经典/限时/PK 三种计分模式）
- 实现 PK 模式抢答判定逻辑（WebSocket 事件处理）
- 实现游戏状态管理器（内存中维护进行中游戏状态）
- 实现防作弊模块（时间/频率/正确率/序列校验）
- 实现出题 API + 切割提交 API
- 实现掌握度更新（切对/切错更新 mastery_level）
- 与 T06-006 结算 API 对接（提供结算数据）
- 编写 API 单元测试

## 边界（不做什么）

- 不写 Phaser 前端游戏场景（T07-002）
- 不写匹配系统（T06-005 已完成）
- 不写结算页面前端（T06-011 已完成）
- 不写段位变更逻辑（T06-006 已完成）
- 不实现皮肤系统后端（T06-008 已完成）
- 不写管理后台题库管理（T14 系列）

## 涉及文件

- 新建: `backend/src/services/games/g1/question-generator.ts`
- 新建: `backend/src/services/games/g1/scoring-engine.ts`
- 新建: `backend/src/services/games/g1/game-state.ts`
- 新建: `backend/src/services/games/g1/anti-cheat.ts`
- 新建: `backend/src/services/games/g1/types.ts`
- 新建: `backend/src/routers/v1/games/g1-hanzi-slash.ts`
- 新建: `backend/src/repositories/g1-question-bank.repo.ts`
- 新建: `backend/src/repositories/g1-user-mastery.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g1_hanzi_slash.sql`
- 新建: `scripts/seed-g1-questions.sql`
- 修改: `backend/src/routers/v1/index.ts` — 注册 G1 路由

## 依赖

- 前置: T06-013（游戏通用系统集成验证完成）
- 前置: T06-005（匹配系统 — WebSocket 基础）
- 前置: T06-006（会话/结算 API — 对接接口）
- 后续: T07-002（G1 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** G1 题库已导入  
   **WHEN** 调用出题 API 生成 100 题序列（auto 难度）  
   **THEN** 返回 100 个题目，每题含目标汉字 + 2-5 个干扰项，干扰项来自形近字/同音字/同偏旁字

2. **GIVEN** 游戏会话已创建（单人经典模式）  
   **WHEN** 提交切对正确汉字的 slash 事件  
   **THEN** 返回 `correct: true`，`score_delta ≥ 10`，`combo_count` 递增

3. **GIVEN** 玩家已连续切对 5 次（Combo = 5）  
   **WHEN** 再次切对  
   **THEN** `combo_multiplier = 2`，`score_delta = 20`

4. **GIVEN** 单人经典模式，玩家剩余 1 条命  
   **WHEN** 提交切错（slashed_hanzi_id 与 target 不匹配）  
   **THEN** `lives_remaining = 0`，游戏状态标记为 Game Over

5. **GIVEN** 限时模式游戏  
   **WHEN** 提交切错  
   **THEN** `score_delta = -5`，不返回 lives_remaining（限时模式无生命值）

6. **GIVEN** PK 模式，两个玩家同时切对同一题（时间差 < 50ms）  
   **WHEN** 服务端判定抢答  
   **THEN** 两人各得一半分数

7. **GIVEN** 用户多次切错汉字"猫"  
   **WHEN** 下一局请求出题  
   **THEN** "猫" 字出现概率高于平均值（自适应权重生效）

8. **GIVEN** 防作弊检查开启  
   **WHEN** 客户端提交时间戳与服务端差距 > 2000ms  
   **THEN** 该次提交被标记为可疑，不计分

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration: `docker compose exec backend npm run db:migrate`
5. 执行 Seed: `docker compose exec backend npm run db:seed:g1`
6. 验证题库: `curl http://localhost:3000/api/v1/games/g1-hanzi-slash/questions` — 返回题目序列
7. 模拟游戏会话：创建 → 提交切割 → 检查计分 → 结束会话
8. 验证 PK 模式 WebSocket 抢答：两个客户端同时连接，模拟抢答场景
9. 验证防作弊：提交异常时间戳，确认被标记可疑
10. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] API 端点返回正确数据（格式符合 grules/04-api-design.md）
- [ ] 控制台无 Error 级别日志
- [ ] 题库 300 字完整导入
- [ ] 出题引擎自适应权重正确
- [ ] 计分引擎 Combo 倍率正确
- [ ] PK 抢答判定延迟 < 50ms
- [ ] 防作弊模块全部校验通过
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/07-games-g1-g4/` 下创建同名结果文件

结果文件路径: `/tasks/result/07-games-g1-g4/T07-001-g1-hanzi-slash-backend.md`

## 自检重点

- [ ] 安全: 所有计分在服务端完成，客户端无法伪造分数
- [ ] 安全: 防作弊四件套（时间/频率/正确率/序列）全部实现
- [ ] 安全: RLS 策略正确，用户只能读取/修改自己的掌握度数据
- [ ] 性能: 出题引擎 < 200ms 响应，切割判定 < 50ms 响应
- [ ] 性能: 游戏状态管理器内存及时清理，无泄漏
- [ ] 类型同步: Zod Schema 与数据库字段一致
- [ ] 并发: PK 模式多人同时提交时无竞态条件
- [ ] 数据: 300 字题库完整无遗漏，形近字/同音字列表准确
