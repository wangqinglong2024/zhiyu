-- E07 ZY-07-01..07 — Learning Engine
-- Tables: courses (stub), lessons (stub), enrollments, lesson_progress,
--         mistake_log, vocab_items, srs_cards, user_progression, xp_log,
--         hsk_results, dashboard_layout.
-- RLS: per-user isolation via auth.uid(); admin role full access; anon
-- restricted. Stub course/lesson tables are kept minimal so E08 can extend
-- them with proper modelling without breaking the engine.

CREATE SCHEMA IF NOT EXISTS zhiyu;

-- ---------------------------------------------------------------------------
-- 0. courses + lessons stubs (will be expanded by E08).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.courses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  track        text NOT NULL DEFAULT 'daily',          -- daily | ecommerce | factory | hsk
  hsk_level    smallint NOT NULL DEFAULT 1,
  i18n_title   jsonb NOT NULL DEFAULT '{}'::jsonb,
  i18n_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  cover_url    text,
  is_free      boolean NOT NULL DEFAULT true,
  status       text NOT NULL DEFAULT 'published',       -- draft | published | archived
  sort_order   smallint NOT NULL DEFAULT 0,
  lesson_count smallint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_track_idx ON zhiyu.courses (track, sort_order);

CREATE TABLE IF NOT EXISTS zhiyu.lessons (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES zhiyu.courses(id) ON DELETE CASCADE,
  slug         text NOT NULL,
  i18n_title   jsonb NOT NULL DEFAULT '{}'::jsonb,
  i18n_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- 10-step spec is jsonb so we can iterate without migrations:
  --   [{ index, type, payload, pass:{...} }, ...]
  steps        jsonb NOT NULL DEFAULT '[]'::jsonb,
  position     smallint NOT NULL DEFAULT 0,
  estimated_minutes smallint NOT NULL DEFAULT 8,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, slug)
);
CREATE INDEX IF NOT EXISTS lessons_course_pos_idx
  ON zhiyu.lessons (course_id, position);

-- ---------------------------------------------------------------------------
-- 1. enrollments — per (user, course) row, status state machine.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.enrollments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         uuid NOT NULL REFERENCES zhiyu.courses(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','completed','reset')),
  current_lesson_id uuid,
  progress_percent  numeric(5,2) NOT NULL DEFAULT 0,
  last_active_at    timestamptz NOT NULL DEFAULT now(),
  enrolled_at       timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  reset_at          timestamptz
);
-- Only ONE active enrollment per (user, course); historical reset/completed
-- rows are kept for audit and can repeat freely.
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_active_uidx
  ON zhiyu.enrollments (user_id, course_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS enrollments_user_status_idx
  ON zhiyu.enrollments (user_id, status);
CREATE INDEX IF NOT EXISTS enrollments_course_idx
  ON zhiyu.enrollments (course_id);

-- ---------------------------------------------------------------------------
-- 2. lesson_progress — per (user, lesson, step) row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.lesson_progress (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   uuid NOT NULL REFERENCES zhiyu.lessons(id) ON DELETE CASCADE,
  step_index  smallint NOT NULL CHECK (step_index BETWEEN 0 AND 9),
  status      text NOT NULL DEFAULT 'in_progress'
              CHECK (status IN ('in_progress','done','skipped','failed')),
  score       numeric(5,2) NOT NULL DEFAULT 0,
  attempts    integer NOT NULL DEFAULT 0,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id, step_index)
);
CREATE INDEX IF NOT EXISTS lesson_progress_user_idx
  ON zhiyu.lesson_progress (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS lesson_progress_lesson_idx
  ON zhiyu.lesson_progress (lesson_id);

-- ---------------------------------------------------------------------------
-- 3. mistake_log — every wrong answer in any lesson step.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.mistake_log (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   uuid REFERENCES zhiyu.lessons(id) ON DELETE SET NULL,
  step_index  smallint,
  question_id text,
  source      text NOT NULL DEFAULT 'lesson',  -- lesson | game | reading | srs
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,                     -- set when user answers correctly later
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mistake_log_user_recent_idx
  ON zhiyu.mistake_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mistake_log_user_unresolved_idx
  ON zhiyu.mistake_log (user_id, resolved_at)
  WHERE resolved_at IS NULL;

-- ---------------------------------------------------------------------------
-- 4. vocab_items — wordbook entries (also seeded by E06 favourites).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.vocab_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word       text NOT NULL,
  pinyin     text,
  meaning    text,
  source     text NOT NULL DEFAULT 'manual',   -- lesson:<id> | article:<id> | game:<id> | manual
  hsk_level  smallint NOT NULL DEFAULT 1,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word)
);
CREATE INDEX IF NOT EXISTS vocab_items_user_idx
  ON zhiyu.vocab_items (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. srs_cards — SM-2 simplified spaced repetition.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.srs_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word          text NOT NULL,
  pinyin        text,
  meaning       text,
  source        text NOT NULL DEFAULT 'manual',  -- lesson:<id> | fav | mistake | manual
  interval_days numeric(6,2) NOT NULL DEFAULT 0,
  ease          numeric(4,2) NOT NULL DEFAULT 2.5,
  due_at        date NOT NULL DEFAULT current_date,
  reps          integer NOT NULL DEFAULT 0,
  lapses        integer NOT NULL DEFAULT 0,
  last_grade    smallint,                          -- 1..4 (again/hard/good/easy)
  last_reviewed_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word)
);
CREATE INDEX IF NOT EXISTS srs_cards_user_due_idx
  ON zhiyu.srs_cards (user_id, due_at);

