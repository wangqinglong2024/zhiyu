import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { COOKIE } from '@zhiyu/shared-config';
import { AppError } from './error.ts';
import { sb } from '../lib/supabase.ts';
import type { Env } from '../env.ts';

export interface CurrentUser {
  id: string;
  email: string | null;
  role: string;
}

/** 从 cookie 解析当前登录用户；未登录返回 null（不抛错） */
export async function resolveUser(c: Context, env: Env): Promise<CurrentUser | null> {
  const at = getCookie(c, COOKIE.ACCESS_TOKEN);
  if (!at) return null;
  const { data, error } = await sb(env).auth.getUser(at);
  if (error || !data.user) return null;
  // 取 role
  const { data: profile } = await sb(env).from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: (profile as { role?: string } | null)?.role ?? 'user',
  };
}

/** 必须登录（未登录抛 401） */
export async function requireUser(c: Context, env: Env): Promise<CurrentUser> {
  const u = await resolveUser(c, env);
  if (!u) throw new AppError(40100, 'auth.required', 401);
  return u;
}
