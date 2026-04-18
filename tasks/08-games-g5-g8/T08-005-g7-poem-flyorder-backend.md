# T08-005: G7 古诗飞花令 — 后端题库与游戏逻辑

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 14+

## 需求摘要

实现 G7 古诗飞花令的后端游戏逻辑。飞花令以关键字/关键主题为令，玩家轮流吟出包含指定关键字的古诗句。核心功能：古诗词数据库建设（唐宋诗词 3000+ 首 + 按字建立倒排索引）、三层验证引擎（包含关键字 → 本局未重复 → 是真实古诗句）、稀有度计分系统、AI 对手逻辑（多档难度）、PK 回合制与车轮战、称号系统（诗童 → 诗仙六级）。关键字池从 L7-L8 课程古诗内容提取。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/03-g7-poem-flyorder.md` — G7 完整 PRD
  - §二 子模式规则（无尽/接力/1v1 PK/车轮战）
  - §三 游戏画面布局（关键字展示区、诗句展示区、操作区、连击计数）
  - §四 核心交互（关键字揭晓、输入联想、吟诵提交、验证反馈链）
  - §五 PK 模式（Bo3/Bo5 + 回合交替 + 用时比较）
  - §六 上瘾机制（稀有诗句分加成、称号进阶、每日一字）
- 游戏设计: `game/07-poem-flyorder.md` — G7 完整玩法设计
  - §二 核心玩法（飞花令规则、验证逻辑、AI 对手）
  - §三 游戏模式（四种子模式）
  - §七 技术要点（倒排索引、三层验证、稀有度计算）
  - §八 题库（唐诗 300 首 + 宋词 200 首 + 课标古诗 75 首）
- 课程内容: `course/level-07.md`, `course/level-08.md` — L7-L8 古诗词
- 通用系统: `product/apps/05-game-common/` — 匹配、结算
- 编码规范: `grules/05-coding-standards.md` §三
- API 设计: `grules/04-api-design.md`
- 关联任务: T06-013 → 本任务 → T08-006（G7 前端）

## 技术方案

### 数据库设计

#### 1. 古诗词库

```sql
CREATE TABLE g7_poem_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,                 -- 诗词标题（如 "静夜思"）
  author VARCHAR(50) NOT NULL,                 -- 作者
  dynasty VARCHAR(20) NOT NULL,                -- 朝代
  full_text TEXT NOT NULL,                     -- 全文
  sentences JSONB NOT NULL,                    -- 逐句拆分 ["床前明月光", "疑是地上霜", ...]
  pinyin JSONB,                                -- 逐句拼音
  genre VARCHAR(30),                           -- 体裁（五言绝句/七言律诗/词等）
  theme VARCHAR(50),                           -- 主题（思乡/边塞/田园/咏物等）
  rarity INTEGER NOT NULL DEFAULT 1 CHECK (rarity BETWEEN 1 AND 5),
  -- 1=常见课标 2=知名篇 3=进阶 4=生僻 5=罕见
  is_curriculum BOOLEAN NOT NULL DEFAULT false, -- 是否课标要求
  course_levels INTEGER[] DEFAULT '{}',         -- 关联课程级别
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g7_poem_author ON g7_poem_bank(author);
CREATE INDEX idx_g7_poem_dynasty ON g7_poem_bank(dynasty);
CREATE INDEX idx_g7_poem_rarity ON g7_poem_bank(rarity);
CREATE INDEX idx_g7_poem_active ON g7_poem_bank(is_active);

ALTER TABLE g7_poem_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g7_poem_read" ON g7_poem_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g7_poem_admin" ON g7_poem_bank FOR ALL TO service_role USING (true);
```

#### 2. 诗句倒排索引表

```sql
-- 按字建立倒排索引，加速飞花令查询
CREATE TABLE g7_sentence_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poem_id UUID NOT NULL REFERENCES g7_poem_bank(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,                      -- 单句（如 "床前明月光"）
  sentence_pinyin TEXT,                        -- 拼音
  sentence_index INTEGER NOT NULL,             -- 在原诗中的位置（第几句）
  char_set TEXT[] NOT NULL,                    -- 去重字集合 ["床","前","明","月","光"]
  rarity INTEGER NOT NULL DEFAULT 1,           -- 继承自诗词
  genre VARCHAR(30),
  theme VARCHAR(50)
);

