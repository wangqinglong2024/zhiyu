# 4.2 · 游戏 · 数据模型与 API

> **MVP 收敛（60s 无限连玩）**：仅保留 `games` / `game_sessions` / `game_user_stats` 三张表的最小子集。`game_leaderboards` 、所有 HMAC / 反作弊 / 日上限发币 全部迁入 `99-post-mvp-backlog.md`。

## 一、数据模型

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 'pinyin-shooter'...
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  icon_url TEXT,
  cover_url TEXT,
  category TEXT,                       -- 'shooter','match3','memory'...
  version TEXT NOT NULL,               -- 'v1','v1.5','v2'
  status TEXT DEFAULT 'coming_soon',   -- coming_soon/active/maintenance/deprecated
  config JSONB,                        -- {duration, lives, packs, ...}
  release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  game_id UUID NOT NULL REFERENCES games(id),
  pack_type TEXT NOT NULL,             -- 'current_track','all_learned','wrong_set','hsk_X'
  pack_meta JSONB,                     -- {track, stage, permission_reason, trial_mode}
  score INT NOT NULL,
  stars INT CHECK (stars BETWEEN 0 AND 3),
  duration_seconds INT NOT NULL,
  correct_count INT,
  wrong_count INT,
  question_responses JSONB,            -- [{question_id|kp_id, is_correct, time_ms}]
  client_signature TEXT,               -- HMAC
  is_valid BOOLEAN DEFAULT TRUE,       -- 反作弊后置
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_game ON game_sessions(user_id, game_id, played_at DESC);
CREATE INDEX idx_sessions_leaderboard ON game_sessions(game_id, played_at, score DESC) WHERE is_valid;

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON game_sessions FOR SELECT USING (user_id = auth.uid());

CREATE TABLE game_user_stats (
  user_id UUID NOT NULL REFERENCES users(id),
  game_id UUID NOT NULL REFERENCES games(id),
  total_plays INT DEFAULT 0,
  best_score INT,
  best_stars INT,
  total_time_seconds BIGINT,
  last_played_at TIMESTAMPTZ,
  daily_coins_earned INT DEFAULT 0,    -- 当日已领币（reset by cron）
  daily_coins_date DATE,
  PRIMARY KEY (user_id, game_id)
);

ALTER TABLE game_user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON game_user_stats USING (user_id = auth.uid());

CREATE TABLE game_leaderboards (
  game_id UUID NOT NULL REFERENCES games(id),
  scope TEXT NOT NULL CHECK (scope IN ('day','week','all_time')),
  scope_date DATE,                     -- day=date, week=Monday, all_time=NULL
  user_id UUID NOT NULL REFERENCES users(id),
  best_score INT,
  best_session_id UUID,
  rank INT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (game_id, scope, scope_date, user_id)
);

CREATE INDEX idx_lb_rank ON game_leaderboards(game_id, scope, scope_date, best_score DESC);
```

## 二、API

### GET `/api/games`
- 12 游戏列表（全部 active，无 coming_soon 占位）

### GET `/api/games/:code`
- 游戏元信息 + 用户最近一次得分 + 可选词包权限摘要

### GET `/api/games/pack-options`
- 返回当前用户可选择的课程题库范围：`[{ track_code, stage_no, has_access, reason, disabled_reason }]`
- 权限来源复用 CR `GET /api/learn/permissions`
- 未登录返回游客基础范围，`srsOn=false`

### POST `/api/games/:id/sessions/start`
- Body: `{ track_code, stage_no, difficulty }`
- 返回：`{ session_token, questions: [...] }`（题目用一次 token 加密返回）
- 服务端必须校验课程权限并记录 `pack_meta.permission_reason`
- 限流：30/min/user

### POST `/api/games/:id/sessions/submit`
- Body: `{ session_token, score, duration, responses, client_signature }`
- 服务端校验：签名、token、score 上限、时长合理性
- 写 game_sessions + 更新 game_user_stats
- 推错题到 SRS
- 不发币、不返回 stars/rank
- 返回：`{ score, duration_seconds: 60, wrong_questions: [...] }`

### GET `/api/games/:id/leaderboard?scope=day|week|all_time`
- 返回前 50 + 自己上下文

### GET `/api/games/:id/sessions/me?limit=20`
- 用户自己历史

## 三、反作弊
- 客户端 HMAC：`HMAC(secret, session_token + score + duration + responses)`
- 服务端校验：
  - 签名匹配
  - score / duration > 历史 P99 → 标 invalid
  - 同 session_token 多次提交 → 拒
  - 单局响应数 = config.expected_count

## 四、性能
- 排行榜查询 P95 < 200ms（PG 索引 + Redis 缓存 1min）
- 提交 P95 < 500ms
