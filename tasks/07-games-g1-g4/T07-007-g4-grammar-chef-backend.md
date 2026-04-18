# T07-007: G4 语法大厨 — 后端题库与游戏逻辑

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10+

## 需求摘要

实现 G4 语法大厨的后端游戏逻辑：句型题库（目标句意 + 正确词序 + 干扰词）、订单生成 API、语序验证引擎（服务端裁决）、计分引擎（Combo 倍率 + 关联词加分 + VIP 双倍 + 速度加分）、难度递增控制器、顾客耐心模型。题库 100% 来自 L4 课程累计 3200 词汇 + 60 个成语 + 复杂关联词（因为…所以…、虽然…但是…、不但…而且…、如果…就…）。支持单人经营/限时、1v1 PK（各自厨房比完成数）、多人协作（2 人分工：选词手 + 排序手）四种子模式。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/04-g4-grammar-chef.md` — G4 完整 PRD
  - §二 子模式规则（经营/限时/PK/协作）
  - §三 厨房布局（传送带 + 操作台 + 锅区）
  - §四 核心交互（接单 → 选词 → 排序 → 提交，正确/错误/超时三种结果）
  - §四.5 关联词特殊食材（Rose 红底 + 金色边框 + 成对使用加分）
  - §五 难度递增（句子长度、耐心时间、干扰词数量、句型复杂度）
  - §五.4 VIP 顾客（每 5 位出现、难度 +1、双倍分 + 双倍惩罚）
  - §六 生命值系统（3 位顾客离开 → Game Over）
  - §七 PK 模式（独立厨房、不同订单、同难度）
- 游戏设计: `game/04-grammar-chef.md` — G4 完整玩法设计
  - §二 核心玩法（食材类型、难度递进）
  - §七 技术要点（SentenceValidator、服务端验证）
- 课程内容: `course/level-04.md` — L4 篇章理解
  - 累计 3200 词汇、800 字会写、200 个成语、复杂关联词、修辞手法
- 通用系统: `product/apps/05-game-common/` — 匹配、结算、段位规则
- 编码规范: `grules/05-coding-standards.md` §三 — 后端 Express 规范
- API 设计: `grules/04-api-design.md` — 统一响应格式
- 关联任务: T06-013 → 本任务 → T07-008（G4 前端）

## 技术方案

### 数据库设计

#### 1. G4 句型题库

```sql
-- 语法大厨题库（句型 + 正确语序 + 干扰词）
CREATE TABLE g4_sentence_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_meaning TEXT NOT NULL,            -- 目标句意（顾客"点菜"内容）
  correct_sentence TEXT NOT NULL,          -- 正确完整句子
  correct_word_order TEXT[] NOT NULL,      -- 正确词序数组 ["虽然","天气","很冷","，","但是","我们","还是","去了","公园","。"]
  word_details JSONB NOT NULL,             -- 每个词的详情 [{word, pinyin, pos, is_conjunction}]
  distractor_words TEXT[] NOT NULL,        -- 干扰词列表
  distractor_details JSONB NOT NULL,       -- 干扰词详情 [{word, pinyin, pos}]
  conjunction_pairs JSONB DEFAULT '[]',    -- 关联词对 [{"a":"虽然","b":"但是"}]
  sentence_type VARCHAR(30) NOT NULL,      -- simple / compound / complex / rhetoric
  word_count INTEGER NOT NULL,             -- 正确句子词数
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  patience_seconds INTEGER NOT NULL DEFAULT 20,  -- 推荐顾客耐心秒数
  course_level INTEGER NOT NULL DEFAULT 4,
  course_module VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g4_sb_difficulty ON g4_sentence_bank(difficulty);
CREATE INDEX idx_g4_sb_type ON g4_sentence_bank(sentence_type);
CREATE INDEX idx_g4_sb_word_count ON g4_sentence_bank(word_count);

ALTER TABLE g4_sentence_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g4_sb_read" ON g4_sentence_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g4_sb_admin" ON g4_sentence_bank FOR ALL TO service_role USING (true);
```

#### 2. 用户掌握度表

```sql
CREATE TABLE g4_user_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence_id UUID NOT NULL REFERENCES g4_sentence_bank(id) ON DELETE CASCADE,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  avg_completion_sec REAL,                -- 平均完成时间
  last_seen_at TIMESTAMPTZ,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sentence_id)
);

CREATE INDEX idx_g4_mastery_user ON g4_user_mastery(user_id);
ALTER TABLE g4_user_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g4_mastery_own" ON g4_user_mastery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 获取订单（游戏开始 / 下一位顾客）

