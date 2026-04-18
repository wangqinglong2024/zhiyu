-- ============================================================
-- T04-001: 课程结构表 — levels / units / lessons
-- ============================================================

-- === 表 1: levels — 课程等级（12 个固定等级） ===
CREATE TABLE public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number SMALLINT NOT NULL UNIQUE CHECK (level_number BETWEEN 1 AND 12),

  -- 多语言名称
  name_zh VARCHAR(50) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,

  -- 多语言描述
  description_zh TEXT,
  description_en TEXT,
  description_vi TEXT,

  -- 对标信息
  hsk_level VARCHAR(20) NOT NULL,
  cefr_level VARCHAR(10) NOT NULL,
  school_stage VARCHAR(50),

  -- 课程数据指标
  total_units SMALLINT NOT NULL DEFAULT 0,
  lessons_per_unit SMALLINT NOT NULL DEFAULT 5,
  total_lessons SMALLINT NOT NULL DEFAULT 0,
  cumulative_vocab INTEGER NOT NULL DEFAULT 0,
  cumulative_chars INTEGER NOT NULL DEFAULT 0,
  cumulative_idioms INTEGER NOT NULL DEFAULT 0,
  cumulative_poems INTEGER NOT NULL DEFAULT 0,
  estimated_hours SMALLINT NOT NULL DEFAULT 30,

  -- 定价
  is_free BOOLEAN NOT NULL DEFAULT false,
  price_usd DECIMAL(5,2) NOT NULL DEFAULT 6.00,
  coin_price INTEGER NOT NULL DEFAULT 600,

  -- 排序与展示
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_levels_number ON public.levels (level_number);
CREATE INDEX idx_levels_active ON public.levels (is_active) WHERE is_active = true;

-- === 表 2: units — 学习单元 ===
CREATE TABLE public.units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  unit_number SMALLINT NOT NULL,

  -- 多语言名称
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  name_vi VARCHAR(200) NOT NULL,

  -- 多语言描述
  description_zh TEXT,
  description_en TEXT,
  description_vi TEXT,

  -- 单元元数据
  total_lessons SMALLINT NOT NULL DEFAULT 5,

  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (level_id, unit_number)
);

CREATE INDEX idx_units_level ON public.units (level_id);
CREATE INDEX idx_units_level_order ON public.units (level_id, sort_order);

-- === 表 3: lessons — 课时 ===
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  lesson_number SMALLINT NOT NULL,

  -- 多语言标题
  title_zh VARCHAR(200) NOT NULL,
  title_en VARCHAR(300) NOT NULL,
  title_vi VARCHAR(300) NOT NULL,

  -- 教学内容（JSON 结构，支持多语言渲染）
  content JSONB NOT NULL DEFAULT '{}',
  -- 重点词汇（JSONB 数组）
  key_vocabulary JSONB NOT NULL DEFAULT '[]',
  -- 语法点（JSONB 数组）
  grammar_points JSONB NOT NULL DEFAULT '[]',

  -- 音频资源
  audio_url VARCHAR(500),

  -- 元数据
  estimated_minutes SMALLINT DEFAULT 15,
  vocab_count SMALLINT DEFAULT 0,

  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (unit_id, lesson_number)
);

CREATE INDEX idx_lessons_unit ON public.lessons (unit_id);
CREATE INDEX idx_lessons_level ON public.lessons (level_id);
CREATE INDEX idx_lessons_unit_order ON public.lessons (unit_id, sort_order);

-- === RLS ===
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "levels_select_authenticated" ON public.levels
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "units_select_authenticated" ON public.units
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "lessons_select_authenticated" ON public.lessons
  FOR SELECT TO authenticated USING (is_active = true);

-- === 触发器: updated_at 自动更新 ===
CREATE TRIGGER set_levels_updated_at BEFORE UPDATE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- === 种子数据: 12 个 Level ===
INSERT INTO public.levels (level_number, name_zh, name_en, name_vi, hsk_level, cefr_level, school_stage, total_units, lessons_per_unit, total_lessons, cumulative_vocab, cumulative_chars, cumulative_idioms, cumulative_poems, estimated_hours, is_free, price_usd, coin_price, sort_order) VALUES
(1,  '识字启蒙',   'First Steps',             'Khởi đầu nhận chữ',       'HSK 1',   'A1',  '小学一年级上', 8,  5, 40,  500,   300,   0,    0,  30, true,  0.00, 0,   1),
(2,  '拼音世界',   'Pinyin World',             'Thế giới Pinyin',         'HSK 1',   'A1',  '小学一年级下', 8,  5, 40,  800,   500,   0,    5,  30, true,  0.00, 0,   2),
(3,  '词语花园',   'Word Garden',              'Vườn từ vựng',            'HSK 2',   'A2',  '小学二年级上', 8,  5, 40,  1200,  700,   20,   10, 30, true,  0.00, 0,   3),
(4,  '句子乐园',   'Sentence Paradise',        'Thiên đường câu',         'HSK 2',   'A2',  '小学二年级下', 10, 5, 50,  1600,  900,   40,   20, 35, false, 6.00, 600, 4),
(5,  '成语故事',   'Idiom Stories',            'Câu chuyện thành ngữ',    'HSK 3',   'B1',  '小学三年级上', 10, 5, 50,  2100,  1100,  80,   30, 35, false, 6.00, 600, 5),
(6,  '阅读天地',   'Reading World',            'Thế giới đọc hiểu',      'HSK 3',   'B1',  '小学三年级下', 10, 5, 50,  2600,  1300,  120,  40, 35, false, 6.00, 600, 6),
(7,  '写作基础',   'Writing Basics',           'Cơ sở viết văn',         'HSK 4',   'B1',  '小学四年级上', 10, 6, 60,  3200,  1500,  160,  50, 40, false, 6.00, 600, 7),
(8,  '文化探索',   'Cultural Exploration',     'Khám phá văn hóa',       'HSK 4',   'B2',  '小学四年级下', 10, 6, 60,  3800,  1700,  200,  60, 40, false, 6.00, 600, 8),
(9,  '经典诵读',   'Classic Recitation',       'Đọc tác phẩm kinh điển', 'HSK 5',   'B2',  '小学五年级上', 12, 5, 60,  4500,  1900,  250,  75, 40, false, 6.00, 600, 9),
(10, '古文入门',   'Classical Chinese Intro',  'Nhập môn cổ văn',        'HSK 5-6', 'B2',  '小学五年级下', 12, 5, 60,  5200,  2100,  300,  90, 40, false, 6.00, 600, 10),
(11, '思辨阅读',   'Critical Reading',         'Đọc tư duy phản biện',   'HSK 6',   'C1',  '小学六年级上', 12, 5, 60,  6000,  2300,  360,  100,45, false, 6.00, 600, 11),
(12, '文学鉴赏',   'Literary Appreciation',    'Thưởng thức văn học',     'HSK 7-9', 'C1',  '小学六年级下', 12, 5, 60,  6800,  2500,  400,  120,45, false, 6.00, 600, 12);
