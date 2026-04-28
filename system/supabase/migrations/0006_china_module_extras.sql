-- 0006 · 发现中国（china）扩展：清理废弃 + 进度表 + 句子位置/重排 RPC + 类目计数视图 + storage bucket
--
-- 内容：
--   1) 删除废弃 discover_topics（被 china_categories 取代）
--   2) 创建跨域 learning_progress 表（最小占位，learning-engine 域上线时再扩字段）
--   3) 重写 fn_clear_progress_by_article 真正删除该文章的进度
--   4) 新增 RPC：fn_insert_sentence_at / fn_reorder_sentences / fn_delete_sentence
--   5) 新增视图：v_china_category_counts（类目下文章计数）
--   6) 创建 storage bucket china-tts（公开读、service-role 写）

-- =============================================================
-- 1. 删除废弃表（取代品 china_categories 已上线）
-- =============================================================
drop table if exists zhiyu.discover_topics cascade;

-- =============================================================
-- 2. learning_progress（跨域占位；最小可用字段）
-- =============================================================
create table if not exists zhiyu.learning_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  source       text not null,                              -- 'china' / 'course' / ...
  source_code  text not null,                              -- e.g. china_articles.code
  last_seq_no  int  not null default 0 check (last_seq_no >= 0),
  completed    boolean not null default false,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (user_id, source, source_code)
);
create index if not exists idx_learning_progress_user_source
  on zhiyu.learning_progress (user_id, source);
create index if not exists idx_learning_progress_source_code
  on zhiyu.learning_progress (source, source_code);

drop trigger if exists tg_learning_progress_before_update_set_updated_at on zhiyu.learning_progress;
create trigger tg_learning_progress_before_update_set_updated_at
  before update on zhiyu.learning_progress
  for each row execute function zhiyu.set_updated_at();

alter table zhiyu.learning_progress enable row level security;
drop policy if exists learning_progress_self_read on zhiyu.learning_progress;
create policy learning_progress_self_read on zhiyu.learning_progress
  for select to authenticated using (user_id = auth.uid());
drop policy if exists learning_progress_self_write on zhiyu.learning_progress;
create policy learning_progress_self_write on zhiyu.learning_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on zhiyu.learning_progress to authenticated;
grant all on zhiyu.learning_progress to service_role;

-- =============================================================
-- 3. 重写 fn_clear_progress_by_article（按 china article code 清进度）
--    本域 RPC 通过 SECURITY DEFINER 调用，参数仅 article_id
-- =============================================================
create or replace function zhiyu.fn_clear_progress_by_article(p_article_id uuid)
returns void language plpgsql security definer as $$
declare
  v_code text;
begin
  select code into v_code from zhiyu.china_articles where id = p_article_id;
  if v_code is null then
    return;
  end if;
  delete from zhiyu.learning_progress
   where source = 'china' and source_code = v_code;
end;
$$;

-- =============================================================
-- 4. 句子级 RPC：插入指定位置 / 重排 / 删除（封装事务 + 副作用）
-- =============================================================

-- 4.1 在文章末尾追加（payload 为单条句子 JSON）
--     payload 例：{"pinyin":"...","content":{"zh":"...","en":"...","vi":"...","th":"...","id":"..."}}
create or replace function zhiyu.fn_append_sentence(
  p_article_id uuid,
  p_payload    jsonb
) returns zhiyu.china_sentences
language plpgsql security definer as $$
declare
  v_seq      int;
  v_sentence zhiyu.china_sentences;
begin
  perform 1 from zhiyu.china_articles where id = p_article_id and deleted_at is null for update;
  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_seq := zhiyu.fn_next_sentence_seq(p_article_id);

  insert into zhiyu.china_sentences
    (article_id, seq_no, pinyin, content_zh, content_en, content_vi, content_th, content_id)
  values
    (p_article_id, v_seq,
     p_payload->>'pinyin',
     p_payload->'content'->>'zh',
     p_payload->'content'->>'en',
     p_payload->'content'->>'vi',
     p_payload->'content'->>'th',
     p_payload->'content'->>'id')
  returning * into v_sentence;

  return v_sentence;
