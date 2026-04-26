import { createServerClient } from '@zhiyu/sdk';
import { loadEnv } from '@zhiyu/config';

const env = loadEnv();

export const supaAdmin = createServerClient({
  url: env.SUPABASE_URL,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
});

export type AuthUser = {
  id: string;
  email: string | null;
  sessionId: string | null;
  role: 'admin' | 'user';
};

export const ACCESS_TOKEN_COOKIE = 'zy_at';
export const REFRESH_TOKEN_COOKIE = 'zy_rt';
