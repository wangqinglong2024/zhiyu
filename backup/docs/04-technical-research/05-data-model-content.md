# 4.5 · 数据模型 · 统一内容数据格式

> **目标**：让"AI 生成 → 入库 → 管理后台 → 应用端"的格式完全统一，杜绝数据漂移

## 一、数据模型分层

### 1.1 命名规则
- 表名小写下划线
- 内容表前缀 `content_`
- 用户表前缀 `user_`
- 业务表无前缀

### 1.2 核心表清单

```
内容表：
  content_articles            发现中国短文
  content_article_sentences   短文句子（句子级数据）
  content_courses             课程层级（轨道/阶段/章/节）
  content_knowledge_points    知识点（最小学习单位）
  content_quiz_templates      题型模板（10+3 类）
  content_novels              小说
  content_novel_chapters      小说章节
  content_novel_sentences     小说句子
  content_games               游戏配置
  content_daily_quotes        每日金句

用户表：
  user_profiles               扩展资料
  user_settings               偏好设置
  user_progress_courses       课程进度
  user_progress_articles      文章进度
  user_progress_novels        小说进度
  user_progress_games         游戏分数
  user_srs_queue              SRS 队列（FSRS-5）
  user_quiz_attempts          答题记录
  user_coins_balance          知语币余额
  user_coins_ledger           知语币流水
  user_referral_relations     分销关系
  user_referral_rewards       分销收益
  user_streaks                连续登录
  user_devices                设备指纹

业务表：
  orders                      订单
  subscriptions               订阅
  coupons                     优惠码
  paddle_webhook_events       Paddle 事件原始日志

IM 表：
  im_conversations
  im_messages
  im_attachments

系统表：
  audit_logs                  审计
  redline_keywords            红线关键词
  langgraph_runs              内容工厂运行
  cron_runs                   Cron 执行
```

## 二、统一内容句子级数据格式（关键约定）

### 2.1 设计目标
- 发现中国 / 课程 / 小说 三个模块的"句子"用同一 schema
- 一处生成、四处展示（Web 应用端、管理后台、未来 App、SEO 静态页）
- 用户偏好（拼音/母语显示、朗读模式）零修改 schema 即可生效

### 2.2 sentence 通用格式（JSON）

```json
{
  "id": "uuid",
  "ref_id": "article-uuid 或 lesson-uuid 或 chapter-uuid",
  "ref_type": "article|lesson|chapter",
  "order": 12,
  "zh": "你好，欢迎来到中国。",
  "pinyin": "nǐ hǎo, huān yíng lái dào zhōng guó.",
  "pinyin_tones": [3, 3, 1, 2, 2, 4, 1, 2],
  "translations": {
    "en": "Hello, welcome to China.",
    "vi": "Xin chào, chào mừng đến với Trung Quốc.",
    "th": "สวัสดี ยินดีต้อนรับสู่ประเทศจีน",
    "id": "Halo, selamat datang di Tiongkok."
  },
  "audio": {
    "zh": "https://cdn.zhiyu.app/audio/abc.mp3",
    "vi": "https://cdn.zhiyu.app/audio/abc-vi.mp3",
    "th": null,
    "id": null
  },
  "tags": ["greeting", "tourism"],
  "hsk_level": 1,
  "key_points": ["欢迎 = welcome 在不同场景的用法"],
  "metadata": {
    "created_at": "2026-04-25T10:00:00Z",
    "ai_model": "deepseek-v3",
    "reviewer": "user-uuid",
    "review_status": "approved"
  }
}
```

### 2.3 表结构（Postgres）

```sql
CREATE TABLE content_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id UUID NOT NULL,
  ref_type TEXT NOT NULL CHECK (ref_type IN ('article','lesson','chapter')),
  order_idx INT NOT NULL,
  zh TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  pinyin_tones INT[] DEFAULT '{}',
  translations JSONB NOT NULL DEFAULT '{}',
  audio JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  hsk_level SMALLINT,
  key_points TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  review_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ref_id, order_idx)
);

CREATE INDEX idx_sentences_ref ON content_sentences(ref_id, ref_type, order_idx);
CREATE INDEX idx_sentences_status ON content_sentences(review_status);
CREATE INDEX idx_sentences_translations_gin ON content_sentences USING GIN (translations);
```

