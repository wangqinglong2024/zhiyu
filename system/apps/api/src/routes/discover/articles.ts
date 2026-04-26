import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, asc, desc, eq, lt, sql as dsql } from 'drizzle-orm';
import { articles, categories, sentences } from '@zhiyu/db';
import { db } from '../../db.js';
import { getOptionalUser } from '../../auth-mw.js';

const listQ = z.object({
  category: z.string().optional(),
  hsk: z.coerce.number().int().min(1).max(9).optional(),
  cursor: z.string().optional(), // ISO timestamp + id pair, opaque
  limit: z.coerce.number().int().min(1).max(40).default(12),
  q: z.string().trim().max(80).optional(),
});

interface CursorPayload { ts: string; id: string }

function parseCursor(raw: string | undefined): CursorPayload | null {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const obj = JSON.parse(decoded);
    if (typeof obj.ts === 'string' && typeof obj.id === 'string') return obj;
  } catch {
    /* malformed */
  }
  return null;
}

function makeCursor(p: CursorPayload): string {
  return Buffer.from(JSON.stringify(p), 'utf8').toString('base64url');
}

/**
 * GET /api/v1/discover/articles
 *   ?category=<slug>&hsk=&cursor=&limit=
 * Keyset pagination on (published_at DESC, id). Returns published only.
 *
 * GET /api/v1/discover/articles/:slug
 *   Returns article + sentences + (when authed) reading progress + rating.
 */
export async function registerDiscoverArticlesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/discover/articles', async (req, reply) => {
    const parsed = listQ.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_query', issues: parsed.error.issues };
    }
    const { category, hsk, cursor, limit, q } = parsed.data;
    let categoryId: number | null = null;
    if (category) {
      const [c] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);
      if (!c) {
        reply.code(404);
        return { error: 'category_not_found' };
      }
      categoryId = c.id;
    }

    const conditions = [eq(articles.status, 'published')];
    if (categoryId !== null) conditions.push(eq(articles.categoryId, categoryId));
    if (hsk) conditions.push(eq(articles.hskLevel, hsk));
    const cur = parseCursor(cursor);
    if (cur) {
      conditions.push(
        dsql`(${articles.publishedAt}, ${articles.id}::text) < (${new Date(cur.ts)}, ${cur.id})`,
      );
    }
    if (q) {
      conditions.push(dsql`(
        ${articles.i18nTitle}->>'zh-CN' ILIKE ${'%' + q + '%'} OR
        ${articles.i18nTitle}->>'en' ILIKE ${'%' + q + '%'}
      )`);
    }

    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        categoryId: articles.categoryId,
        hskLevel: articles.hskLevel,
        coverUrl: articles.coverUrl,
        estimatedMinutes: articles.estimatedMinutes,
        i18nTitle: articles.i18nTitle,
        i18nSummary: articles.i18nSummary,
        ratingAvg: articles.ratingAvg,
        ratingCount: articles.ratingCount,
        views: articles.views,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1];
      if (last && last.publishedAt) {
        nextCursor = makeCursor({ ts: last.publishedAt.toISOString(), id: last.id });
      }
    }
    return { items, next_cursor: nextCursor };
  });

  app.get('/api/v1/discover/articles/:slug', async (req, reply) => {
    const slug = (req.params as { slug: string }).slug;
    const [art] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
      .limit(1);
    if (!art) {
      // Fall back: return draft for admins; otherwise 404. v1 keeps it simple.
      reply.code(404);
      return { error: 'article_not_found' };
    }
    const ss = await db
      .select()
      .from(sentences)
      .where(eq(sentences.articleId, art.id))
      .orderBy(asc(sentences.idx));

    // increment views fire-and-forget
    void db
      .update(articles)
      .set({ views: dsql`${articles.views} + 1` })
      .where(eq(articles.id, art.id));

    const user = await getOptionalUser(req);
    let progress: unknown = null;
    let ratingMine: number | null = null;
    if (user) {
      const [p] = await db.execute(
        dsql`SELECT * FROM zhiyu.reading_progress WHERE user_id=${user.id} AND article_id=${art.id} LIMIT 1`,
      ) as unknown as Array<Record<string, unknown>>;
      progress = p ?? null;
      const [r] = await db.execute(
        dsql`SELECT score FROM zhiyu.article_ratings WHERE user_id=${user.id} AND article_id=${art.id} LIMIT 1`,
      ) as unknown as Array<{ score: number }>;
      if (r) ratingMine = r.score;
    }

    return { article: art, sentences: ss, progress, rating_mine: ratingMine };
  });
}
