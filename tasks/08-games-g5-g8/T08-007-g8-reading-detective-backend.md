# T08-007: G8 阅读侦探社 — 后端题库与游戏逻辑

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 14+

## 需求摘要

实现 G8 阅读侦探社的后端游戏逻辑。玩家扮演"文字侦探"，阅读 300-800 字短文后，解答 5 道推理题目（涵盖修辞手法识别、作者意图推测、逻辑关系判断、情感色彩分析、文体辨析五大题型）。核心功能：阅读文章库建设（L8-L10 课程联动，150+ 篇，标注文体/主题/难度）、AI 出题引擎（从文章自动生成 5 道四选一推理题）、评级系统（B/A/S/SS/SSS 五级）、侦探称号系统（见习侦探 → 名侦探六级）、案卷档案系统（历史解题记录可回看）。PK 模式为同文竞速。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/04-g8-reading-detective.md` — G8 完整 PRD
  - §二 子模式规则（单人侦查/限时挑战/双人竞速 PK/多人侦探团）
  - §三 游戏画面布局（文章阅读区、线索面板、题目弹窗、案卷档案）
  - §四 核心交互（翻页阅读、线索标记、答题推理、评级揭晓）
  - §五 PK 模式（同文竞速、答题准确率+速度双维度）
  - §六 上瘾机制（侦探评级、称号进阶、完美通关奖章、案卷收集）
- 游戏设计: `game/08-reading-detective.md` — G8 完整玩法设计
  - §二 核心玩法（阅读 → 标记线索 → 推理答题 → 评级）
  - §三 游戏模式（四种子模式）
  - §七 技术要点（AI 出题、评级算法、同步机制）
  - §八 题库（L8 记叙文 + L9 议论文/说明文 + L10 文言文/散文）
- 课程内容: `course/level-08.md`, `course/level-09.md`, `course/level-10.md`
- 通用系统: `product/apps/05-game-common/`
- 编码规范: `grules/05-coding-standards.md` §三
- API 设计: `grules/04-api-design.md`
- 关联任务: T06-013 → 本任务 → T08-008（G8 前端）

## 技术方案

### 数据库设计

#### 1. 阅读文章库

```sql
CREATE TABLE g8_article_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,                  -- 文章标题
  author VARCHAR(50),                           -- 作者（如有）
  content TEXT NOT NULL,                        -- 正文（300-800 字）
  word_count INTEGER NOT NULL,                  -- 字数
  genre VARCHAR(30) NOT NULL CHECK (genre IN (
    'narrative', 'argumentative', 'expository', 'prose', 'classical', 'poetry_appreciation'
  )),
  -- narrative=记叙文 argumentative=议论文 expository=说明文
  -- prose=散文 classical=文言文 poetry_appreciation=诗词鉴赏
  theme VARCHAR(50),                            -- 主题标签
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  course_level INTEGER NOT NULL,                -- 关联课程等级 8/9/10
  key_sentences JSONB,                          -- 关键句标记 [{index, text, type}]
  rhetoric_devices JSONB,                       -- 修辞手法标注 [{type, text, location}]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g8_article_genre ON g8_article_bank(genre);
CREATE INDEX idx_g8_article_diff ON g8_article_bank(difficulty);
CREATE INDEX idx_g8_article_level ON g8_article_bank(course_level);
CREATE INDEX idx_g8_article_active ON g8_article_bank(is_active);

ALTER TABLE g8_article_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g8_article_read" ON g8_article_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g8_article_admin" ON g8_article_bank FOR ALL TO service_role USING (true);
```

#### 2. 题目库（预生成 + AI 动态生成）

```sql
CREATE TABLE g8_question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES g8_article_bank(id) ON DELETE CASCADE,
  question_type VARCHAR(30) NOT NULL CHECK (question_type IN (
    'rhetoric', 'intent', 'logic', 'emotion', 'genre'
  )),
  -- rhetoric=修辞手法识别 intent=作者意图推测 logic=逻辑关系判断
  -- emotion=情感色彩分析 genre=文体辨析
  question_text TEXT NOT NULL,                  -- 题目文本
  options JSONB NOT NULL,                       -- 四个选项 [{label:"A", text:"...", is_correct: false}]
  correct_option VARCHAR(1) NOT NULL,           -- 正确选项 A/B/C/D
  explanation TEXT NOT NULL,                    -- 解析说明
  clue_sentence_index INTEGER,                  -- 关联线索句在文章中的位置索引
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g8_question_article ON g8_question_bank(article_id);
CREATE INDEX idx_g8_question_type ON g8_question_bank(question_type);

