# 05 · 数据模型（Data Model）

## 一、整体规划

- Postgres 16 (Supabase 托管, Singapore)
- 单库多 schema：`public` (默认)、`audit` (审计)、`analytics` (报表派生)
- 行级安全（RLS）启用
- 软删（deleted_at），硬删需特殊审批

## 二、命名约定

- 表：snake_case 复数（users, articles）
- 列：snake_case (created_at)
- 主键：id (uuid v7)
- 外键：<resource>_id
- 时间：created_at / updated_at / deleted_at（timestamptz）
- 枚举：列后缀 `_status` `_type`

## 三、领域分组

```
1. Identity      users / sessions / oauth_accounts
2. Content       articles / categories / courses / stages / chapters /
                 lessons / steps / novels / chapters_novel /
                 game_packs / words / sentences
3. Translation   content_translations / audio_assets
4. Learning      enrollments / progress / mistakes / favorites / notes
5. Game          game_runs / game_scores / leaderboards
6. Economy       coins_balances / coins_ledger / shop_items / orders
7. Subscription  subscriptions / plans / payment_orders
8. Referral      referral_codes / referrals / commissions（佣金 = ZC，自动入账 coins_ledger）
9. Support       conversations / messages / tickets / faq
10. Factory      factory_tasks / agents / prompt_templates / generations
11. Admin        admin_users / roles / permissions / audit_logs / flags
12. Notification notifications / notification_preferences / push_tokens
```

## 四、关键表 DDL（精简）

### 4.1 users
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE,
  phone text UNIQUE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  country_code text NOT NULL,
  preferred_lang text NOT NULL DEFAULT 'en',
  level int NOT NULL DEFAULT 1,
  xp bigint NOT NULL DEFAULT 0,
  hsk_level int,
  is_paid boolean NOT NULL DEFAULT false,
  paid_until timestamptz,
  referrer_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX idx_users_country ON users(country_code);
CREATE INDEX idx_users_referrer ON users(referrer_user_id);
```

### 4.2 sessions / oauth_accounts
```sql
CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  user_agent text,
  ip inet,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);
```

### 4.3 categories（中国文化 / 小说）
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,        -- culture | novel
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_url text,
  display_order int,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.4 articles（中国文化文章）
```sql
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  hsk_level int NOT NULL,
  word_count int,
  estimated_minutes int,
  cover_url text,
  status text NOT NULL DEFAULT 'draft', -- draft|review|published|archived
  published_at timestamptz,
  created_by uuid REFERENCES admin_users(id),
  ai_generated boolean DEFAULT false,
  factory_task_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_articles_status_pub ON articles(status, published_at DESC);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_hsk ON articles(hsk_level);
```

### 4.5 sentences（句子级 - 文章/课程/小说复用）
```sql
CREATE TABLE sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,       -- article|lesson|novel_chapter
  source_id uuid NOT NULL,
  ordinal int NOT NULL,
  zh text NOT NULL,
  pinyin text,
  audio_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sentences_source ON sentences(source_type, source_id, ordinal);
```

### 4.6 content_translations
```sql
CREATE TABLE content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,    -- article|lesson|sentence|novel|chapter|...
  source_id uuid NOT NULL,
  field text NOT NULL,          -- title|body|note...
  lang text NOT NULL,           -- en|vi|th|id|zh
  value text NOT NULL,
  reviewer_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, field, lang)
);
CREATE INDEX idx_translations_lookup ON content_translations(source_type, source_id, lang);
```

### 4.7 课程层级
```sql
CREATE TABLE course_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,            -- daily|ecommerce|factory|hsk
  name text,
  description text,
  cover_url text,
  display_order int
);

CREATE TABLE course_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid REFERENCES course_tracks(id),
  ordinal int,
  name text,
  hsk_level int,
  is_paid boolean DEFAULT false,
  cover_url text,
  UNIQUE(track_id, ordinal)
);

CREATE TABLE course_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES course_stages(id),
  ordinal int,
  name text,
  UNIQUE(stage_id, ordinal)
);

CREATE TABLE course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES course_chapters(id),
  ordinal int,
  name text,
  estimated_minutes int,
  status text DEFAULT 'draft',
  ai_generated boolean DEFAULT false,
  UNIQUE(chapter_id, ordinal)
);