### 2.4 应用端展示规则
- **Layout 标准**：上方拼音 / 中间中文 / 下方用户母语
- 用户在设置中可关 / 关 拼音 或 母语
- 朗读模式：
  - 全中文（仅 zh 音频）
  - 一中一母语（zh → user_lang 交替）
  - 朗读语速 0.5x / 0.75x / 1.0x / 1.25x / 1.5x（前端速率控制）
- 单句独立朗读（点击对应句子）
- 全篇朗读（队列播放，可暂停 / 跳过 / 重读）

## 三、知识点（content_knowledge_points）

### 3.1 字段

```sql
CREATE TABLE content_knowledge_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track TEXT NOT NULL CHECK (track IN ('ec','factory','hsk','daily')),
  stage SMALLINT NOT NULL CHECK (stage BETWEEN 1 AND 12),
  chapter SMALLINT NOT NULL CHECK (chapter BETWEEN 1 AND 12),
  lesson SMALLINT NOT NULL CHECK (lesson BETWEEN 1 AND 12),
  kpoint SMALLINT NOT NULL CHECK (kpoint BETWEEN 1 AND 12),
  unit_type TEXT NOT NULL CHECK (unit_type IN ('char','word','phrase','short_sent','mid_sent','long_sent','complex_sent')),
  zh TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  pinyin_tones INT[],
  translations JSONB NOT NULL DEFAULT '{}',
  key_point TEXT,                         -- 教学点解说（用用户母语生成）
  audio JSONB DEFAULT '{}',
  example_sentences JSONB DEFAULT '[]',   -- 示例句
  review_status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(track, stage, chapter, lesson, kpoint)
);

CREATE INDEX idx_kpoints_locator ON content_knowledge_points(track, stage, chapter, lesson, kpoint);
```

### 3.2 解说字段（key_point）的多语化
- 因为讲解必须用用户母语（差异化关键），所以 `translations.{lang}.key_point` 嵌入

```json
"translations": {
  "vi": {
    "translation": "ông chủ",
    "key_point": "Đây là cách gọi chung trong giao tiếp thương mại điện tử"
  },
  "th": { ... },
  "id": { ... },
  "en": { ... }
}
```

## 四、课程层级（content_courses）

### 4.1 三级结构

```sql
CREATE TABLE content_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track TEXT NOT NULL,
  stage SMALLINT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('stage','chapter','lesson')),
  parent_id UUID REFERENCES content_courses(id),
  order_idx SMALLINT NOT NULL,
  title JSONB NOT NULL,         -- 多语 title
  description JSONB,
  thumbnail TEXT,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 免费策略
- 4 轨道前 3 阶段 `is_free = true`
- 后 9 阶段 `is_free = false`
- 会员有效期内全部解锁
- 用户可强解锁（前端不写真值，后端不解锁，但允许浏览）

## 五、用户进度（user_progress_courses）

```sql
CREATE TABLE user_progress_courses (
  user_id UUID NOT NULL REFERENCES auth.users,
  course_id UUID NOT NULL REFERENCES content_courses,
  status TEXT CHECK (status IN ('not_started','in_progress','completed','force_unlocked')),
  completion_pct NUMERIC(5,2) DEFAULT 0,
  best_quiz_score NUMERIC(5,2),
  total_attempts SMALLINT DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_id)
);
ALTER TABLE user_progress_courses ENABLE ROW LEVEL SECURITY;
```

## 六、SRS 队列（user_srs_queue）

### 6.1 FSRS-5 字段

```sql
CREATE TABLE user_srs_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  kpoint_id UUID NOT NULL REFERENCES content_knowledge_points,
  -- FSRS-5 状态
  difficulty NUMERIC(8,4) NOT NULL DEFAULT 5,
  stability NUMERIC(10,4) NOT NULL DEFAULT 1,
  retrievability NUMERIC(5,4),
  state SMALLINT NOT NULL DEFAULT 0,   -- 0=new 1=learning 2=review 3=relearn
  due TIMESTAMPTZ NOT NULL,
  last_review TIMESTAMPTZ,
  reps SMALLINT DEFAULT 0,
  lapses SMALLINT DEFAULT 0,
  UNIQUE(user_id, kpoint_id)
);
CREATE INDEX idx_srs_due ON user_srs_queue(user_id, due);
```

### 6.2 详细 FSRS 算法见 [`08-srs-algorithm.md`](./08-srs-algorithm.md)

## 七、知语币

### 7.1 余额

```sql
CREATE TABLE user_coins_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INT NOT NULL DEFAULT 0,
  lifetime_spent INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 7.2 流水

