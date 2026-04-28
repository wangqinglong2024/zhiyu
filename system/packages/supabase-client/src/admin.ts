import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 后台管理 client，调用 auth.admin.* / Storage 管理面。 */
export function getAdminSupabase(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-client-info': 'zhiyu-admin/0.0.0' } },
  });
}
