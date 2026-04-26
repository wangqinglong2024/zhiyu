-- E06 ZY-06-01..06 — Discover China content model + interactions + FTS.
-- Tables: categories, articles, sentences, favorites, notes, reading_progress,
--         article_ratings, char_dict.
-- FTS: pg_trgm + tsvector (zhparser optional; falls back to 'simple' tokenizer
-- when extension unavailable so dev container starts on stock Postgres).
-- RLS: published rows are readable by everyone (incl. anon) per ZY-06-07
--未登录预览; admin role has full access; user-owned tables (favorites/notes/
-- reading_progress/ratings) restricted to owner.

CREATE SCHEMA IF NOT EXISTS zhiyu;

-- ---------------------------------------------------------------------------
-- 0. Extensions (best-effort, do not fail if extension missing in container).
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[E06] pg_trgm extension unavailable, continuing without trigram FTS';
END $$;

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS unaccent;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[E06] unaccent extension unavailable';
END $$;

-- pg_jieba is only present when supabase-db image is custom-built with the
-- compiled extension (see /opt/projects/zhiyu/system/docker/supabase-db/).
-- We attempt to load it; on failure, fall back to a generic ts_config that
-- splits Chinese on character boundaries (good enough for v1 dev demos).
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_jieba;
  RAISE NOTICE '[E06] pg_jieba loaded';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[E06] pg_jieba unavailable, using simple tokenizer fallback';
END $$;

-- ---------------------------------------------------------------------------
-- 1. categories — 12 fixed cultural buckets, slug-keyed, i18n labels.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.categories (
  id           smallserial PRIMARY KEY,
  slug         text NOT NULL UNIQUE,
  emoji        text,
  cover_url    text,
  i18n_name    jsonb NOT NULL DEFAULT '{}'::jsonb,
  i18n_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order   smallint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_sort_idx ON zhiyu.categories (sort_order);

-- ---------------------------------------------------------------------------
-- 2. articles — main content unit. status state-machine: draft → review →
--    published. body_md holds source markdown; render is FE responsibility.
--    i18n_title/summary keep per-locale headlines; body translations live in
--    sentences.i18n_translation jsonb (per-sentence aligned).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.articles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  category_id   smallint NOT NULL REFERENCES zhiyu.categories(id) ON DELETE RESTRICT,
  hsk_level     smallint NOT NULL DEFAULT 1,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','review','published','archived')),
  cover_url     text,
  estimated_minutes smallint NOT NULL DEFAULT 5,
  i18n_title    jsonb NOT NULL DEFAULT '{}'::jsonb,
  i18n_summary  jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_md       text NOT NULL DEFAULT '',
  audio_voice   text NOT NULL DEFAULT 'female-1',
  author        text,
  views         bigint NOT NULL DEFAULT 0,
  likes         bigint NOT NULL DEFAULT 0,
  rating_avg    numeric(3,2) NOT NULL DEFAULT 0,
  rating_count  bigint NOT NULL DEFAULT 0,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- FTS column maintained by trigger below (mixes title + body, language=simple
  -- so it tokenizes both Chinese characters and ASCII without extension dep).
  search_doc    tsvector
);
CREATE INDEX IF NOT EXISTS articles_category_idx ON zhiyu.articles (category_id, hsk_level, published_at DESC);
CREATE INDEX IF NOT EXISTS articles_status_idx ON zhiyu.articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS articles_search_idx ON zhiyu.articles USING gin (search_doc);

