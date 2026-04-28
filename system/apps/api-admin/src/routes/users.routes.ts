import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../env.ts';
import { sb } from '../lib/supabase.ts';
import { ok } from '../middlewares/respond.ts';
import { AppError } from '../middlewares/error.ts';
import { requireAdmin } from '../middlewares/auth-admin.ts';

export function usersRoutes(env: Env) {
  const r = new Hono();

  r.get('/', async (c) => {
    await requireAdmin(c, env);
    const page = Math.max(1, Number(c.req.query('page') ?? '1'));
    const size = Math.min(50, Math.max(1, Number(c.req.query('size') ?? '20')));
    const from = (page - 1) * size;
    const to = from + size - 1;
    const { data, error, count } = await sb(env)
      .from('profiles')
      .select('id,email,role,display_name,is_active,locale,created_at', { count: 'exact' })
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new AppError(50000, error.message, 500);
    return ok(c, { items: data, total: count ?? 0, page, size });
  });

  r.post(
    '/:id/active',
    zValidator('json', z.object({ is_active: z.boolean() })),
    async (c) => {
      const actor = await requireAdmin(c, env);
      const targetId = c.req.param('id');
      if (targetId === actor.id) throw new AppError(40300, 'cannot disable self', 403);
      const { is_active } = c.req.valid('json');
      const { error } = await sb(env)
        .from('profiles')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', targetId);
      if (error) throw new AppError(50000, error.message, 500);
      if (!is_active) {
        await sb(env).auth.admin.signOut(targetId).catch(() => undefined);
        await sb(env).from('user_sessions').delete().eq('user_id', targetId);
      }
      await sb(env).from('audit_logs').insert({
        actor_id: actor.id,
        actor_role: 'super_admin',
        event: is_active ? 'user.enable' : 'user.disable',
        target_type: 'user',
        target_id: targetId,
      });
      return ok(c, { id: targetId, is_active });
    },
  );

  return r;
}
