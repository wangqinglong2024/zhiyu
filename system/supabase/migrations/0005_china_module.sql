-- 0005 · 发现中国（Discover China）数据层
-- 来源：function/01-china/ai/F1-AI-数据模型规范/*
-- 包含：
--   1) 通用辅助函数 set_updated_at（幂等）
--   2) 跨域占位函数 fn_clear_progress_by_article（learning-engine 域后续替换）
--   3) 三张表：china_categories / china_articles / china_sentences（含 RLS + Grants）
--   4) 编号 / 重排 / 状态机 RPC
--   5) 12 个固定类目种子（幂等 upsert）

-- =============================================================
-- 0. 通用：set_updated_at 触发器函数（幂等）
-- =============================================================
create or replace function zhiyu.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================
-- 1. 跨域占位：fn_clear_progress_by_article
--    learning-engine 域上线时通过 create or replace 覆盖。
--    此处仅作为依赖占位，避免下方 RPC 编译失败。
-- =============================================================
create or replace function zhiyu.fn_clear_progress_by_article(p_article_id uuid)
returns void language plpgsql security definer as $$
begin
  -- TODO(learning-engine): delete from zhiyu.learning_progress
  --   where source = 'china' and source_article_id = p_article_id;
  perform 1;
end;
$$;

-- =============================================================
-- 2. 表：china_categories（数据字典，12 条固定）
-- =============================================================
create table if not exists zhiyu.china_categories (
  id               uuid primary key default gen_random_uuid(),
  code             text not null,
  name_i18n        jsonb not null,
  description_i18n jsonb not null,
  sort_order       int  not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint uq_china_categories_code unique (code),
  constraint ck_china_categories_code_format
    check (code ~ '^(0[1-9]|1[0-2])$'),
  constraint ck_china_categories_name_i18n_keys
    check (name_i18n ?& array['zh','en','vi','th','id']),
  constraint ck_china_categories_desc_i18n_keys
    check (description_i18n ?& array['zh','en','vi','th','id'])
);

create index if not exists idx_china_categories_sort_order
  on zhiyu.china_categories (sort_order);

drop trigger if exists tg_china_categories_before_update_set_updated_at on zhiyu.china_categories;
create trigger tg_china_categories_before_update_set_updated_at
  before update on zhiyu.china_categories
  for each row execute function zhiyu.set_updated_at();

-- =============================================================
-- 3. 表：china_articles（文章主体，软删 + 状态机）
-- =============================================================
create table if not exists zhiyu.china_articles (
  id           uuid primary key default gen_random_uuid(),
  code         text not null,
  category_id  uuid not null,
  title_pinyin text not null,
  title_i18n   jsonb not null,
  status       text not null default 'draft',
  published_at timestamptz,
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,

  constraint fk_china_articles_category_id
    foreign key (category_id) references zhiyu.china_categories(id) on delete restrict,
  constraint fk_china_articles_created_by
    foreign key (created_by) references auth.users(id) on delete set null,
  constraint fk_china_articles_updated_by
    foreign key (updated_by) references auth.users(id) on delete set null,

  constraint ck_china_articles_code_format
    check (code ~ '^[A-Z0-9]{12}$'),
  constraint ck_china_articles_status
    check (status in ('draft','published')),
  constraint ck_china_articles_title_pinyin_len
    check (char_length(title_pinyin) between 1 and 200),
  constraint ck_china_articles_title_i18n_keys
    check (title_i18n ?& array['zh','en','vi','th','id']),
  constraint ck_china_articles_published_at_consistency
    check (
      (status = 'published' and published_at is not null) or
      (status = 'draft'     and published_at is null)
    )
);

create unique index if not exists uq_china_articles_code
  on zhiyu.china_articles (code) where deleted_at is null;
create index if not exists idx_china_articles_category_id
  on zhiyu.china_articles (category_id) where deleted_at is null;
create index if not exists idx_china_articles_status
  on zhiyu.china_articles (status) where deleted_at is null;
create index if not exists idx_china_articles_published_at
  on zhiyu.china_articles (published_at desc) where status = 'published' and deleted_at is null;
create index if not exists idx_china_articles_created_by
  on zhiyu.china_articles (created_by);
create index if not exists idx_china_articles_deleted_at
  on zhiyu.china_articles (deleted_at);

drop trigger if exists tg_china_articles_before_update_set_updated_at on zhiyu.china_articles;
create trigger tg_china_articles_before_update_set_updated_at
  before update on zhiyu.china_articles
  for each row execute function zhiyu.set_updated_at();

-- =============================================================
-- 4. 表：china_sentences（句子，5 语言独立列 + TTS 状态）
-- =============================================================
create table if not exists zhiyu.china_sentences (
  id                 uuid primary key default gen_random_uuid(),
  article_id         uuid not null,
  seq_no             int  not null,
  pinyin             text not null,
  content_zh         text not null,
  content_en         text not null,
  content_vi         text not null,
  content_th         text not null,
  content_id         text not null,
  audio_url_zh       text,
  audio_status       text not null default 'pending',
  audio_provider     text,
  audio_voice        text,
  audio_duration_ms  int,
  audio_generated_at timestamptz,
  audio_error        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  constraint fk_china_sentences_article_id
    foreign key (article_id) references zhiyu.china_articles(id) on delete cascade,

  constraint ck_china_sentences_seq_no_range  check (seq_no between 1 and 9999),
  constraint ck_china_sentences_audio_status
    check (audio_status in ('pending','processing','ready','failed')),
  constraint ck_china_sentences_pinyin_len     check (char_length(pinyin) between 1 and 600),
  constraint ck_china_sentences_content_zh_len check (char_length(content_zh) between 1 and 400),
  constraint ck_china_sentences_content_en_len check (char_length(content_en) between 1 and 400),
  constraint ck_china_sentences_content_vi_len check (char_length(content_vi) between 1 and 400),
  constraint ck_china_sentences_content_th_len check (char_length(content_th) between 1 and 400),
  constraint ck_china_sentences_content_id_len check (char_length(content_id) between 1 and 400),
  constraint ck_china_sentences_audio_url_when_ready
    check (audio_status <> 'ready' or audio_url_zh is not null)
);

create unique index if not exists uq_china_sentences_article_seq
  on zhiyu.china_sentences (article_id, seq_no) where deleted_at is null;
create index if not exists idx_china_sentences_article_id
  on zhiyu.china_sentences (article_id) where deleted_at is null;
create index if not exists idx_china_sentences_audio_status
  on zhiyu.china_sentences (audio_status)
  where audio_status in ('pending','processing','failed');
create index if not exists idx_china_sentences_deleted_at
  on zhiyu.china_sentences (deleted_at);

drop trigger if exists tg_china_sentences_before_update_set_updated_at on zhiyu.china_sentences;
create trigger tg_china_sentences_before_update_set_updated_at
  before update on zhiyu.china_sentences
  for each row execute function zhiyu.set_updated_at();

-- =============================================================
-- 5. RLS 策略
-- =============================================================
alter table zhiyu.china_categories enable row level security;
alter table zhiyu.china_articles   enable row level security;
alter table zhiyu.china_sentences  enable row level security;

-- 5.1 categories：公开 select
drop policy if exists china_categories_select_public on zhiyu.china_categories;
create policy china_categories_select_public on zhiyu.china_categories
  for select to anon, authenticated
  using (true);

-- 5.2 articles：仅放行 status='published' and deleted_at is null
drop policy if exists china_articles_select_published on zhiyu.china_articles;
create policy china_articles_select_published on zhiyu.china_articles
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

-- 5.3 sentences：所属文章已发布且未软删
drop policy if exists china_sentences_select_published on zhiyu.china_sentences;
create policy china_sentences_select_published on zhiyu.china_sentences
  for select to anon, authenticated
  using (
    deleted_at is null and exists (
      select 1 from zhiyu.china_articles a
      where a.id = china_sentences.article_id
        and a.status = 'published'
        and a.deleted_at is null
    )
  );
-- service_role 默认 BYPASSRLS，无需额外策略。

-- =============================================================
-- 6. Grants
-- =============================================================
grant select on zhiyu.china_categories to anon, authenticated;
grant select on zhiyu.china_articles   to anon, authenticated;
grant select on zhiyu.china_sentences  to anon, authenticated;
grant all    on zhiyu.china_categories to service_role;
grant all    on zhiyu.china_articles   to service_role;
grant all    on zhiyu.china_sentences  to service_role;

-- =============================================================
-- 7. RPC：编号生成
-- =============================================================
create or replace function zhiyu.fn_gen_article_code()
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 chars，剔除 I O 0 1
  v_code text;
  v_attempts int := 0;
begin
  loop
    v_code := '';
    for i in 1..12 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;

    perform 1 from zhiyu.china_articles where code = v_code;
    if not found then
      return v_code;
    end if;

    v_attempts := v_attempts + 1;
    if v_attempts >= 5 then
      raise exception 'CHINA_ARTICLE_CODE_GEN_FAILED';
    end if;
  end loop;
end;
$$;

create or replace function zhiyu.fn_next_sentence_seq(p_article_id uuid)
returns int language plpgsql as $$
declare
  v_next int;
begin
  -- 锁住该文章行，序列化 seq_no 分配
  perform 1 from zhiyu.china_articles where id = p_article_id for update;

  select coalesce(max(seq_no), 0) + 1
    into v_next
    from zhiyu.china_sentences
   where article_id = p_article_id
     and deleted_at is null;

  if v_next > 9999 then
    raise exception 'CHINA_SENTENCE_SEQ_OVERFLOW';
  end if;

  return v_next;
end;
$$;

create or replace function zhiyu.fn_resequence_sentences(p_article_id uuid)
returns void language plpgsql as $$
declare
  v_row record;
  v_new int := 0;
begin
  perform 1 from zhiyu.china_articles where id = p_article_id for update;

  -- 仅用于 *压缩* 场景（删除后填补空洞）：按当前 seq_no 升序遍历，
  -- 重新分配 1..N。因新值始终 ≤ 当前行的旧值，且其它未处理行的旧值 ≥ 当前行旧值，
  -- 所以单趟更新不会撞复合唯一索引 (article_id, seq_no)。
  -- 任意顺序的"重排"（reorder）场景需另写 fn_reorder_sentences，那里才需要双阶段偏移。
  for v_row in
    select id, seq_no
      from zhiyu.china_sentences
     where article_id = p_article_id
       and deleted_at is null
     order by seq_no asc
  loop
    v_new := v_new + 1;
    if v_new <> v_row.seq_no then
      update zhiyu.china_sentences
         set seq_no             = v_new,
             -- seq_no 变化导致音频缓存键失效，必须重置（PM 答 Q8）
             audio_url_zh       = null,
             audio_status       = 'pending',
             audio_provider     = null,
             audio_voice        = null,
             audio_duration_ms  = null,
             audio_generated_at = null,
             audio_error        = null
       where id = v_row.id;
    end if;
  end loop;
end;
$$;

-- =============================================================
-- 8. RPC：状态机（发布 / 下架）
-- =============================================================
create or replace function zhiyu.fn_publish_article(p_article_id uuid)
returns zhiyu.china_articles
language plpgsql security definer as $$
declare
  v_article zhiyu.china_articles;
  v_count   int;
begin
  select * into v_article
    from zhiyu.china_articles
   where id = p_article_id and deleted_at is null
   for update;

  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_article.status = 'published' then
    raise exception 'CHINA_ARTICLE_ALREADY_PUBLISHED';
  end if;

  -- 至少 1 条句子
  select count(*) into v_count
    from zhiyu.china_sentences
   where article_id = p_article_id
     and deleted_at is null;
  if v_count < 1 then
    raise exception 'CHINA_ARTICLE_PUBLISH_NO_SENTENCES';
  end if;

  update zhiyu.china_articles
     set status       = 'published',
         published_at = now(),
         updated_by   = coalesce(auth.uid(), updated_by)
   where id = p_article_id
   returning * into v_article;

  return v_article;
end;
$$;

create or replace function zhiyu.fn_unpublish_article(p_article_id uuid)
returns zhiyu.china_articles
language plpgsql security definer as $$
declare
  v_article zhiyu.china_articles;
begin
  select * into v_article
    from zhiyu.china_articles
   where id = p_article_id and deleted_at is null
   for update;

  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_article.status = 'draft' then
    raise exception 'CHINA_ARTICLE_ALREADY_DRAFT';
  end if;

  update zhiyu.china_articles
     set status       = 'draft',
         published_at = null,
         updated_by   = coalesce(auth.uid(), updated_by)
   where id = p_article_id
   returning * into v_article;

  -- 副作用：清空所有用户对该文章的学习进度
  perform zhiyu.fn_clear_progress_by_article(p_article_id);

  return v_article;
end;
$$;

create or replace function zhiyu.fn_delete_article(p_article_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_article zhiyu.china_articles;
begin
  select * into v_article
    from zhiyu.china_articles
   where id = p_article_id and deleted_at is null
   for update;

  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- 软删 + 状态回退到 draft（与状态机表一致）
  update zhiyu.china_articles
     set status       = 'draft',
         published_at = null,
         deleted_at   = now(),
         updated_by   = coalesce(auth.uid(), updated_by)
   where id = p_article_id;

  -- 同步软删句子（CASCADE 仅在物理 DELETE 时生效）
  update zhiyu.china_sentences
     set deleted_at = now()
   where article_id = p_article_id
     and deleted_at is null;

  perform zhiyu.fn_clear_progress_by_article(p_article_id);
end;
$$;

-- =============================================================
-- 9. 类目种子（12 条固定，幂等 upsert）
--    与 content/china/00-index.md 中文母版对齐；外语初稿待翻译团队审校。
-- =============================================================
insert into zhiyu.china_categories (code, sort_order, name_i18n, description_i18n) values
('01', 1,
 '{"zh":"中国历史","en":"Chinese History","vi":"Lịch sử Trung Quốc","th":"ประวัติศาสตร์จีน","id":"Sejarah Tiongkok"}'::jsonb,
 '{"zh":"朝代更替、历史事件、传奇人物","en":"Dynasties, historical events, legendary figures","vi":"Triều đại, sự kiện lịch sử, nhân vật huyền thoại","th":"ราชวงศ์ เหตุการณ์ ประวัติบุคคล","id":"Dinasti, peristiwa sejarah, tokoh legendaris"}'::jsonb),
('02', 2,
 '{"zh":"中国美食","en":"Chinese Cuisine","vi":"Ẩm thực Trung Quốc","th":"อาหารจีน","id":"Kuliner Tiongkok"}'::jsonb,
 '{"zh":"八大菜系、地方小吃、饮食文化","en":"Eight cuisines, local snacks, food culture","vi":"Tám trường phái, món ăn địa phương, văn hóa ẩm thực","th":"แปดสำรับ อาหารท้องถิ่น วัฒนธรรมอาหาร","id":"Delapan masakan, jajanan daerah, budaya kuliner"}'::jsonb),
('03', 3,
 '{"zh":"名胜风光","en":"Scenic Wonders","vi":"Danh lam thắng cảnh","th":"สถานที่ท่องเที่ยว","id":"Pemandangan Indah"}'::jsonb,
 '{"zh":"自然奇观、历史遗迹、城市地标","en":"Natural wonders, historic sites, city landmarks","vi":"Kỳ quan thiên nhiên, di tích lịch sử, biểu tượng thành phố","th":"ธรรมชาติ โบราณสถาน แลนด์มาร์ก","id":"Keajaiban alam, situs sejarah, ikon kota"}'::jsonb),
('04', 4,
 '{"zh":"传统节日","en":"Festivals & Customs","vi":"Lễ hội truyền thống","th":"เทศกาลและประเพณี","id":"Festival & Adat"}'::jsonb,
 '{"zh":"传统节日、节气、民间习俗","en":"Festivals, solar terms, folk customs","vi":"Lễ hội, tiết khí, phong tục dân gian","th":"เทศกาล สารทฤดู ประเพณี","id":"Festival, musim, adat rakyat"}'::jsonb),
('05', 5,
 '{"zh":"艺术非遗","en":"Arts & Heritage","vi":"Nghệ thuật & Di sản","th":"ศิลปะและมรดก","id":"Seni & Warisan"}'::jsonb,
 '{"zh":"书法、国画、剪纸、陶瓷、刺绣","en":"Calligraphy, painting, paper-cut, ceramics, embroidery","vi":"Thư pháp, quốc họa, cắt giấy, gốm sứ, thêu","th":"การประดิษฐ์ตัวอักษร จิตรกรรม กระดาษตัด เซรามิก ปัก","id":"Kaligrafi, lukisan, kertas potong, keramik, sulam"}'::jsonb),
('06', 6,
 '{"zh":"音乐戏曲","en":"Music & Opera","vi":"Âm nhạc & Hí khúc","th":"ดนตรีและงิ้ว","id":"Musik & Opera"}'::jsonb,
 '{"zh":"民族乐器、京剧、民歌","en":"Folk instruments, Peking Opera, folk songs","vi":"Nhạc cụ dân tộc, kinh kịch, dân ca","th":"เครื่องดนตรีพื้นเมือง งิ้วปักกิ่ง เพลงพื้นบ้าน","id":"Alat musik etnis, opera Beijing, lagu rakyat"}'::jsonb),
('07', 7,
 '{"zh":"文学经典","en":"Classic Literature","vi":"Văn học kinh điển","th":"วรรณกรรมคลาสสิก","id":"Sastra Klasik"}'::jsonb,
 '{"zh":"古典名著、诗词歌赋、寓言","en":"Classic works, poetry, fables","vi":"Tác phẩm kinh điển, thi ca, ngụ ngôn","th":"วรรณกรรม กวีนิพนธ์ นิทาน","id":"Karya klasik, puisi, fabel"}'::jsonb),
('08', 8,
 '{"zh":"成语典故","en":"Idioms & Allusions","vi":"Thành ngữ & Điển cố","th":"สำนวนและตำนาน","id":"Idiom & Kisah"}'::jsonb,
 '{"zh":"成语故事、歇后语、谚语","en":"Idiom stories, two-part allegorical sayings, proverbs","vi":"Câu chuyện thành ngữ, yết hậu ngữ, tục ngữ","th":"นิทานสำนวน คำพังเพย สุภาษิต","id":"Kisah idiom, peribahasa dua bagian, pepatah"}'::jsonb),
('09', 9,
 '{"zh":"哲学思想","en":"Philosophy & Wisdom","vi":"Triết học & Trí tuệ","th":"ปรัชญาและภูมิปัญญา","id":"Filsafat & Kebijaksanaan"}'::jsonb,
 '{"zh":"儒释道、诸子百家","en":"Confucianism, Buddhism, Daoism, Hundred Schools","vi":"Nho-Phật-Đạo, bách gia chư tử","th":"ขงจื๊อ พุทธ เต๋า นักปราชญ์ร้อยสำนัก","id":"Konfusianisme, Buddhisme, Taoisme, Seratus Aliran"}'::jsonb),
('10', 10,
 '{"zh":"当代中国","en":"Modern China","vi":"Trung Quốc hiện đại","th":"จีนสมัยใหม่","id":"Tiongkok Modern"}'::jsonb,
 '{"zh":"科技、城市生活、流行文化","en":"Technology, urban life, pop culture","vi":"Công nghệ, đời sống đô thị, văn hóa đại chúng","th":"เทคโนโลยี ชีวิตเมือง วัฒนธรรมป๊อป","id":"Teknologi, kehidupan kota, budaya pop"}'::jsonb),
('11', 11,
 '{"zh":"趣味汉字","en":"Fun with Chinese","vi":"Hán tự thú vị","th":"อักษรจีนสนุก","id":"Aksara Tiongkok Seru"}'::jsonb,
 '{"zh":"汉字演变、数字密码、网络用语","en":"Character evolution, number codes, internet slang","vi":"Diễn biến chữ Hán, mật mã số, tiếng lóng mạng","th":"วิวัฒนาการอักษร รหัสตัวเลข ศัพท์เน็ต","id":"Evolusi aksara, kode angka, slang internet"}'::jsonb),
('12', 12,
 '{"zh":"神话传说","en":"Myths & Legends","vi":"Thần thoại & Truyền thuyết","th":"เทพปกรณัมและตำนาน","id":"Mitos & Legenda"}'::jsonb,
 '{"zh":"创世神话、神仙体系、民间传说","en":"Creation myths, pantheon, folk legends","vi":"Thần thoại sáng thế, hệ thống thần tiên, truyền thuyết dân gian","th":"ปกรณัมการสร้างโลก เทพเจ้า ตำนานพื้นบ้าน","id":"Mitos penciptaan, panteon, legenda rakyat"}'::jsonb)
on conflict (code) do update set
  sort_order       = excluded.sort_order,
  name_i18n        = excluded.name_i18n,
  description_i18n = excluded.description_i18n,
  updated_at       = now();
