// china 域：服务层 · 句子 / TTS / 进度（应用端）
import type { SupabaseClient } from '@supabase/supabase-js';
import { failByCode } from '../../middlewares/respond.ts';
import type { Env } from '../../env.ts';
import { synthesize } from './tts-mock.adapter.ts';

export interface SentenceAudioState {
  sentence_id: string;
  audio: { status: string; url: string | null };
}

export async function getSentenceAudioState(
  sb: SupabaseClient,
  sentenceId: string,
): Promise<SentenceAudioState> {
  const { data, error } = await sb
    .from('china_sentences')
    .select('id, audio_url_zh, audio_status, deleted_at')
    .eq('id', sentenceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || (data as { deleted_at: string | null }).deleted_at) {
    failByCode('CHINA_SENTENCE_NOT_FOUND');
  }
  const r = data as { id: string; audio_url_zh: string | null; audio_status: string };
  return {
    sentence_id: r.id,
    audio: { status: r.audio_status, url: r.audio_url_zh },
  };
}

/** C4 · 触发 TTS（mock 同步完成） */
export async function requestSentenceTts(
  env: Env,
  sb: SupabaseClient,
  sentenceId: string,
  voice?: string,
): Promise<SentenceAudioState> {
  // 取句子 + 文章 code
  const { data, error } = await sb
    .from('china_sentences')
    .select('id, content_zh, audio_status, audio_url_zh, deleted_at, article_id, china_articles!fk_china_sentences_article_id(code, deleted_at)')
    .eq('id', sentenceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as
    | {
        id: string;
        content_zh: string;
        audio_status: string;
        audio_url_zh: string | null;
        deleted_at: string | null;
        china_articles: { code: string; deleted_at: string | null } | null;
      }
    | null;
  if (!row || row.deleted_at) failByCode('CHINA_SENTENCE_NOT_FOUND');
  const r = row as NonNullable<typeof row>;
  if (!r.china_articles || r.china_articles.deleted_at) failByCode('CHINA_ARTICLE_NOT_FOUND');

  // 已 ready 直接返回
  if (r.audio_status === 'ready' && r.audio_url_zh) {
    return { sentence_id: r.id, audio: { status: 'ready', url: r.audio_url_zh } };
  }

  // 标记 processing
  await sb
    .from('china_sentences')
    .update({ audio_status: 'processing', audio_error: null })
    .eq('id', r.id);

  try {
    const seqResp = await sb
      .from('china_sentences')
      .select('seq_no')
      .eq('id', r.id)
      .maybeSingle();
    const seq = (seqResp.data as { seq_no: number } | null)?.seq_no ?? 1;
    const code = r.china_articles!.code;
    const out = await synthesize(env, { article_code: code, seq_no: seq, text: r.content_zh, voice });

    const { error: uerr } = await sb
      .from('china_sentences')
      .update({
        audio_url_zh: out.url,
        audio_status: 'ready',
        audio_provider: out.provider,
        audio_voice: out.voice,
        audio_duration_ms: out.duration_ms,
        audio_generated_at: new Date().toISOString(),
        audio_error: null,
      })
      .eq('id', r.id);
    if (uerr) throw new Error(uerr.message);

    return { sentence_id: r.id, audio: { status: 'ready', url: out.url } };
  } catch (e) {
    await sb
      .from('china_sentences')
      .update({ audio_status: 'failed', audio_error: (e as Error).message.slice(0, 500) })
      .eq('id', r.id);
    failByCode('CHINA_TTS_UPSTREAM_FAILED', (e as Error).message);
  }
}

/** I1 · TTS 内部回调（service-role） */
export async function applyTtsCallback(
  sb: SupabaseClient,
  payload: {
    sentence_id: string;
    audio_url: string;
    duration_ms?: number;
    provider: string;
    voice: string;
  },
): Promise<{ sentence_id: string; status: string }> {
  const { data, error } = await sb
    .from('china_sentences')
    .select('id, deleted_at, audio_status, audio_url_zh')
    .eq('id', payload.sentence_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || (data as { deleted_at: string | null }).deleted_at) {
    failByCode('CHINA_SENTENCE_NOT_FOUND');
  }
  const r = data as { id: string; audio_status: string; audio_url_zh: string | null };
  // 若已 ready 且 URL 不同 → 409
  if (r.audio_status === 'ready' && r.audio_url_zh && r.audio_url_zh !== payload.audio_url) {
    throw Object.assign(new Error('CHINA_SENTENCE_AUDIO_STATUS_INVALID'), { code: 40900, http: 409 });
  }
  const { error: uerr } = await sb
    .from('china_sentences')
    .update({
      audio_url_zh: payload.audio_url,
      audio_status: 'ready',
      audio_provider: payload.provider,
      audio_voice: payload.voice,
      audio_duration_ms: payload.duration_ms ?? null,
      audio_generated_at: new Date().toISOString(),
      audio_error: null,
    })
    .eq('id', r.id);
  if (uerr) throw new Error(uerr.message);
  return { sentence_id: r.id, status: 'ready' };
}
