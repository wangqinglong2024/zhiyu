/**
 * E07 ZY-07-03 — SRS review API.
 *
 * Routes:
 *   GET  /api/v1/srs/queue?limit=                — today's due cards
 *   POST /api/v1/srs/cards                        — manually add a card
 *   POST /api/v1/srs/cards/:id/review             — submit a grade (1..4)
 *   GET  /api/v1/srs/stats                        — counters for dashboard
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { srsCards } from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';
import { applySm2, SRS_DEFAULTS, type SrsGrade } from '../../learning/srs-algo.js';
import { awardXp } from '../../learning/progression-svc.js';
import { XP_AMOUNTS } from '../../learning/xp-algo.js';

const idParam = z.object({ id: z.string().uuid() });
const reviewBody = z.object({ grade: z.number().int().min(1).max(4) });
const addCardBody = z.object({
  word: z.string().min(1).max(20),
  pinyin: z.string().max(40).optional(),
  meaning: z.string().max(200).optional(),
  source: z.string().max(40).optional(),
});

export async function registerSrsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/srs/queue', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const q = (req.query as { limit?: string }) ?? {};
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 30)));
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select()
      .from(srsCards)
      .where(and(eq(srsCards.userId, user.id), lte(srsCards.dueAt, today as unknown as string)))
      .orderBy(asc(srsCards.dueAt))
      .limit(limit);
    return { queue: rows, today };
  });

  app.post('/api/v1/srs/cards', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = addCardBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await db
      .insert(srsCards)
      .values({
        userId: user.id,
        word: parsed.data.word,
        pinyin: parsed.data.pinyin ?? null,
        meaning: parsed.data.meaning ?? null,
        source: parsed.data.source ?? 'manual',
        dueAt: today as unknown as string,
      })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      reply.code(409);
      return { error: 'already_exists' };
    }
    return { card: row };
  });

  app.post('/api/v1/srs/cards/:id/review', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const params = idParam.safeParse(req.params);
    const body = reviewBody.safeParse(req.body);
    if (!params.success || !body.success) {
      reply.code(400);
      return { error: 'invalid_payload' };
    }
    const [card] = await db
      .select()
      .from(srsCards)
      .where(and(eq(srsCards.id, params.data.id), eq(srsCards.userId, user.id)))
      .limit(1);
    if (!card) {
      reply.code(404);
      return { error: 'card_not_found' };
    }
    const update = applySm2(
      {
        interval_days: Number(card.intervalDays),
        ease: Number(card.ease),
        reps: card.reps,
        lapses: card.lapses,
      },
      body.data.grade as SrsGrade,
    );
    const dueAt = new Date(Date.now() + update.next_due_offset_days * 86400_000)
      .toISOString()
      .slice(0, 10);

    let xpResult: Awaited<ReturnType<typeof awardXp>> | null = null;
    await db.transaction(async (tx) => {
      await tx
        .update(srsCards)
        .set({
          intervalDays: String(update.interval_days),
          ease: String(update.ease),
          dueAt: dueAt as unknown as string,
          reps: update.reps,
          lapses: update.lapses,
          lastGrade: update.grade,
          lastReviewedAt: new Date(),
        })
        .where(eq(srsCards.id, card.id));
      xpResult = await awardXp(tx, user.id, XP_AMOUNTS.srsReview, 'srsReview', {
        card_id: card.id,
        grade: update.grade,
      });
    });
    return { card_id: card.id, ...update, due_at: dueAt, xp: xpResult };
  });

  app.get('/api/v1/srs/stats', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        due_today: sql<number>`count(*) filter (where due_at <= ${today})::int`,
        new_cards: sql<number>`count(*) filter (where reps = 0)::int`,
        learning: sql<number>`count(*) filter (where reps > 0 and reps < 5)::int`,
        mature: sql<number>`count(*) filter (where reps >= 5)::int`,
      })
      .from(srsCards)
      .where(eq(srsCards.userId, user.id));
    return { stats: row ?? { total: 0, due_today: 0, new_cards: 0, learning: 0, mature: 0 }, today };
  });
}

// Helper used by other routes (kept here for proximity).
export function defaultsFor(): typeof SRS_DEFAULTS {
  return SRS_DEFAULTS;
}
