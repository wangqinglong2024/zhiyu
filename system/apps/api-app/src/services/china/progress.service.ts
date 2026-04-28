// china 域：服务层 · 学习进度（应用端）
import type { SupabaseClient } from '@supabase/supabase-js';
import { failByCode } from '../../middlewares/respond.ts';

export interface ProgressView {
  user_id: string;
  source: 'china';
  source_code: string;
  last_seq_no: number;
  completed: boolean;
  updated_at: string;
}

async function ensureArticleExists(sb: SupabaseClient, code: string): Promise<void> {
  const { data, error } = await sb
    .from('china_articles')
    .select('id, status, deleted_at')
    .eq('code', code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || (data as { deleted_at: string | null }).deleted_at) {
    failByCode('CHINA_ARTICLE_NOT_FOUND');
  }
  const row = data as { status: string; deleted_at: string | null };
  if (row.status !== 'published') failByCode('CHINA_ARTICLE_NOT_FOUND');
}

export async function getProgress(
  sb: SupabaseClient,
  userId: string,
  articleCode: string,
): Promise<ProgressView> {
  await ensureArticleExists(sb, articleCode);
  const { data, error } = await sb
    .from('learning_progress')
    .select('user_id, source, source_code, last_seq_no, completed, updated_at')
    .eq('user_id', userId)
    .eq('source', 'china')
    .eq('source_code', articleCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return {
      user_id: userId,
      source: 'china',
      source_code: articleCode,
      last_seq_no: 0,
      completed: false,
      updated_at: new Date(0).toISOString(),
    };
  }
  return data as ProgressView;
}

export async function upsertProgress(
  sb: SupabaseClient,
  userId: string,
  articleCode: string,
  payload: { last_seq_no: number; completed?: boolean },
): Promise<ProgressView> {
  await ensureArticleExists(sb, articleCode);
  const row = {
    user_id: userId,
    source: 'china',
    source_code: articleCode,
    last_seq_no: payload.last_seq_no,
    completed: payload.completed ?? false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from('learning_progress')
    .upsert(row, { onConflict: 'user_id,source,source_code' })
    .select('user_id, source, source_code, last_seq_no, completed, updated_at')
    .single();
  if (error) throw new Error(error.message);
  return data as ProgressView;
}
