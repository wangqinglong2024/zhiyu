-- ============================================================
-- T04-007: 入学测试表 — placement_tests / placement_test_questions
-- ============================================================

-- === 表 1: placement_tests — 入学测试结果 ===
CREATE TABLE public.placement_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),

  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]',

  vocab_score DECIMAL(5,2) DEFAULT 0,
  reading_score DECIMAL(5,2) DEFAULT 0,
  grammar_score DECIMAL(5,2) DEFAULT 0,
  listening_score DECIMAL(5,2) DEFAULT 0,

  overall_accuracy DECIMAL(5,2),
  recommended_level SMALLINT,

  coin_reward_claimed BOOLEAN NOT NULL DEFAULT false,

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pt_user ON public.placement_tests (user_id);
CREATE INDEX idx_pt_user_status ON public.placement_tests (user_id, status);

-- === 表 2: placement_test_questions — 题库 ===
CREATE TABLE public.placement_test_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module VARCHAR(20) NOT NULL CHECK (module IN ('character', 'vocabulary', 'reading', 'hsk')),
  difficulty_level SMALLINT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 12),
  question JSONB NOT NULL,
  correct_answer VARCHAR(10) NOT NULL,
  explanation JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ptq_module_level ON public.placement_test_questions (module, difficulty_level) WHERE is_active = true;

-- === RLS ===
ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_test_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pt_user_all" ON public.placement_tests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ptq_select_authenticated" ON public.placement_test_questions
  FOR SELECT TO authenticated USING (is_active = true);

-- === 触发器 ===
CREATE TRIGGER set_pt_updated_at BEFORE UPDATE ON public.placement_tests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- === 种子数据: 每个模块每个难度 3 道题（用于逻辑验证） ===
INSERT INTO public.placement_test_questions (module, difficulty_level, question, correct_answer, explanation) VALUES
-- character 模块 L1-L3
('character', 1, '{"type":"single_choice","stem":"\"人\" 的意思是？","options":["A. 天","B. 人(person)","C. 大","D. 小"]}', 'B', '{"zh":"人 = person"}'),
('character', 2, '{"type":"single_choice","stem":"\"书\" 的意思是？","options":["A. 水","B. 火","C. 书(book)","D. 山"]}', 'C', '{"zh":"书 = book"}'),
('character', 3, '{"type":"single_choice","stem":"\"学\" 的意思是？","options":["A. 学(learn)","B. 字","C. 文","D. 语"]}', 'A', '{"zh":"学 = learn"}'),
-- vocabulary 模块 L1-L3
('vocabulary', 1, '{"type":"single_choice","stem":"\"你好\" 的英文翻译是？","options":["A. Goodbye","B. Hello","C. Thanks","D. Sorry"]}', 'B', '{"zh":"你好 = Hello"}'),
('vocabulary', 2, '{"type":"single_choice","stem":"\"谢谢\" 的英文翻译是？","options":["A. Hello","B. Sorry","C. Thank you","D. Please"]}', 'C', '{"zh":"谢谢 = Thank you"}'),
('vocabulary', 3, '{"type":"single_choice","stem":"\"朋友\" 的英文翻译是？","options":["A. Family","B. Teacher","C. Student","D. Friend"]}', 'D', '{"zh":"朋友 = Friend"}'),
-- reading 模块 L3-L5
('reading', 3, '{"type":"single_choice","stem":"\"我喜欢吃苹果。\" — 我喜欢什么？","options":["A. 香蕉","B. 苹果","C. 葡萄","D. 西瓜"]}', 'B', '{"zh":"苹果"}'),
('reading', 4, '{"type":"single_choice","stem":"\"今天天气很好，我们去公园吧。\" — 他们要去哪里？","options":["A. 学校","B. 医院","C. 公园","D. 商店"]}', 'C', '{"zh":"公园"}'),
('reading', 5, '{"type":"single_choice","stem":"\"他每天早上六点起床跑步。\" — 他什么时候起床？","options":["A. 五点","B. 六点","C. 七点","D. 八点"]}', 'B', '{"zh":"六点"}'),
-- hsk 模块 L4-L6
('hsk', 4, '{"type":"single_choice","stem":"选择正确的量词：一___书","options":["A. 个","B. 本","C. 条","D. 只"]}', 'B', '{"zh":"一本书"}'),
('hsk', 5, '{"type":"single_choice","stem":"\"虽然...但是...\" 表示什么关系？","options":["A. 因果","B. 转折","C. 递进","D. 并列"]}', 'B', '{"zh":"虽然...但是... = 转折关系"}'),
('hsk', 6, '{"type":"single_choice","stem":"\"画蛇添足\" 比喻什么？","options":["A. 多此一举","B. 一举两得","C. 半途而废","D. 守株待兔"]}', 'A', '{"zh":"画蛇添足 = 多此一举，做多余的事"}');
