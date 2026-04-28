// A15 · 全局搜索（聚合：文章 + 句子）
import { Hono } from 'hono';
import { AdminChinaSearchQuery } from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok, failByCode } from '../../middlewares/respond.ts';
import { requireAdmin } from '../../middlewares/auth-admin.ts';
import { searchAdmin } from '../../services/china/search.service.ts';

export function adminSearchRoutes(env: Env) {
  const r = new Hono();

  r.get('/', async (c) => {
    await requireAdmin(c, env);
    const parsed = AdminChinaSearchQuery.safeParse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    );
    if (!parsed.success) {
      // 把错误码映射到业务码
      const flat = parsed.error.flatten().fieldErrors;
      const qErr = (flat.q || [])[0];
      if (qErr === 'CHINA_SEARCH_QUERY_TOO_SHORT') failByCode('CHINA_SEARCH_QUERY_TOO_SHORT');
      if (qErr === 'CHINA_SEARCH_QUERY_TOO_LONG') failByCode('CHINA_SEARCH_QUERY_TOO_LONG');
      return c.json({ code: 40001, message: 'validation_failed', details: parsed.error.flatten() }, 400);
    }
    const out = await searchAdmin(sb(env), parsed.data);
    return ok(c, out);
  });

  return r;
}
