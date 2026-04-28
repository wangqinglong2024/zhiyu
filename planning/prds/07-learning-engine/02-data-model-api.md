# 7.2 · 学习引擎 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE srs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES content_questions(id),
  -- FSRS-5 状态
  state TEXT NOT NULL DEFAULT 'new' CHECK (state IN ('new','learning','review','relearning')),
  due TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability DECIMAL(10,4),
  difficulty DECIMAL(10,4),
  elapsed_days INT,
  scheduled_days INT,
  reps INT DEFAULT 0,
  lapses INT DEFAULT 0,
  last_review TIMESTAMPTZ,
  -- 业务字段
  source TEXT NOT NULL,                -- 'lesson_quiz','chapter_test','stage_exam','game','manual_course'
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_srs_due ON srs_cards(user_id, due, state);
CREATE INDEX idx_srs_source_due ON srs_cards(user_id, source, due);
CREATE INDEX idx_srs_unresolved ON srs_cards(user_id, is_resolved, last_review DESC);

CREATE TABLE srs_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES srs_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 4),  -- Again/Hard/Good/Easy
  duration_ms INT,
  state_before TEXT,
  state_after TEXT,
  scheduled_days_before INT,
  scheduled_days_after INT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_user_date ON srs_reviews(user_id, reviewed_at DESC);

CREATE TABLE learning_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  freeze_count INT DEFAULT 0,          -- 已使用的冻结
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_daily_stats (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  reviews_count INT DEFAULT 0,
  new_questions_count INT DEFAULT 0,
  quiz_count INT DEFAULT 0,
  game_plays INT DEFAULT 0,
  total_time_seconds INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  PRIMARY KEY (user_id, stat_date)
);

ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON srs_cards USING (user_id = auth.uid());
ALTER TABLE srs_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON srs_reviews USING (user_id = auth.uid());
```

## API

### 复习
- `GET /api/le/review/today?limit=20` — 返回今日到期题（按优先级排序）
- `POST /api/le/review/:card_id/rate` — `{rating, duration_ms}` → 用 ts-fsrs 计算 + 更新 card + 记录 review
- `GET /api/le/review/preview` — `{due_today, due_overdue, new_available}`

### 错题
- `GET /api/le/wrong-set?source=&hsk=&page=` — 错题列表；source 仅允许 all/course/game
- `POST /api/le/cards/:id/resolve` — 手动标记已解决
- `POST /api/le/cards/manual-add` — `{question_id}` 手动加入；仅允许学习系统题库问题

### 仪表板
- `GET /api/le/dashboard` — 返回 streak + 今日 / 周 / 累计统计 + 掌握度热力图
- `GET /api/le/heatmap?range=30d` — 活跃热力图

### Streak / Freeze
- `POST /api/le/streak/freeze/use` — 使用冻结道具（消耗 50 币）

## SRS 引擎逻辑

```typescript
import { fsrs, generatorParameters, Rating } from 'ts-fsrs';

const f = fsrs(generatorParameters({ enable_fuzz: true }));

async function rateCard(cardId, rating, durationMs) {
  const card = await loadCard(cardId);
  const fsrsCard = toFsrsCard(card);
  const now = new Date();
  const result = f.repeat(fsrsCard, now);
  const next = result[rating];   // rating: 1=Again, 2=Hard, 3=Good, 4=Easy

  await updateCard(card.id, fromFsrsCard(next.card));
  await insertReview({card_id: cardId, rating, duration_ms: durationMs, ...});

  // resolve 逻辑：连续 2 次 Good/Easy 且 state=review → resolved
  if (rating >= 3 && next.card.state === State.Review && card.consecutive_correct >= 1) {
    await markResolved(cardId);
  }
}
```

## 调度优先级
1. 已到期错题（state in ['learning','relearning']）
2. 已到期复习（state='review'）
3. 新题（state='new'，每日新题上限 10）

## 性能
- SRS 调度查 P95 < 200ms（PG 索引）
- rate 提交 P95 < 300ms
- 仪表板 P95 < 500ms（聚合用 daily_stats 物化）
