// A1 · 管理端类目列表 + 详情
import { Hono } from 'hono';
import { CHINA_CATEGORY_CODE_RE } from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok, failByCode } from '../../middlewares/respond.ts';
import { requireAdmin } from '../../middlewares/auth-admin.ts';
import {
  listCategoriesAdmin,
  getCategoryAdmin,
} from '../../services/china/categories.service.ts';

export function adminCategoriesRoutes(env: Env) {
  const r = new Hono();

  r.get('/', async (c) => {
    await requireAdmin(c, env);
    const items = await listCategoriesAdmin(sb(env));
    return ok(c, { items });
  });

  r.get('/:code', async (c) => {
    await requireAdmin(c, env);
    const code = c.req.param('code');
    if (!CHINA_CATEGORY_CODE_RE.test(code)) failByCode('CHINA_CATEGORY_CODE_INVALID');
    const item = await getCategoryAdmin(sb(env), code);
    return ok(c, item);
  });

  return r;
}
