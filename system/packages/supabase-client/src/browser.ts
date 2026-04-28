import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/** 浏览器侧匿名 client；安全暴露 ANON_KEY。 */
export function getBrowserSupabase(url: string, anonKey: string): SupabaseClient {
  if (cached) return cached;
  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'zhiyu-sb-auth',
    },
    global: { headers: { 'x-client-info': 'zhiyu-web/0.0.0' } },
  });
  return cached;
}
