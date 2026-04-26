/**
 * E07 ZY-07-01 — Enrollment + course/lesson catalog read endpoints.
 *
 * Routes:
 *   GET  /api/v1/courses                                  — list published
 *   GET  /api/v1/courses/:id                              — course + lessons
 *   POST /api/v1/courses/:id/enroll                       — idempotent enroll
 *   GET  /api/v1/me/enrollments                           — list my enrollments
 *   POST /api/v1/me/enrollments/:enrollmentId/reset       — soft reset
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { courses, lessons, enrollments } from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';

const uuidParam = z.object({ id: z.string().uuid() });
const enrollmentParam = z.object({ enrollmentId: z.string().uuid() });

export async function registerEnrollmentRoutes(app: FastifyInstance): Promise<void> {
  // ---- Public catalog -------------------------------------------------
  app.get('/api/v1/courses', async (req) => {
    const q = (req.query as { track?: string; limit?: string }) ?? {};
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? 20)));
    const where = q.track ? eq(courses.track, q.track) : undefined;
    const rows = await db
      .select()
      .from(courses)
      .where(where ? and(eq(courses.status, 'published'), where) : eq(courses.status, 'published'))
      .orderBy(asc(courses.sortOrder))
      .limit(limit);
    return { courses: rows };
  });

  app.get('/api/v1/courses/:id', async (req, reply) => {
    const parsed = uuidParam.safeParse(req.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const [course] = await db.select().from(courses).where(eq(courses.id, parsed.data.id)).limit(1);
    if (!course || course.status !== 'published') {
      reply.code(404);
      return { error: 'course_not_found' };
    }
    const ls = await db
      .select({
        id: lessons.id,
        slug: lessons.slug,
        i18n_title: lessons.i18nTitle,
        position: lessons.position,
        estimated_minutes: lessons.estimatedMinutes,
      })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(asc(lessons.position));
    return { course, lessons: ls };
  });

  // ---- Enrollment lifecycle ------------------------------------------
  app.post('/api/v1/courses/:id/enroll', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = uuidParam.safeParse(req.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const courseId = parsed.data.id;
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course || course.status !== 'published') {
      reply.code(404);
      return { error: 'course_not_found' };
    }
    // Find first lesson to seed current_lesson_id.
    const [firstLesson] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.position))
      .limit(1);

    // Idempotency: if active enrollment exists, return it unchanged.
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId), eq(enrollments.status, 'active')))
      .limit(1);
    if (existing) {
      return { enrollment: existing, idempotent: true };
    }
    const [created] = await db
      .insert(enrollments)
      .values({
        userId: user.id,
        courseId,
        status: 'active',
        currentLessonId: firstLesson?.id ?? null,
      })
      .returning();
    return { enrollment: created, idempotent: false };
  });

  app.get('/api/v1/me/enrollments', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const rows = await db
      .select({
        id: enrollments.id,
        course_id: enrollments.courseId,
        status: enrollments.status,
        current_lesson_id: enrollments.currentLessonId,
        progress_percent: enrollments.progressPercent,
        last_active_at: enrollments.lastActiveAt,
        enrolled_at: enrollments.enrolledAt,
        completed_at: enrollments.completedAt,
        course_title: courses.i18nTitle,
        course_slug: courses.slug,
        course_track: courses.track,
        course_cover: courses.coverUrl,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, user.id))
      .orderBy(desc(enrollments.lastActiveAt));
    return { enrollments: rows };
  });

  app.post('/api/v1/me/enrollments/:enrollmentId/reset', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = enrollmentParam.safeParse(req.params);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_id' };
    }
    const [target] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, parsed.data.enrollmentId), eq(enrollments.userId, user.id)))
      .limit(1);
    if (!target) {
      reply.code(404);
      return { error: 'enrollment_not_found' };
    }
    if (target.status !== 'active') {
      reply.code(409);
      return { error: 'enrollment_not_active' };
    }
    const result = await db.transaction(async (tx) => {
      await tx
        .update(enrollments)
        .set({ status: 'reset', resetAt: new Date(), progressPercent: '0' })
        .where(eq(enrollments.id, target.id));
      // Wipe lesson_progress for the course's lessons (best-effort).
      const lessonIds = await tx
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.courseId, target.courseId));
      if (lessonIds.length > 0) {
        await tx.execute(
          sql`delete from zhiyu.lesson_progress where user_id = ${user.id}
              and lesson_id in (${sql.join(lessonIds.map((l) => sql`${l.id}::uuid`), sql`, `)})`,
        );
      }
      // Find first lesson to seed current_lesson_id of the new enrollment.
      const [firstLesson] = await tx
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.courseId, target.courseId))
        .orderBy(asc(lessons.position))
        .limit(1);
      const [created] = await tx
        .insert(enrollments)
        .values({
          userId: user.id,
          courseId: target.courseId,
          status: 'active',
          currentLessonId: firstLesson?.id ?? null,
        })
        .returning();
      return { previous: target, current: created };
    });
    return { ok: true, ...result };
  });
}
