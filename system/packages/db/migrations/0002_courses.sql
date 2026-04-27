CREATE TABLE IF NOT EXISTS zhiyu.content_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code IN ('ec','factory','hsk','daily')),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  icon_url TEXT,
  display_order INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zhiyu.content_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES zhiyu.content_tracks(id),
  stage_no INT NOT NULL CHECK (stage_no BETWEEN 1 AND 12),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  hsk_level_range INT[],
  prerequisite_stage INT,
  is_free BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, stage_no)
);

CREATE TABLE IF NOT EXISTS zhiyu.content_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES zhiyu.content_stages(id),
  chapter_no INT NOT NULL CHECK (chapter_no BETWEEN 1 AND 12),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  is_free BOOLEAN DEFAULT FALSE,
  free_reason TEXT,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stage_id, chapter_no)
);

CREATE TABLE IF NOT EXISTS zhiyu.content_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES zhiyu.content_chapters(id),
  lesson_no INT NOT NULL CHECK (lesson_no BETWEEN 1 AND 12),
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  intro JSONB,
  learning_objectives JSONB,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, lesson_no)
);

CREATE TABLE IF NOT EXISTS zhiyu.content_knowledge_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES zhiyu.content_lessons(id),
  kpoint_no INT NOT NULL CHECK (kpoint_no BETWEEN 1 AND 12),
  type TEXT NOT NULL CHECK (type IN ('word','phrase','sentence','grammar','culture')),
  zh TEXT NOT NULL CHECK (char_length(zh) <= 40),
  pinyin TEXT NOT NULL,
  pinyin_tones TEXT,
  translations JSONB NOT NULL,
  key_point JSONB,
  audio JSONB,
  example_sentences JSONB,
  tags TEXT[],
  hsk_level INT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id, kpoint_no)
);
CREATE INDEX IF NOT EXISTS idx_kp_lesson ON zhiyu.content_knowledge_points(lesson_id, kpoint_no);

CREATE TABLE IF NOT EXISTS zhiyu.content_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','P1','P2','P3')),
  stem_zh TEXT,
  stem_translations JSONB,
  audio_url TEXT,
  options JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  explanation JSONB NOT NULL,
  knowledge_point_id UUID REFERENCES zhiyu.content_knowledge_points(id),
  lesson_id UUID REFERENCES zhiyu.content_lessons(id),
  chapter_id UUID REFERENCES zhiyu.content_chapters(id),
  stage_id UUID REFERENCES zhiyu.content_stages(id),
  track TEXT,
  hsk_level INT,
  difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[],
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'ai',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES zhiyu.admin_users(id),
  report_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON zhiyu.content_questions(lesson_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_type ON zhiyu.content_questions(type, hsk_level);

CREATE TABLE IF NOT EXISTS zhiyu.content_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('lesson_quiz','chapter_test','stage_exam','pinyin_intro')),
  parent_id UUID NOT NULL,
  question_count INT NOT NULL,
  pass_threshold INT NOT NULL,
  time_limit_seconds INT,
  question_ids UUID[],
  selection_strategy JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zhiyu.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('track','stage','chapter','lesson','knowledge_point','pinyin')),
  scope_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','completed','skipped')),
  progress_pct DECIMAL(5,2) DEFAULT 0,
  completion_counted BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS zhiyu.learning_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  quiz_id UUID NOT NULL REFERENCES zhiyu.content_quizzes(id),
  question_responses JSONB NOT NULL,
  score_pct DECIMAL(5,2) NOT NULL,
  is_passed BOOLEAN NOT NULL,
  duration_seconds INT NOT NULL,
  attempt_no INT DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zhiyu.learning_wrong_set (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  question_id UUID NOT NULL REFERENCES zhiyu.content_questions(id),
  wrong_count INT DEFAULT 1,
  last_wrong_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS zhiyu.user_track_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  track_id UUID NOT NULL REFERENCES zhiyu.content_tracks(id),
  current_stage_id UUID REFERENCES zhiyu.content_stages(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

CREATE TABLE IF NOT EXISTS zhiyu.user_stage_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  stage_id UUID NOT NULL REFERENCES zhiyu.content_stages(id),
  track_id UUID REFERENCES zhiyu.content_tracks(id),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('stage_single','stage_nine_pack','membership_monthly','membership_yearly','membership_half_year','single_stage','nine_pack','membership','manual_grant')),
  order_id UUID,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stage_id, purchase_type)
);

CREATE TABLE IF NOT EXISTS zhiyu.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  scope_id UUID NOT NULL,
  active_seconds INT NOT NULL DEFAULT 0,
  day_key DATE NOT NULL DEFAULT CURRENT_DATE,
  rewarded BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scope_id, day_key)
);

CREATE TABLE IF NOT EXISTS zhiyu.course_content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES zhiyu.users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('pinyin','translation','audio','inappropriate')),
  description TEXT,
  status TEXT DEFAULT 'to_review',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zhiyu.course_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_version TEXT NOT NULL,
  module TEXT NOT NULL DEFAULT 'courses',
  status TEXT NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT TRUE,
  item_count INT NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES zhiyu.admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE zhiyu.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.learning_wrong_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.user_track_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.user_stage_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zhiyu.course_content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rlsp_self_learning_progress ON zhiyu.learning_progress;
DROP POLICY IF EXISTS rlsp_self_quiz_attempts ON zhiyu.learning_quiz_attempts;
DROP POLICY IF EXISTS rlsp_self_wrong_set ON zhiyu.learning_wrong_set;
DROP POLICY IF EXISTS rlsp_self_track_enrollments ON zhiyu.user_track_enrollments;
DROP POLICY IF EXISTS rlsp_self_stage_purchases ON zhiyu.user_stage_purchases;
DROP POLICY IF EXISTS rlsp_self_learning_sessions ON zhiyu.learning_sessions;
DROP POLICY IF EXISTS rlsp_self_course_reports ON zhiyu.course_content_reports;
CREATE POLICY rlsp_self_learning_progress ON zhiyu.learning_progress USING (user_id = auth.uid());
CREATE POLICY rlsp_self_quiz_attempts ON zhiyu.learning_quiz_attempts USING (user_id = auth.uid());
CREATE POLICY rlsp_self_wrong_set ON zhiyu.learning_wrong_set USING (user_id = auth.uid());
CREATE POLICY rlsp_self_track_enrollments ON zhiyu.user_track_enrollments USING (user_id = auth.uid());
CREATE POLICY rlsp_self_stage_purchases ON zhiyu.user_stage_purchases USING (user_id = auth.uid());
CREATE POLICY rlsp_self_learning_sessions ON zhiyu.learning_sessions USING (user_id = auth.uid());
CREATE POLICY rlsp_self_course_reports ON zhiyu.course_content_reports USING (user_id = auth.uid());