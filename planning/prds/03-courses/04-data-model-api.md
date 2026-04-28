> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 3.4 · 系统课程 · 数据模型 与 API

## 一、数据模型

### 1.1 `content_tracks`

```sql
CREATE TABLE content_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,           -- 'ec','factory','hsk','daily'
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  icon_url TEXT,
  display_order INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 `content_stages`

```sql
CREATE TABLE content_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES content_tracks(id),
  stage_no INT NOT NULL CHECK (stage_no BETWEEN 1 AND 12),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  hsk_level_range INT[],               -- e.g. [4,5]
  prerequisite_stage INT,
  is_free BOOLEAN DEFAULT FALSE,       -- TRUE for Stage 1-3 in each theme by default; manual/promo overrides must be audited
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, stage_no)
);
```

### 1.3 `content_chapters`

```sql
CREATE TABLE content_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES content_stages(id),
  chapter_no INT NOT NULL CHECK (chapter_no BETWEEN 1 AND 12),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  is_free BOOLEAN DEFAULT FALSE,       -- TRUE for all chapters under Stage 1-3 in each theme
  free_reason TEXT,                    -- login_trial/manual/promo
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stage_id, chapter_no)
);
```

### 1.4 `content_lessons`

```sql
CREATE TABLE content_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES content_chapters(id),
  lesson_no INT NOT NULL CHECK (lesson_no BETWEEN 1 AND 12),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  intro JSONB,                         -- 母语介绍
  learning_objectives JSONB,           -- 学习目标 多语种
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, lesson_no)
);
```

### 1.5 `content_knowledge_points`

```sql
CREATE TABLE content_knowledge_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES content_lessons(id),
  kpoint_no INT NOT NULL CHECK (kpoint_no BETWEEN 1 AND 12),
  type TEXT NOT NULL CHECK (type IN ('word','phrase','sentence','grammar','culture')),
  zh TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  pinyin_tones TEXT,
  translations JSONB NOT NULL,
  key_point JSONB,                     -- 4 语种解释
  audio JSONB,
  example_sentence_ids UUID[],         -- references content_sentences
  tags TEXT[],
  hsk_level INT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id, kpoint_no)
);

CREATE INDEX idx_kp_lesson ON content_knowledge_points(lesson_id, kpoint_no);
```

### 1.6 `content_questions`（题目）

见 [`03-question-types.md`](./03-question-types.md) 第 17 节。

### 1.7 `content_quizzes`（节小测 / 章测 / 阶段考）

```sql
CREATE TABLE content_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('lesson_quiz','chapter_test','stage_exam')),
  parent_id UUID NOT NULL,             -- lesson_id / chapter_id / stage_id
  question_count INT NOT NULL,
  pass_threshold INT NOT NULL,         -- 60 / 70 / 75
  time_limit_seconds INT,
  question_ids UUID[],                 -- 静态题表（小测）或 NULL（动态抽样）
  selection_strategy JSONB,            -- 动态抽样规则
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.8 `learning_progress`

```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('track','stage','chapter','lesson','knowledge_point')),
  scope_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed','skipped')),
  progress_pct DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scope_type, scope_id)
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON learning_progress USING (user_id = auth.uid());

CREATE INDEX idx_progress_user ON learning_progress(user_id, scope_type);
```

### 1.9 `learning_quiz_attempts`

```sql
CREATE TABLE learning_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  quiz_id UUID NOT NULL REFERENCES content_quizzes(id),
  question_responses JSONB NOT NULL,   -- [{question_id, answer, is_correct, time_ms}]
  score_pct DECIMAL(5,2) NOT NULL,
  is_passed BOOLEAN NOT NULL,
  duration_seconds INT NOT NULL,
  attempt_no INT DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON learning_quiz_attempts USING (user_id = auth.uid());

CREATE INDEX idx_attempts_user_quiz ON learning_quiz_attempts(user_id, quiz_id, attempt_no);
```

### 1.10 `learning_wrong_set`

```sql
CREATE TABLE learning_wrong_set (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES content_questions(id),
  wrong_count INT DEFAULT 1,
  last_wrong_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,                         -- 'lesson_quiz','chapter_test','stage_exam','game','review'
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE learning_wrong_set ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON learning_wrong_set USING (user_id = auth.uid());
```

### 1.11 `user_track_enrollments`

```sql
CREATE TABLE user_track_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  track_id UUID NOT NULL REFERENCES content_tracks(id),
  current_stage_id UUID,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);
```

### 1.12 `user_stage_purchases`

```sql
CREATE TABLE user_stage_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  stage_id UUID NOT NULL REFERENCES content_stages(id),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('single_stage','nine_pack','membership','manual_grant')),
  order_id UUID,                       -- references orders
  expires_at TIMESTAMPTZ,              -- NULL for permanent (single_stage/nine_pack)
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stage_id, purchase_type)
);

CREATE INDEX idx_purchases_user ON user_stage_purchases(user_id, status);
```

## 二、API 设计

### 2.1 公开 API（结构信息，无内容）

#### GET `/api/learn/tracks`
- 返回 4 主题 + 每主题 12 阶段 元信息
- 缓存：CDN 1h

### 2.2 已登录 API

#### GET `/api/learn/tracks/:track_code/dashboard`
- 返回当前轨道总览：当前阶段 / 进度 / 推荐
- 缓存：用户级 5min

#### GET `/api/learn/stages/:stage_id`
- 返回阶段详情 + 12 章 + 每章进度
- 检查权限：返回每章 `has_access`，前三阶段免费章 or 已购阶段 or 会员 or 人工授权

