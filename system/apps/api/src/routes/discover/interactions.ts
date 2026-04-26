/**
 * /api/v1/discover/* user-scoped interactions:
 *   favorites   – generic starring (article/sentence/word/char/lesson)
 *   notes       – personal markdown notes
 *   progress    – per-article reading cursor + accumulated time
 *   rating      – 1..5 stars per article
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, sql as dsql } from 'drizzle-orm';
import { favorites, notes, articles } from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';

const ENTITY_TYPES = ['article', 'sentence', 'word', 'char', 'lesson'] as const;
const TARGET_TYPES = ['article', 'sentence', 'word', 'char'] as const;

const favBody = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().min(1).max(120),
});

const noteCreate = z.object({
  target_type: z.enum(TARGET_TYPES),
  target_id: z.string().min(1).max(120),
  body: z.string().max(2000),
  color: z.string().max(20).optional(),
});

const notePatch = z.object({
  body: z.string().max(2000).optional(),
  color: z.string().max(20).optional(),
});

const progressUpsert = z.object({
  article_id: z.string().uuid(),
  last_sentence_idx: z.number().int().min(0).max(10000).optional(),
  scroll_pct: z.number().min(0).max(100).optional(),
  delta_seconds: z.number().int().min(0).max(3600).optional(),
  completed: z.boolean().optional(),
});

const ratingBody = z.object({ score: z.number().int().min(1).max(5) });

export async function registerDiscoverInteractionsRoutes(app: FastifyInstance): Promise<void> {
  // ---- Favorites ----
  app.get('/api/v1/discover/favorites', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const rows = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt))
      .limit(200);
    return { items: rows };
  });

  app.post('/api/v1/discover/favorites', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const parsed = favBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const { entity_type, entity_id } = parsed.data;
    await db
      .insert(favorites)
      .values({ userId: user.id, entityType: entity_type, entityId: entity_id })
      .onConflictDoNothing();
    return { ok: true };
  });

  app.delete('/api/v1/discover/favorites', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const parsed = favBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload' };
    }
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(favorites.entityType, parsed.data.entity_type),
          eq(favorites.entityId, parsed.data.entity_id),
        ),
      );
    return { ok: true };
  });

  // ---- Notes ----
  app.get('/api/v1/discover/notes', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const rows = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.updatedAt))
      .limit(200);
    return { items: rows };
  });

  app.post('/api/v1/discover/notes', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const parsed = noteCreate.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const d = parsed.data;
    const [row] = await db
      .insert(notes)
      .values({
        userId: user.id,
        targetType: d.target_type,
        targetId: d.target_id,
        body: d.body,
        color: d.color ?? 'amber',
      })
      .returning();
    return { note: row };
  });

  app.patch('/api/v1/discover/notes/:id', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const id = (req.params as { id: string }).id;
    const parsed = notePatch.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload' };
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.body !== undefined) updates.body = parsed.data.body;
    if (parsed.data.color !== undefined) updates.color = parsed.data.color;
    const [row] = await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning();
    if (!row) {
      reply.code(404);
      return { error: 'note_not_found' };
    }
    return { note: row };
  });

  app.delete('/api/v1/discover/notes/:id', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const id = (req.params as { id: string }).id;
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, user.id)));
    return { ok: true };
  });

  // ---- Reading progress ----
  app.post('/api/v1/discover/progress', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const parsed = progressUpsert.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const d = parsed.data;
    // Validate article exists & published.
    const [art] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(and(eq(articles.id, d.article_id), eq(articles.status, 'published')))
      .limit(1);
    if (!art) {
      reply.code(404);
      return { error: 'article_not_found' };
    }
    // Upsert with running additive delta_seconds.
    await db.execute(dsql`
      INSERT INTO zhiyu.reading_progress
        (user_id, article_id, last_sentence_idx, scroll_pct,
         accumulated_seconds, completed, last_seen_at)
      VALUES
        (${user.id}, ${d.article_id},
         ${d.last_sentence_idx ?? 0}, ${d.scroll_pct ?? 0},
         ${d.delta_seconds ?? 0}, ${d.completed ?? false}, now())
      ON CONFLICT (user_id, article_id) DO UPDATE SET
        last_sentence_idx = COALESCE(${d.last_sentence_idx ?? null}, zhiyu.reading_progress.last_sentence_idx),
        scroll_pct = COALESCE(${d.scroll_pct ?? null}, zhiyu.reading_progress.scroll_pct),
        accumulated_seconds = zhiyu.reading_progress.accumulated_seconds + ${d.delta_seconds ?? 0},
        completed = COALESCE(${d.completed ?? null}, zhiyu.reading_progress.completed),
        last_seen_at = now()
    `);
    return { ok: true };
  });

  app.get('/api/v1/discover/progress', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const rows = (await db.execute(dsql`
      SELECT * FROM zhiyu.reading_progress
       WHERE user_id = ${user.id}
       ORDER BY last_seen_at DESC
       LIMIT 50
    `)) as unknown as Array<Record<string, unknown>>;
    return { items: rows };
  });

  // ---- Rating ----
  app.post('/api/v1/discover/articles/:slug/rating', async (req, reply) => {
    const user = await requireUser(req as FastifyRequest, reply);
    if (!user) return;
    const slug = (req.params as { slug: string }).slug;
    const parsed = ratingBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload' };
    }
    const [art] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);
    if (!art) {
      reply.code(404);
      return { error: 'article_not_found' };
    }
    await db.execute(dsql`
      INSERT INTO zhiyu.article_ratings (user_id, article_id, score)
      VALUES (${user.id}, ${art.id}, ${parsed.data.score})
      ON CONFLICT (user_id, article_id) DO UPDATE SET
        score = EXCLUDED.score, updated_at = now()
    `);
    return { ok: true };
  });
}