end;
$$;

-- 4.2 在指定 seq_no 之后或开头插入（位移其余句子，并清空音频缓存 + 进度）
--     position ∈ ('start','after')
create or replace function zhiyu.fn_insert_sentence_at(
  p_article_id   uuid,
  p_position     text,
  p_after_seq_no int,
  p_payload      jsonb
) returns zhiyu.china_sentences
language plpgsql security definer as $$
declare
  v_target_pos int;
  v_max        int;
  v_temp_seq   int;
  v_sentence   zhiyu.china_sentences;
begin
  if p_position not in ('start','after') then
    raise exception 'CHINA_SENTENCE_INSERT_POSITION_INVALID';
  end if;

  perform 1 from zhiyu.china_articles where id = p_article_id and deleted_at is null for update;
  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  select coalesce(max(seq_no), 0) into v_max
    from zhiyu.china_sentences
   where article_id = p_article_id and deleted_at is null;

  if v_max + 1 > 9999 then
    raise exception 'CHINA_SENTENCE_SEQ_OVERFLOW';
  end if;

  if p_position = 'start' then
    v_target_pos := 1;
  else  -- after
    if p_after_seq_no is null then
      raise exception 'CHINA_SENTENCE_AFTER_SEQ_REQUIRED';
    end if;
    -- 必须存在
    if not exists (
      select 1 from zhiyu.china_sentences
       where article_id = p_article_id and seq_no = p_after_seq_no and deleted_at is null
    ) then
      raise exception 'CHINA_SENTENCE_AFTER_SEQ_NOT_FOUND';
    end if;
    v_target_pos := p_after_seq_no + 1;
  end if;

  -- 把 >= v_target_pos 的句子整体后移 1，使用临时偏移避免唯一冲突
  -- 步骤：先 +10000，再 -9999，得到净 +1
  update zhiyu.china_sentences
     set seq_no = seq_no + 10000
   where article_id = p_article_id
     and deleted_at is null
     and seq_no >= v_target_pos;

  update zhiyu.china_sentences
     set seq_no             = seq_no - 9999,
         audio_url_zh       = null,
         audio_status       = 'pending',
         audio_provider     = null,
         audio_voice        = null,
         audio_duration_ms  = null,
         audio_generated_at = null,
         audio_error        = null
   where article_id = p_article_id
     and deleted_at is null
     and seq_no >= 10000;

  -- 插入目标位置
  insert into zhiyu.china_sentences
    (article_id, seq_no, pinyin, content_zh, content_en, content_vi, content_th, content_id)
  values
    (p_article_id, v_target_pos,
     p_payload->>'pinyin',
     p_payload->'content'->>'zh',
     p_payload->'content'->>'en',
     p_payload->'content'->>'vi',
     p_payload->'content'->>'th',
     p_payload->'content'->>'id')
  returning * into v_sentence;

  -- 副作用：start / after 都清进度（PM 答 F3-Q4/Q12）
  perform zhiyu.fn_clear_progress_by_article(p_article_id);

  return v_sentence;
end;
$$;

