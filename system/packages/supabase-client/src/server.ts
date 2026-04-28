import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 服务端 service-role client（绕 RLS），默认 schema = zhiyu。 */
export function getServerSupabase(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'zhiyu' },
    global: { headers: { 'x-client-info': 'zhiyu-server/0.0.0' } },
  });
}
