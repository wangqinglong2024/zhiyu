-- =====================================================
-- T03-001: 文章浏览去重表
-- =====================================================

-- article_views 浏览去重表
CREATE TABLE article_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id       UUID,
  fingerprint   VARCHAR(64),
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 登录用户 24 小时去重索引
CREATE UNIQUE INDEX idx_article_views_user_dedup
  ON article_views(article_id, user_id)
  WHERE user_id IS NOT NULL;

-- 未登录用户指纹索引
CREATE INDEX idx_article_views_fingerprint
  ON article_views(article_id, fingerprint, viewed_at)
  WHERE fingerprint IS NOT NULL;

-- RLS: 任何人可写（记录浏览）
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_views_insert_all" ON article_views
  FOR INSERT WITH CHECK (true);
