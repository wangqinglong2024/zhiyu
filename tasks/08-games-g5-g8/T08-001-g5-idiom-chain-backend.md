# T08-001: G5 成语接龙大战 — 后端题库与游戏逻辑

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12+

## 需求摘要

实现 G5 成语接龙大战的后端游戏逻辑：成语题库管理、接龙验证引擎（尾字同字/同音字匹配）、回合制计时管理、四种子模式服务端逻辑（单人无尽/限时/1v1 PK/多人车轮战）、生僻成语额外加分机制、AI 对手逻辑（自适应难度）、防作弊系统。题库从 L5 课程 100+ 核心成语导入，并补充扩展成语库（5000+），每个成语标注常见度（常见/进阶/生僻）、释义、出处、例句。所有接龙验证和计分由服务端完成。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/01-g5-idiom-chain.md` — G5 完整 PRD
  - §二 子模式规则（无尽/限时/1v1 PK/多人车轮战）
  - §三 游戏画面布局（成语链展示区、操作区、联想提示面板）
  - §四 核心交互（起始成语、键盘输入、联想提示选择、接龙成功/失败、倒计时归零）
  - §五 PK 模式特殊规则（三回合制、回合交替、车轮战淘汰）
  - §六 上瘾机制（生僻成语加分、释义展示、每日排名、专属称号）
- 游戏设计: `game/05-idiom-chain.md` — G5 完整玩法设计
  - §二 核心玩法（接龙规则细节、成语展示内容）
  - §三 游戏模式（四种模式详细规则）
  - §五 上瘾机制（成语图鉴、段位系统、成就）
  - §七 技术要点（场景结构、成语库、接龙验证、提示生成）
- 课程内容: `course/level-05.md` — L5 深度阅读（100+ 核心成语）
- 成语参考: `china/08-idioms-allusions.md` — 成语典故内容（题库扩展来源）
- 通用系统: `product/apps/05-game-common/` — 匹配、结算、段位规则
- 编码规范: `grules/05-coding-standards.md` §三 — 后端 Express 规范、三层分离
- API 设计: `grules/04-api-design.md` — 统一响应格式、错误码
- 关联任务: T06-013（游戏通用系统集成验证）→ 本任务 → T08-002（G5 前端）

## 技术方案

### 数据库设计

#### 1. G5 成语题库表

```sql
-- 成语接龙题库（从 L5 课程 + 扩展成语库导入）
CREATE TABLE g5_idiom_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idiom VARCHAR(8) NOT NULL,                -- 成语（如 "一马当先"）
  pinyin VARCHAR(50) NOT NULL,              -- 拼音（如 "yī mǎ dāng xiān"）
  first_char VARCHAR(4) NOT NULL,           -- 首字（如 "一"）
  last_char VARCHAR(4) NOT NULL,            -- 尾字（如 "先"）
  first_char_pinyin VARCHAR(10) NOT NULL,   -- 首字拼音（如 "yī"）
  last_char_pinyin VARCHAR(10) NOT NULL,    -- 尾字拼音（如 "xiān"）
  meaning TEXT NOT NULL,                    -- 释义
  origin TEXT,                              -- 出处/典故
  example TEXT,                             -- 例句
  rarity VARCHAR(10) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'advanced', 'rare')),
  -- common=常见 advanced=进阶 rare=生僻
  sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  -- 褒贬义标注
  category VARCHAR(50),                     -- 分类（动物、数字、历史、战争、品德、自然等）
  course_level INTEGER NOT NULL DEFAULT 5,  -- 课程等级
  is_active BOOLEAN NOT NULL DEFAULT true,  -- 是否启用
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引：首字/尾字/拼音 + 常见度
CREATE INDEX idx_g5_idiom_first_char ON g5_idiom_bank(first_char);
CREATE INDEX idx_g5_idiom_last_char ON g5_idiom_bank(last_char);
CREATE INDEX idx_g5_idiom_first_pinyin ON g5_idiom_bank(first_char_pinyin);
CREATE INDEX idx_g5_idiom_last_pinyin ON g5_idiom_bank(last_char_pinyin);
CREATE INDEX idx_g5_idiom_rarity ON g5_idiom_bank(rarity);
CREATE INDEX idx_g5_idiom_active ON g5_idiom_bank(is_active);

