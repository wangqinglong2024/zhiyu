-- =====================================================
-- T03-002: 每日金句表
-- =====================================================

CREATE TABLE daily_quotes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 中文金句（始终存在）
  quote_zh          TEXT NOT NULL,
  quote_pinyin      TEXT NOT NULL,
  source_zh         VARCHAR(200),
  interpretation_zh TEXT,

  -- 英文翻译
  quote_en          TEXT,
  interpretation_en TEXT,

  -- 越南语翻译
  quote_vi          TEXT,
  interpretation_vi TEXT,

  -- 排期与节日
  scheduled_date    DATE NOT NULL,
  is_holiday        BOOLEAN NOT NULL DEFAULT FALSE,
  holiday_name      VARCHAR(100),
  holiday_type      SMALLINT NOT NULL DEFAULT 5,

  -- 分享配置
  bg_image_url      TEXT,

  -- 状态管理
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引：同一天仅一条已发布金句
CREATE UNIQUE INDEX idx_daily_quotes_date ON daily_quotes(scheduled_date) WHERE status = 'published';
-- 节日金句查询
CREATE INDEX idx_daily_quotes_holiday ON daily_quotes(scheduled_date, holiday_type) WHERE is_holiday = true AND status = 'published';
-- 最近金句降级查询
CREATE INDEX idx_daily_quotes_latest ON daily_quotes(scheduled_date DESC) WHERE status = 'published';

-- updated_at 触发器
CREATE TRIGGER set_daily_quotes_updated_at BEFORE UPDATE ON daily_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: 任何人可读已发布金句
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_quotes_select_published" ON daily_quotes
  FOR SELECT USING (status = 'published');

-- 示例种子金句数据
INSERT INTO daily_quotes (quote_zh, quote_pinyin, source_zh, interpretation_zh, quote_en, interpretation_en, quote_vi, interpretation_vi, scheduled_date, status, published_at) VALUES
  ('千里之行，始于足下。', 'Qiān lǐ zhī xíng, shǐ yú zú xià.', '老子《道德经》', '再远大的目标，都要从脚下的第一步开始。', 'A journey of a thousand miles begins with a single step.', 'Even the grandest goals must begin with a single first step.', 'Hành trình vạn dặm bắt đầu từ một bước chân.', 'Mục tiêu dù lớn lao đến đâu cũng phải bắt đầu từ bước đầu tiên.', CURRENT_DATE, 'published', now()),
  ('学而不思则罔，思而不学则殆。', 'Xué ér bù sī zé wǎng, sī ér bù xué zé dài.', '孔子《论语》', '只学不思考会迷惑，只思考不学习会危险。', 'Learning without thinking leads to confusion; thinking without learning leads to danger.', 'Study and reflection must go hand in hand.', 'Học mà không suy nghĩ thì hoang mang, suy nghĩ mà không học thì nguy hiểm.', 'Học và suy ngẫm phải đi đôi với nhau.', CURRENT_DATE + INTERVAL '1 day', 'published', now()),
  ('己所不欲，勿施于人。', 'Jǐ suǒ bù yù, wù shī yú rén.', '孔子《论语》', '自己不想要的东西，不要强加给别人。', 'Do not impose on others what you do not wish for yourself.', 'Treat others the way you want to be treated.', 'Điều mình không muốn, đừng áp đặt cho người khác.', 'Hãy đối xử với người khác như cách bạn muốn được đối xử.', CURRENT_DATE + INTERVAL '2 days', 'published', now());