-- 关键：GIN 索引加速包含查询
CREATE INDEX idx_g7_sentence_chars ON g7_sentence_index USING GIN (char_set);
CREATE INDEX idx_g7_sentence_rarity ON g7_sentence_index(rarity);

ALTER TABLE g7_sentence_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g7_sentence_read" ON g7_sentence_index FOR SELECT TO authenticated USING (true);
CREATE POLICY "g7_sentence_admin" ON g7_sentence_index FOR ALL TO service_role USING (true);
```

#### 3. 关键字池表

```sql
CREATE TABLE g7_keyword_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(4) NOT NULL,                 -- 关键字（1-2 字）
  keyword_type VARCHAR(20) NOT NULL CHECK (keyword_type IN ('single_char', 'theme')),
  -- single_char=单字（"月"/"花"） theme=主题（"春"/"离别"）
  sentence_count INTEGER NOT NULL DEFAULT 0,   -- 可匹配诗句数
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  -- 根据可匹配诗句数反向计算：诗句多=简单 诗句少=困难
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g7_keyword_type ON g7_keyword_pool(keyword_type);
CREATE INDEX idx_g7_keyword_diff ON g7_keyword_pool(difficulty);

ALTER TABLE g7_keyword_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g7_keyword_read" ON g7_keyword_pool FOR SELECT TO authenticated USING (true);
CREATE POLICY "g7_keyword_admin" ON g7_keyword_pool FOR ALL TO service_role USING (true);
```

#### 4. 用户称号与掌握度

```sql
CREATE TABLE g7_user_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sentences_used INTEGER NOT NULL DEFAULT 0,  -- 累计使用不同诗句数
  unique_poems_cited INTEGER NOT NULL DEFAULT 0,    -- 引用不同诗词数
  rare_sentences_count INTEGER NOT NULL DEFAULT 0,  -- 稀有诗句使用数
  current_title VARCHAR(10) NOT NULL DEFAULT '诗童',
  -- 诗童 → 诗生 → 诗人 → 诗豪 → 诗圣 → 诗仙
  title_level INTEGER NOT NULL DEFAULT 1 CHECK (title_level BETWEEN 1 AND 6),
  longest_streak INTEGER NOT NULL DEFAULT 0,        -- 最长连击
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE g7_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g7_mastery_own" ON g7_user_mastery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 开始新局 / 获取关键字

```
POST /api/v1/games/g7-poem-flyorder/start
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "mode": "solo_endless" | "solo_relay" | "pk_1v1" | "pk_wheel",
  "player_ids": ["uuid1", "uuid2?"],
  "difficulty_preset": "auto"
}

Response 201:
{
  "code": 0,
  "data": {
    "keyword": "月",
    "keyword_type": "single_char",
    "hint_sentence": "床前明月光",
    "available_count": 156,
    "time_limit_seconds": 30,
    "round": 1
  }
}
```

#### 2. 查询候选诗句（联想提示）

```
POST /api/v1/games/g7-poem-flyorder/sessions/:sessionId/candidates
Headers: Authorization: Bearer {token}
Body: {
  "input_text": "明月",
  "keyword": "月",
  "limit": 10
}

Response 200:
{
  "code": 0,
  "data": {
    "candidates": [
      {
        "sentence": "明月几时有",
        "author": "苏轼",
        "title": "水调歌头",
        "rarity": 1,
        "already_used": false
      },
      {
        "sentence": "明月松间照",
        "author": "王维",
        "title": "山居秋暝",
        "rarity": 2,
        "already_used": true
      }
    ]
  }
}
```

#### 3. 提交吟诵

```
POST /api/v1/games/g7-poem-flyorder/sessions/:sessionId/submit
Headers: Authorization: Bearer {token}
Body: {
  "player_id": "uuid",
  "sentence": "海上生明月",
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "valid": true,
    "validation_detail": {
      "contains_keyword": true,
      "not_repeated": true,
      "is_real_poem": true
    },
    "poem_info": {
      "title": "望月怀远",
      "author": "张九龄",
      "full_text": "海上生明月，天涯共此时...",
      "dynasty": "唐"
    },
    "score": 180,
    "score_detail": {
      "base": 100,
      "rarity_bonus": 50,
      "speed_bonus": 30
    },
    "streak": 5,
    "total_score": 820,
    "server_timestamp": 1714000000030
  }
}

// 验证失败示例
{
  "code": 0,
  "data": {
    "valid": false,
    "validation_detail": {
      "contains_keyword": true,
      "not_repeated": false,
      "is_real_poem": true
    },
    "failure_reason": "repeated",
    "message": "这句诗已经用过了",
    "previous_user": "Player2"
  }
}
```

