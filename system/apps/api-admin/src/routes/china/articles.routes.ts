// A2 列表 / A3 详情 / A4 创建 / A5 更新 / A6 发布 / A7 下架 / A8 删除
import { Hono } from 'hono';
import { z } from 'zod';
import {
  AdminChinaListArticlesQuery,
  ChinaArticleUpsertInput,
  CHINA_LOCALES,
} from '@zhiyu/shared-schemas';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok, failByCode } from '../../middlewares/respond.ts';
import { requireAdmin } from '../../middlewares/auth-admin.ts';
import {
  listArticlesAdmin,
  getArticleAdmin,
  createArticleAdmin,
  updateArticleAdmin,
  publishArticleAdmin,
  unpublishArticleAdmin,
  deleteArticleAdmin,
} from '../../services/china/articles.service.ts';

const UuidParam = z.string().uuid();
const ArticleUpdateInput = ChinaArticleUpsertInput.partial();

export function adminArticlesRoutes(env: Env) {
  const r = new Hono();

  r.get('/', async (c) => {
    await requireAdmin(c, env);
    const parsed = AdminChinaListArticlesQuery.safeParse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    );
    if (!parsed.success) {
      return c.json({ code: 40001, message: 'validation_failed', details: parsed.error.flatten() }, 400);
    }
    const result = await listArticlesAdmin(sb(env), parsed.data);
    return ok(c, {
      items: result.items,
      pagination: { page: parsed.data.page, page_size: parsed.data.page_size, total: result.total },
    });
  });

  r.post('/', async (c) => {
    const actor = await requireAdmin(c, env);
    const body = ChinaArticleUpsertInput.parse(await c.req.json().catch(() => ({})));
    // 5 语言完整性
    for (const lang of CHINA_LOCALES) {
      if (!body.title_i18n[lang]) failByCode('CHINA_ARTICLE_TITLE_I18N_MISSING');
    }
    const out = await createArticleAdmin(sb(env), actor.id, body);
    return ok(c, out);
  });

  r.get('/:id', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_ARTICLE_NOT_FOUND');
    const out = await getArticleAdmin(sb(env), id);
    return ok(c, out);
  });

  r.patch('/:id', async (c) => {
    const actor = await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_ARTICLE_NOT_FOUND');
    const body = ArticleUpdateInput.parse(await c.req.json().catch(() => ({})));
    if (body.title_i18n) {
      for (const lang of CHINA_LOCALES) {
        if (!body.title_i18n[lang]) failByCode('CHINA_ARTICLE_TITLE_I18N_MISSING');
      }
    }
    const out = await updateArticleAdmin(sb(env), id, actor.id, body);
    return ok(c, out);
  });

  r.post('/:id/publish', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_ARTICLE_NOT_FOUND');
    const out = await publishArticleAdmin(sb(env), id);
    return ok(c, out);
  });

  r.post('/:id/unpublish', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_ARTICLE_NOT_FOUND');
    const out = await unpublishArticleAdmin(sb(env), id);
    return ok(c, out);
  });

  r.delete('/:id', async (c) => {
    await requireAdmin(c, env);
    const id = c.req.param('id');
    if (!UuidParam.safeParse(id).success) failByCode('CHINA_ARTICLE_NOT_FOUND');
    await deleteArticleAdmin(sb(env), id);
    return ok(c, { id, deleted: true });
  });

  return r;
}
