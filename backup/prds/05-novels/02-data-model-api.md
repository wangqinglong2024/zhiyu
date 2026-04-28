# 5.2 · 小说 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE content_novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES content_categories(id),  -- module='novel'
  slug TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_translations JSONB NOT NULL,
  author_zh TEXT,
  cover_image_url TEXT,
  summary JSONB,
  hsk_level INT,
  total_chapters INT DEFAULT 0,
  word_count BIGINT DEFAULT 0,
  status TEXT DEFAULT 'draft',         -- draft/serializing/completed/archived
  rating_avg DECIMAL(3,2),
  rating_count INT DEFAULT 0,
  reader_count INT DEFAULT 0,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_novels_category ON content_novels(category_id, status, published_at DESC);

CREATE TABLE content_novel_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES content_novels(id) ON DELETE CASCADE,
  chapter_no INT NOT NULL,
  title_zh TEXT NOT NULL,
  title_translations JSONB,
  word_count INT,
  reading_minutes INT,
  highlight_sentences UUID[],          -- 金句 ID 列表
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, chapter_no)
);

CREATE INDEX idx_chapters_novel ON content_novel_chapters(novel_id, chapter_no);

-- 章末快测（复用 content_quizzes）
-- type='novel_chapter_quiz', parent_id=chapter_id
```

> 句子复用 `content_sentences`（`novel_chapter_id` 字段）；阅读进度、收藏、笔记、评分均复用 DC 模型。

## API

### 公开
- `GET /api/novels/categories` — 12 类目（标记 v1 上架的 5 类目）
- `GET /api/novels/categories/:slug/novels` — 小说列表（分页）
- `GET /api/novels/:novel_slug` — 小说详情 + 章节列表
- `GET /api/novels/:novel_slug/chapters/:chapter_no` — 章节内容（含句子）
  - 未登录：仅可读小说前 1 章
  - 已登录：可读全站全部小说章节
  - 限流：30/min/IP

### 已登录
- `POST /api/novels/chapters/:id/progress` — 进度（复用 DC 进度逻辑）
- `POST /api/novels/:id/favorite`
- `POST /api/novels/chapters/:id/quiz/submit` — 章末快测
- `POST /api/novels/:id/rating`
- `POST /api/novels/chapters/:id/share-card`

## 缓存
- 类目 / 小说列表 CDN 5min
- 章节内容（已发布）CDN 1h
- 句子音频 CDN 30 天

## 内容上架顺序（W0）
1. 5 部启动小说选定（PM）
2. 每部首 10 章 AI 生成 + 翻译 + TTS + 母语审校
3. 红线词检测
4. 启动后 W+1 起每周新增 1-2 章 / 部