#### 4. AI 回合

```
POST /api/v1/games/g7-poem-flyorder/sessions/:sessionId/ai-turn
Headers: Authorization: Bearer {token}
Body: {
  "keyword": "月",
  "ai_difficulty": 3,
  "used_sentences": ["床前明月光", "明月几时有"]
}

Response 200:
{
  "code": 0,
  "data": {
    "sentence": "月落乌啼霜满天",
    "poem_info": { ... },
    "rarity": 2,
    "think_time_ms": 3500,
    "score": 130
  }
}
```

#### 5. WebSocket 广播

```typescript
// 服务端 → 所有客户端：对手吟诵结果
interface PoemSubmitBroadcast {
  type: 'g7_submit_result'
  player_id: string
  sentence: string
  poem_info: { title: string; author: string; dynasty: string }
  valid: boolean
  score: number
  streak: number
  timestamp: number
}

// 服务端 → 所有客户端：新关键字
interface NewKeywordBroadcast {
  type: 'g7_new_keyword'
  keyword: string
  round: number
  timestamp: number
}

// 服务端 → 所有客户端：回合 / 车轮战淘汰
interface PoemRoundEndBroadcast {
  type: 'g7_round_end'
  winner_id: string | null
  round: number
  player_scores: Record<string, number>
  timestamp: number
}

interface PoemEliminationBroadcast {
  type: 'g7_elimination'
  eliminated_id: string
  reason: 'timeout' | 'invalid' | 'repeated'
  remaining_players: string[]
  timestamp: number
}
```

### 服务端核心逻辑

#### 三层验证引擎

```typescript
// backend/src/services/games/g7/poem-validator.ts

class G7PoemValidator {
  /**
   * 三层验证（PRD §4.3、game 设计 §7.2）
   *
   * Layer 1: 包含关键字
   *   输入诗句中至少有一个字 == 关键字
   *   关键字为主题时，匹配该主题标签下的诗句
   *
   * Layer 2: 本局未重复
   *   在 usedSentences Set 中查找（精确匹配）
   *   如已用过，返回之前使用者信息
   *
   * Layer 3: 是否真实古诗句
   *   在 g7_sentence_index 中精确匹配或模糊匹配（允许省略标点）
   *   返回匹配的诗词完整信息
   */
  async validate(sentence: string, keyword: string, usedSentences: Set<string>): Promise<ValidationResult>

  /**
   * 模糊匹配
   * 去除标点、空格后比对
   * 允许繁简体混用
   */
  private fuzzyMatch(input: string, dbSentence: string): boolean
}
```

#### 稀有度计分引擎

```typescript
// backend/src/services/games/g7/scoring-engine.ts

class G7ScoringEngine {
  /**
   * 吟诵计分（PRD §6.1）
   *
   * 基础分 100
   * + 稀有度加成：
   *   rarity 1（常见课标）: +0
   *   rarity 2（知名篇）: +20
   *   rarity 3（进阶）: +50
   *   rarity 4（生僻）: +80
   *   rarity 5（罕见）: +150
   * + 速度奖励：<5s → +30 / <10s → +20 / <20s → +10
   * + 连击加成：连续 3 次 ×1.2 / 5 次 ×1.5 / 10 次 ×2.0
   */
  calculateScore(params: {
    rarity: number
    responseTimeSeconds: number
    streak: number
  }): { total: number; base: number; rarityBonus: number; speedBonus: number; streakMultiplier: number }
}
```

#### AI 对手逻辑

```typescript
// backend/src/services/games/g7/ai-opponent.ts

class G7AIOpponent {
  /**
   * AI 吟诵（PRD §4.6）
   *
   * 难度 1-2（初学）：只用 rarity 1-2 诗句，思考 4-6 秒
   * 难度 3（进阶）：使用 rarity 1-3，偶尔用 4，思考 3-5 秒
   * 难度 4-5（大师）：使用全部 rarity，偶尔故意用罕见，思考 2-4 秒
   *
   * AI 选择策略：
   * 1. 查询关键字匹配 + 未用诗句
   * 2. 按难度设定的 rarity 范围过滤
   * 3. 加权随机（偶尔超出范围制造惊喜）
   * 4. 模拟思考时间（随难度递减）
   */
  async selectSentence(keyword: string, usedSentences: Set<string>, difficulty: number): Promise<AIResponse>
}
```

