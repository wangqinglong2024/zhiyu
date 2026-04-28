import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { COOKIE } from '@zhiyu/shared-config';
import { AppError } from './error.ts';
import { sb } from '../lib/supabase.ts';
import type { Env } from '../env.ts';

export interface AdminUser {
  id: string;
  email: string | null;
  role: 'super_admin';
}

export async function requireAdmin(c: Context, env: Env): Promise<AdminUser> {
  const at = getCookie(c, COOKIE.ACCESS_TOKEN);
  if (!at) throw new AppError(40100, 'auth.required', 401);
  const { data, error } = await sb(env).auth.getUser(at);
  if (error || !data.user) throw new AppError(40100, 'auth.required', 401);
  const { data: p } = await sb(env)
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .maybeSingle();
  const prof = p as { role?: string; is_active?: boolean } | null;
  if (!prof || prof.role !== 'super_admin' || prof.is_active === false) {
    throw new AppError(40300, 'forbidden', 403);
  }
  return { id: data.user.id, email: data.user.email ?? null, role: 'super_admin' };
}