#### GET `/api/learn/chapters/:chapter_id`
- 返回章详情 + 12 节
- 检查权限

#### GET `/api/learn/lessons/:lesson_id`
- 返回节内容（12 知识点 + 例句 + key_point + audio）
- 检查权限
- 限流：30/min/user

#### POST `/api/learn/lessons/:lesson_id/start`
- 标记节开始 + 写 progress

#### POST `/api/learn/knowledge-points/:kp_id/viewed`
- 标记知识点已看（1s 防抖）

#### GET `/api/learn/quizzes/:quiz_id`
- 返回小测题目（带选项 / 不带答案）
- 限流：5/min/user

#### POST `/api/learn/quizzes/:quiz_id/submit`
- Body: `{ responses: [{question_id, answer, time_ms}], duration_seconds }`
- 后端评分 + 写 attempt + 更新 progress + 错题入库
- 返回：得分 / 错题列表 / 解释

#### GET `/api/learn/wrong-set?source=...`
- 返回错题集（分页）

#### GET `/api/learn/permissions`
- 查询参数：`track_code`, `stage_no`, `chapter_no?`, `lesson_id?`
- 检查用户对课程节点的访问权限
- 返回：`{ has_access, reason: 'free_chapter'|'purchased_stage'|'membership'|'manual_grant'|'paywall', expires_at }`
- 游戏模块复用该权限汇总生成可选词包范围

### 2.3 学习报告 API

#### GET `/api/learn/reports/lesson/:lesson_id`
- 节末报告（小测得分 + 错题 + 推荐）

#### GET `/api/learn/reports/chapter/:chapter_id`
- 章末报告

#### GET `/api/learn/reports/stage/:stage_id`
- 阶段末报告（含证书生成 URL）

### 2.4 报错 API

#### POST `/api/learn/content-reports`
- Body: `{ target_type, target_id, issue_type, description }`
- 入审校工作台

## 三、权限检查算法

```typescript
async function canAccessCourseNode(userId: string, input: CourseNode): Promise<AccessResult> {
  const stage = await getStage(input.stageId);
  const chapter = input.chapterId ? await getChapter(input.chapterId) : null;

  // 免费试学：每个主题 Stage 1-3 全部章节
  if (stage.stage_no <= 3) return { allowed: true, reason: 'free_stage' };
  if (chapter?.is_free) return { allowed: true, reason: 'free_chapter' };

  // 检查活跃订阅会员
  const sub = await getActiveSubscription(userId);
  if (sub && sub.expires_at > now()) return { allowed: true, reason: 'membership' };

  // 检查单段购买
  const purchase = await db.query(
    'SELECT * FROM user_stage_purchases WHERE user_id=$1 AND stage_id=$2 AND status=active',
    [userId, stageId]
  );
  if (purchase) return { allowed: true, reason: 'purchased_stage' };

  // 检查 9 段全包（按 track）
  const ninePack = await db.query(
    'SELECT * FROM user_stage_purchases WHERE user_id=$1 AND track_id=$2 AND purchase_type=nine_pack',
    [userId, stage.track_id]
  );
  if (ninePack) return { allowed: true, reason: 'nine_pack' };

  return { allowed: false, reason: 'paywall' };
}
```

> 购买不检查 `prerequisite_stage`，仅用于学习建议与 UI 提示；用户可跨级购买任意阶段。

## 四、错题 SRS 集成

### 4.1 错题入 SRS
- 答错时立即 INSERT `learning_wrong_set`
- 同时调 SRS 服务（LE 模块）：把 question_id 加入复习队列
- FSRS-5 状态：`new`（新题）→ `learning`（已答错）→ `review`（待复习）

### 4.2 错题解决
- 用户在温故知新中答对 2 次 → `is_resolved=TRUE`
- 用户在新一轮节小测 / 章测中答对 → `is_resolved=TRUE`

详见 [`/planning/prds/07-learning-engine/`](../07-learning-engine/)。

## 五、内容工厂集成

### 5.1 生成流程

```
PM 配置
  ├── 选轨道 + 阶段
  ├── 设定主题 + HSK 等级
  └── 触发 LangGraph workflow
        ├── Step 1: 12 章主题
        ├── Step 2: 12 节主题（每章）
        ├── Step 3: 12 知识点（每节，含例句）
        ├── Step 4: 4 语翻译 + key_point
        ├── Step 5: TTS 批量
        ├── Step 6: 节小测题目（10/节）
        ├── Step 7: 章测题目（36/章）
        └── Step 8: 阶段考题目（80-150/段）
```

详见 [`14-content-factory/`](../14-content-factory/)。

## 六、缓存策略

| 数据 | 层级 | TTL |
|---|---|:---:|
| Tracks/Stages 元信息 | CDN | 1h |
| Lessons 列表（按章） | CDN | 5min |
| Lesson 详情（已发布） | CDN | 1h |
| 知识点 / 句子 | CDN | 1h |
| 用户进度 | 用户级 | 5min |
| 小测题目 | 用户级 | 不缓存（避免预知） |
| 错题集 | 用户级 | 不缓存 |

## 七、性能要求

- 节学习页 LCP < 2s
- 知识点切换 < 200ms
- 小测提交 < 500ms
- 章测 36 题渲染 < 1s
- 阶段考 150 题渲染 < 2s

进入 [`05-acceptance-criteria.md`](./05-acceptance-criteria.md)。