ALTER TABLE g8_question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g8_question_read" ON g8_question_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "g8_question_admin" ON g8_question_bank FOR ALL TO service_role USING (true);
```

#### 3. 用户案卷档案

```sql
CREATE TABLE g8_user_casefile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES g8_article_bank(id),
  session_id UUID NOT NULL,
  answers JSONB NOT NULL,                       -- [{question_id, selected, correct, time_seconds}]
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 5,
  total_time_seconds NUMERIC(6,2) NOT NULL,
  rating VARCHAR(3) NOT NULL CHECK (rating IN ('B', 'A', 'S', 'SS', 'SSS')),
  score INTEGER NOT NULL DEFAULT 0,
  clues_found INTEGER NOT NULL DEFAULT 0,       -- 找到的线索数
  is_perfect BOOLEAN NOT NULL DEFAULT false,    -- 5/5 全对
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_g8_casefile_user ON g8_user_casefile(user_id);
CREATE INDEX idx_g8_casefile_article ON g8_user_casefile(article_id);

ALTER TABLE g8_user_casefile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g8_casefile_own" ON g8_user_casefile FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

#### 4. 用户侦探档案（称号与统计）

```sql
CREATE TABLE g8_user_detective (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cases_solved INTEGER NOT NULL DEFAULT 0,    -- 累计破案数
  perfect_cases INTEGER NOT NULL DEFAULT 0,         -- 完美破案数（5/5）
  sss_count INTEGER NOT NULL DEFAULT 0,             -- SSS 评级数
  accuracy_rate NUMERIC(5,4) NOT NULL DEFAULT 0,    -- 累计正确率
  current_title VARCHAR(20) NOT NULL DEFAULT '见习侦探',
  -- 见习侦探 → 助理侦探 → 侦探 → 高级侦探 → 王牌侦探 → 名侦探
  title_level INTEGER NOT NULL DEFAULT 1 CHECK (title_level BETWEEN 1 AND 6),
  favorite_genre VARCHAR(30),                       -- 最擅长文体
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE g8_user_detective ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g8_detective_own" ON g8_user_detective FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 获取文章 + 题目

```
POST /api/v1/games/g8-reading-detective/start
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "mode": "solo_detective" | "solo_timed" | "pk_speed" | "multiplayer_team",
  "player_ids": ["uuid1", "uuid2?"],
  "difficulty_preset": "auto",
  "genre_filter": null
}

Response 201:
{
  "code": 0,
  "data": {
    "article": {
      "id": "uuid",
      "title": "背影",
      "author": "朱自清",
      "content": "我与父亲不相见已二年余了...",
      "word_count": 650,
      "genre": "prose",
      "read_time_estimate": 180
    },
    "questions": [
      {
        "id": "uuid",
        "index": 1,
        "type": "rhetoric",
        "text": "文中「他用两手攀着上面，两脚再向上缩」运用了什么修辞手法？",
        "options": [
          {"label": "A", "text": "比喻"},
          {"label": "B", "text": "白描"},
          {"label": "C", "text": "拟人"},
          {"label": "D", "text": "夸张"}
        ]
      },
      // ... 共 5 题
    ],
    "time_limit_seconds": 600,
    "clue_count": 3
  }
}
```

#### 2. 提交答案（逐题提交）

```
POST /api/v1/games/g8-reading-detective/sessions/:sessionId/answer
Headers: Authorization: Bearer {token}
Body: {
  "player_id": "uuid",
  "question_id": "uuid",
  "question_index": 1,
  "selected_option": "B",
  "time_seconds": 45.2,
  "clues_referenced": [0, 2],
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "data": {
    "correct": true,
    "correct_option": "B",
    "explanation": "这段文字采用白描手法，不加修饰地描写父亲爬月台的动作...",
    "score": 200,
    "score_detail": {
      "base": 100,
      "accuracy_bonus": 50,
      "speed_bonus": 30,
      "clue_bonus": 20
    },
    "progress": {
      "answered": 1,
      "total": 5,
      "correct_so_far": 1
    },
    "server_timestamp": 1714000000030
  }
}
```

#### 3. 完成所有题目 — 获取评级

```
POST /api/v1/games/g8-reading-detective/sessions/:sessionId/complete
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "data": {
    "rating": "SS",
    "rating_detail": {
      "correct_count": 4,
      "total_count": 5,
      "accuracy_rate": 0.8,
      "average_time_seconds": 38.5,
      "clues_found": 3,
      "total_score": 850
    },
    "badges": ["首次散文通关"],
    "title_upgrade": null,
    "casefile_id": "uuid"
  }
}
```

#### 4. 查询案卷档案

```
GET /api/v1/games/g8-reading-detective/casefiles?page=1&limit=10
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "data": {
    "casefiles": [
      {
        "id": "uuid",
        "article_title": "背影",
        "genre": "prose",
        "rating": "SS",
        "correct_count": 4,
        "total_count": 5,
        "score": 850,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 23 }
  }
}
```

#### 5. PK 模式进度同步（WebSocket）

```typescript
// 服务端 → 所有客户端：对手答题进度
interface DetectiveProgressBroadcast {
  type: 'g8_progress'
  player_id: string
  answered: number
  total: number
  correct_so_far: number
  current_question_index: number
  timestamp: number
}

