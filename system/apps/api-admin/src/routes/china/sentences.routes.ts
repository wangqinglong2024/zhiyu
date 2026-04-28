// A9 列表(by article) / A10 详情 / A11 追加 / A11b 插入 / A12 更新 / A13 删除 / A14 重排
import { Hono } from 'hono';
import { z } from 'zod';
import {
  ChinaSentenceUpsertInput,
  AdminChinaInsertSentenceReq,
  AdminChinaReorderReq,
} from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok, failByCode } from '../../middlewares/respond.ts';
import { requireAdmin } from '../../middlewares/auth-admin.ts';
import {
  listSentencesAdmin,
  getSentenceAdmin,
  appendSentenceAdmin,
  insertSentenceAdmin,
  updateSentenceAdmin,
  deleteSentenceAdmin,
  reorderSentencesAdmin,
} from '../../services/china/sentences.service.ts';

const UuidParam = z.string().uuid();
const SentenceUpdateInput = ChinaSentenceUpsertInput.partial();

export function adminSentencesRoutes(env: Env) {
  const r = new Hono();

  // A9 · 列表（按 article_id query）
  r.get('/', async (c) => {
    await requireAdmin(c, env);
    const articleId = c.req.query('article_id') ?? '';
    if (!UuidParam.safeParse(articleId).success) failByCode('CHINA_ARTICLE_NOT_FOUND');
    const items = await listSentencesAdmin(sb(env), articleId);
    return ok(c, { items });
  });

  // A11 · 追加（POST /sentences body 含 article_id）
  r.post('/', async (c) => {
    await requireAdmin(c, env);
    const body = z
      .object({ article_id: z.string().uuid() })
      .merge(ChinaSentenceUpsertInput)
      .parse(await c.req.json().catch(() => ({})));
    const { article_id, ...payload } = body;
    const out = await appendSentenceAdmin(sb(env), article_id, payload);
    return ok(c, out);
  });

  // A11b · 在指定位置插入
  r.post('/insert', async (c) => {
    await requireAdmin(c, env);
    const body = z
      .object({ article_id: z.string().uuid() })
      .merge(AdminChinaInsertSentenceReq)
      .parse(await c.req.json().catch(() => ({})));
    const { article_id, ...payload } = body;
    if (payload.position === 'after' && (payload.after_seq_no === undefined || payload.after_seq_no === null)) {
      failByCode('CHINA_SENTENCE_AFTER_SEQ_REQUIRED');
    }
    const out = await insertSentenceAdmin(sb(env), article_id, payload);
    return ok(c, out);
  });

  // A14 · 重排（PUT /sentences/reorder body 含 article_id, ordered_ids）
  r.put('/reorder', async (c) => {
    await requireAdmin(c, env);
    const body = z
      .object({ article_id: z.string().uuid() })
      .merge(AdminChinaReorderReq)
      .parse(await c.req.json().catch(() => ({})));
    const items = await reorderSentencesAdmin(sb(env), body.article_id, body.ordered_ids);
    return ok(c, { items });
  });

  // A10 · 详情
  r.get('/:id', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_SENTENCE_NOT_FOUND');
    const out = await getSentenceAdmin(sb(env), id);
    return ok(c, out);
  });

  // A12 · 更新
  r.patch('/:id', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_SENTENCE_NOT_FOUND');
    const body = SentenceUpdateInput.parse(await c.req.json().catch(() => ({})));
    const out = await updateSentenceAdmin(sb(env), id, body);
    return ok(c, out);
  });

  // A13 · 删除
  r.delete('/:id', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_SENTENCE_NOT_FOUND');
    const out = await deleteSentenceAdmin(sb(env), id);
    return ok(c, { id, deleted: true, article_id: out.article_id });
  });

  return r;
}
