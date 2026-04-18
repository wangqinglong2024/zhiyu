export const APP_CONFIG = {
  apiBase: import.meta.env.VITE_API_BASE || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  appEnv: import.meta.env.VITE_APP_ENV || 'dev',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
