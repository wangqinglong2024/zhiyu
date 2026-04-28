> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 2.2 · 发现中国 · 数据模型与 API

## 一、数据模型

### 1.1 `content_categories`（类目）

```sql
CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL CHECK (module IN ('discover','novel')),
  slug TEXT NOT NULL,
  code TEXT NOT NULL,                       -- e.g. 'history','cuisine'
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,         -- {en, vi, th, id}
  description JSONB,                        -- 多语种描述
  cover_image_url TEXT,
  theme_color TEXT,                         -- HEX
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, slug)
);
```

### 1.2 `content_articles`（文章）

```sql
CREATE TABLE content_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES content_categories(id),
  slug TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_translations JSONB NOT NULL,
  summary JSONB,                            -- 多语种摘要
  cover_image_url TEXT,
  hsk_level INT,                            -- 1-9
  word_count INT,
  reading_minutes INT,
  tags TEXT[],
  key_points JSONB,                         -- 多语种 key_point 列表
  status TEXT NOT NULL DEFAULT 'draft',     -- draft/review/published/archived
  published_at TIMESTAMPTZ,
  view_count BIGINT DEFAULT 0,
  rating_avg DECIMAL(3,2),
  rating_count INT DEFAULT 0,
  created_by UUID,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_articles_published ON content_articles(status, published_at DESC);
CREATE INDEX idx_articles_category ON content_articles(category_id, status);
CREATE INDEX idx_articles_search ON content_articles USING gin(to_tsvector('simple', title_zh || ' ' || COALESCE(summary->>'en', '')));
```

### 1.3 `content_sentences`（句子，跨模块共用）

```sql
CREATE TABLE content_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 关联（exactly one of these populated）
  article_id UUID REFERENCES content_articles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES content_lessons(id) ON DELETE CASCADE,
  novel_chapter_id UUID REFERENCES content_novel_chapters(id) ON DELETE CASCADE,

  sequence_number INT NOT NULL,             -- 在文章/课/章节内的顺序
  zh TEXT NOT NULL,                          -- 中文原文
  pinyin TEXT NOT NULL,                      -- 拼音字母 'nǐ hǎo'
  pinyin_tones TEXT,                         -- 数字声调 'ni3 hao3'
  translations JSONB NOT NULL,               -- {en, vi, th, id}
  audio JSONB,                               -- {default: {url, duration_ms}, voices: [...]}
  hsk_level INT,
  tags TEXT[],
  key_point JSONB,                           -- 句子级关键点（可选，多语种）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentences_article ON content_sentences(article_id, sequence_number);
CREATE INDEX idx_sentences_lesson ON content_sentences(lesson_id, sequence_number);
CREATE INDEX idx_sentences_chapter ON content_sentences(novel_chapter_id, sequence_number);
CREATE INDEX idx_sentences_search ON content_sentences USING gin(to_tsvector('simple', zh));

ALTER TABLE content_sentences ADD CONSTRAINT chk_one_parent CHECK (
  (article_id IS NOT NULL)::int + (lesson_id IS NOT NULL)::int + (novel_chapter_id IS NOT NULL)::int = 1
);
```

### 1.4 `learning_reading_progress`（阅读进度）

```sql
CREATE TABLE learning_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('article','novel_chapter')),
  target_id UUID NOT NULL,
  last_sentence_id UUID,
  progress_pct DECIMAL(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  reading_time_seconds INT DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE learning_reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON learning_reading_progress USING (user_id = auth.uid());
```

### 1.5 `user_favorites`

```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('article','sentence','lesson','novel','chapter','knowledge_point')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_favorites USING (user_id = auth.uid());
```

### 1.6 `user_notes`

```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_notes USING (user_id = auth.uid());
```

### 1.7 `content_ratings`

```sql
CREATE TABLE content_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);
```

## 二、API 设计

### 2.1 公开 API（未登录可访问，限流）