-- ---------------------------------------------------------------------------
-- 6. user_progression — XP / level / streak summary.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.user_progression (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp               bigint NOT NULL DEFAULT 0,
  level            integer NOT NULL DEFAULT 0,
  streak_current   integer NOT NULL DEFAULT 0,
  streak_max       integer NOT NULL DEFAULT 0,
  last_active_date date,
  freeze_count     integer NOT NULL DEFAULT 0,
  freeze_granted_month text,                       -- YYYY-MM, last grant month
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. xp_log — append-only ledger for XP awards.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.xp_log (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta      integer NOT NULL,
  source     text NOT NULL,                         -- lesson | srs | article | streak | event
  meta       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xp_log_user_recent_idx
  ON zhiyu.xp_log (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 8. hsk_results — onboarding self-assessment.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.hsk_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions integer NOT NULL,
  correct_count   integer NOT NULL,
  per_level       jsonb NOT NULL DEFAULT '{}'::jsonb,    -- { "1": {asked:n, correct:m}, ... }
  recommended_level smallint NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hsk_results_user_idx
  ON zhiyu.hsk_results (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 9. dashboard_layout — saved card order (per user).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zhiyu.dashboard_layout (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  card_order text[] NOT NULL DEFAULT ARRAY['xp','streak','today_srs','continue','recommend','achievements']::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE zhiyu.courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.lesson_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.mistake_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.vocab_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.srs_cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.user_progression  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.xp_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.hsk_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.dashboard_layout  ENABLE ROW LEVEL SECURITY;

-- Public catalog: published courses + lessons readable by anyone.
DROP POLICY IF EXISTS courses_read ON zhiyu.courses;
CREATE POLICY courses_read ON zhiyu.courses FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS lessons_read ON zhiyu.lessons;
CREATE POLICY lessons_read ON zhiyu.lessons FOR SELECT
  USING (true);

-- Service role bypasses RLS by default; explicit owner policies for the rest.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'enrollments','lesson_progress','mistake_log','vocab_items',
    'srs_cards','user_progression','xp_log','hsk_results','dashboard_layout'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_owner_select ON zhiyu.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_owner_select ON zhiyu.%I FOR SELECT USING (user_id = auth.uid())',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_owner_insert ON zhiyu.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_owner_insert ON zhiyu.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_owner_update ON zhiyu.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_owner_update ON zhiyu.%I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_owner_delete ON zhiyu.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_owner_delete ON zhiyu.%I FOR DELETE USING (user_id = auth.uid())',
      t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Helper RPCs (used by the dashboard to keep round-trips minimal).
-- ---------------------------------------------------------------------------

-- Snapshot of progression + today's SRS + active enrollment count.
CREATE OR REPLACE FUNCTION zhiyu.dashboard_snapshot(p_user uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'progression',
      (SELECT to_jsonb(p) FROM zhiyu.user_progression p WHERE p.user_id = p_user),
    'today_srs',
      (SELECT count(*) FROM zhiyu.srs_cards
        WHERE user_id = p_user AND due_at <= current_date),
    'active_enrollments',
      (SELECT count(*) FROM zhiyu.enrollments
        WHERE user_id = p_user AND status = 'active'),
    'completed_lessons',
      (SELECT count(distinct lesson_id) FROM zhiyu.lesson_progress
        WHERE user_id = p_user AND status = 'done' AND step_index = 9),
    'mistakes_open',
      (SELECT count(*) FROM zhiyu.mistake_log
        WHERE user_id = p_user AND resolved_at IS NULL),
    'wordbook_size',
      (SELECT count(*) FROM zhiyu.vocab_items WHERE user_id = p_user)
  );
$$;

GRANT EXECUTE ON FUNCTION zhiyu.dashboard_snapshot(uuid)
  TO authenticated, service_role;

-- 7-day XP rollup for the dashboard chart.
CREATE OR REPLACE FUNCTION zhiyu.xp_weekly(p_user uuid)
RETURNS TABLE (day date, xp bigint)
LANGUAGE sql
STABLE
AS $$
  WITH days AS (
    SELECT (current_date - i)::date AS day
    FROM generate_series(0, 6) AS gs(i)
  )
  SELECT d.day,
         coalesce(sum(x.delta)::bigint, 0) AS xp
  FROM days d
  LEFT JOIN zhiyu.xp_log x
    ON x.user_id = p_user
   AND x.created_at::date = d.day
  GROUP BY d.day
  ORDER BY d.day;
$$;

GRANT EXECUTE ON FUNCTION zhiyu.xp_weekly(uuid)
  TO authenticated, service_role;
