-- =====================================================
-- T03-001: 文章表 + 文章多语言表
-- =====================================================

-- articles 文章表
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     SMALLINT NOT NULL REFERENCES categories(id),
  slug            VARCHAR(200) UNIQUE NOT NULL,
  cover_url       TEXT,
  thumbnail_url   TEXT,
  audio_url       TEXT,
  audio_duration  INT,
  view_count      INT NOT NULL DEFAULT 0,
  favorite_count  INT NOT NULL DEFAULT 0,
  sort_weight     INT NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_articles_category_status ON articles(category_id, status);
CREATE INDEX idx_articles_category_published ON articles(category_id, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_category_views ON articles(category_id, view_count DESC) WHERE status = 'published';

-- article_translations 文章多语言内容表
CREATE TABLE article_translations (
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale        VARCHAR(5) NOT NULL,
  title         VARCHAR(300) NOT NULL,
  summary       TEXT,
  content       TEXT NOT NULL,
  vocabulary    JSONB,
  quiz          JSONB,
  PRIMARY KEY (article_id, locale)
);

-- updated_at 触发器
CREATE TRIGGER set_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: articles — 已发布文章，未登录仅公开类目，登录全部
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_select_public" ON articles
  FOR SELECT USING (
    status = 'published'
    AND (
      category_id IN (SELECT id FROM categories WHERE is_public = true)
      OR
      auth.uid() IS NOT NULL
    )
  );

-- RLS: article_translations — 跟随 articles 的访问权限
ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_translations_select" ON article_translations
  FOR SELECT USING (
    article_id IN (SELECT id FROM articles WHERE status = 'published')
  );