-- RLS: 所有认证用户可读
ALTER TABLE g5_idiom_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g5_idiom_read" ON g5_idiom_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g5_idiom_admin" ON g5_idiom_bank FOR ALL TO service_role USING (true);
```

#### 2. 用户成语掌握度表

```sql
CREATE TABLE g5_user_idiom_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idiom_id UUID NOT NULL REFERENCES g5_idiom_bank(id) ON DELETE CASCADE,
  used_count INTEGER NOT NULL DEFAULT 0,       -- 使用次数
  last_used_at TIMESTAMPTZ,
  is_learned BOOLEAN NOT NULL DEFAULT false,   -- 是否已学习（释义已展示过）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idiom_id)
);

CREATE INDEX idx_g5_mastery_user ON g5_user_idiom_mastery(user_id);

ALTER TABLE g5_user_idiom_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g5_mastery_own" ON g5_user_idiom_mastery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

#### 3. 成语接龙专属称号表

```sql
CREATE TABLE g5_user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_chain_count INTEGER NOT NULL DEFAULT 0,   -- 累计接龙数
  rare_idiom_count INTEGER NOT NULL DEFAULT 0,    -- 使用生僻成语数
  max_chain_length INTEGER NOT NULL DEFAULT 0,    -- 单局最长链
  current_title VARCHAR(20) NOT NULL DEFAULT '成语新手',
  -- 成语新手/成语达人/成语高手/成语大师/成语宗师
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE g5_user_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g5_titles_read" ON g5_user_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "g5_titles_own" ON g5_user_titles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "g5_titles_insert" ON g5_user_titles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 获取接龙候选列表（联想提示）

```
POST /api/v1/games/g5-idiom-chain/candidates
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "last_char": "先",
  "last_char_pinyin": "xiān",
  "used_idiom_ids": ["uuid1", "uuid2"]
}

Response 200:
{
  "code": 0,
  "data": {
    "candidates": [
      {
        "id": "uuid",
        "idiom": "先发制人",
        "pinyin": "xiān fā zhì rén",
        "rarity": "common",
        "meaning": "先动手以制服对方",
        "is_used": false
      },
      {
        "id": "uuid",
        "idiom": "先声夺人",
        "pinyin": "xiān shēng duó rén",
        "rarity": "advanced",
        "meaning": "先张扬声势以压倒对方"
      }
    ],
    "total_available": 12
  }
}
```

#### 2. 提交接龙（服务端校验）

```
POST /api/v1/games/g5-idiom-chain/sessions/:sessionId/submit
Headers: Authorization: Bearer {token}
Body: {
  "player_id": "uuid",
  "idiom_text": "先发制人",
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "valid": true,
    "idiom": {
      "id": "uuid",
      "idiom": "先发制人",
      "pinyin": "xiān fā zhì rén",
      "meaning": "先动手以制服对方",
      "origin": "《汉书·项羽传》",
      "rarity": "common",
      "last_char": "人",
      "last_char_pinyin": "rén"
    },
    "score_delta": 100,
    "speed_bonus": 20,
    "total_score": 520,
    "chain_length": 6,
    "server_timestamp": 1714000000050
  }
}

// 失败响应
Response 200:
{
  "code": 0,
  "data": {
    "valid": false,
    "reason": "invalid_idiom" | "wrong_first_char" | "already_used" | "not_in_bank",
    "message": "成语不存在，请重新输入"
  }
}
```

#### 3. AI 对手回合（单人模式）

```
POST /api/v1/games/g5-idiom-chain/sessions/:sessionId/ai-turn
Headers: Authorization: Bearer {token}
Body: {
  "last_char": "人",
  "last_char_pinyin": "rén",
  "ai_difficulty": "medium",
  "used_idiom_ids": ["uuid1", "uuid2"]
}

Response 200:
{
  "code": 0,
  "data": {
    "idiom": {
      "id": "uuid",
      "idiom": "人山人海",
      "pinyin": "rén shān rén hǎi",
      "meaning": "形容人非常多",
      "rarity": "common",
      "last_char": "海",
      "last_char_pinyin": "hǎi"
    },
    "delay_ms": 3500
  }
}
```

#### 4. PK 模式 WebSocket 消息

```typescript
// 客户端 → 服务端：提交接龙
interface IdiomSubmitEvent {
  type: 'g5_submit'
  session_id: string
  player_id: string
  round: number
  idiom_text: string
  client_timestamp: number
}

// 服务端 → 所有客户端：接龙结果广播
interface IdiomResultBroadcast {
  type: 'g5_idiom_result'
  round: number
  player_id: string
  valid: boolean
  idiom?: IdiomDetail
  score_delta: number
  scores: Record<string, number>
  chain_length: number
  next_turn_player_id: string
  timestamp: number
}