```
POST /api/v1/games/g4-grammar-chef/order
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "mode": "solo_manage" | "solo_timed" | "pk_1v1" | "coop",
  "completed_orders": 8,
  "current_combo": 3,
  "difficulty_preset": "auto"
}

Response 200:
{
  "code": 0,
  "data": {
    "order": {
      "order_id": "uuid",
      "customer": {
        "name": "王老板",
        "avatar_id": "avatar_03",
        "is_vip": false,
        "patience_sec": 20
      },
      "target_meaning": "虽然天气很冷，但是我们还是去了公园。",
      "conjunction_highlight": ["虽然", "但是"],
      "conveyor_words": [
        { "word_id": "uuid", "word": "虽然", "pinyin": "suīrán", "pos": "conjunction", "is_correct": true },
        { "word_id": "uuid", "word": "天气", "pinyin": "tiānqì", "pos": "noun", "is_correct": true },
        { "word_id": "uuid", "word": "因为", "pinyin": "yīnwèi", "pos": "conjunction", "is_correct": false },
        ...
      ],
      "correct_word_count": 10,
      "slot_count": 12
    },
    "difficulty_info": {
      "level": 3,
      "sentence_type": "compound",
      "distractor_count": 3
    }
  }
}
```

#### 2. 提交语序

```
POST /api/v1/games/g4-grammar-chef/sessions/:sessionId/submit
Headers: Authorization: Bearer {token}
Body: {
  "order_id": "uuid",
  "word_sequence": ["虽然", "天气", "很冷", "，", "但是", "我们", "还是", "去了", "公园", "。"],
  "completion_sec": 12.5,
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "correct": true,
    "score_breakdown": {
      "base_score": 50,
      "combo_multiplier": 1.5,
      "conjunction_bonus": 50,         // 成对关联词"虽然…但是…"
      "speed_bonus": 10,               // < 8 秒完成
      "vip_multiplier": 1,             // VIP 为 2
      "total": 135
    },
    "current_score": 1250,
    "combo_count": 4,
    "combo_effect": null,              // 达到 5 时返回 { label: "大厨上线!!", color: "amber" }
    "failed_customers": 0,
    "server_timestamp": 1714000000030
  }
}
```

**提交错误时**:
```json
{
  "code": 0,
  "data": {
    "correct": false,
    "correct_sequence": ["虽然", "天气", "很冷", "，", "但是", "我们", "还是", "去了", "公园", "。"],
    "error_positions": [3, 4],         // 客户端可高亮错误位置
    "score_delta": -10,
    "current_score": 1240,
    "combo_count": 0,                  // Combo 中断
    "server_timestamp": 1714000000030
  }
}
```

#### 3. 顾客超时离开

```
POST /api/v1/games/g4-grammar-chef/sessions/:sessionId/timeout
Headers: Authorization: Bearer {token}
Body: {
  "order_id": "uuid",
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "score_delta": -20,                // VIP 为 -40
    "current_score": 1210,
    "failed_customers": 1,
    "game_over": false,                // 达到 3 时为 true
    "server_timestamp": 1714000000020
  }
}
```

#### 4. PK 模式进度同步（WebSocket）

```typescript
// 服务端 → 所有客户端
interface G4ProgressSyncEvent {
  type: 'g4_progress_sync'
  session_id: string
  player_states: Record<string, {
    completed_orders: number
    score: number
    combo: number
    failed_customers: number
    is_game_over: boolean
  }>
  timestamp: number
}

// 协作模式 — 实时操作同步
interface G4CoopActionEvent {
  type: 'g4_coop_action'
  session_id: string
  action: 'word_placed' | 'word_removed' | 'word_reordered' | 'submit'
  player_id: string
  player_role: 'selector' | 'sorter'
  data: {
    word_id?: string
    slot_index?: number
    word_sequence?: string[]
  }
  timestamp: number
}
```

### 服务端核心逻辑

#### 订单生成器

