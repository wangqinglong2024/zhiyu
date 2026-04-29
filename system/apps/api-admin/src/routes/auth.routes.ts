import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { COOKIE, SESSION_ROLLING_SEC } from '@zhiyu/shared-config';
import { randomToken } from '@zhiyu/shared-utils';
import type { Context } from 'hono';
import type { Env } from '../env.ts';
import { sb } from '../lib/supabase.ts';
import { ok } from '../middlewares/respond.ts';

/** 写 access/refresh/csrf cookie，maxAge 统一 30 天（滚动）。 */
function writeAuthCookies(c: Context, accessToken: string, refreshToken: string, csrf: string) {
  setCookie(c, COOKIE.ACCESS_TOKEN, accessToken, {
    httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: SESSION_ROLLING_SEC,
  });
  setCookie(c, COOKIE.REFRESH_TOKEN, refreshToken, {
    httpOnly: true, sameSite: 'Lax', secure: false, path: '/', maxAge: SESSION_ROLLING_SEC,
  });
  setCookie(c, COOKIE.CSRF, csrf, {
    httpOnly: false, sameSite: 'Lax', secure: false, path: '/', maxAge: SESSION_ROLLING_SEC,
  });
}

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
      writeAuthCookies(c, data.session.access_token, data.session.refresh_token, csrf);
      return ok(c, { user: profile, csrf });
    },
  );

  r.get('/session', async (c) => {
    const at = getCookie(c, COOKIE.ACCESS_TOKEN);
    const rt = getCookie(c, COOKIE.REFRESH_TOKEN);
    const existingCsrf = getCookie(c, COOKIE.CSRF);

    let userId: string | null = null;
    let accessToken = at;
    let refreshToken = rt;

    // 1) 优先用 access token
    if (at) {
      const { data, error } = await sb(env).auth.getUser(at);
      if (!error && data.user) userId = data.user.id;
    }
    // 2) access 失效但 refresh 还在 → 静默换一对新 token
    if (!userId && rt) {
      const { data, error } = await sb(env).auth.refreshSession({ refresh_token: rt });
      if (!error && data.session && data.user) {
        userId = data.user.id;
        accessToken = data.session.access_token;
        refreshToken = data.session.refresh_token;
      }
    }
    if (!userId || !accessToken || !refreshToken) {
      return ok(c, { authenticated: false });
    }

    const { data: profile } = await sb(env)
      .from('profiles').select('*').eq('id', userId).single();
    const prof = profile as { role?: string } | null;
    if (!prof || prof.role !== 'super_admin') return ok(c, { authenticated: false });

    // 3) 滚动续期：每次 session 命中都重写 cookie，maxAge 重新计 30 天
    const csrf = existingCsrf ?? randomToken(24);
    writeAuthCookies(c, accessToken, refreshToken, csrf);
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