#### 称号系统

```typescript
// backend/src/services/games/g7/title-service.ts

class G7TitleService {
  /**
   * 称号进阶规则（PRD §6.3）
   *
   * 诗童 Lv1: 累计使用 0-49 个不同诗句
   * 诗生 Lv2: 50-149 个
   * 诗人 Lv3: 150-299 个
   * 诗豪 Lv4: 300-499 个
   * 诗圣 Lv5: 500-799 个
   * 诗仙 Lv6: 800+ 个
   */
  checkTitleUpgrade(userId: string, newSentenceCount: number): Promise<TitleUpgradeResult | null>
}
```

#### 游戏状态管理

```typescript
// backend/src/services/games/g7/game-state.ts

interface G7GameState {
  sessionId: string
  mode: 'solo_endless' | 'solo_relay' | 'pk_1v1' | 'pk_wheel'
  currentKeyword: string
  usedSentences: Map<string, { userId: string; timestamp: number }>
  players: Map<string, G7PlayerState>
  currentTurnPlayerId: string | null
  turnStartTime: number
  round: number
  roundWins: Record<string, number>
  eliminatedPlayers: Set<string>
  keywordHistory: string[]
  startedAt: number
}

interface G7PlayerState {
  userId: string
  totalScore: number
  streak: number
  sentencesUsed: string[]
  uniquePoemsCount: number
  rareSentenceCount: number
  isEliminated: boolean
}

class G7GameStateManager {
  initSession(sessionId: string, config: SessionConfig): G7GameState
  setKeyword(sessionId: string): KeywordData
  handleSubmit(sessionId: string, playerId: string, sentence: string): SubmitResult
  handleAITurn(sessionId: string): AITurnResult
  handleTimeout(sessionId: string, playerId: string): TimeoutResult
  nextTurn(sessionId: string): TurnData
  eliminatePlayer(sessionId: string, playerId: string, reason: string): void
  checkGameOver(sessionId: string): GameOverResult | null
  getSettlementData(sessionId: string): SettlementData
  cleanup(sessionId: string): void
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g7/anti-cheat.ts

class G7AntiCheat {
  /** 验证提交时间戳：不可能 < 1 秒完成吟诵 */
  validateResponseTime(turnStartTime: number, submitTime: number): boolean

  /** 验证诗句来源：服务端二次查库确认 */
  validateSentenceSource(sentence: string): Promise<boolean>

  /** 频率限制：同一 session 内提交频率不超过 1 次/2 秒 */
  validateSubmitFrequency(sessionId: string, playerId: string): boolean
}
```

## 范围（做什么）

- 创建古诗词库表 + 诗句倒排索引表 + 关键字池表 + 用户称号表（Migration）
- 导入唐诗 300 首 + 宋词 200 首 + 课标古诗 75 首（含逐句拆分、拼音、稀有度）
- 构建诗句按字倒排索引
- 构建关键字池（统计每个字可匹配的诗句数 → 反向计算难度）
- 实现三层验证引擎（关键字包含 + 未重复 + 真实诗句）
- 实现稀有度计分引擎（稀有度加成 + 速度奖励 + 连击倍数）
- 实现 AI 对手逻辑（5 档难度 + 模拟思考时间）
- 实现关键字选择逻辑（按难度递增 + 避免连续重复主题）
- 实现称号系统（6 级进阶 + 升级事件）
- 实现 PK 回合制 + 车轮战淘汰逻辑
- 实现联想提示查询（按输入文本模糊匹配 + 标记已用）
- 实现游戏状态管理器
- 实现防作弊模块
- 与 T06-006 结算 API 对接

## 边界（不做什么）

- 不写 Phaser 前端场景（T08-006）
- 不写匹配/结算页面（T06 已完成）
- 不实现语音吟诵识别（后期功能）
- 不实现诗词鉴赏详情页（属于 Discover China 模块）
- 不做每日一字推送调度（T14 运营模块）

## 涉及文件