// 服务端 → 所有客户端：对手完成
interface DetectiveCompleteBroadcast {
  type: 'g8_complete'
  player_id: string
  rating: string
  correct_count: number
  total_time_seconds: number
  score: number
  timestamp: number
}

// 服务端 → 所有客户端：最终结算
interface DetectiveSettlementBroadcast {
  type: 'g8_settlement'
  rankings: Array<{
    player_id: string
    rating: string
    correct_count: number
    total_time_seconds: number
    score: number
  }>
  timestamp: number
}
```

### 服务端核心逻辑

#### AI 出题引擎

```typescript
// backend/src/services/games/g8/question-generator.ts

class G8QuestionGenerator {
  /**
   * 为文章生成 5 道推理题（预生成 + AI 动态生成兜底）
   *
   * 优先使用 g8_question_bank 预存题目
   * 若题库不足 5 道 → AI 动态补充
   *
   * 题型分配策略（PRD §2.1）：
   * 每篇文章 5 题必须覆盖至少 3 种题型
   * 推荐分配：rhetoric 1 + intent 1 + logic 1 + emotion 1 + genre 1
   * 若文章不适合某种题型（如非文言文不出文体辨析）→ 替换为其他类型
   */
  async generateQuestions(articleId: string, count: number): Promise<Question[]>

  /**
   * AI 动态出题（调用大模型）
   * Prompt：给定文章内容 + 题型要求 → 生成四选一题目 + 解析
   * 质量校验：选项不重复、正确答案有依据、干扰项有迷惑性
   */
  private async aiGenerateQuestion(article: Article, questionType: string): Promise<Question>
}
```

#### 评级引擎

```typescript
// backend/src/services/games/g8/rating-engine.ts

class G8RatingEngine {
  /**
   * 评级计算规则（PRD §6.1）
   *
   * SSS: 5/5 全对 + 平均答题时间 < 30s + 找到所有线索
   * SS:  5/5 全对 或 (4/5 + 平均时间 < 30s)
   * S:   4/5 或 (3/5 + 平均时间 < 45s)
   * A:   3/5
   * B:   < 3/5
   *
   * 得分计算：
   * 基础分：每题正确 100 分
   * + 速度奖励：< 30s → +50 / < 60s → +30 / < 90s → +10
   * + 线索奖励：每找到 1 个线索 +20 分
   * + 连对奖励：连续答对 3 题 +50 / 4 题 +100 / 5 题 +200
   */
  calculateRating(params: {
    correctCount: number
    totalCount: number
    averageTimeSeconds: number
    cluesFound: number
    totalClues: number
    answers: AnswerDetail[]
  }): { rating: string; score: number; detail: RatingDetail }
}
```

#### 称号系统

```typescript
// backend/src/services/games/g8/title-service.ts