// 服务端 → 所有客户端：回合结束
interface RoundEndBroadcast {
  type: 'g5_round_end'
  round: number
  winner_id: string
  reason: 'timeout' | 'invalid'
  round_scores: Record<string, number>
  overall_score: Record<string, number>  // 如 { "p1": 2, "p2": 1 }（回合胜场数）
  timestamp: number
}

// 服务端 → 所有客户端：车轮战淘汰
interface EliminationBroadcast {
  type: 'g5_elimination'
  eliminated_player_id: string
  remaining_players: string[]
  reason: 'timeout'
  timestamp: number
}
```

### 服务端核心逻辑

#### 接龙验证引擎

```typescript
// backend/src/services/games/g5/idiom-validator.ts

class G5IdiomValidator {
  /**
   * 验证接龙合法性
   * 1. 检查成语是否存在于题库中
   * 2. 检查首字是否匹配上一成语尾字（同字或同音字）
   * 3. 检查成语在本局中是否已被使用
   */
  async validateChain(params: {
    idiomText: string
    lastChar: string
    lastCharPinyin: string
    usedIdiomIds: string[]
  }): Promise<ValidationResult>

  /**
   * 首字匹配规则
   * - 尾字同字优先（如 "先" → "先发制人"）
   * - 同音字可接（如 "先" xiān → "鲜为人知" xiān）
   * - 声调不同也可接（如 xiān → xiǎn 不可）→ 声母韵母相同即可
   */
  private matchFirstChar(inputFirstChar: string, inputFirstPinyin: string,
    lastChar: string, lastCharPinyin: string): boolean
}
```

#### 计分引擎

```typescript
// backend/src/services/games/g5/scoring-engine.ts

class G5ScoringEngine {
  private readonly SCORE_TABLE = {
    common: { base: 100, speed_bonus: 20 },
    advanced: { base: 120, speed_bonus: 30 },
    rare: { base: 150, speed_bonus: 50 }
  }

  /**
   * 计算接龙得分
   * 基础分（按 rarity）+ 速度奖励（<3s 提交触发）
   */
  calculateScore(params: {
    rarity: 'common' | 'advanced' | 'rare'
    submitTimeMs: number    // 距离回合开始的毫秒数
    mode: GameMode
  }): { scoreDelta: number; speedBonus: number }

  /**
   * 限时模式特殊计分
   * 超时不扣命但扣 50 分 + 系统自动给出新起始成语
   */
  calculateTimedPenalty(): number
}
```

#### AI 对手逻辑

```typescript
// backend/src/services/games/g5/ai-opponent.ts

class G5AIOpponent {
  /**
   * AI 接龙
   * - 初级：只用常见成语，响应 5-8 秒
   * - 中级：用常见+进阶成语，响应 3-5 秒
   * - 高级：用全部成语（含生僻），响应 1-3 秒
   * AI 在候选列表中随机选择（按难度过滤后）
   */
  async generateResponse(params: {
    lastChar: string
    lastCharPinyin: string
    usedIdiomIds: string[]
    difficulty: 'easy' | 'medium' | 'hard'
  }): Promise<AIResponse>

  /**
   * AI 自适应难度
   * 根据玩家当前链长度动态调整 AI 难度
   * 链长 < 5 → 降低难度（让玩家获得成就感）
   * 链长 5-15 → 正常难度
   * 链长 > 15 → 提高难度（增加挑战）
   */
  private adjustDifficulty(chainLength: number, baseDifficulty: string): string
}
```

#### 游戏状态管理

```typescript
// backend/src/services/games/g5/game-state.ts

interface G5GameState {
  sessionId: string
  mode: 'solo_endless' | 'solo_timed' | 'pk_1v1' | 'multiplayer_wheel'
  players: Map<string, G5PlayerState>
  currentChain: IdiomChainItem[]     // 当前接龙链
  usedIdiomIds: Set<string>          // 已使用成语 ID 集合
  currentTurnPlayerId: string        // 当前回合玩家
  turnStartedAt: number              // 当前回合开始时间
  turnTimeoutMs: number              // 回合超时时间（默认 10000ms）
  round: number                      // PK 模式当前回合（1/2/3）
  roundWins: Record<string, number>  // PK 回合胜场记录
  eliminatedPlayers: string[]        // 车轮战已淘汰玩家
  startedAt: number
}

interface G5PlayerState {
  userId: string
  score: number
  chainCount: number        // 个人接龙次数
  rareIdiomCount: number    // 使用生僻成语次数
  isEliminated: boolean     // 车轮战是否已淘汰
}

