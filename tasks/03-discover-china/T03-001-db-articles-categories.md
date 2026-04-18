# T03-001: 数据库 Schema — 文章与类目

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3

## 需求摘要

为「发现中国」模块创建核心数据库表：categories（类目表）、articles（文章表）、article_translations（文章多语言表）。设计需支持 12 大文化类目的完整内容承载，包括类目元信息、文章内容、多语言翻译（pinyin / zh / en / vi 四语言）、音频、图片、词汇表、测验题等。同时需要建立完善的索引策略和 RLS（Row Level Security）策略，确保未登录用户仅可访问前 3 个类目。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` §一.2 — 文章数据流向
- 产品需求: `product/apps/02-discover-china/00-index.md` §1.2 — 用户访问规则
- 产品需求: `product/00-product-overview.md` §五.5 — 12 大类目定义
- 设计规范: `grules/05-coding-standards.md` §十 — 数据库设计铁律
- 设计规范: `grules/04-api-design.md` §一 — 数据库命名约定
- 内容参考: `china/01-chinese-history.md` ~ `china/12-myths-legends.md` — 12 类目内容结构
- 关联任务: T02-014（Supabase 基础配置）

## 技术方案

### 数据库设计

#### categories 表（类目表）

```sql
CREATE TABLE categories (
  id            SMALLINT PRIMARY KEY,             -- 类目 ID（1-12，手动指定）
  slug          VARCHAR(50) UNIQUE NOT NULL,       -- URL 友好标识（如 chinese-history）
  sort_order    SMALLINT NOT NULL DEFAULT 0,       -- 排序权重
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,    -- 是否对未登录用户公开（01-03 为 true）
  cover_url     TEXT,                              -- 类目封面大图 URL
  icon_url      TEXT,                              -- 类目卡片插图 URL
  article_count INT NOT NULL DEFAULT 0,            -- 文章数量（冗余计数，定时同步）
  status        VARCHAR(20) NOT NULL DEFAULT 'active', -- active / inactive
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 类目多语言信息
CREATE TABLE category_translations (
  category_id   SMALLINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale        VARCHAR(5) NOT NULL,              -- zh / en / vi
  name          VARCHAR(100) NOT NULL,            -- 类目名称
  description   TEXT,                             -- 类目简介（2-3 行）
  PRIMARY KEY (category_id, locale)
);
```

#### articles 表（文章表）

```sql
CREATE TABLE articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   SMALLINT NOT NULL REFERENCES categories(id),
  slug          VARCHAR(200) UNIQUE NOT NULL,      -- URL 友好标识
  cover_url     TEXT,                              -- 文章封面图 URL
  thumbnail_url TEXT,                              -- 缩略图 URL（列表用）
  audio_url     TEXT,                              -- 音频文件 URL（可选）
  audio_duration INT,                              -- 音频时长（秒）
  view_count    INT NOT NULL DEFAULT 0,            -- 浏览量
  favorite_count INT NOT NULL DEFAULT 0,           -- 收藏数（冗余计数）
  sort_weight   INT NOT NULL DEFAULT 0,            -- 排序权重（运营后台可调）
  status        VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft / published / archived
  published_at  TIMESTAMPTZ,                       -- 发布时间
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_articles_category_status ON articles(category_id, status);
CREATE INDEX idx_articles_category_published ON articles(category_id, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_category_views ON articles(category_id, view_count DESC) WHERE status = 'published';
```

#### article_translations 表（文章多语言内容表）

```sql
CREATE TABLE article_translations (
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale        VARCHAR(5) NOT NULL,              -- zh / en / vi / pinyin
  title         VARCHAR(300) NOT NULL,            -- 文章标题
  summary       TEXT,                             -- 文章摘要（120 字以内）
  content       TEXT NOT NULL,                    -- 正文内容（Markdown/HTML）
  vocabulary    JSONB,                            -- 核心词汇表 [{word, pinyin, translation, audio_url}]
  quiz          JSONB,                            -- 测验题 [{question, options[], answer, explanation}]
  PRIMARY KEY (article_id, locale)
);
```

#### article_views 表（浏览去重表）

```sql
CREATE TABLE article_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id       UUID,                              -- 登录用户 ID（可选）
  fingerprint   VARCHAR(64),                       -- 设备指纹（未登录用户）
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24 小时去重索引
CREATE UNIQUE INDEX idx_article_views_user_dedup
  ON article_views(article_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_article_views_fingerprint
  ON article_views(article_id, fingerprint, viewed_at)
  WHERE fingerprint IS NOT NULL;
```

### RLS 策略

```sql
-- categories: 所有人可读
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT USING (status = 'active');

-- category_translations: 所有人可读
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category_translations_select_all" ON category_translations
  FOR SELECT USING (true);

-- articles: 已发布文章 — 未登录仅公开类目，登录全部
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_select_public" ON articles
  FOR SELECT USING (
    status = 'published'
    AND (
      -- 公开类目任何人可读
      category_id IN (SELECT id FROM categories WHERE is_public = true)
      OR
      -- 登录用户可读所有类目
      auth.uid() IS NOT NULL
    )
  );

-- article_translations: 跟随 articles 的访问权限
ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_translations_select" ON article_translations
  FOR SELECT USING (
    article_id IN (SELECT id FROM articles WHERE status = 'published')
  );

-- article_views: 任何人可写（记录浏览）
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_views_insert_all" ON article_views
  FOR INSERT WITH CHECK (true);
```

### 种子数据

```sql
-- 12 大类目初始数据
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

-- 类目多语言 (zh / en / vi) — 各 12 条
INSERT INTO category_translations (category_id, locale, name, description) VALUES
  (1, 'zh', '中国历史', '上下五千年的朝代更替、历史事件与传奇人物，带你穿越时空感受华夏文明。'),
  (1, 'en', 'Chinese History', 'Five thousand years of dynastic changes, historical events, and legendary figures — travel through time to experience Chinese civilization.'),
  (1, 'vi', 'Lịch sử Trung Quốc', 'Năm nghìn năm thay đổi triều đại, sự kiện lịch sử và nhân vật huyền thoại — du hành thời gian để trải nghiệm nền văn minh Trung Hoa.'),
  -- ... 其余 11 个类目的 3 语言翻译（详见 product/apps/02-discover-china/02-article-list.md §三）
  (2, 'zh', '中国美食', '八大菜系、地方小吃、食材文化与饮食礼仪，一口吃遍中国。'),
  (2, 'en', 'Chinese Cuisine', 'Eight major cuisines, local snacks, food culture, and dining etiquette — taste all of China in one bite.'),
  (2, 'vi', 'Ẩm thực Trung Quốc', 'Tám đại hệ ẩm thực, đồ ăn vặt địa phương, văn hóa ẩm thực và nghi thức ăn uống — nếm trọn Trung Quốc.'),
  (3, 'zh', '名胜风光', '壮丽山川、历史遗迹与城市地标，发现中国最美的角落。'),
  (3, 'en', 'Scenic Wonders', 'Majestic landscapes, historical sites, and city landmarks — discover the most beautiful corners of China.'),
  (3, 'vi', 'Danh lam thắng cảnh', 'Sơn thủy hùng vĩ, di tích lịch sử và địa danh thành phố — khám phá những góc đẹp nhất của Trung Quốc.'),
  (4, 'zh', '传统节日', '春节的烟火、中秋的月饼、端午的龙舟……每个节日都是一个动人故事。'),
  (4, 'en', 'Festivals & Customs', 'Spring Festival fireworks, Mid-Autumn mooncakes, Dragon Boat races… every festival tells a moving story.'),
  (4, 'vi', 'Lễ hội & Phong tục', 'Pháo hoa Tết, bánh Trung Thu, đua thuyền Đoan Ngọ… mỗi lễ hội đều là một câu chuyện cảm động.'),
  (5, 'zh', '艺术非遗', '书法的韵味、剪纸的精巧、陶瓷的绚丽，感受指尖上的中国艺术。'),
  (5, 'en', 'Arts & Heritage', 'The charm of calligraphy, the intricacy of paper-cutting, the splendor of ceramics — feel Chinese art at your fingertips.'),
  (5, 'vi', 'Nghệ thuật & Di sản', 'Vẻ đẹp thư pháp, sự tinh xảo của cắt giấy, sự lộng lẫy của gốm sứ — cảm nhận nghệ thuật Trung Hoa trên đầu ngón tay.'),
  (6, 'zh', '音乐戏曲', '古筝悠扬、京剧婉转、民歌质朴，聆听中国千年的声音。'),
  (6, 'en', 'Music & Opera', 'The elegance of guzheng, the grace of Peking opera, the simplicity of folk songs — listen to China''s thousand-year voice.'),
  (6, 'vi', 'Âm nhạc & Kinh kịch', 'Tiếng đàn tranh du dương, Kinh kịch uyển chuyển, dân ca mộc mạc — lắng nghe âm thanh ngàn năm của Trung Quốc.'),
  (7, 'zh', '文学经典', '四大名著、唐诗宋词、寓言故事，走进中国文字的瑰丽世界。'),
  (7, 'en', 'Classic Literature', 'The Four Great Novels, Tang poetry, Song lyrics, fables — enter the magnificent world of Chinese literature.'),
  (7, 'vi', 'Văn học kinh điển', 'Tứ đại danh tác, thơ Đường, từ Tống, ngụ ngôn — bước vào thế giới tuyệt vời của văn học Trung Quốc.'),
  (8, 'zh', '成语典故', '每个成语背后都有一个精彩故事，学成语就是学中国智慧。'),
  (8, 'en', 'Idioms & Allusions', 'Every idiom hides a brilliant story — learning idioms means learning Chinese wisdom.'),
  (8, 'vi', 'Thành ngữ & Điển tích', 'Mỗi thành ngữ đều ẩn chứa một câu chuyện tuyệt vời — học thành ngữ là học trí tuệ Trung Hoa.'),
  (9, 'zh', '哲学思想', '儒释道的智慧、诸子百家的思辨，探索中国人的精神世界。'),
  (9, 'en', 'Philosophy & Wisdom', 'Wisdom of Confucianism, Buddhism, and Taoism — explore the spiritual world of the Chinese people.'),
  (9, 'vi', 'Triết học & Trí tuệ', 'Trí tuệ Nho Phật Đạo, tư biện bách gia — khám phá thế giới tinh thần của người Trung Quốc.'),
  (10, 'zh', '当代中国', '高铁飞驰、科技创新、网络潮流，看看今天的中国什么样。'),
  (10, 'en', 'Modern China', 'High-speed rails, tech innovation, internet trends — see what China looks like today.'),
  (10, 'vi', 'Trung Quốc hiện đại', 'Tàu cao tốc, đổi mới công nghệ, xu hướng mạng — xem Trung Quốc ngày nay như thế nào.'),
  (11, 'zh', '趣味汉字', '从甲骨文到表情包，汉字的演变充满了惊喜和乐趣。'),
  (11, 'en', 'Fun with Chinese', 'From oracle bones to emojis — the evolution of Chinese characters is full of surprises and fun.'),
  (11, 'vi', 'Chữ Hán thú vị', 'Từ chữ giáp cốt đến emoji — sự phát triển của chữ Hán đầy bất ngờ và thú vị.'),
  (12, 'zh', '中国神话传说', '盘古开天、女娲补天、嫦娥奔月……走进中国最奇幻的想象世界。'),
  (12, 'en', 'Myths & Legends', 'Pangu creating the world, Nüwa mending the sky, Chang''e flying to the moon… enter China''s most fantastical realm.'),
  (12, 'vi', 'Thần thoại & Truyền thuyết', 'Bàn Cổ khai thiên, Nữ Oa vá trời, Hằng Nga bay lên mặt trăng… bước vào thế giới tưởng tượng kỳ ảo nhất của Trung Quốc.');
```

### updated_at 自动触发器

```sql
-- 通用 updated_at 触发器函数（若 T02 未创建则在此创建）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 范围（做什么）

- 创建 Supabase 迁移文件：categories 表 + category_translations 表
- 创建 Supabase 迁移文件：articles 表 + article_translations 表
- 创建 Supabase 迁移文件：article_views 表
- 创建所有必要索引（类目排序、文章分页、浏览量排序、去重查询）
- 配置 RLS 策略（未登录仅公开类目、登录全部）
- 创建 12 类目种子数据（含 zh/en/vi 三语言翻译）
- 创建 updated_at 自动触发器

## 边界（不做什么）

- 不创建每日金句表（T03-002）
- 不创建收藏表（T03-003）
- 不写 API 路由代码（T03-004）
- 不写前端页面组件（T03-007+）
- 不配置 Supabase Storage Bucket（如有需要由后续任务处理）

## 涉及文件

- 新建: `supabase/migrations/20260418_001_create_categories.sql`
- 新建: `supabase/migrations/20260418_002_create_articles.sql`
- 新建: `supabase/migrations/20260418_003_create_article_views.sql`
- 新建: `supabase/seed/03-discover-china-categories.sql`

## 依赖

- 前置: T02-014（Supabase 基础配置、Schema 初始化、RLS 通用函数）
- 后续: T03-002, T03-003, T03-004, T03-005, T03-006

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 迁移文件已执行  
   **WHEN** 查询 `SELECT * FROM categories ORDER BY sort_order`  
   **THEN** 返回 12 条类目记录，id 1-3 的 is_public = true，id 4-12 的 is_public = false

2. **GIVEN** 类目种子数据已导入  
   **WHEN** 查询 `SELECT * FROM category_translations WHERE category_id = 1`  
   **THEN** 返回 3 条记录（zh/en/vi），name 分别为「中国历史」「Chinese History」「Lịch sử Trung Quốc」

3. **GIVEN** articles 表已创建  
   **WHEN** 插入一条 status='published' 的文章到 category_id=1  
   **THEN** 文章正常写入，article_translations 可关联写入 4 种 locale（zh/en/vi/pinyin）

4. **GIVEN** RLS 策略已启用  
   **WHEN** 未认证用户查询 category_id=4 的文章  
   **THEN** 返回空结果（被 RLS 拦截）

5. **GIVEN** RLS 策略已启用  
   **WHEN** 未认证用户查询 category_id=1（公开类目）的已发布文章  
   **THEN** 正常返回文章数据

6. **GIVEN** RLS 策略已启用  
   **WHEN** 已认证用户查询 category_id=4 的已发布文章  
   **THEN** 正常返回文章数据

7. **GIVEN** article_views 表已创建  
   **WHEN** 同一 user_id 对同一 article_id 插入两次浏览记录  
   **THEN** 唯一索引冲突，仅保留第一条（实现 24 小时去重）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务（含 Supabase）
2. `docker compose ps` — 确认所有容器 Running
3. 在 Supabase 容器内执行迁移文件
4. 验证表结构：`\dt` 检查 categories / category_translations / articles / article_translations / article_views 表存在
5. 执行种子数据 SQL
6. 验证 12 类目 + 36 条翻译（12×3）全部写入
7. 模拟未认证请求查询公开/非公开类目文章，验证 RLS
8. 模拟认证请求查询全部类目文章，验证 RLS
9. 测试浏览去重唯一索引

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 5 张数据表全部创建成功
- [ ] 所有索引创建成功
- [ ] RLS 策略对未登录用户正确拦截非公开类目
- [ ] RLS 策略对登录用户放行全部类目
- [ ] 12 类目 + 36 条翻译种子数据正常写入
- [ ] article_views 去重索引正确生效
- [ ] updated_at 触发器正常工作

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-001-db-articles-categories.md`

## 自检重点

- [ ] 安全：RLS 策略覆盖所有表，未登录仅限公开类目
- [ ] 性能：关键查询路径有索引覆盖（类目排序、文章分页、浏览量排序）
- [ ] 类型同步：表结构与后续 TypeScript 类型保持一致
- [ ] 数据完整性：外键约束 + ON DELETE CASCADE
- [ ] 命名约定：表名 snake_case、字段名 snake_case
