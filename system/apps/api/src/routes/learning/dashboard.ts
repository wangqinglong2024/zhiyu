/**
 * E07 ZY-07-07 — Personal dashboard aggregation endpoint.
 *
 * Routes:
 *   GET  /api/v1/me/dashboard               — 6 cards in one shot, ≤300ms target
 *   PATCH /api/v1/me/dashboard/layout       — reorder cards
 *
 * Uses the SQL helper RPC `zhiyu.dashboard_snapshot(user)` plus a few targeted
 * selects so we don't fan out to many round-trips.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import {
  courses,
  dashboardLayout,
  enrollments,
  lessons,
  userProgression,
} from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';
import { xpForLevel } from '../../learning/xp-algo.js';

const layoutPatch = z.object({
  card_order: z.array(z.enum(['xp', 'streak', 'today_srs', 'continue', 'recommend', 'achievements'])).min(1).max(12),
});

const DEFAULT_ORDER = ['xp', 'streak', 'today_srs', 'continue', 'recommend', 'achievements'];

interface SnapshotRow {
  progression: { xp: string | number; level: number; streak_current: number; streak_max: number; freeze_count: number } | null;
  today_srs: number | string;
  active_enrollments: number | string;
  completed_lessons: number | string;
  mistakes_open: number | string;
  wordbook_size: number | string;
}

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/me/dashboard', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    // 1) Snapshot via SQL function (single round-trip, returns jsonb).
    const snapshotRow = await db.execute<{ dashboard_snapshot: SnapshotRow }>(
      sql`select zhiyu.dashboard_snapshot(${user.id}::uuid) as dashboard_snapshot`,
    );
    const snapshot: SnapshotRow = (snapshotRow as unknown as Array<{ dashboard_snapshot: SnapshotRow }>)[0]
      ?.dashboard_snapshot ?? {
      progression: null,
      today_srs: 0,
      active_enrollments: 0,
      completed_lessons: 0,
      mistakes_open: 0,
      wordbook_size: 0,
    };

    // 2) "Continue learning" — most recent active enrollment + lesson title.
    const [continueRow] = await db
      .select({
        enrollment_id: enrollments.id,
        course_id: enrollments.courseId,
        course_title: courses.i18nTitle,
        course_slug: courses.slug,
        progress_percent: enrollments.progressPercent,
        current_lesson_id: enrollments.currentLessonId,
        last_active_at: enrollments.lastActiveAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.status, 'active')))
      .orderBy(desc(enrollments.lastActiveAt))
      .limit(1);

    let continueLessonTitle: unknown = null;
    if (continueRow?.current_lesson_id) {
      const [lessonRow] = await db
        .select({ title: lessons.i18nTitle })
        .from(lessons)
        .where(eq(lessons.id, continueRow.current_lesson_id))
        .limit(1);
      continueLessonTitle = lessonRow?.title ?? null;
    }

    // 3) Recommend — top 3 published courses matching profile hsk_self_level
    //    (stub: simply newest 3). Ranking can be improved by E08.
    const recommend = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.i18nTitle,
        cover: courses.coverUrl,
        track: courses.track,
        hsk_level: courses.hskLevel,
      })
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(asc(courses.sortOrder))
      .limit(6);

    // 4) Layout (with default fallback).
    const [layoutRow] = await db
      .select()
      .from(dashboardLayout)
      .where(eq(dashboardLayout.userId, user.id))
      .limit(1);

    // 5) Progression numbers + level math.
    const xp = Number(snapshot.progression?.xp ?? 0);
    const level = snapshot.progression?.level ?? xpForLevel(xp);
    const nextLevelXp = ((level + 1) ** 2) * 100;
    const currentLevelXp = level ** 2 * 100;
    const progress_to_next =
      nextLevelXp === currentLevelXp ? 1 : Math.max(0, Math.min(1, (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)));

    return {
      cards: {
        xp: {
          xp,
          level,
          progress_to_next,
          xp_to_next: nextLevelXp - xp,
          double_xp: /^(true|1|yes)$/i.test(process.env.XP_DOUBLE ?? ''),
        },
        streak: {
          current: snapshot.progression?.streak_current ?? 0,
          max: snapshot.progression?.streak_max ?? 0,
          freeze_count: snapshot.progression?.freeze_count ?? 0,
        },
        today_srs: {
          due: Number(snapshot.today_srs ?? 0),
          mistakes_open: Number(snapshot.mistakes_open ?? 0),
          wordbook_size: Number(snapshot.wordbook_size ?? 0),
        },
        continue: continueRow
          ? {
              enrollment_id: continueRow.enrollment_id,
              course_id: continueRow.course_id,
              course_slug: continueRow.course_slug,
              course_title: continueRow.course_title,
              progress_percent: Number(continueRow.progress_percent ?? 0),
              current_lesson_id: continueRow.current_lesson_id,
              current_lesson_title: continueLessonTitle,
              last_active_at: continueRow.last_active_at,
            }
          : null,
        recommend: { items: recommend },
        achievements: {
          completed_lessons: Number(snapshot.completed_lessons ?? 0),
          active_enrollments: Number(snapshot.active_enrollments ?? 0),
          // Compact list of badges based on counters.
          badges: deriveBadges({
            xp,
            level,
            streak: snapshot.progression?.streak_current ?? 0,
            completed_lessons: Number(snapshot.completed_lessons ?? 0),
          }),
        },
      },
      layout: { card_order: layoutRow?.cardOrder ?? DEFAULT_ORDER },
    };
  });

  app.patch('/api/v1/me/dashboard/layout', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = layoutPatch.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid_payload', issues: parsed.error.issues };
    }
    await db
      .insert(dashboardLayout)
      .values({ userId: user.id, cardOrder: parsed.data.card_order })
      .onConflictDoUpdate({
        target: dashboardLayout.userId,
        set: { cardOrder: parsed.data.card_order, updatedAt: new Date() },
      });
    return { ok: true, card_order: parsed.data.card_order };
  });
}

function deriveBadges(s: { xp: number; level: number; streak: number; completed_lessons: number }): string[] {
  const out: string[] = [];
  if (s.level >= 1) out.push('first_level');
  if (s.level >= 5) out.push('rising_learner');
  if (s.level >= 10) out.push('veteran');
  if (s.streak >= 3) out.push('streak_3');
  if (s.streak >= 7) out.push('streak_7');
  if (s.streak >= 30) out.push('streak_30');
  if (s.completed_lessons >= 1) out.push('first_lesson');
  if (s.completed_lessons >= 10) out.push('lesson_master');
  return out;
}
