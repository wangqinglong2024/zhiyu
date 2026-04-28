// C1 · 类目列表（公开）
import { Hono } from 'hono';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok } from '../../middlewares/respond.ts';
import { listCategoriesPublic } from '../../services/china/categories.service.ts';

export function categoriesRoutes(env: Env) {
  const r = new Hono();
  r.get('/', async (c) => {
    const items = await listCategoriesPublic(sb(env));
    return ok(c, { items });
  });
  return r;
}