class G8TitleService {
  /**
   * 侦探称号进阶（PRD §6.3）
   *
   * 见习侦探 Lv1: 累计破案 0-9
   * 助理侦探 Lv2: 10-29 案 + 正确率 ≥ 50%
   * 侦探 Lv3: 30-59 案 + 正确率 ≥ 60%
   * 高级侦探 Lv4: 60-99 案 + 正确率 ≥ 70%
   * 王牌侦探 Lv5: 100-199 案 + 正确率 ≥ 75%
   * 名侦探 Lv6: 200+ 案 + 正确率 ≥ 80% + SSS ≥ 20 次
   */
  checkTitleUpgrade(userId: string): Promise<TitleUpgradeResult | null>
}
```

#### 游戏状态管理

```typescript
// backend/src/services/games/g8/game-state.ts

interface G8GameState {
  sessionId: string
  mode: 'solo_detective' | 'solo_timed' | 'pk_speed' | 'multiplayer_team'
  article: Article
  questions: Question[]
  players: Map<string, G8PlayerState>
  startedAt: number
  timeLimitSeconds: number
}

interface G8PlayerState {
  userId: string
  answers: Map<string, AnswerRecord>
  correctCount: number
  totalScore: number
  cluesFound: Set<number>
  startedAt: number
  completedAt: number | null
}

class G8GameStateManager {
  initSession(sessionId: string, config: SessionConfig): G8GameState
  handleAnswer(sessionId: string, playerId: string, questionId: string, selected: string, timeSeconds: number): AnswerResult
  handleComplete(sessionId: string, playerId: string): CompleteResult
  handleTimeout(sessionId: string): TimeoutResult
  getCasefile(sessionId: string, playerId: string): CasefileData
  getSettlementData(sessionId: string): SettlementData
  cleanup(sessionId: string): void
}
```

#### 线索系统

```typescript
// backend/src/services/games/g8/clue-service.ts

class G8ClueService {
  /**
   * 线索管理（PRD §3.3）
   *
   * 每篇文章预标注 2-5 个关键句作为"线索"
   * 线索句在文章中可被玩家"发现"（点击/标记）
   * 找到线索给予额外得分 + 影响评级
   *
   * 线索类型：
   * - 关键论据句（议论文）
   * - 关键描写句（记叙文/散文）
   * - 修辞句（各类）
   * - 转折/因果关键词句（逻辑类）
   */
  getCluesForArticle(articleId: string): Promise<ClueInfo[]>
  recordClueFound(sessionId: string, playerId: string, clueIndex: number): void
}
```

### 防作弊机制

```typescript
// backend/src/services/games/g8/anti-cheat.ts

class G8AntiCheat {
  /** 答题时间校验：不可能 < 3 秒读完题目并答对 */
  validateAnswerTime(questionIndex: number, timeSeconds: number): boolean

  /** 答案提交顺序校验：必须按题目索引顺序提交 */
  validateSubmitOrder(currentIndex: number, expectedIndex: number): boolean

  /** 频率校验：同一题目不可重复提交 */
  validateNoRepeat(sessionId: string, questionId: string): boolean

