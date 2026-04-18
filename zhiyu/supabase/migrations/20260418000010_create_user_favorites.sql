-- =====================================================
-- T03-003: 用户收藏表
-- =====================================================

CREATE TABLE user_favorites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 联合唯一：同一用户不能重复收藏同一篇文章
  CONSTRAINT uq_user_article_favorite UNIQUE (user_id, article_id)
);

-- 索引
CREATE INDEX idx_favorites_user_created ON user_favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_article ON user_favorites(article_id);

-- RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 收藏数 +1 触发器
CREATE OR REPLACE FUNCTION increment_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles SET favorite_count = favorite_count + 1 WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 收藏数 -1 触发器
CREATE OR REPLACE FUNCTION decrement_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles SET favorite_count = favorite_count - 1 WHERE id = OLD.article_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_favorite_insert AFTER INSERT ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION increment_favorite_count();

CREATE TRIGGER after_favorite_delete AFTER DELETE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION decrement_favorite_count();