CREATE TABLE course_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES course_lessons(id),
  ordinal int,
  step_type text,          -- sentence|word_card|choice|listen|speak|translate|...
  payload jsonb NOT NULL,  -- 步骤内容
  scoring jsonb,           -- 评分规则
  UNIQUE(lesson_id, ordinal)
);
```

### 4.8 小说
```sql
CREATE TABLE novels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  slug text UNIQUE,
  title text,
  author text,
  cover_url text,
  hsk_level int,
  total_chapters int,
  status text,         -- ongoing|completed|paused
  is_paid boolean DEFAULT false,
  free_chapters int DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE novel_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id uuid REFERENCES novels(id),
  ordinal int,
  title text,
  word_count int,
  estimated_minutes int,
  status text DEFAULT 'draft',
  published_at timestamptz,
  ai_generated boolean DEFAULT false,
  UNIQUE(novel_id, ordinal)
);
```

### 4.9 游戏
```sql
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text,
  description text,
  cover_url text,
  category text,         -- shooter|casual|puzzle|rhythm|...
  recommended_hsk int[],
  is_active boolean DEFAULT true,
  display_order int
);

CREATE TABLE word_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  source text,           -- system|user|hsk|theme
  hsk_level int,
  word_count int,
  is_paid boolean DEFAULT false,
  owner_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zh text NOT NULL,
  pinyin text,
  hsk_level int,
  pos text,              -- 词性
  audio_url text,
  UNIQUE(zh)
);

CREATE TABLE word_pack_items (
  pack_id uuid REFERENCES word_packs(id) ON DELETE CASCADE,
  word_id uuid REFERENCES words(id),
  PRIMARY KEY (pack_id, word_id)
);

CREATE TABLE game_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  game_id uuid REFERENCES games(id),
  pack_id uuid REFERENCES word_packs(id),
  score int,
  duration_seconds int,
  stars int,
  payload jsonb,         -- 关卡 / 错题等
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_runs_user_game ON game_runs(user_id, game_id, created_at DESC);
```

### 4.10 学习记录
```sql
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  track_id uuid REFERENCES course_tracks(id),
  current_stage int DEFAULT 1,
  current_chapter int DEFAULT 1,
  current_lesson int DEFAULT 1,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  lesson_id uuid REFERENCES course_lessons(id),
  steps_completed int DEFAULT 0,
  steps_total int,
  accuracy numeric(4,2),
  duration_seconds int,
  completed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  source_type text,        -- lesson_step|game_run|article_quiz
  source_id uuid,
  word_id uuid REFERENCES words(id),
  count int DEFAULT 1,
  last_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  source_type text,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_type, source_id)
);

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  source_type text,
  source_id uuid,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.11 知语币
```sql
CREATE TABLE coins_balances (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  balance bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coins_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  delta bigint NOT NULL,    -- 正增 负减
  reason text NOT NULL,     -- earn_lesson|earn_game|spend_unlock|topup|refund|admin_adjust
  ref_type text,
  ref_id uuid,
  balance_after bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_coins_user_time ON coins_ledger(user_id, created_at DESC);

CREATE TABLE shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text,
  cost_coins bigint,
  type text,       -- pack|theme|powerup
  payload jsonb,
  is_active boolean DEFAULT true
);
```

### 4.12 订阅 / 支付
```sql
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,        -- monthly|yearly|lifetime
  name text,
  price_usd numeric(10,2),
  duration_days int,        -- null=lifetime
  paddle_product_id text,
  is_active boolean
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  plan_id uuid REFERENCES plans(id),
  provider text,            -- paddle|lemonsqueezy
  provider_sub_id text,
  status text,              -- active|canceled|past_due|expired|trialing
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type text,        -- subscription|coin_topup|one_time
  amount_usd numeric(10,2),
  amount_local numeric(12,2),
  currency text,
  provider text,
  provider_order_id text,
  status text,      -- pending|succeeded|refunded|failed
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.13 分销
```sql
CREATE TABLE referral_codes (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  code text UNIQUE NOT NULL,           -- 6 位无歧义；系统生成、不可改、不暴露给前端字段
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid REFERENCES users(id),    -- L1
  l2_user_id uuid REFERENCES users(id),          -- L2（自动派生）
  referred_user_id uuid REFERENCES users(id),
  bound_at timestamptz NOT NULL DEFAULT now(),
  source text,
  source_ip text,
  source_device_id text,
  is_effective boolean DEFAULT true,             -- 注册即有效
  is_suspicious boolean DEFAULT false,
  UNIQUE(referred_user_id)
);

CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id uuid REFERENCES users(id),
  referred_user_id uuid REFERENCES users(id),
  order_id uuid REFERENCES payment_orders(id),
  level int NOT NULL CHECK (level IN (1,2)),
  order_amount_usd numeric(10,2),
  rate numeric(4,3),                   -- 0.20
  amount_coins int NOT NULL,           -- = order_amount_usd * 100 * rate（单位 ZC）
  status text,                         -- pending|confirmed|issued|reversed
  confirmed_at timestamptz,
  issued_at timestamptz,
  coins_ledger_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, level)
);

-- 不再提供 withdrawals 表：佣金 confirmed 后自动作为 ZC 入账 coins_ledger
-- 旧表保留兼容（仅历史数据用，不再写入）：
-- CREATE TABLE withdrawals_legacy ( ... );
```

### 4.14 客服
```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  agent_id uuid REFERENCES admin_users(id),
  status text DEFAULT 'open',
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  sender_type text,        -- user|agent|system
  sender_id uuid,
  body text,
  attachments jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  category text,
  priority text,
  subject text,
  body text,
  status text DEFAULT 'open',
  assignee uuid REFERENCES admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  question text,
  answer text,
  lang text,
  display_order int
);
```

### 4.15 工厂
```sql
CREATE TABLE prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text,            -- article|lesson|chapter|pack
  version int,
  body text,
  variables jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE factory_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,            -- article|lesson|...
  template_id uuid,
  inputs jsonb,
  status text,          -- queued|running|review|approved|published|failed
  cost_usd numeric(10,4),
  tokens_in int,
  tokens_out int,
  result_id uuid,       -- 生成内容 ID
  langgraph_run_id text,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES factory_tasks(id),
  step text,
  model text,
  prompt text,
  response text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10,4),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 4.16 后台
```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE,
  password_hash text,
  totp_secret text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id uuid PRIMARY KEY,
  name text UNIQUE
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY,
  resource text,
  action text,
  UNIQUE(resource, action)
);

CREATE TABLE role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE admin_user_roles (
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_user_id, role_id)
);

CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  description text,
  is_enabled boolean DEFAULT false,
  rules jsonb,        -- {percent, countries, users, platforms}
  updated_at timestamptz
);

CREATE TABLE audit.audit_logs (
  id bigserial PRIMARY KEY,
  actor_type text,    -- admin|user|system
  actor_id uuid,
  action text,
  resource_type text,
  resource_id uuid,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit.audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit.audit_logs(resource_type, resource_id);
```

### 4.17 通知
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type text,
  title text,
  body text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  learning_reminder boolean DEFAULT true,
  reminder_time time,
  marketing boolean DEFAULT false,
  support boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true
);

CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  provider text,           -- onesignal
  token text,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## 五、RLS 策略示例

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_owner ON notes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE coins_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY coins_read_self ON coins_ledger
  FOR SELECT USING (user_id = auth.uid());

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY articles_public_read ON articles
  FOR SELECT USING (status = 'published');
```

## 六、索引策略

- 高频查询路径全部建索引
- 复合索引：覆盖最常用 where + order
- JSONB 用 GIN 仅必要
- 文本搜索：FTS GIN 索引

## 七、迁移管理

- Drizzle migrations
- 文件 `apps/api/migrations/{ts}_{name}.sql`
- CI 验证 dryrun
- 生产 manual approve

## 八、备份

- Supabase PITR 7 天
- Daily snapshot → R2 (自动)
- 30 天保留

## 九、性能

- 慢查询日志（> 200ms）
- pg_stat_statements
- Connection pool: PgBouncer (Supabase 自带)
- 大表分区（v1.5：audit_logs, generations）

## 十、检查清单

- [ ] 全部表 RLS 启用
- [ ] 全部外键 ON DELETE 策略明确
- [ ] 索引覆盖热点 query
- [ ] 软删字段 deleted_at
- [ ] 时间戳 timestamptz
- [ ] uuid v7 (有序)
- [ ] 审计表分离 schema
