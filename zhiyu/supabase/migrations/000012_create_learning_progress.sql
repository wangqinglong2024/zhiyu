-- ============================================================
-- T04-002: 学习进度表 — user_course_progress / user_lesson_progress / user_unit_progress
-- ============================================================

-- === 表 1: user_course_progress — Level 级进度 ===
CREATE TABLE public.user_course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),

  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,

  placement_recommended BOOLEAN NOT NULL DEFAULT false,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_studied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, level_id)
);

CREATE INDEX idx_ucp_user ON public.user_course_progress (user_id);
CREATE INDEX idx_ucp_user_status ON public.user_course_progress (user_id, status);
CREATE INDEX idx_ucp_user_level ON public.user_course_progress (user_id, level_id);

-- === 表 2: user_unit_progress — 单元级进度 ===
CREATE TABLE public.user_unit_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),

  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,

  assessment_score SMALLINT,
  assessment_passed BOOLEAN NOT NULL DEFAULT false,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, unit_id)
);

CREATE INDEX idx_uup_user ON public.user_unit_progress (user_id);
CREATE INDEX idx_uup_user_level ON public.user_unit_progress (user_id, level_id);
CREATE INDEX idx_uup_user_status ON public.user_unit_progress (user_id, status);

-- === 表 3: user_lesson_progress — 课时级进度 ===
CREATE TABLE public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'content_done', 'completed')),

  resume_data JSONB DEFAULT '{}',

  started_at TIMESTAMPTZ,
  content_done_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_studied_at TIMESTAMPTZ,
  total_study_seconds INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_ulp_user ON public.user_lesson_progress (user_id);
CREATE INDEX idx_ulp_user_unit ON public.user_lesson_progress (user_id, unit_id);
CREATE INDEX idx_ulp_user_level ON public.user_lesson_progress (user_id, level_id);
CREATE INDEX idx_ulp_user_status ON public.user_lesson_progress (user_id, status);
CREATE INDEX idx_ulp_last_studied ON public.user_lesson_progress (user_id, last_studied_at DESC);

-- === RLS ===
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ucp_user_all" ON public.user_course_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uup_user_all" ON public.user_unit_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ulp_user_all" ON public.user_lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === 触发器 ===
CREATE TRIGGER set_ucp_updated_at BEFORE UPDATE ON public.user_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_uup_updated_at BEFORE UPDATE ON public.user_unit_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_ulp_updated_at BEFORE UPDATE ON public.user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
