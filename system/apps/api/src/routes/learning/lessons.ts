/**
 * E07 ZY-07-02 — Lesson step engine + lesson completion endpoints.
 *
 * Routes:
 *   GET  /api/v1/lessons/:id                           — lesson + per-step progress
 *   POST /api/v1/lessons/:id/steps/:n/answer           — graded step advance
 *
 * The handler:
 *   1. Loads lesson.steps[n] type + threshold.
 *   2. Calls evaluateStep(payload) → score / mistakes / passed.
 *   3. Persists lesson_progress row, increments attempts.
 *   4. Inserts unresolved mistakes into mistake_log.
 *   5. Marks resolved mistake rows resolved_at = now().
 *   6. On final step (9) pass → updates enrollments.progress + advances
 *      current_lesson_id to next position; awards XP via xp helper.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  courses,
  enrollments,
  lessons,
  lessonProgress,
  mistakeLog,
  srsCards,
} from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser, getOptionalUser } from '../../auth-mw.js';
import { answerPayloadSchema, evaluateStep, resolveStepType, STEP_TYPES } from '../../learning/lesson-engine.js';
import { awardXp } from '../../learning/progression-svc.js';
import { XP_AMOUNTS } from '../../learning/xp-algo.js';

const idParam = z.object({ id: z.string().uuid() });
const stepParams = z.object({ id: z.string().uuid(), n: z.string().regex(/^[0-9]$/) });

export async function registerLessonRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/lessons/:id', async (req, reply) => {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, parsed.data.id)).limit(1);
    if (!lesson) {
      reply.code(404);
      return { error: 'lesson_not_found' };
    }
    const user = await maybeUser(req);
    let progress: Array<{ step_index: number; status: string; score: string }> = [];
    if (user) {
      const rows = await db
        .select({
          step_index: lessonProgress.stepIndex,
          status: lessonProgress.status,
          score: lessonProgress.score,
        })
        .from(lessonProgress)
        .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lesson.id)))
        .orderBy(asc(lessonProgress.stepIndex));
      progress = rows.map((r) => ({ ...r, score: String(r.score) }));
    }
    return { lesson, progress, step_types: STEP_TYPES };
  });

  app.post('/api/v1/lessons/:id/steps/:n/answer', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const params = stepParams.safeParse(req.params);
    if (!params.success) {
      reply.code(400);
      return { error: 'invalid_params' };
    }
    const payload = answerPayloadSchema.safeParse(req.body ?? {});
    if (!payload.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: payload.error.issues };
    }
    const stepIndex = Number(params.data.n);
    const lessonId = params.data.id;
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!lesson) {
      reply.code(404);
      return { error: 'lesson_not_found' };
    }
    // Enforce gating: step n requires step n-1 done (intro exempt).
    if (stepIndex > 0) {
      const [prev] = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, user.id),
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.stepIndex, stepIndex - 1),
          ),
        )
        .limit(1);
      if (!prev || prev.status !== 'done') {
        reply.code(409);
        return { error: 'previous_step_not_done', need_step: stepIndex - 1 };
      }
    }
    const stepType = resolveStepType(lesson.steps, stepIndex);
    const result = evaluateStep(stepIndex, stepType, payload.data);

    await db.transaction(async (tx) => {
      await tx
        .insert(lessonProgress)
        .values({
          userId: user.id,
          lessonId,
          stepIndex,
          status: result.passed ? 'done' : 'failed',
          score: String(result.score),
          attempts: 1,
          payload: payload.data as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId, lessonProgress.stepIndex],
          set: {
            status: result.passed ? 'done' : 'failed',
            score: String(result.score),
            attempts: sql`${lessonProgress.attempts} + 1`,
            payload: payload.data as Record<string, unknown>,
            updatedAt: new Date(),
          },
        });

      if (result.mistakes.length > 0) {
        await tx.insert(mistakeLog).values(
          result.mistakes.map((m) => ({
            userId: user.id,
            lessonId,
            stepIndex,
            questionId: m.question_id,
            source: 'lesson',
            payload: m.payload,
          })),
        );
      }
      if (result.resolved_mistake_question_ids.length > 0) {
        await tx
          .update(mistakeLog)
          .set({ resolvedAt: new Date() })
          .where(
            and(
              eq(mistakeLog.userId, user.id),
              isNull(mistakeLog.resolvedAt),
              inArray(mistakeLog.questionId, result.resolved_mistake_question_ids),
            ),
          );
      }

      if (result.passed) {
        // Award XP per step.
        await awardXp(tx, user.id, XP_AMOUNTS.lessonStepDone, 'lessonStepDone', {
          lesson_id: lessonId,
          step_index: stepIndex,
        });
      }

      if (result.lesson_complete) {
        // Update enrollments + advance current_lesson_id.
        const [enrollRow] = await tx
          .select()
          .from(enrollments)
          .where(
            and(eq(enrollments.userId, user.id), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')),
          )
          .limit(1);
        if (enrollRow) {
          // Compute new progress %: completed lessons / total lessons.
          const totals = await tx
            .select({ total: sql<number>`count(*)::int` })
            .from(lessons)
            .where(eq(lessons.courseId, lesson.courseId));
          const completed = await tx
            .select({ done: sql<number>`count(distinct lesson_id)::int` })
            .from(lessonProgress)
            .where(
              and(
                eq(lessonProgress.userId, user.id),
                eq(lessonProgress.status, 'done'),
                eq(lessonProgress.stepIndex, 9),
              ),
            );
          const total = totals[0]?.total ?? 0;
          const done = completed[0]?.done ?? 0;
          const percent = total > 0 ? Math.min(100, Math.round((done / total) * 10000) / 100) : 0;
          // Find next lesson (position > current).
          const [nextLesson] = await tx
            .select({ id: lessons.id })
            .from(lessons)
            .where(and(eq(lessons.courseId, lesson.courseId), sql`${lessons.position} > ${lesson.position}`))
            .orderBy(asc(lessons.position))
            .limit(1);
          await tx
            .update(enrollments)
            .set({
              progressPercent: String(percent),
              currentLessonId: nextLesson?.id ?? lesson.id,
              status: nextLesson ? 'active' : 'completed',
              completedAt: nextLesson ? null : new Date(),
              lastActiveAt: new Date(),
            })
            .where(eq(enrollments.id, enrollRow.id));
        }
        await awardXp(tx, user.id, XP_AMOUNTS.lessonComplete, 'lessonComplete', {
          lesson_id: lessonId,
        });

        // Auto-create SRS cards for this lesson's vocabulary if steps include
        // word data. We treat any answer with question_id starting with
        // "word:" as a SRS source word.
        const words = collectWordsFromPayload(payload.data);
        if (words.length > 0) {
          await tx
            .insert(srsCards)
            .values(
              words.map((w) => ({
                userId: user.id,
                word: w,
                source: `lesson:${lessonId}`,
                dueAt: new Date().toISOString().slice(0, 10) as unknown as string,
              })),
            )
            .onConflictDoNothing();
        }
      } else {
        // Touch enrollment last_active_at.
        await tx
          .update(enrollments)
          .set({ lastActiveAt: new Date() })
          .where(
            and(eq(enrollments.userId, user.id), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')),
          );
      }
    });

    return {
      ok: true,
      ...result,
      hint: result.passed
        ? result.lesson_complete
          ? { type: 'recommend_srs' }
          : { type: 'continue', next_step: result.next_step_index }
        : { type: 'retry', step_type: stepType },
    };
  });
}

async function maybeUser(req: import('fastify').FastifyRequest) {
  try {
    return await getOptionalUser(req);
  } catch {
    return null;
  }
}

function collectWordsFromPayload(payload: { answers?: Array<{ question_id: string; chosen?: string; expected?: string }> }): string[] {
  const out = new Set<string>();
  for (const a of payload.answers ?? []) {
    if (a.question_id.startsWith('word:')) {
      // Prefer explicit expected/chosen, fall back to the suffix after "word:".
      const fragment = a.expected ?? a.chosen ?? a.question_id.slice('word:'.length);
      if (fragment) out.add(fragment.slice(0, 20));
    }
  }
  return Array.from(out);
}
