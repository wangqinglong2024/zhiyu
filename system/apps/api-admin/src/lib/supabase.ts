import { getServerSupabase } from '@zhiyu/supabase-client';
import type { Env } from '../env.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

// 不缓存：避免 sb.auth.signInWithPassword 把用户 session 写入共享 client，
// 让后续 .from() 请求被降级为 authenticated 角色。
export function sb(env: Env): SupabaseClient {
  return getServerSupabase(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
