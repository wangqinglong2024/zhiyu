-- 0007_china_seq_offset_fix.sql
-- 修复 fn_insert_sentence_at / fn_reorder_sentences：
-- 之前用 +100000 / +10000 临时偏移，违反 ck_china_sentences_seq_no_range (-9999..9999)。
-- 改用 "取负" 中间状态：positive→negative→target_positive，单次 UPDATE 就不会
-- 与同分区内的正值键冲突。

set search_path = zhiyu, public;

create or replace function zhiyu.fn_insert_sentence_at(
  p_article_id    uuid,
  p_position      text,
  p_after_seq_no  int,
  p_payload       jsonb
) returns zhiyu.china_sentences
language plpgsql
security definer
as $$
declare
  v_target_pos int;
  v_max        int;
  v_sentence   zhiyu.china_sentences;
begin
  if p_position not in ('start','after') then
    raise exception 'CHINA_SENTENCE_INSERT_POSITION_INVALID';
  end if;

  perform 1 from zhiyu.china_articles
    where id = p_article_id and deleted_at is null for update;
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
  else
    if p_after_seq_no is null then
      raise exception 'CHINA_SENTENCE_AFTER_SEQ_REQUIRED';
    end if;
    if not exists (
      select 1 from zhiyu.china_sentences
       where article_id = p_article_id
         and seq_no = p_after_seq_no
         and deleted_at is null
    ) then
      raise exception 'CHINA_SENTENCE_AFTER_SEQ_NOT_FOUND';
    end if;
    v_target_pos := p_after_seq_no + 1;
  end if;

  -- 1) 把 >= v_target_pos 的现有句子取负（脱出正向键空间，避免后面 +1 时冲突）
  update zhiyu.china_sentences
     set seq_no = -seq_no
   where article_id = p_article_id
     and deleted_at is null
     and seq_no >= v_target_pos;

  -- 2) 把负值整体偏回 +1 写入正向新位置；同时清空音频缓存（语序变了）
  update zhiyu.china_sentences
     set seq_no             = -seq_no + 1,
         audio_url_zh       = null,
         audio_status       = 'pending',
         audio_provider     = null,
         audio_voice        = null,
         audio_duration_ms  = null,
         audio_generated_at = null,
         audio_error        = null
   where article_id = p_article_id
     and deleted_at is null
     and seq_no < 0;

  -- 3) 插入新句
  insert into zhiyu.china_sentences (
    article_id, seq_no, pinyin,
    content_zh, content_en, content_vi, content_th, content_id
  ) values (
    p_article_id, v_target_pos,
    p_payload->>'pinyin',
    p_payload->'content'->>'zh',
    p_payload->'content'->>'en',
    p_payload->'content'->>'vi',
    p_payload->'content'->>'th',
    p_payload->'content'->>'id'
  ) returning * into v_sentence;

  -- 4) 清进度
  perform zhiyu.fn_clear_progress_by_article(p_article_id);

  return v_sentence;
end;
$$;

create or replace function zhiyu.fn_reorder_sentences(
  p_article_id  uuid,
  p_ordered_ids uuid[]
) returns void
language plpgsql
security definer
as $$
declare
  v_n        int;
  v_total    int;
  v_distinct int;
  v_belong   int;
  v_id       uuid;
  v_idx      int;
begin
  perform 1 from zhiyu.china_articles
    where id = p_article_id and deleted_at is null for update;
  if not found then
    raise exception 'CHINA_ARTICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_n := coalesce(array_length(p_ordered_ids, 1), 0);

  select count(*) into v_total
    from zhiyu.china_sentences
   where article_id = p_article_id and deleted_at is null;

  if v_n <> v_total then
    raise exception 'CHINA_REORDER_IDS_MISMATCH';
  end if;

  select count(distinct x) into v_distinct from unnest(p_ordered_ids) as t(x);
  if v_distinct <> v_n then
    raise exception 'CHINA_REORDER_IDS_MISMATCH';
  end if;

  select count(*) into v_belong
    from zhiyu.china_sentences
   where article_id = p_article_id
     and deleted_at is null
     and id = any (p_ordered_ids);
  if v_belong <> v_n then
    raise exception 'CHINA_REORDER_IDS_MISMATCH';
  end if;

  if v_n > 9999 then
    raise exception 'CHINA_SENTENCE_SEQ_OVERFLOW';
  end if;

  -- 1) 全部取负，进入负向键空间，不与目标正值冲突
  update zhiyu.china_sentences
     set seq_no             = -seq_no,
         audio_url_zh       = null,
         audio_status       = 'pending',
         audio_provider     = null,
         audio_voice        = null,
         audio_duration_ms  = null,
         audio_generated_at = null,
         audio_error        = null
   where article_id = p_article_id and deleted_at is null;

  -- 2) 按 ordered_ids 写正值 1..N
  v_idx := 0;
  foreach v_id in array p_ordered_ids loop
    v_idx := v_idx + 1;
    update zhiyu.china_sentences
       set seq_no = v_idx
     where id = v_id;
  end loop;

  perform zhiyu.fn_clear_progress_by_article(p_article_id);
end;
$$;

grant execute on function zhiyu.fn_insert_sentence_at(uuid, text, int, jsonb) to service_role;
grant execute on function zhiyu.fn_reorder_sentences(uuid, uuid[]) to service_role;