-- pg_trgm (fuzzy slug / title search) — best-effort.
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS articles_title_trgm_idx
    ON zhiyu.articles USING gin ((i18n_title->>'zh-CN') gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[E06] articles trigram index skipped';
END $$;

-- Search vector trigger. Falls back to 'simple' config so it works without
-- pg_jieba; when pg_jieba is loaded we can switch via ALTER LANGUAGE later.
CREATE OR REPLACE FUNCTION zhiyu.articles_tsv_refresh() RETURNS trigger AS $$
DECLARE
  cfg regconfig;
  zh_text text;
BEGIN
  -- Prefer pg_jieba's chinese config when present; fall back to simple.
  BEGIN
    SELECT 'jiebacfg'::regconfig INTO cfg;
  EXCEPTION WHEN OTHERS THEN
    cfg := 'simple'::regconfig;
  END;
  zh_text := coalesce(NEW.i18n_title->>'zh-CN','') || ' '
          || coalesce(NEW.i18n_summary->>'zh-CN','') || ' '
          || coalesce(NEW.body_md,'');
  NEW.search_doc :=
       setweight(to_tsvector(cfg, zh_text), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.i18n_title->>'en','')), 'B')
    || setweight(to_tsvector('simple', coalesce(NEW.i18n_summary->>'en','')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_tsv_trg ON zhiyu.articles;
CREATE TRIGGER articles_tsv_trg
  BEFORE INSERT OR UPDATE OF i18n_title, i18n_summary, body_md ON zhiyu.articles
  FOR EACH ROW EXECUTE FUNCTION zhiyu.articles_tsv_refresh();

-- ---------------------------------------------------------------------------
-- 3. sentences — per-sentence alignment for immersive reader.
--    idx is 0-based ordinal within the article; (article_id, idx) UNIQUE.
--    pinyin pre-computed at seed/import time. i18n_translation: {en,vi,th,id}.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.sentences (
  id            bigserial PRIMARY KEY,
  article_id    uuid NOT NULL REFERENCES zhiyu.articles(id) ON DELETE CASCADE,
  idx           smallint NOT NULL,
  zh            text NOT NULL,
  pinyin        text,
  i18n_translation jsonb NOT NULL DEFAULT '{}'::jsonb,
  audio_url     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sentences_article_idx_uk UNIQUE (article_id, idx)
);
CREATE INDEX IF NOT EXISTS sentences_article_idx ON zhiyu.sentences (article_id, idx);

-- ---------------------------------------------------------------------------
-- 4. char_dict — tiny single-character dictionary for the popup. Seeded with
--    common HSK-1 chars; extended by content factory in E16. v1 returns
--    pinyin / english / examples; missing chars degrade gracefully.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.char_dict (
  ch            text PRIMARY KEY,
  pinyin        text,
  i18n_gloss    jsonb NOT NULL DEFAULT '{}'::jsonb,
  examples      jsonb NOT NULL DEFAULT '[]'::jsonb,
  audio_url     text,
  hsk_level     smallint,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. favorites — generic "starred" set for any entity (articles, words, lessons).
--    UNIQUE (user_id, entity_type, entity_id) keeps it idempotent.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.favorites (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL,
  entity_type   text NOT NULL CHECK (entity_type IN ('article','sentence','word','char','lesson')),
  entity_id     text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_uk UNIQUE (user_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON zhiyu.favorites (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. notes — personal markdown notes attached to articles / chars / words.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  target_type   text NOT NULL CHECK (target_type IN ('article','sentence','word','char')),
  target_id     text NOT NULL,
  body          text NOT NULL DEFAULT '',
  color         text NOT NULL DEFAULT 'amber',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notes_user_idx ON zhiyu.notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS notes_target_idx ON zhiyu.notes (target_type, target_id);

-- ---------------------------------------------------------------------------
-- 7. reading_progress — per-(user, article) cursor with accumulated time.
--    PRIMARY KEY (user_id, article_id) ensures one row per pair.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.reading_progress (
  user_id            uuid NOT NULL,
  article_id         uuid NOT NULL REFERENCES zhiyu.articles(id) ON DELETE CASCADE,
  last_sentence_idx  smallint NOT NULL DEFAULT 0,
  scroll_pct         numeric(5,2) NOT NULL DEFAULT 0,
  accumulated_seconds integer NOT NULL DEFAULT 0,
  completed          boolean NOT NULL DEFAULT false,
  last_seen_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);
CREATE INDEX IF NOT EXISTS reading_progress_user_idx
  ON zhiyu.reading_progress (user_id, last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- 8. article_ratings — 1..5 star, one per (user, article). On insert/update
--    a small recompute trigger updates articles.rating_avg / rating_count.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.article_ratings (
  user_id     uuid NOT NULL,
  article_id  uuid NOT NULL REFERENCES zhiyu.articles(id) ON DELETE CASCADE,
  score       smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

CREATE OR REPLACE FUNCTION zhiyu.article_ratings_recompute() RETURNS trigger AS $$
DECLARE
  aid uuid;
  avg_score numeric(3,2);
  cnt bigint;
BEGIN
  aid := COALESCE(NEW.article_id, OLD.article_id);
  SELECT COALESCE(AVG(score)::numeric(3,2), 0), COUNT(*)
    INTO avg_score, cnt
    FROM zhiyu.article_ratings
   WHERE article_id = aid;
  UPDATE zhiyu.articles
     SET rating_avg = avg_score, rating_count = cnt, updated_at = now()
   WHERE id = aid;
  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_ratings_rcm ON zhiyu.article_ratings;
CREATE TRIGGER article_ratings_rcm
  AFTER INSERT OR UPDATE OR DELETE ON zhiyu.article_ratings
  FOR EACH ROW EXECUTE FUNCTION zhiyu.article_ratings_recompute();

-- ---------------------------------------------------------------------------
-- 9. RLS policies.
-- ---------------------------------------------------------------------------
ALTER TABLE zhiyu.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.articles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.sentences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.char_dict          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.favorites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.reading_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.article_ratings    ENABLE ROW LEVEL SECURITY;

-- Public read on reference data (categories) and published articles/sentences.
DROP POLICY IF EXISTS categories_public_read ON zhiyu.categories;
CREATE POLICY categories_public_read ON zhiyu.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS articles_public_read ON zhiyu.articles;
CREATE POLICY articles_public_read ON zhiyu.articles
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS sentences_public_read ON zhiyu.sentences;
CREATE POLICY sentences_public_read ON zhiyu.sentences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM zhiyu.articles a
       WHERE a.id = sentences.article_id AND a.status = 'published'
    )
  );

DROP POLICY IF EXISTS char_dict_public_read ON zhiyu.char_dict;
CREATE POLICY char_dict_public_read ON zhiyu.char_dict FOR SELECT USING (true);

-- service_role bypasses RLS automatically. Provide explicit admin-style write
-- policies for authenticated admins (custom claim role='admin').
DROP POLICY IF EXISTS articles_admin_write ON zhiyu.articles;
CREATE POLICY articles_admin_write ON zhiyu.articles
  FOR ALL USING (auth.role() = 'service_role' OR (auth.jwt()->>'role') = 'admin')
  WITH CHECK (auth.role() = 'service_role' OR (auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS categories_admin_write ON zhiyu.categories;
CREATE POLICY categories_admin_write ON zhiyu.categories
  FOR ALL USING (auth.role() = 'service_role' OR (auth.jwt()->>'role') = 'admin')
  WITH CHECK (auth.role() = 'service_role' OR (auth.jwt()->>'role') = 'admin');

DROP POLICY IF EXISTS sentences_admin_write ON zhiyu.sentences;
CREATE POLICY sentences_admin_write ON zhiyu.sentences
  FOR ALL USING (auth.role() = 'service_role' OR (auth.jwt()->>'role') = 'admin')
  WITH CHECK (auth.role() = 'service_role' OR (auth.jwt()->>'role') = 'admin');

-- User-owned rows.
DROP POLICY IF EXISTS favorites_owner_all ON zhiyu.favorites;
CREATE POLICY favorites_owner_all ON zhiyu.favorites
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notes_owner_all ON zhiyu.notes;
CREATE POLICY notes_owner_all ON zhiyu.notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS progress_owner_all ON zhiyu.reading_progress;
CREATE POLICY progress_owner_all ON zhiyu.reading_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ratings_owner_all ON zhiyu.article_ratings;
CREATE POLICY ratings_owner_all ON zhiyu.article_ratings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