```sql
CREATE TABLE user_coins_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INT NOT NULL,        -- 正负
  reason TEXT NOT NULL,       -- signup_bonus | daily_checkin | referral_l1 | referral_l2 | exchange_membership | exchange_skin | streak_freeze | manual_adj
  ref_table TEXT,
  ref_id UUID,
  balance_after INT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_coins_ledger_user ON user_coins_ledger(user_id, created_at DESC);
```

### 7.3 单户上限校验
- DB Trigger：单户每年累计 `signup_bonus + daily_checkin + referral_*` ≤ 50,000
- 超出自动转入"公益币"账户

## 八、分销关系

```sql
CREATE TABLE user_referral_relations (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  parent_id UUID REFERENCES auth.users,           -- 直推上级
  grandparent_id UUID REFERENCES auth.users,      -- 二级（祖）上级
  bound_at TIMESTAMPTZ DEFAULT now(),
  source_type TEXT,                               -- share_link | referral_code
  source_ref TEXT,
  device_fingerprint TEXT
);
```

## 九、订单 / 订阅

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paddle_transaction_id TEXT UNIQUE,
  product_type TEXT NOT NULL,    -- membership_monthly | membership_half | membership_yearly | course_segment | course_full
  product_ref TEXT,              -- e.g. "ec-stage-4-6"
  amount_usd NUMERIC(8,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,          -- pending | paid | refunded | failed
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  paddle_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,          -- active | paused | canceled | past_due
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  metadata JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 十、IM 表

```sql
CREATE TABLE im_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  assignee_id UUID REFERENCES auth.users,
  status TEXT DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  unread_count_user INT DEFAULT 0,
  unread_count_admin INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE im_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES im_conversations,
  sender_id UUID NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('user','admin','bot')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_im_msg_conv ON im_messages(conversation_id, created_at);
```

## 十一、管理后台数据呈现

### 11.1 内容管理界面（关键）
- 列表页：按"轨道 / 阶段 / 章 / 节" 树形展开
- 详情页：左侧元数据 + 右侧 4 语种内容 + TTS 试听
- 操作：编辑 / 重生成 / 标记审过 / 退回 AI / 发布

### 11.2 后台 → 应用端一致性保证
- 同一 schema、同一 API（管理后台 GET 时不带鉴权头取 admin 视图）
- 修改后实时刷新 CDN（Cloudflare Purge API）
- 前端通过 SWR 自动检测内容版本号

## 十二、数据迁移与版本

### 12.1 Schema 版本号
- 每个内容表加 `schema_version INT DEFAULT 1`
- 升级时数据迁移脚本 + 应用端 fallback

### 12.2 内容版本号
- `metadata.content_version` 自增
- 用户进度按版本号兼容（旧版本进度保留，新版本作为新条目）

## 十三、性能与索引

### 13.1 高频查询索引
- `content_sentences(ref_id, order_idx)` - 文章渲染
- `content_knowledge_points(track, stage, chapter, lesson, kpoint)` - 课程定位
- `user_srs_queue(user_id, due)` - 复习调度
- `user_coins_ledger(user_id, created_at DESC)` - 流水查询
- 全文搜索：内容用 GIN tsvector（中文 + 拼音 + 母语）

### 13.2 物化视图
- `mv_user_dashboard` - 用户首页数据（每 5 分钟刷新）
- `mv_admin_metrics` - 管理后台核心指标（每分钟刷新）

## 十四、数据治理

- 命名一致：snake_case
- 注释：每个表 + 关键字段必须有 comment
- 文档生成：drizzle introspect → 自动生成 docs
- 模型版本管理：每次 schema 变化必须有 migration + 文档更新

进入 [`06-payment-paddle-compliance.md`](./06-payment-paddle-compliance.md)。
