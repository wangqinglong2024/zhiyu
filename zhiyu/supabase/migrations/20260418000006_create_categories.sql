-- =====================================================
-- T03-001: 类目表 + 类目多语言表
-- =====================================================

-- 通用 updated_at 触发器函数（幂等创建）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- categories 类目表
CREATE TABLE categories (
  id            SMALLINT PRIMARY KEY,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  cover_url     TEXT,
  icon_url      TEXT,
  article_count INT NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- category_translations 类目多语言信息
CREATE TABLE category_translations (
  category_id   SMALLINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale        VARCHAR(5) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  PRIMARY KEY (category_id, locale)
);

-- updated_at 触发器
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: categories 所有人可读
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT USING (status = 'active');

-- RLS: category_translations 所有人可读
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category_translations_select_all" ON category_translations
  FOR SELECT USING (true);

-- 12 大类目种子数据
INSERT INTO categories (id, slug, sort_order, is_public) VALUES
  (1,  'chinese-history',    1,  true),
  (2,  'chinese-cuisine',    2,  true),
  (3,  'scenic-wonders',     3,  true),
  (4,  'festivals-customs',  4,  false),
  (5,  'arts-heritage',      5,  false),
  (6,  'music-opera',        6,  false),
  (7,  'classic-literature', 7,  false),
  (8,  'idioms-allusions',   8,  false),
  (9,  'philosophy-wisdom',  9,  false),
  (10, 'modern-china',       10, false),
  (11, 'fun-with-chinese',   11, false),
  (12, 'myths-legends',      12, false);

-- 类目三语言翻译
INSERT INTO category_translations (category_id, locale, name, description) VALUES
  (1,  'zh', '中国历史',       '上下五千年的朝代更替、历史事件与传奇人物，带你穿越时空感受华夏文明。'),
  (1,  'en', 'Chinese History', 'Five thousand years of dynastic changes, historical events, and legendary figures — travel through time to experience Chinese civilization.'),
  (1,  'vi', 'Lịch sử Trung Quốc', 'Năm nghìn năm thay đổi triều đại, sự kiện lịch sử và nhân vật huyền thoại — du hành thời gian để trải nghiệm nền văn minh Trung Hoa.'),
  (2,  'zh', '中国美食',       '八大菜系、地方小吃、食材文化与饮食礼仪，一口吃遍中国。'),
  (2,  'en', 'Chinese Cuisine', 'Eight major cuisines, local snacks, food culture, and dining etiquette — taste all of China in one bite.'),
  (2,  'vi', 'Ẩm thực Trung Quốc', 'Tám đại hệ ẩm thực, đồ ăn vặt địa phương, văn hóa ẩm thực và nghi thức ăn uống — nếm trọn Trung Quốc.'),
  (3,  'zh', '名胜风光',       '壮丽山川、历史遗迹与城市地标，发现中国最美的角落。'),
  (3,  'en', 'Scenic Wonders',  'Majestic landscapes, historical sites, and city landmarks — discover the most beautiful corners of China.'),
  (3,  'vi', 'Danh lam thắng cảnh', 'Sơn thủy hùng vĩ, di tích lịch sử và địa danh thành phố — khám phá những góc đẹp nhất của Trung Quốc.'),
  (4,  'zh', '传统节日',       '春节的烟火、中秋的月饼、端午的龙舟……每个节日都是一个动人故事。'),
  (4,  'en', 'Festivals & Customs', 'Spring Festival fireworks, Mid-Autumn mooncakes, Dragon Boat races… every festival tells a moving story.'),
  (4,  'vi', 'Lễ hội & Phong tục', 'Pháo hoa Tết, bánh Trung Thu, đua thuyền Đoan Ngọ… mỗi lễ hội đều là một câu chuyện cảm động.'),
  (5,  'zh', '艺术非遗',       '书法的韵味、剪纸的精巧、陶瓷的绚丽，感受指尖上的中国艺术。'),
  (5,  'en', 'Arts & Heritage',  'The charm of calligraphy, the intricacy of paper-cutting, the splendor of ceramics — feel Chinese art at your fingertips.'),
  (5,  'vi', 'Nghệ thuật & Di sản', 'Vẻ đẹp thư pháp, sự tinh xảo của cắt giấy, sự lộng lẫy của gốm sứ — cảm nhận nghệ thuật Trung Hoa trên đầu ngón tay.'),
  (6,  'zh', '音乐戏曲',       '古筝悠扬、京剧婉转、民歌质朴，聆听中国千年的声音。'),
  (6,  'en', 'Music & Opera',   'The elegance of guzheng, the grace of Peking opera, the simplicity of folk songs — listen to China''s thousand-year voice.'),
  (6,  'vi', 'Âm nhạc & Kinh kịch', 'Tiếng đàn tranh du dương, Kinh kịch uyển chuyển, dân ca mộc mạc — lắng nghe âm thanh ngàn năm của Trung Quốc.'),
  (7,  'zh', '文学经典',       '四大名著、唐诗宋词、寓言故事，走进中国文字的瑰丽世界。'),
  (7,  'en', 'Classic Literature', 'The Four Great Novels, Tang poetry, Song lyrics, fables — enter the magnificent world of Chinese literature.'),
  (7,  'vi', 'Văn học kinh điển', 'Tứ đại danh tác, thơ Đường, từ Tống, ngụ ngôn — bước vào thế giới tuyệt vời của văn học Trung Quốc.'),
  (8,  'zh', '成语典故',       '每个成语背后都有一个精彩故事，学成语就是学中国智慧。'),
  (8,  'en', 'Idioms & Allusions', 'Every idiom hides a brilliant story — learning idioms means learning Chinese wisdom.'),
  (8,  'vi', 'Thành ngữ & Điển tích', 'Mỗi thành ngữ đều ẩn chứa một câu chuyện tuyệt vời — học thành ngữ là học trí tuệ Trung Hoa.'),
  (9,  'zh', '哲学思想',       '儒释道的智慧、诸子百家的思辨，探索中国人的精神世界。'),
  (9,  'en', 'Philosophy & Wisdom', 'Wisdom of Confucianism, Buddhism, and Taoism — explore the spiritual world of the Chinese people.'),
  (9,  'vi', 'Triết học & Trí tuệ', 'Trí tuệ Nho Phật Đạo, tư biện bách gia — khám phá thế giới tinh thần của người Trung Quốc.'),
  (10, 'zh', '当代中国',       '高铁飞驰、科技创新、网络潮流，看看今天的中国什么样。'),
  (10, 'en', 'Modern China',    'High-speed rails, tech innovation, internet trends — see what China looks like today.'),
  (10, 'vi', 'Trung Quốc hiện đại', 'Tàu cao tốc, đổi mới công nghệ, xu hướng mạng — xem Trung Quốc ngày nay như thế nào.'),
  (11, 'zh', '趣味汉字',       '从甲骨文到表情包，汉字的演变充满了惊喜和乐趣。'),
  (11, 'en', 'Fun with Chinese', 'From oracle bones to emojis — the evolution of Chinese characters is full of surprises and fun.'),
  (11, 'vi', 'Chữ Hán thú vị', 'Từ chữ giáp cốt đến emoji — sự phát triển của chữ Hán đầy bất ngờ và thú vị.'),
  (12, 'zh', '中国神话传说',   '盘古开天、女娲补天、嫦娥奔月……走进中国最奇幻的想象世界。'),
  (12, 'en', 'Myths & Legends',  'Pangu creating the world, Nüwa mending the sky, Chang''e flying to the moon… enter China''s most fantastical realm.'),
  (12, 'vi', 'Thần thoại & Truyền thuyết', 'Bàn Cổ khai thiên, Nữ Oa vá trời, Hằng Nga bay lên mặt trăng… bước vào thế giới tưởng tượng kỳ ảo nhất của Trung Quốc.');