- 新建: `backend/src/services/games/g7/poem-validator.ts`
- 新建: `backend/src/services/games/g7/scoring-engine.ts`
- 新建: `backend/src/services/games/g7/ai-opponent.ts`
- 新建: `backend/src/services/games/g7/title-service.ts`
- 新建: `backend/src/services/games/g7/game-state.ts`
- 新建: `backend/src/services/games/g7/keyword-selector.ts`
- 新建: `backend/src/services/games/g7/anti-cheat.ts`
- 新建: `backend/src/services/games/g7/types.ts`
- 新建: `backend/src/routers/v1/games/g7-poem-flyorder.ts`
- 新建: `backend/src/repositories/g7-poem-bank.repo.ts`
- 新建: `backend/src/repositories/g7-sentence-index.repo.ts`
- 新建: `backend/src/repositories/g7-keyword-pool.repo.ts`
- 新建: `backend/src/repositories/g7-user-mastery.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g7_poem_flyorder.sql`
- 新建: `scripts/seed-g7-poems.sql`
- 新建: `scripts/build-g7-index.ts` — 倒排索引构建脚本
- 修改: `backend/src/routers/v1/index.ts` — 注册 G7 路由

## 依赖

- 前置: T06-013（游戏通用系统集成）
- 前置: T06-005（WebSocket 基础）
- 前置: T06-006（会话/结算 API）
- 后续: T08-006（G7 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 古诗词库已导入  
   **WHEN** 开始新局，指定关键字 "月"  
   **THEN** 返回关键字 + 可匹配诗句数 + 提示诗句

2. **GIVEN** 关键字为 "月"  
   **WHEN** 提交 "海上生明月"  
   **THEN** 三层验证全通过 → `valid: true` + 返回诗词信息（张九龄《望月怀远》） + 稀有度得分

3. **GIVEN** "床前明月光" 已被使用  
   **WHEN** 再次提交 "床前明月光"  
   **THEN** `valid: false` + `failure_reason: "repeated"` + 返回之前使用者

4. **GIVEN** 关键字为 "月"  
   **WHEN** 提交 "大江东去浪淘尽"（不含 "月"）  
   **THEN** `valid: false` + `failure_reason: "missing_keyword"`

5. **GIVEN** 提交虚构诗句 "月上高楼人已散"  
   **WHEN** 数据库无匹配  
   **THEN** `valid: false` + `failure_reason: "not_real_poem"`

6. **GIVEN** AI 难度 3  
   **WHEN** 请求 AI 回合  
   **THEN** AI 选出 rarity 1-3 的真实诗句 + 模拟思考 3-5 秒

7. **GIVEN** 玩家连续 5 次有效吟诵  
   **WHEN** 第 5 次提交成功  
   **THEN** 连击倍数 ×1.5 应用于得分

8. **GIVEN** 玩家累计使用 50 个不同诗句  
   **WHEN** 第 50 句提交成功  
   **THEN** 称号从 "诗童" 升级为 "诗生"

9. **GIVEN** 车轮战 4 人  
   **WHEN** 一人超时未答  
   **THEN** 该玩家被淘汰 + 广播淘汰消息 + 后续轮转跳过

10. **GIVEN** 倒排索引已构建  
    **WHEN** 查询关键字 "月" 的候选诗句  
    **THEN** 返回结果 < 100ms，按稀有度排序

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration + Seed + 倒排索引构建
5. 验证关键字查询：不同关键字返回不同数量候选
6. 模拟完整飞花令流程：开始 → 关键字 → 吟诵 → 验证 → 计分 → AI → 超时
7. 验证三层验证逐层拦截
8. 验证 PK + 车轮战淘汰逻辑
9. 验证称号升级
10. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 古诗词库完整导入（575+ 首）
- [ ] 倒排索引构建成功
- [ ] 三层验证逻辑正确
- [ ] 稀有度计分准确
- [ ] AI 对手按难度选诗合理
- [ ] 称号系统升级正确
- [ ] PK/车轮战同步正常
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-005-g7-poem-flyorder-backend.md`

## 自检重点

- [ ] 安全: 诗句验证服务端执行，不信任客户端判定
- [ ] 安全: 防作弊（时间戳/频率/来源三重校验）
- [ ] 安全: RLS 策略正确
- [ ] 性能: 倒排索引查询 < 100ms
- [ ] 性能: 三层验证总耗时 < 200ms
- [ ] 数据: 诗词数据准确（无错字、无张冠李戴）
- [ ] 数据: 稀有度分级合理（课标诗 rarity=1，冷门 rarity=4-5）
- [ ] 算法: AI 选诗不重复、难度匹配
