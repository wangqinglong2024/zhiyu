// C6 · 我的某文章进度 GET / C7 · PUT
import { Hono } from 'hono';
import { CHINA_ARTICLE_CODE_RE, ChinaProgressUpdateReq } from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok, failByCode } from '../../middlewares/respond.ts';
import { requireUser } from '../../middlewares/auth.ts';
import { getProgress, upsertProgress } from '../../services/china/progress.service.ts';

export function progressRoutes(env: Env) {
  const r = new Hono();

  // C6 · GET /api/v1/china/me/articles/:code/progress
  r.get('/articles/:code/progress', async (c) => {
    const u = await requireUser(c, env);
    const code = c.req.param('code');
    if (!CHINA_ARTICLE_CODE_RE.test(code)) failByCode('CHINA_ARTICLE_CODE_INVALID');
    const out = await getProgress(sb(env), u.id, code);
    return ok(c, out);
  });

  // C7 · PUT /api/v1/china/me/articles/:code/progress
  r.put('/articles/:code/progress', async (c) => {
    const u = await requireUser(c, env);
    const code = c.req.param('code');
    if (!CHINA_ARTICLE_CODE_RE.test(code)) failByCode('CHINA_ARTICLE_CODE_INVALID');
    const body = ChinaProgressUpdateReq.parse(await c.req.json().catch(() => ({})));
    const out = await upsertProgress(sb(env), u.id, code, body);
    return ok(c, out);
  });

  return r;
}
