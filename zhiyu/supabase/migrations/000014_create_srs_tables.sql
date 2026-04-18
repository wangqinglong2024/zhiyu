-- ============================================================
-- T04-004: SRS 间隔复习表 — srs_review_items / srs_review_logs / srs_config
-- ============================================================

-- === 表 1: srs_review_items — 复习项 ===
CREATE TABLE public.srs_review_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  source_type VARCHAR(20) NOT NULL
    CHECK (source_type IN ('wrong_answer', 'vocabulary', 'grammar')),

  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  source_id VARCHAR(100),

  card_front JSONB NOT NULL,
  card_back JSONB NOT NULL,

  interval_stage SMALLINT NOT NULL DEFAULT 0,

  next_review_at TIMESTAMPTZ NOT NULL,
  last_reviewed_at TIMESTAMPTZ,

  total_reviews INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  wrong_streak INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_wrong INTEGER NOT NULL DEFAULT 0,

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'graduated', 'suspended')),

  graduated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sri_user_next_review
  ON public.srs_review_items (user_id, next_review_at)
  WHERE status = 'active';

CREATE INDEX idx_sri_user_source
  ON public.srs_review_items (user_id, source_type);

CREATE INDEX idx_sri_lesson
  ON public.srs_review_items (lesson_id)
  WHERE lesson_id IS NOT NULL;

CREATE INDEX idx_sri_graduated
  ON public.srs_review_items (user_id, graduated_at)
  WHERE status = 'graduated';

CREATE UNIQUE INDEX idx_sri_unique_source
  ON public.srs_review_items (user_id, source_type, source_id)
  WHERE status = 'active';

-- === 表 2: srs_review_logs — 复习历史记录 ===
CREATE TABLE public.srs_review_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_item_id UUID NOT NULL REFERENCES public.srs_review_items(id) ON DELETE CASCADE,

  result VARCHAR(20) NOT NULL CHECK (result IN ('remembered', 'forgotten')),

  interval_stage_before SMALLINT NOT NULL,
  interval_stage_after SMALLINT NOT NULL,

  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_time_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_srl_user ON public.srs_review_logs (user_id);
CREATE INDEX idx_srl_item ON public.srs_review_logs (review_item_id);
CREATE INDEX idx_srl_user_date ON public.srs_review_logs (user_id, reviewed_at DESC);

-- === 表 3: srs_config — 间隔算法参数（可配置） ===
CREATE TABLE public.srs_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(50) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.srs_config (config_key, config_value, description) VALUES
('interval_days', '[1, 2, 4, 7, 15, 30]', '各阶段间隔天数序列'),
('graduation_streak', '6', '连续"记住了"多少次后毕业'),
('daily_max_reviews', '50', '每日最大复习卡片数'),
('overdue_reset_days', '7', '逾期超过多少天自动回退到第 1 阶段'),
('wrong_streak_repeat', '2', '连续"还没记住"多少次后当日队列末尾再出现');

-- === RLS ===
ALTER TABLE public.srs_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sri_user_all" ON public.srs_review_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "srl_user_all" ON public.srs_review_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "config_select_authenticated" ON public.srs_config
  FOR SELECT TO authenticated USING (true);

-- === 触发器 ===
CREATE TRIGGER set_sri_updated_at BEFORE UPDATE ON public.srs_review_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_srs_config_updated_at BEFORE UPDATE ON public.srs_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