class G5GameStateManager {
  /** 初始化游戏状态，生成起始成语 */
  initSession(sessionId: string, config: SessionConfig): G5GameState

  /** 处理玩家接龙提交 */
  handleSubmit(sessionId: string, playerId: string, idiomText: string): SubmitResult

  /** 处理回合超时 */
  handleTimeout(sessionId: string): TimeoutResult

  /** 切换到下一位玩家（车轮战跳过已淘汰玩家） */
  nextTurn(sessionId: string): string

  /** PK 模式新回合初始化 */
  startNewRound(sessionId: string): RoundStartResult

  /** 检查游戏结束条件 */
  checkGameOver(sessionId: string): GameOverResult | null

  /** 获取结算数据 */
  getSettlementData(sessionId: string): SettlementData

  /** 清理已结束游戏状态 */
  cleanup(sessionId: string): void
}
```

#### 称号更新逻辑

```typescript
// backend/src/services/games/g5/title-service.ts

class G5TitleService {
  private readonly TITLE_REQUIREMENTS = {
    '成语新手': { totalChain: 50, rareIdiom: 0, maxChain: 0 },
    '成语达人': { totalChain: 200, rareIdiom: 0, maxChain: 0 },
    '成语高手': { totalChain: 500, rareIdiom: 20, maxChain: 0 },
    '成语大师': { totalChain: 1000, rareIdiom: 50, maxChain: 0 },
    '成语宗师': { totalChain: 2000, rareIdiom: 0, maxChain: 30 }
  }

  /** 游戏结束后更新称号统计并检查晋级 */
  async updateAfterGame(userId: string, gameStats: GameStats): Promise<TitleUpdateResult>
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g5/anti-cheat.ts

class G5AntiCheat {
  /** 时间校验：客户端时间戳与服务端时间差 > 2000ms 标记可疑 */
  validateTimestamp(clientTs: number, serverTs: number): boolean

  /** 提交频率校验：同一玩家两次提交间隔 < 500ms 标记可疑（输入型游戏间隔更长） */
  validateFrequency(lastSubmitTs: number, currentTs: number): boolean

