/**
 * E07 ZY-07-05 — Progression read endpoints + manual award (debug only).
 *
 * Routes:
 *   GET  /api/v1/me/progression
 *   GET  /api/v1/me/progression/log?limit=
 *   POST /api/v1/me/progression/checkin   — daily streak ping (+5 XP)
 */
import type { FastifyInstance } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import { userProgression, xpLog } from '@zhiyu/db';
import { db } from '../../db.js';
import { requireUser } from '../../auth-mw.js';
import { awardXp } from '../../learning/progression-svc.js';
import { XP_AMOUNTS, xpForLevel } from '../../learning/xp-algo.js';

export async function registerProgressionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/me/progression', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const [row] = await db
      .select()
      .from(userProgression)
      .where(eq(userProgression.userId, user.id))
      .limit(1);
    const xp = Number(row?.xp ?? 0);
    const level = row?.level ?? xpForLevel(xp);
    const nextLevelXp = ((level + 1) ** 2) * 100;
    const currentLevelXp = (level ** 2) * 100;
    const progress_to_next =
      nextLevelXp === currentLevelXp ? 1 : (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    return {
      progression: row ?? {
        userId: user.id,
        xp: 0,
        level: 0,
        streakCurrent: 0,
        streakMax: 0,
        lastActiveDate: null,
        freezeCount: 0,
      },
      xp_to_next: nextLevelXp - xp,
      next_level_at: nextLevelXp,
      progress_to_next: Math.max(0, Math.min(1, progress_to_next)),
      double_xp: /^(true|1|yes)$/i.test(process.env.XP_DOUBLE ?? ''),
    };
  });

  app.get('/api/v1/me/progression/log', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const q = (req.query as { limit?: string }) ?? {};
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 30)));
    const rows = await db
      .select()
      .from(xpLog)
      .where(eq(xpLog.userId, user.id))
      .orderBy(desc(xpLog.createdAt))
      .limit(limit);
    return { entries: rows };
  });

  app.post('/api/v1/me/progression/checkin', async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    let result: Awaited<ReturnType<typeof awardXp>> | undefined;
    await db.transaction(async (tx) => {
      result = await awardXp(tx, user.id, XP_AMOUNTS.dailyStreak, 'dailyStreak', { kind: 'checkin' });
    });
    return { ok: true, ...(result ?? {}) };
  });
}
