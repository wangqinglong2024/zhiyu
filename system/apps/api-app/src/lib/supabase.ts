import { getServerSupabase } from '@zhiyu/supabase-client';
import type { Env } from '../env.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;
export function sb(env: Env): SupabaseClient {
  if (!cached) cached = getServerSupabase(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  return cached;
}
