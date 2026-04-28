// 管理端：china 服务层 · 句子 CRUD（A9-A14）
import type { SupabaseClient } from '@supabase/supabase-js';
import { failByCode } from '../../middlewares/respond.ts';

export interface AdminSentence {
  id: string;
  article_id: string;
  seq_no: number;
  seq_label: string;
  pinyin: string;
  content_zh: string;
  content_en: string;
  content_vi: string;
  content_th: string;
  content_id: string;
  audio_url_zh: string | null;
  audio_status: string;
  updated_at: string;
}

const SENTENCE_SELECT = 'id, article_id, seq_no, pinyin, content_zh, content_en, content_vi, content_th, content_id, audio_url_zh, audio_status, updated_at';

export async function listSentencesAdmin(
  sb: SupabaseClient,
  articleId: string,
): Promise<AdminSentence[]> {
  // 校验 article 存在
  const { data: art } = await sb
    .from('china_articles').select('id').eq('id', articleId).is('deleted_at', null).maybeSingle();
  if (!art) failByCode('CHINA_ARTICLE_NOT_FOUND');
  const { data, error } = await sb
    .from('china_sentences')
    .select(SENTENCE_SELECT)
    .eq('article_id', articleId)
    .is('deleted_at', null)
    .order('seq_no', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toAdminSentence);
}

export async function getSentenceAdmin(
  sb: SupabaseClient,
  id: string,
): Promise<AdminSentence> {
  const { data, error } = await sb
    .from('china_sentences')
    .select(SENTENCE_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) failByCode('CHINA_SENTENCE_NOT_FOUND');
  return toAdminSentence(data);
}

export async function appendSentenceAdmin(
  sb: SupabaseClient,
  articleId: string,
  payload: {
    pinyin: string;
    content_zh: string; content_en: string; content_vi: string;
    content_th: string; content_id: string;
  },
): Promise<AdminSentence> {
  const { data, error } = await sb.rpc('fn_append_sentence', {
    p_article_id: articleId,
    p_payload: {
      pinyin: payload.pinyin,
      content: {
        zh: payload.content_zh,
        en: payload.content_en,
        vi: payload.content_vi,
        th: payload.content_th,
        id: payload.content_id,
      },
    },
  });
  if (error) throw new Error(error.message);
  // RPC 返回行；二次查询保证一致格式
  const newId = (data as { id: string } | null)?.id ?? '';
  return getSentenceAdmin(sb, newId);
}

export async function insertSentenceAdmin(
  sb: SupabaseClient,
  articleId: string,
  payload: {
    position: 'start' | 'after';
    after_seq_no?: number;
    pinyin: string;
    content_zh: string; content_en: string; content_vi: string;
    content_th: string; content_id: string;
  },
): Promise<AdminSentence> {
  const { data, error } = await sb.rpc('fn_insert_sentence_at', {
    p_article_id: articleId,
    p_position: payload.position,
    p_after_seq_no: payload.after_seq_no ?? null,
    p_payload: {
      pinyin: payload.pinyin,
      content: {
        zh: payload.content_zh,
        en: payload.content_en,
        vi: payload.content_vi,
        th: payload.content_th,
        id: payload.content_id,
      },
    },
  });
  if (error) throw new Error(error.message);
  const newId = (data as { id: string } | null)?.id ?? '';
  return getSentenceAdmin(sb, newId);
}

export async function updateSentenceAdmin(
  sb: SupabaseClient,
  id: string,
  payload: Partial<{
    pinyin: string;
    content_zh: string; content_en: string; content_vi: string;
    content_th: string; content_id: string;
  }>,
): Promise<AdminSentence> {
  const cur = await getSentenceAdmin(sb, id);
  const update: Record<string, unknown> = {};
  for (const k of [
    'pinyin', 'content_zh', 'content_en', 'content_vi', 'content_th', 'content_id',
  ] as const) {
    if (payload[k] !== undefined) update[k] = payload[k];
  }
  // 若 content_zh 改变 → 清空音频缓存
  if (payload.content_zh !== undefined && payload.content_zh !== cur.content_zh) {
    update.audio_url_zh = null;
    update.audio_status = 'pending';
    update.audio_provider = null;
    update.audio_voice = null;
    update.audio_duration_ms = null;
    update.audio_generated_at = null;
    update.audio_error = null;
  }
  const { error } = await sb.from('china_sentences').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  return getSentenceAdmin(sb, id);
}

export async function deleteSentenceAdmin(
  sb: SupabaseClient,
  id: string,
): Promise<{ article_id: string }> {
  await getSentenceAdmin(sb, id);
  const { data, error } = await sb.rpc('fn_delete_sentence', { p_sentence_id: id });
  if (error) throw new Error(error.message);
  return { article_id: data as string };
}

export async function reorderSentencesAdmin(
  sb: SupabaseClient,
  articleId: string,
  orderedIds: string[],
): Promise<AdminSentence[]> {
  const { error } = await sb.rpc('fn_reorder_sentences', {
    p_article_id: articleId,
    p_ordered_ids: orderedIds,
  });
  if (error) throw new Error(error.message);
  return listSentencesAdmin(sb, articleId);
}

function toAdminSentence(d: unknown): AdminSentence {
  const r = d as {
    id: string; article_id: string; seq_no: number; pinyin: string;
    content_zh: string; content_en: string; content_vi: string; content_th: string; content_id: string;
    audio_url_zh: string | null; audio_status: string; updated_at: string;
  };
  return {
    id: r.id,
    article_id: r.article_id,
    seq_no: r.seq_no,
    seq_label: String(r.seq_no).padStart(4, '0'),
    pinyin: r.pinyin,
    content_zh: r.content_zh,
    content_en: r.content_en,
    content_vi: r.content_vi,
    content_th: r.content_th,
    content_id: r.content_id,
    audio_url_zh: r.audio_url_zh,
    audio_status: r.audio_status,
    updated_at: r.updated_at,
  };
}