```typescript
// backend/src/services/games/g4/order-generator.ts

class G4OrderGenerator {
  /**
   * 生成订单（根据难度曲线选题）
   * PRD §五.1:
   * - 0-5 单: 4-6 词，简单句（主谓宾），2 个干扰词，25 秒耐心
   * - 6-10 单: 5-7 词，含修饰词，3 个干扰词，22 秒
   * - 11-20 单: 6-8 词，含单关联词，3-4 个干扰词，20 秒
   * - 21-30 单: 7-10 词，含成对关联词，4 个干扰词，18 秒
   * - 31-40 单: 8-12 词，复句+句式转换，5 个干扰词，16 秒
   * - 41+单: 10-14 词，多重复句+混合关联词，5-6 个干扰词，15 秒
   */
  generateOrder(completedOrders: number, mode: GameMode, userMastery: MasteryData): Order

  /**
   * VIP 顾客（PRD §五.4）：
   * - 每 5 位普通顾客后出现 1 位 VIP
   * - 难度 = 当前难度 +1 级
   * - 正确双倍分，超时双倍扣分
   */
  generateVIPOrder(baseDifficulty: number): Order

  /**
   * 干扰词选取（PRD §三.4.1）：
   * - 语义相近：目标 "因为" → 干扰 "所以"、"但是"
   * - 同词性：目标名词 → 干扰名词
   * - 不会完全无关（避免太容易排除）
   */
  selectDistractors(correctWords: WordDetail[], count: number): WordDetail[]

  /**
   * 传送带排列：正确词 + 干扰词随机乱序
   */
  shuffleConveyorWords(correctWords: WordDetail[], distractors: WordDetail[]): WordDetail[]
}
```

#### 语序验证引擎

```typescript
// backend/src/services/games/g4/sentence-validator.ts

class G4SentenceValidator {
  /**
   * 验证提交的词序是否正确
   * - 严格匹配：提交序列 === 正确序列（包含标点符号位置）
   * - 关联词容错：部分关联词位置可灵活（如"因为"可在句首或分句首）
   */
  validate(submitted: string[], correct: string[], toleranceRules?: ToleranceRule[]): ValidationResult

  /**
   * 识别错误位置（错误提交时返回给客户端学习）
   * - 标记哪些位置的词与正确答案不同
   */
  findErrorPositions(submitted: string[], correct: string[]): number[]

  /**
   * 关联词配对检测
   * - 检查提交中是否包含完整的关联词对
   * - 返回配对使用情况（用于计算加分）
   */
  checkConjunctionPairs(submitted: string[], conjunctionPairs: ConjunctionPair[]): ConjunctionResult
}
```

#### 计分引擎

```typescript
// backend/src/services/games/g4/scoring-engine.ts

class G4ScoringEngine {
  private readonly BASE_ORDER_SCORE = 50
  private readonly CONJUNCTION_SINGLE_BONUS = 20     // 单个关联词加分
  private readonly CONJUNCTION_PAIR_BONUS = 50       // 成对关联词加分
  private readonly SPEED_BONUS_THRESHOLD_SEC = 8     // < 8 秒完成加 10 分
  private readonly SPEED_BONUS = 10
  private readonly ERROR_PENALTY = -10
  private readonly TIMEOUT_PENALTY = -20
  private readonly VIP_MULTIPLIER = 2

  private readonly COMBO_MULTIPLIERS: Record<number, number> = {
    3: 1.5,    // 连续 3 单
    5: 2.0,    // 连续 5 单
    10: 3.0,   // 连续 10 单
  }
  private readonly COMBO_EFFECTS = {
    3: { label: '好厨艺!', color: 'sky' },
    5: { label: '大厨上线!!', color: 'amber' },
    10: { label: '厨神降临!!!', color: 'rose_amber_gradient' },
  }

  calculateSubmitScore(params: {
    correct: boolean
    isVIP: boolean
    completionSec: number
    currentCombo: number
    conjunctionResult: ConjunctionResult
  }): ScoreResult
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g4/anti-cheat.ts

class G4AntiCheat {
  /** 提交频率校验：同一订单两次提交间隔 < 1s 标记可疑 */
  validateSubmitFrequency(lastSubmitTs: number, currentTs: number): boolean

  /** 完成时间合理性：< 2 秒完成含 8 个词的订单标记可疑 */
  validateCompletionTime(wordCount: number, completionSec: number): boolean

  /** 协作模式角色校验：选词手不能触发排序操作 */
  validateCoopRole(playerId: string, action: string, assignedRole: string): boolean
}
```

## 范围（做什么）

- 创建 G4 句型题库表 + 用户掌握度表（Migration）
- 从 L4 课程内容导入句型题库（含关联词配对、干扰词）（Seed）
- 实现订单生成器（难度曲线、VIP 顾客、干扰词选取）
- 实现语序验证引擎（严格匹配 + 关联词容错 + 错误位置标记）
- 实现关联词配对检测与加分
- 实现计分引擎（基础分 + Combo + 关联词 + 速度 + VIP）
- 实现顾客耐心模型（按难度配置耐心秒数）
- 实现 PK 模式进度同步（WebSocket 事件）
- 实现协作模式操作同步（选词手/排序手角色隔离）
- 实现防作弊模块
- 与 T06-006 结算 API 对接

