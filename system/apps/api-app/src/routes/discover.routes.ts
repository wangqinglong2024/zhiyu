import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { COOKIE, GUEST_DISCOVER_LIMIT } from '@zhiyu/shared-config';
import { sb } from '../lib/supabase.ts';
import type { Env } from '../env.ts';

export function discoverRoutes(env: Env) {
  const r = new Hono();
  // 列表：未登录最多前 3 个；登录后全部
  r.get('/topics', async (c) => {
    const at = getCookie(c, COOKIE.ACCESS_TOKEN);
    let authed = false;
    if (at) {
      const { data } = await sb(env).auth.getUser(at);
      authed = !!data.user;
    }
    let q = sb(env).from('discover_topics').select('id,slug,order_no,title_zh,title_en,cover_url').order('order_no');
    if (!authed) q = q.limit(GUEST_DISCOVER_LIMIT);
    const { data, error } = await q;
    if (error) return c.json({ code: 50000, message: error.message }, 500);
    return c.json({ code: 0, data: { authenticated: authed, items: data ?? [], guest_limit: authed ? null : GUEST_DISCOVER_LIMIT } });
  });
  return r;
}