  /** 接龙内容校验：服务端二次验证成语有效性（防篡改请求） */
  validateIdiom(idiomText: string): Promise<boolean>
}
```

## 范围（做什么）

- 创建 G5 成语题库表 + 用户掌握度表 + 称号表（Migration）
- 从 L5 课程内容导入 100+ 核心成语 + 扩展成语库（含释义、出处、例句、常见度标注、首尾字及拼音）
- 实现接龙验证引擎（首字匹配尾字/同音字、成语存在性、未重复使用）
- 实现候选列表 API（联想提示面板数据源）
- 实现计分引擎（常见/进阶/生僻三档 + 速度奖励）
- 实现 AI 对手逻辑（三档难度 + 自适应调整）
- 实现 PK 模式回合管理（三回合制 Bo3、回合交替、超时判负）
- 实现车轮战模式（轮流接龙、淘汰机制、跳过已淘汰玩家）
- 实现游戏状态管理器（内存维护进行中游戏）
- 实现称号更新逻辑（接龙数/生僻数/最长链 → 称号晋级）
- 实现防作弊模块
- 与 T06-006 结算 API 对接
- 编写单元测试

## 边界（不做什么）

- 不写 Phaser 前端游戏场景（T08-002）
- 不写匹配系统（T06-005 已完成）
- 不写结算页面前端（T06-011 已完成）
- 不写段位变更逻辑（T06-006 已完成）
- 不实现皮肤系统后端（T06-008 已完成）
- 不写管理后台题库管理（T14 系列）
- 不实现语音输入（后期功能）

## 涉及文件

- 新建: `backend/src/services/games/g5/idiom-validator.ts`
- 新建: `backend/src/services/games/g5/scoring-engine.ts`
- 新建: `backend/src/services/games/g5/ai-opponent.ts`
- 新建: `backend/src/services/games/g5/game-state.ts`
- 新建: `backend/src/services/games/g5/title-service.ts`
- 新建: `backend/src/services/games/g5/anti-cheat.ts`
- 新建: `backend/src/services/games/g5/types.ts`
- 新建: `backend/src/routers/v1/games/g5-idiom-chain.ts`
- 新建: `backend/src/repositories/g5-idiom-bank.repo.ts`
- 新建: `backend/src/repositories/g5-user-idiom-mastery.repo.ts`
- 新建: `backend/src/repositories/g5-user-titles.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g5_idiom_chain.sql`
- 新建: `scripts/seed-g5-idioms.sql`
- 修改: `backend/src/routers/v1/index.ts` — 注册 G5 路由

## 依赖

- 前置: T06-013（游戏通用系统集成验证完成）
- 前置: T06-005（匹配系统 — WebSocket 基础）
- 前置: T06-006（会话/结算 API — 对接接口）
- 后续: T08-002（G5 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** G5 成语题库已导入（100+ 核心 + 扩展库）  
   **WHEN** 查询以"先"字开头的可接成语  
   **THEN** 返回所有首字为"先"或首字拼音为 xiān 的成语列表，按常见度排序，含释义和常见度标签

2. **GIVEN** 游戏会话已创建（单人无尽模式），起始成语为"一马当先"  
   **WHEN** 提交"先发制人"作为接龙  
   **THEN** 返回 `valid: true`，`score_delta = 100`，`chain_length` 递增，释义自动包含在返回中

3. **GIVEN** 游戏进行中  
   **WHEN** 提交"先发制人"但首字不匹配当前尾字  
   **THEN** 返回 `valid: false`，`reason: "wrong_first_char"`，附带友好提示消息

4. **GIVEN** 游戏进行中  
   **WHEN** 提交一个不存在于题库中的四字组合  
   **THEN** 返回 `valid: false`，`reason: "not_in_bank"`

5. **GIVEN** 玩家使用生僻成语（rarity = rare）接龙成功  
   **WHEN** 计算得分  
   **THEN** 基础分为 150，若 <3 秒提交再 +50 速度奖励

6. **GIVEN** 单人无尽模式，AI 难度为中级  
   **WHEN** 请求 AI 回合  
   **THEN** AI 在 3-5 秒内返回一个有效接龙成语，从常见+进阶库中选择

7. **GIVEN** 1v1 PK 模式，三回合制第一回合  
   **WHEN** 一方 10 秒倒计时归零未提交有效成语  
   **THEN** 该方本回合判负，`round_scores` 更新，自动进入第二回合

8. **GIVEN** 多人车轮战（4 人），玩家 B 已淘汰  
   **WHEN** 轮转到下一位玩家  
   **THEN** 跳过玩家 B，直接轮到玩家 C

9. **GIVEN** 玩家累计接龙 200 次 + 使用 0 个生僻成语  
   **WHEN** 游戏结束后更新称号  
   **THEN** 称号升级为"成语达人"

10. **GIVEN** 防作弊检查开启  
    **WHEN** 客户端提交时间戳与服务端差距 > 2000ms  
    **THEN** 该次提交被标记为可疑

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration: `docker compose exec backend npm run db:migrate`
5. 执行 Seed: `docker compose exec backend npm run db:seed:g5`
6. 验证题库: `curl http://localhost:3000/api/v1/games/g5-idiom-chain/candidates` — 返回候选列表
7. 模拟游戏会话：创建 → 提交接龙 → 检查计分 → AI 回合 → 继续接龙 → 超时处理
8. 验证 PK 模式 WebSocket：三回合制流程完整走通
9. 验证车轮战模式：4 人轮转 + 淘汰 + 跳过
10. 验证防作弊：提交异常时间戳，确认被标记
11. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] API 端点返回正确数据（格式符合 grules/04-api-design.md）
- [ ] 控制台无 Error 级别日志
- [ ] 成语题库完整导入（100+ 核心 + 扩展库均含释义、出处、常见度）
- [ ] 接龙验证引擎同字/同音字匹配正确
- [ ] 计分引擎三档分数 + 速度奖励正确
- [ ] AI 对手三档难度行为符合预期
- [ ] PK 三回合制流程完整
- [ ] 车轮战淘汰和跳过逻辑正确
- [ ] 称号晋级逻辑正确
- [ ] 防作弊模块全部校验通过
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-001-g5-idiom-chain-backend.md`

## 自检重点

- [ ] 安全: 所有接龙验证和计分在服务端完成，客户端无法伪造
- [ ] 安全: 防作弊三件套（时间/频率/内容校验）全部实现
- [ ] 安全: RLS 策略正确，用户只能读取/修改自己的掌握度和称号数据
- [ ] 性能: 候选列表查询 < 100ms（首字/拼音索引命中）
- [ ] 性能: 接龙验证 < 50ms 响应
- [ ] 性能: 游戏状态管理器内存及时清理，无泄漏
- [ ] 类型同步: Zod Schema 与数据库字段一致
- [ ] 并发: PK 模式多人同时提交时回合交替正确无竞态
- [ ] 数据: 成语题库首尾字及拼音标注准确，释义完整
