import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sql as dsql } from 'drizzle-orm';
import { db } from '../../db.js';

/**
 * GET /api/v1/discover/search?q=&lang=&limit=
 * Postgres FTS over articles.search_doc + ILIKE fallback for short queries.
 *
 * The tsvector is maintained by the trigger zhiyu.articles_tsv_refresh which
 * uses pg_jieba when available (Chinese tokenisation) and the simple config
 * otherwise. The query side mirrors that: first try websearch_to_tsquery
 * with a config probe, then fall back to ILIKE.
 *
 * Highlighting is computed via ts_headline on title + summary (zh-CN).
 */
const queryQ = z.object({
  q: z.string().trim().min(1).max(80),
  lang: z.string().max(10).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export async function registerDiscoverSearchRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/discover/search', async (req, reply) => {
    const parsed = queryQ.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_query', issues: parsed.error.issues };
    }
    const { q, lang, limit } = parsed.data;

    let rows: Array<Record<string, unknown>> = [];
    try {
      // Probe pg_jieba; fall back to simple config inside the function call.
      rows = (await db.execute(dsql`
        WITH cfg AS (
          SELECT CASE WHEN EXISTS (
            SELECT 1 FROM pg_ts_config WHERE cfgname = 'jiebacfg'
          ) THEN 'jiebacfg'::regconfig ELSE 'simple'::regconfig END AS c
        )
        SELECT
          a.id, a.slug, a.category_id, a.hsk_level, a.cover_url,
          a.i18n_title, a.i18n_summary, a.rating_avg, a.rating_count,
          ts_rank(a.search_doc, websearch_to_tsquery((SELECT c FROM cfg), ${q})) AS rank,
          ts_headline((SELECT c FROM cfg),
            COALESCE(a.i18n_title->>'zh-CN','') || ' / ' || COALESCE(a.i18n_summary->>'zh-CN',''),
            websearch_to_tsquery((SELECT c FROM cfg), ${q}),
            'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=20'
          ) AS highlight
          FROM zhiyu.articles a
         WHERE a.status = 'published'
           AND (
             a.search_doc @@ websearch_to_tsquery((SELECT c FROM cfg), ${q})
             OR (a.i18n_title->>'zh-CN') ILIKE ${'%' + q + '%'}
             OR (a.i18n_title->>'en') ILIKE ${'%' + q + '%'}
           )
         ORDER BY rank DESC NULLS LAST, a.published_at DESC
         LIMIT ${limit}
      `)) as unknown as Array<Record<string, unknown>>;
    } catch {
      // ultimate fallback: pure ILIKE
      rows = (await db.execute(dsql`
        SELECT
          a.id, a.slug, a.category_id, a.hsk_level, a.cover_url,
          a.i18n_title, a.i18n_summary, a.rating_avg, a.rating_count,
          NULL::float AS rank,
          (a.i18n_title->>'zh-CN') AS highlight
          FROM zhiyu.articles a
         WHERE a.status = 'published'
           AND (
             (a.i18n_title->>'zh-CN') ILIKE ${'%' + q + '%'}
             OR (a.i18n_title->>'en')   ILIKE ${'%' + q + '%'}
             OR (a.i18n_summary->>'zh-CN') ILIKE ${'%' + q + '%'}
           )
         ORDER BY a.published_at DESC
         LIMIT ${limit}
      `)) as unknown as Array<Record<string, unknown>>;
    }
    return { q, lang: lang ?? null, total: rows.length, items: rows };
  });
}
