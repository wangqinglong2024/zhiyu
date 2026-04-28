import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { COOKIE } from '@zhiyu/shared-config';
import { AppError } from '../middlewares/error.ts';
import { sb } from '../lib/supabase.ts';
import type { Env } from '../env.ts';

export function meRoutes(env: Env) {
  const r = new Hono();
  r.get('/profile', async (c) => {
    const at = getCookie(c, COOKIE.ACCESS_TOKEN);
    if (!at) throw new AppError(40100, 'auth.required', 401);
    const { data, error } = await sb(env).auth.getUser(at);
    if (error || !data.user) throw new AppError(40100, 'auth.required', 401);
    const { data: profile } = await sb(env).from('profiles').select('*').eq('id', data.user.id).single();
    return c.json({ code: 0, data: profile });
  });
  return r;
}