## 边界（不做什么）

- 不写 Phaser 前端厨房场景（T07-008）
- 不写匹配系统（T06-005）
- 不写结算/段位逻辑（T06-006）
- 不写皮肤系统（T06-008）
- 不写餐厅装修系统（永久视觉装饰，后续任务）

## 涉及文件

- 新建: `backend/src/services/games/g4/order-generator.ts`
- 新建: `backend/src/services/games/g4/sentence-validator.ts`
- 新建: `backend/src/services/games/g4/scoring-engine.ts`
- 新建: `backend/src/services/games/g4/anti-cheat.ts`
- 新建: `backend/src/services/games/g4/types.ts`
- 新建: `backend/src/routers/v1/games/g4-grammar-chef.ts`
- 新建: `backend/src/repositories/g4-sentence-bank.repo.ts`
- 新建: `backend/src/repositories/g4-user-mastery.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g4_grammar_chef.sql`
- 新建: `scripts/seed-g4-sentences.sql`
- 修改: `backend/src/routers/v1/index.ts` — 注册 G4 路由

## 依赖

- 前置: T06-013（游戏通用系统集成验证完成）
- 前置: T06-005（匹配系统 — WebSocket 基础）
- 前置: T06-006（会话/结算 API）
- 后续: T07-008（G4 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** G4 句型题库已导入  
   **WHEN** 调用订单 API（经营模式，第 1 单）  
   **THEN** 返回简单句（4-6 词）+ 2 个干扰词 + 25 秒耐心 + 传送带乱序词列表

2. **GIVEN** 经营模式完成第 20 单  
   **WHEN** 请求下一订单  
   **THEN** 返回含成对关联词的复合句（7-10 词）+ 4 个干扰词 + 18 秒耐心

3. **GIVEN** 经营模式完成第 10 单  
   **WHEN** 下一位顾客到达  
   **THEN** 第 11 位为 VIP 顾客（`is_vip: true`），难度 +1 级

4. **GIVEN** 提交正确语序 "虽然…但是…" 完整关联词对  
   **WHEN** 验证通过  
   **THEN** `correct: true`，`conjunction_bonus: 50`（成对加分）

5. **GIVEN** 提交语序中 "但是" 和 "虽然" 位置颠倒  
   **WHEN** 验证失败  
   **THEN** `correct: false`，返回正确语序 + 标记错误位置 [0, 4]

6. **GIVEN** 连续正确完成 5 单  
   **WHEN** 计算分数  
   **THEN** Combo ×2.0，返回 `combo_effect: { label: "大厨上线!!", color: "amber" }`

7. **GIVEN** VIP 顾客超时离开  
   **WHEN** 计算惩罚  
   **THEN** `score_delta: -40`（双倍扣分），`failed_customers +1`

8. **GIVEN** 协作模式中排序手尝试从传送带抓取食材  
   **WHEN** 角色校验  
   **THEN** 操作被拒绝，返回角色权限错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration + Seed 句型题库数据
5. 验证订单生成 API：难度递增正确
6. 模拟选词-排序-提交完整流程
7. 验证关联词配对加分
8. 验证 PK 模式进度同步 WebSocket
9. 验证协作模式角色隔离
10. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] API 端点返回正确数据
- [ ] 句型题库完整导入（含关联词对信息）
- [ ] 难度曲线按 PRD §五.1 正确递增
- [ ] VIP 顾客每 5 位准时出现
- [ ] 语序验证引擎正确判定（严格 + 关联词容错）
- [ ] 干扰词选取语义相近
- [ ] 协作模式角色隔离正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/07-games-g1-g4/T07-007-g4-grammar-chef-backend.md`

## 自检重点

- [ ] 安全: 语序验证 100% 服务端完成，正确答案不下发给客户端（仅错误时展示学习）
- [ ] 安全: 传送带 is_correct 字段不下发给客户端
- [ ] 安全: RLS 策略正确
- [ ] 安全: 协作模式角色隔离严格
- [ ] 性能: 订单生成（含干扰词选取）< 100ms
- [ ] 性能: 语序验证 < 10ms
- [ ] 数据: 干扰词语义相近但不与正确词混淆
- [ ] 并发: 协作模式双方操作无竞态
