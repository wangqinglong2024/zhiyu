// C2 · 文章列表 / C3 · 文章详情（按 code）/ C5 · 文章句子列表
import { Hono } from 'hono';
import { CHINA_ARTICLE_CODE_RE, ChinaListArticlesQuery } from '@zhiyu/shared-schemas';
import { GUEST_DISCOVER_LIMIT } from '@zhiyu/shared-config';
import type { Env } from '../../env.ts';
import { sb } from '../../lib/supabase.ts';
import { ok, failByCode } from '../../middlewares/respond.ts';
import { resolveUser } from '../../middlewares/auth.ts';
import { AppError } from '../../middlewares/error.ts';
import {
  listPublishedArticles,
  getPublishedArticleByCode,
  listPublishedArticleSentencesByCode,
} from '../../services/china/articles.service.ts';
import { isPublicTier } from '../../services/china/categories.service.ts';

export function articlesRoutes(env: Env) {
  const r = new Hono();

  // C2 · 列表
  r.get('/', async (c) => {
    const parsed = ChinaListArticlesQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
    if (!parsed.success) {
      return c.json({ code: 40001, message: 'validation_failed', details: parsed.error.flatten() }, 400);
    }
    const q = parsed.data;

    // 权限：未登录仅可访问 PUBLIC_TIER 类目；显式传非公开 category_code 时校验
    const user = await resolveUser(c, env);
    if (!user && q.category_code && !isPublicTier(q.category_code)) {
      throw new AppError(40100, 'auth.required', 401);
    }

    const result = await listPublishedArticles(sb(env), q);

    // 未登录：若未带 category_code，仅返回公开类目下的文章；这里通过过滤实现。
    if (!user && !q.category_code) {
      const filtered = result.items.filter((x) => isPublicTier(x.category?.code as string));
      return ok(c, {
        items: filtered.slice(0, GUEST_DISCOVER_LIMIT * 100),
        pagination: { page: q.page, page_size: q.page_size, total: filtered.length },
      });
    }

    return ok(c, {
      items: result.items,
      pagination: { page: q.page, page_size: q.page_size, total: result.total },
    });
  });

  // C3 · 详情（by code）
  r.get('/:code', async (c) => {
    const code = c.req.param('code');
    if (!CHINA_ARTICLE_CODE_RE.test(code)) failByCode('CHINA_ARTICLE_CODE_INVALID');
    const detail = await getPublishedArticleByCode(sb(env), code);

    // 权限：非公开类目要求登录
    if (!isPublicTier(detail.category?.code as string)) {
      const u = await resolveUser(c, env);
      if (!u) throw new AppError(40100, 'auth.required', 401);
    }
    return ok(c, detail);
  });

  // C5 · 文章句子列表
  r.get('/:code/sentences', async (c) => {
    const code = c.req.param('code');
    if (!CHINA_ARTICLE_CODE_RE.test(code)) failByCode('CHINA_ARTICLE_CODE_INVALID');

    const detail = await getPublishedArticleByCode(sb(env), code);
    if (!isPublicTier(detail.category?.code as string)) {
      const u = await resolveUser(c, env);
      if (!u) throw new AppError(40100, 'auth.required', 401);
    }
    const items = await listPublishedArticleSentencesByCode(sb(env), code);
    return ok(c, {
      article: { id: detail.id, code: detail.code, title_i18n: detail.title_i18n },
      items,
    });
  });

  return r;
}
