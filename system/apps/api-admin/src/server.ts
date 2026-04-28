import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getServerSupabase } from '@zhiyu/supabase-client';
import { COOKIE, JWT_TTL } from '@zhiyu/shared-config';
import { randomToken } from '@zhiyu/shared-utils';
import { loadEnv } from './env.ts';

const env = loadEnv();
const sb = getServerSupabase(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const app = new Hono();
app.use('*', logger());
const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:4100')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  '*',
  cors({
    origin: corsOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }),
);

const startedAt = Date.now();
app.get('/', (c) => c.json({ code: 0, data: { service: 'zhiyu-api-admin', env: env.APP_ENV } }));
app.get('/admin/v1/health', (c) =>
  c.json({ code: 0, data: { uptime_s: Math.floor((Date.now() - startedAt) / 1000) } }),
);

// ---- admin login（仅邮箱密码）----
app.post(
  '/admin/v1/auth/login',
  zValidator('json', z.object({ email: z.string().email(), password: z.string().min(1) })),
  async (c) => {
    const body = c.req.valid('json');
    const { data, error } = await sb.auth.signInWithPassword({ email: body.email, password: body.password });
    if (error || !data.session || !data.user) return c.json({ code: 41002, message: 'invalid credentials' }, 401);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (!profile || profile.role !== 'super_admin' || profile.is_active === false) {
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
    return c.json({ code: 0, data: { user: profile, csrf } });
  },
);

app.get('/admin/v1/auth/session', async (c) => {
  const at = getCookie(c, COOKIE.ACCESS_TOKEN);
  if (!at) return c.json({ code: 0, data: { authenticated: false } });
  const { data, error } = await sb.auth.getUser(at);
  if (error || !data.user) return c.json({ code: 0, data: { authenticated: false } });
  const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile || profile.role !== 'super_admin') return c.json({ code: 0, data: { authenticated: false } });
  return c.json({ code: 0, data: { authenticated: true, user: profile } });
});

app.post('/admin/v1/auth/logout', (c) => {
  deleteCookie(c, COOKIE.ACCESS_TOKEN, { path: '/' });
  deleteCookie(c, COOKIE.REFRESH_TOKEN, { path: '/' });
  deleteCookie(c, COOKIE.CSRF, { path: '/' });
  return c.json({ code: 0, data: { logged_out: true } });
});

// ---- admin: 用户列表 + 启停 ----
async function requireAdmin(c: import('hono').Context): Promise<{ id: string }> {
  const at = getCookie(c, COOKIE.ACCESS_TOKEN);
  if (!at) throw new Error('unauthorized');
  const { data, error } = await sb.auth.getUser(at);
  if (error || !data.user) throw new Error('unauthorized');
  const { data: p } = await sb.from('profiles').select('role').eq('id', data.user.id).single();
  if (!p || p.role !== 'super_admin') throw new Error('forbidden');
  return { id: data.user.id };
}

app.get('/admin/v1/users', async (c) => {
  try { await requireAdmin(c); } catch { return c.json({ code: 40100, message: 'auth required' }, 401); }
  const page = Math.max(1, Number(c.req.query('page') ?? '1'));
  const size = Math.min(50, Math.max(1, Number(c.req.query('size') ?? '20')));
  const from = (page - 1) * size;
  const to = from + size - 1;
  const { data, error, count } = await sb
    .from('profiles')
    .select('id,email,role,display_name,is_active,locale,created_at', { count: 'exact' })
    .eq('role', 'user') // G3-01：管理端「用户管理」仅管理普通用户，不展示任何管理员账号
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) return c.json({ code: 50000, message: error.message }, 500);
  return c.json({ code: 0, data: { items: data, total: count ?? 0, page, size } });
});

app.post(
  '/admin/v1/users/:id/active',
  zValidator('json', z.object({ is_active: z.boolean() })),
  async (c) => {
    let actor: { id: string };
    try { actor = await requireAdmin(c); } catch { return c.json({ code: 40100, message: 'auth required' }, 401); }
    const targetId = c.req.param('id');
    if (targetId === actor.id) return c.json({ code: 40300, message: 'cannot disable self' }, 403);
    const { is_active } = c.req.valid('json');
    const { error } = await sb.from('profiles').update({ is_active, updated_at: new Date().toISOString() }).eq('id', targetId);
    if (error) return c.json({ code: 50000, message: error.message }, 500);
    if (!is_active) {
      // 全局 signOut + 清掉 user_sessions
      await sb.auth.admin.signOut(targetId).catch(() => undefined);
      await sb.from('user_sessions').delete().eq('user_id', targetId);
    }
    await sb.from('audit_logs').insert({
      actor_id: actor.id, actor_role: 'super_admin',
      event: is_active ? 'user.enable' : 'user.disable',
      target_type: 'user', target_id: targetId,
    });
    return c.json({ code: 0, data: { id: targetId, is_active } });
  },
);

app.onError((err, c) => {
  // eslint-disable-next-line no-console
  console.error('[admin]', err);
  return c.json({ code: 50000, message: 'internal error' }, 500);
});

serve({ fetch: app.fetch, port: env.API_ADMIN_PORT, hostname: '0.0.0.0' }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[api-admin] listening on http://0.0.0.0:${info.port}`);
});
