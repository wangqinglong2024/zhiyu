/**
 * E07 ZY-07-06 — HSK self-assessment endpoints.
 *
 * Routes:
 *   GET  /api/v1/hsk/questions
 *   POST /api/v1/hsk/submit
 *   GET  /api/v1/me/hsk/last
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { desc, eq, sql } from 'drizzle-orm';
import { hskResults } from '@zhiyu/db';
import { profiles } from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';
import { getHskQuestions, scoreHskAssessment } from '@zhiyu/sdk';

const submitBody = z.object({
  duration_seconds: z.number().int().min(0).max(36_000).optional(),
  answers: z
    .array(
      z.object({
        question_id: z.string().min(1).max(60),
        selected: z.number().int().min(-1).max(10),
      }),
    )
    .min(1)
    .max(50),
});

export async function registerHskRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/hsk/questions', async () => {
    // Strip the answer key — must not leak to the client.
    const items = getHskQuestions().map((q) => ({
      id: q.id,
      level: q.level,
      prompt: q.prompt,
      options: q.options,
    }));
    return { questions: items };
  });

  app.post('/api/v1/hsk/submit', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    const score = scoreHskAssessment(parsed.data.answers);
    await db.transaction(async (tx) => {
      await tx.insert(hskResults).values({
        userId: user.id,
        totalQuestions: score.total_questions,
        correctCount: score.correct_count,
        perLevel: score.per_level,
        recommendedLevel: score.recommended_level,
        durationSeconds: parsed.data.duration_seconds ?? 0,
      });
      await tx
        .update(profiles)
        .set({ hskSelfLevel: score.recommended_level, updatedAt: new Date() })
        .where(eq(profiles.id, user.id));
    });
    return { ok: true, ...score };
  });

  app.get('/api/v1/me/hsk/last', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const [row] = await db
      .select()
      .from(hskResults)
      .where(eq(hskResults.userId, user.id))
      .orderBy(desc(hskResults.createdAt))
      .limit(1);
    return { result: row ?? null };
  });
}
