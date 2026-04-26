-- E09 ZY-09-10 — Game engine support tables (game_runs, leaderboards, events, wordpacks).
-- Idempotent: every CREATE uses IF NOT EXISTS / OR REPLACE. RLS isolates per-user.

CREATE SCHEMA IF NOT EXISTS zhiyu;

-- ---------------------------------------------------------------------------
-- 1. game_runs — one row per finished round.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.game_runs (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL,
  game_id     text NOT NULL,
  score       integer NOT NULL CHECK (score >= 0 AND score <= 1000000),
  duration_ms integer NOT NULL CHECK (duration_ms >= 1000 AND duration_ms <= 600000),
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_runs_game_score_idx
  ON zhiyu.game_runs (game_id, score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS game_runs_user_idx
  ON zhiyu.game_runs (user_id, created_at DESC);

ALTER TABLE zhiyu.game_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS game_runs_select_self ON zhiyu.game_runs;
CREATE POLICY game_runs_select_self ON zhiyu.game_runs
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
DROP POLICY IF EXISTS game_runs_insert_self ON zhiyu.game_runs;
CREATE POLICY game_runs_insert_self ON zhiyu.game_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2. leaderboards — top-N cache, refreshed by worker every 5 minutes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.leaderboards (
  game_id      text NOT NULL,
  scope        text NOT NULL CHECK (scope IN ('all','week','month','daily')),
  period_start timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
  period_end   timestamptz,
  ranks        jsonb NOT NULL DEFAULT '[]'::jsonb,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, scope, period_start)
);

ALTER TABLE zhiyu.leaderboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leaderboards_select_all ON zhiyu.leaderboards;
CREATE POLICY leaderboards_select_all ON zhiyu.leaderboards
  FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 3. events — analytics sink replacing PostHog. Append-only.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.events (
  id      bigserial PRIMARY KEY,
  ts      timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  name    text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  props   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS events_name_ts_idx ON zhiyu.events (name, ts DESC);
CREATE INDEX IF NOT EXISTS events_user_ts_idx ON zhiyu.events (user_id, ts DESC);

ALTER TABLE zhiyu.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_insert_self ON zhiyu.events;
CREATE POLICY events_insert_self ON zhiyu.events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR user_id IS NULL);
DROP POLICY IF EXISTS events_select_self ON zhiyu.events;
CREATE POLICY events_select_self ON zhiyu.events
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4. wordpacks — JSON content delivered through the engine WordPackLoader.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.wordpacks (
  id         text PRIMARY KEY,
  hsk_level  smallint NOT NULL DEFAULT 1,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE zhiyu.wordpacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wordpacks_select_all ON zhiyu.wordpacks;
CREATE POLICY wordpacks_select_all ON zhiyu.wordpacks
  FOR SELECT USING (true);

-- Seed minimal HSK level packs so the FE / engine has something to render
-- before the content factory (E16) populates them.
INSERT INTO zhiyu.wordpacks (id, hsk_level, items) VALUES
  ('hsk-1', 1, '[
    {"char":"你","pinyin":"nǐ","gloss_i18n":{"en":"you","zh":"你"}},
    {"char":"好","pinyin":"hǎo","gloss_i18n":{"en":"good","zh":"好"}},
    {"char":"我","pinyin":"wǒ","gloss_i18n":{"en":"I","zh":"我"}},
    {"char":"是","pinyin":"shì","gloss_i18n":{"en":"to be","zh":"是"}},
    {"char":"中","pinyin":"zhōng","gloss_i18n":{"en":"middle","zh":"中"}},
    {"char":"国","pinyin":"guó","gloss_i18n":{"en":"country","zh":"国"}}
  ]'::jsonb),
  ('hsk-2', 2, '[
    {"char":"学","pinyin":"xué","gloss_i18n":{"en":"study"}},
    {"char":"生","pinyin":"shēng","gloss_i18n":{"en":"life"}},
    {"char":"工","pinyin":"gōng","gloss_i18n":{"en":"work"}},
    {"char":"作","pinyin":"zuò","gloss_i18n":{"en":"do"}}
  ]'::jsonb)
ON CONFLICT (id) DO NOTHING;