#### GET `/api/discover/categories`
- 返回 12 类目
- 缓存：CDN 1h
- 限流：60/min/IP

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "cuisine",
      "code": "cuisine",
      "name_zh": "中华美食",
      "name": "Ẩm thực Trung Hoa",
      "description": "...",
      "cover_image_url": "...",
      "theme_color": "#F87171",
      "article_count": 52
    }
  ]
}
```

#### GET `/api/discover/categories/:slug/articles`
- 查询参数：`page`, `limit` (默认 20, 最大 50), `hsk_level`, `length`, `sort` (latest/popular)
- 缓存：CDN 5min
- 限流：30/min/IP

#### GET `/api/discover/articles/:slug`
- 返回单篇 + 句子列表
- **未登录限制**：仅允许读取前 3 个开放类目下的文章；第 4-12 类目返回 401 + `code=discover_category_login_required`
- 缓存：CDN 1h（已发布）

```json
{
  "article": {
    "id": "uuid",
    "title_zh": "饺子的由来",
    "title": "Nguồn gốc của bánh há cảo",
    "summary": "...",
    "cover_image_url": "...",
    "hsk_level": 4,
    "word_count": 580,
    "reading_minutes": 4,
    "rating_avg": 4.5,
    "rating_count": 120,
    "key_points": [
      { "text": "饺子源于东汉..." }
    ]
  },
  "sentences": [
    {
      "id": "uuid",
      "sequence_number": 1,
      "zh": "饺子是中国传统美食。",
      "pinyin": "jiǎo zi shì zhōng guó chuán tǒng měi shí",
      "translation": "Bánh há cảo là món ăn truyền thống Trung Quốc.",
      "audio_url": "https://signed.url/...",
      "key_point": null
    }
  ]
}
```

### 2.2 已登录 API

#### POST `/api/discover/articles/:id/progress`
- Body: `{ last_sentence_id, progress_pct, reading_time_delta }`
- 防抖 5s 后端再写
- 限流：1/2s/user

#### POST `/api/discover/articles/:id/favorite`
- 切换收藏
- 限流：10/min/user

#### POST `/api/discover/sentences/:id/note`
- Body: `{ content }`
- 限流：5/min/user

#### POST `/api/discover/articles/:id/rating`
- Body: `{ rating: 1-5, comment? }`
- 一次有效

#### POST `/api/discover/articles/:id/share-card`
- 生成分享图，返回 URL（含分销码）
- 限流：10/min/user

### 2.3 内部管理 API（仅 admin）

详见 AD 模块 PRD。

## 三、缓存策略

| 数据 | 层级 | TTL |
|---|---|:---:|
| 类目列表 | nginx/cache header/SW | 1h |
| 文章列表（按类目） | nginx/cache header/SW | 5min |
| 单篇内容（已发布） | nginx/cache header/SW | 1h |
| 句子音频 | nginx/cache header/SW | 30 天（不变） |
| 用户进度 / 收藏 | 不缓存 | - |
| 分享图卡 | Storage | 90 天 |

## 四、内容流（生产 → 发布）

```
1. AD 后台触发 LangGraph 工作流（CF 模块）
2. AI 生成 zh + 拼音 + 4 语翻译 + key_point
3. 红线词检测（双层）
4. TTS 批量生成
5. 入审校工作台
6. 母语审校通过 → status='published' + published_at
7. 更新本地缓存版本号 / SW 预取清单（避免延迟）
8. SEO sitemap 增量更新
```

## 五、迁移 / 上架顺序

### W-12 → W-9
- 类目种子数据
- 12 类目封面 + 主题色

### W-9 → W-5
- 600 篇生成 + 翻译 + TTS
- 母语审校

### W-5 → W-2
- 全部入库 + 上架
- SEO sitemap
- 本地缓存预热

进入 [`03-acceptance-criteria.md`](./03-acceptance-criteria.md)。
