-- 0004 · "发现中国" 主题骨架（仅 12 个一级主题与封面映射，详细内容由 content/china/* 后续导入）
create table if not exists zhiyu.discover_topics (
  id          bigserial primary key,
  slug        text not null unique,
  order_no    int  not null,
  title_zh    text not null,
  title_en    text,
  cover_url   text,
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists discover_topics_order_idx on zhiyu.discover_topics (order_no);

-- 12 个一级主题（与 content/china 对齐）
insert into zhiyu.discover_topics (slug, order_no, title_zh, title_en) values
 ('chinese-history',     1,  '中华历史', 'Chinese History'),
 ('chinese-cuisine',     2,  '中华美食', 'Chinese Cuisine'),
 ('scenic-wonders',      3,  '锦绣山河', 'Scenic Wonders'),
 ('festivals-customs',   4,  '节庆习俗', 'Festivals & Customs'),
 ('arts-heritage',       5,  '艺术遗产', 'Arts & Heritage'),
 ('music-opera',         6,  '音乐戏曲', 'Music & Opera'),
 ('classic-literature',  7,  '经典文学', 'Classic Literature'),
 ('idioms-allusions',    8,  '成语典故', 'Idioms & Allusions'),
 ('philosophy-wisdom',   9,  '诸子智慧', 'Philosophy & Wisdom'),
 ('modern-china',        10, '现代中国', 'Modern China'),
 ('fun-with-chinese',    11, '趣味汉字', 'Fun with Chinese'),
 ('myths-legends',       12, '神话传说', 'Myths & Legends')
on conflict (slug) do nothing;

-- 公开可读
alter table zhiyu.discover_topics enable row level security;
drop policy if exists discover_topics_public_read on zhiyu.discover_topics;
create policy discover_topics_public_read on zhiyu.discover_topics
  for select using (is_published = true);
