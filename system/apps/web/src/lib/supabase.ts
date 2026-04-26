/**
 * Supabase browser client singleton — used for realtime channels.
 * Auth flow itself remains cookie-based via our API; this client is initialised
 * with the public anon key only.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  if (_client) return _client;
  _client = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _client;
}
