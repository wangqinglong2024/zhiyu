import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { COOKIE, JWT_TTL } from '@zhiyu/shared-config';
import { randomToken } from '@zhiyu/shared-utils';
import type { Env } from '../env.ts';
import { sb } from '../lib/supabase.ts';
import { ok } from '../middlewares/respond.ts';

export function authRoutes(env: Env) {
  const r = new Hono();

  r.post(
    '/login',
    zValidator('json', z.object({ email: z.string().email(), password: z.string().min(1) })),
    async (c) => {
      const body = c.req.valid('json');
      const { data, error } = await sb(env).auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error || !data.session || !data.user) {
        return c.json({ code: 41002, message: 'invalid credentials' }, 401);
      }
      const { data: profile } = await sb(env)
        .from('profiles').select('*').eq('id', data.user.id).single();
      const prof = profile as { role?: string; is_active?: boolean } | null;
      if (!prof || prof.role !== 'super_admin' || prof.is_active === false) {
        return c.json({ code: 40300, message: 'forbidden: not admin' }, 403);
      }
      const csrf = randomToken(24);
      setCookie(c, COOKIE.ACCESS_TOKEN, data.session.access_token, {
        httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: JWT_TTL.ACCESS_SEC,
      });
      setCookie(c, COOKIE.REFRESH_TOKEN, data.session.refresh_token, {
        httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: JWT_TTL.REFRESH_SEC,
      });
      setCookie(c, COOKIE.CSRF, csrf, {
        httpOnly: false, sameSite: 'Lax', secure: false, path: '/', maxAge: JWT_TTL.ACCESS_SEC,
      });
      return ok(c, { user: profile, csrf });
    },
  );

  r.get('/session', async (c) => {
    const at = getCookie(c, COOKIE.ACCESS_TOKEN);
    if (!at) return ok(c, { authenticated: false });
    const { data, error } = await sb(env).auth.getUser(at);
    if (error || !data.user) return ok(c, { authenticated: false });
    const { data: profile } = await sb(env)
      .from('profiles').select('*').eq('id', data.user.id).single();
    const prof = profile as { role?: string } | null;
    if (!prof || prof.role !== 'super_admin') return ok(c, { authenticated: false });
    return ok(c, { authenticated: true, user: profile });
  });

  r.post('/logout', (c) => {
    deleteCookie(c, COOKIE.ACCESS_TOKEN, { path: '/' });
    deleteCookie(c, COOKIE.REFRESH_TOKEN, { path: '/' });
    deleteCookie(c, COOKIE.CSRF, { path: '/' });
    return ok(c, { logged_out: true });
  });

  return r;
}