  /** PK 模式：双方使用相同文章+题目（由服务端保证） */
  validateSamePuzzle(sessionId: string, playerId1: string, playerId2: string): boolean
}
```

## 范围（做什么）

- 创建文章库 + 题目库 + 案卷档案表 + 侦探档案表（Migration）
- 导入阅读文章 150+ 篇（记叙文/议论文/说明文/散文/文言文/诗词鉴赏，标注线索/修辞）
- 为每篇文章预生成 5 道推理题（覆盖五种题型）
- 实现 AI 出题引擎（动态补充题目兜底）
- 实现评级引擎（B/A/S/SS/SSS 五级 + 分项得分）
- 实现称号系统（六级侦探称号 + 升级条件）
- 实现线索标记与计分
- 实现案卷档案 CRUD（历史记录查询 + 分页）
- 实现 PK 模式同文竞速（进度百分比实时推送）
- 实现游戏状态管理器
- 实现防作弊模块
- 与 T06-006 结算 API 对接

## 边界（不做什么）

- 不写 Phaser 前端场景（T08-008）
- 不写匹配/结算页面（T06）
- 不实现文章朗读功能（后期功能）
- 不实现文章推荐算法（T14 运营模块）
- 不做 AI 实时出题（仅预生成 + 兜底补充，非实时调用）

## 涉及文件

- 新建: `backend/src/services/games/g8/question-generator.ts`
- 新建: `backend/src/services/games/g8/rating-engine.ts`
- 新建: `backend/src/services/games/g8/title-service.ts`
- 新建: `backend/src/services/games/g8/game-state.ts`
- 新建: `backend/src/services/games/g8/clue-service.ts`
- 新建: `backend/src/services/games/g8/anti-cheat.ts`
- 新建: `backend/src/services/games/g8/types.ts`
- 新建: `backend/src/routers/v1/games/g8-reading-detective.ts`
- 新建: `backend/src/repositories/g8-article-bank.repo.ts`
- 新建: `backend/src/repositories/g8-question-bank.repo.ts`
- 新建: `backend/src/repositories/g8-user-casefile.repo.ts`
- 新建: `backend/src/repositories/g8-user-detective.repo.ts`
- 新建: `supabase/migrations/XXXXXX_g8_reading_detective.sql`
- 新建: `scripts/seed-g8-articles.sql`
- 新建: `scripts/generate-g8-questions.ts` — 批量出题脚本
- 修改: `backend/src/routers/v1/index.ts` — 注册 G8 路由

## 依赖

- 前置: T06-013（游戏通用系统集成）
- 前置: T06-005（WebSocket 基础）
- 前置: T06-006（会话/结算 API）
- 后续: T08-008（G8 前端 Phaser 游戏场景）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 文章库已导入  
   **WHEN** 请求开始新游戏（散文 + 中等难度）  
   **THEN** 返回一篇散文文章 + 5 道题目（覆盖 ≥ 3 种题型）+ 线索信息

2. **GIVEN** 文章已加载  
   **WHEN** 提交第 1 题答案（选 B）  
   **THEN** 返回 `correct: true/false` + 正确选项 + 解析说明 + 分项得分

3. **GIVEN** 5 题全部答对，平均答题时间 25 秒，找到全部线索  
   **WHEN** 请求完成评级  
   **THEN** 返回 `rating: "SSS"` + 满分 + 完美标记

4. **GIVEN** 答对 3 题，平均时间 50 秒  
   **WHEN** 请求完成评级  
   **THEN** 返回 `rating: "A"` 或 `"S"`（取决于速度分界线）

5. **GIVEN** 题目按顺序提交  
   **WHEN** 尝试跳过第 2 题直接提交第 3 题  
   **THEN** 返回错误：题目提交顺序不正确

6. **GIVEN** 累计完美破案 5 次、总破案 10 次  
   **WHEN** 第 10 次破案完成  
   **THEN** 称号升级为 "助理侦探"

7. **GIVEN** PK 模式双人  
   **WHEN** 一方每答一题  
   **THEN** 对手收到进度广播（已答题数 + 正确数）

8. **GIVEN** 查询案卷档案  
   **WHEN** 请求第 1 页  
   **THEN** 返回最近 10 个案卷（文章标题、评级、得分、日期）

9. **GIVEN** 文章题库不足 5 道题  
   **WHEN** 请求开始游戏  
   **THEN** AI 出题引擎自动补充至 5 道

10. **GIVEN** 答题时间 < 3 秒  
    **WHEN** 提交答案  
    **THEN** 防作弊标记 + 仍接受答案但记录异常

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=50 backend` — 后端无报错
4. 执行 Migration + Seed + 题目生成
5. 验证文章加载 + 5 道题目返回
6. 模拟完整答题流程：逐题提交 → 评级
7. 验证各评级等级边界条件
8. 验证案卷档案查询
9. 验证 PK 模式进度同步
10. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 文章库完整导入（150+ 篇）
- [ ] 每篇文章 5 道题目覆盖 ≥ 3 种题型
- [ ] 评级计算正确（边界条件验证）
- [ ] 称号升级条件正确
- [ ] 案卷档案 CRUD 正常
- [ ] PK 进度同步正常
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-007-g8-reading-detective-backend.md`

## 自检重点

- [ ] 安全: 答案服务端验证，客户端不持有正确答案
- [ ] 安全: 防作弊（时间/顺序/频率校验）
- [ ] 安全: RLS 策略正确（案卷仅本人可见）
- [ ] 性能: 文章 + 5 题加载 < 500ms
- [ ] 性能: 答案验证 < 50ms
- [ ] 数据: 题目质量（选项无歧义、解析有依据、干扰项有迷惑性）
- [ ] 数据: 文章字数范围 300-800
- [ ] 数据: 线索标注与题目关联正确
- [ ] AI: 出题引擎输出格式一致、质量可控