-- 4.3 软删句子 + 重排
create or replace function zhiyu.fn_delete_sentence(p_sentence_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_article_id uuid;
begin
  select article_id into v_article_id
    from zhiyu.china_sentences
   where id = p_sentence_id and deleted_at is null
   for update;

  if v_article_id is null then
    raise exception 'CHINA_SENTENCE_NOT_FOUND' using errcode = 'P0002';
  end if;

  perform 1 from zhiyu.china_articles where id = v_article_id for update;

  update zhiyu.china_sentences set deleted_at = now() where id = p_sentence_id;
  perform zhiyu.fn_resequence_sentences(v_article_id);
  perform zhiyu.fn_clear_progress_by_article(v_article_id);

  return v_article_id;
end;
$$;

-- 4.4 全量重排：按 ordered_ids 顺序重写 seq_no=1..N，全部音频缓存清空 + 清进度
create or replace function zhiyu.fn_reorder_sentences(
  p_article_id  uuid,
  p_ordered_ids uuid[]
) returns void
language plpgsql security definer as $$
declare
  v_n        int;
  v_total    int;
  v_distinct int;
  v_belong   int;
  v_id       uuid;
  v_idx      int;
begin
  perform 1 from zhiyu.china_articles where id = p_article_id and deleted_at is null for update;
  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_n := coalesce(array_length(p_ordered_ids, 1), 0);

  select count(*) into v_total
    from zhiyu.china_sentences
   where article_id = p_article_id and deleted_at is null;

  -- 必须 1) 长度匹配  2) 元素去重  3) 全部属于该文章
  if v_n <> v_total then
    raise exception 'CHINA_REORDER_IDS_MISMATCH';
  end if;

  select count(distinct x) into v_distinct from unnest(p_ordered_ids) as t(x);
  if v_distinct <> v_n then
    raise exception 'CHINA_REORDER_IDS_MISMATCH';
  end if;

  select count(*) into v_belong
    from zhiyu.china_sentences
   where article_id = p_article_id and deleted_at is null
     and id = any (p_ordered_ids);
  if v_belong <> v_n then
    raise exception 'CHINA_REORDER_IDS_MISMATCH';
  end if;

  -- 临时偏移
  update zhiyu.china_sentences
     set seq_no             = seq_no + 100000,
         audio_url_zh       = null,
         audio_status       = 'pending',
         audio_provider     = null,
         audio_voice        = null,
         audio_duration_ms  = null,
         audio_generated_at = null,
         audio_error        = null
   where article_id = p_article_id and deleted_at is null;

  -- 偏移值需 ≤ 9999，因此先 -100000 再分配
  update zhiyu.china_sentences
     set seq_no = seq_no - 100000
   where article_id = p_article_id and deleted_at is null;
  -- 现在 seq_no 又回到了原值；但音频已清空。后面按 ordered_ids 直接覆盖 seq_no。

  -- 为了避免唯一约束冲突，先把所有句子的 seq_no 设为 -row_number()
  with t as (
    select id, row_number() over () as rn
      from zhiyu.china_sentences
     where article_id = p_article_id and deleted_at is null
  )
  update zhiyu.china_sentences s
     set seq_no = -(t.rn)::int
    from t
   where s.id = t.id;

  -- 然后按 ordered_ids 顺序写入正值 1..N
  v_idx := 0;
  foreach v_id in array p_ordered_ids loop
    v_idx := v_idx + 1;
    update zhiyu.china_sentences
       set seq_no = v_idx
     where id = v_id;
  end loop;

  -- 副作用
  perform zhiyu.fn_clear_progress_by_article(p_article_id);
end;
$$;

-- 注：fn_reorder_sentences 用了负数中间态，与 ck_china_sentences_seq_no_range
-- 的"1..9999"冲突。下面把 CHECK 调整为容忍负数中间态。
alter table zhiyu.china_sentences
  drop constraint if exists ck_china_sentences_seq_no_range;
alter table zhiyu.china_sentences
  add constraint ck_china_sentences_seq_no_range
  check (seq_no between -9999 and 9999);

-- =============================================================
-- 5. 视图：类目下文章计数（含 draft+published 与单 published）
-- =============================================================
create or replace view zhiyu.v_china_category_counts as
select
  c.id                            as category_id,
  c.code                          as category_code,
  count(a.id) filter (where a.deleted_at is null)                                  as total,
  count(a.id) filter (where a.deleted_at is null and a.status = 'draft')           as draft,
  count(a.id) filter (where a.deleted_at is null and a.status = 'published')       as published
from zhiyu.china_categories c
left join zhiyu.china_articles a on a.category_id = c.id
group by c.id, c.code;

grant select on zhiyu.v_china_category_counts to service_role;

-- =============================================================
-- 6. Storage bucket：china-tts（公开读）
--    依赖 supabase storage schema；如未开启，跳过。
-- =============================================================
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
      values ('china-tts', 'china-tts', true)
      on conflict (id) do update set public = excluded.public;
  end if;
end $$;
