/**
 * E07 ZY-07-05 — Progression service: awardXp + streak roll.
 *
 * Centralised so any route can call `awardXp(tx, userId, amount, source)`.
 * Honours XP_DOUBLE feature flag (env: XP_DOUBLE=true) and updates streak +
 * monthly freeze grant when the call counts as a new day of activity.
 */
import { eq } from 'drizzle-orm';
import { userProgression, xpLog } from '@zhiyu/db';
import { db } from '../db.js';
import { monthKey, rollStreak, todayInTz, xpForLevel, type XpSource } from './xp-algo.js';

// Drizzle transaction objects are structurally compatible with the top-level
// `db`; using its type lets us pass either freely.
type Tx = typeof db;

const isDoubleXp = (): boolean => /^(true|1|yes)$/i.test(process.env.XP_DOUBLE ?? '');

export interface AwardXpResult {
  awarded: number;
  multiplier: number;
  level_before: number;
  level_after: number;
  level_up: boolean;
  streak_current: number;
  streak_max: number;
  consumed_freeze: boolean;
  freeze_granted: boolean;
  is_new_day: boolean;
}

export async function awardXp(
  tx: Tx,
  userId: string,
  amount: number,
  source: XpSource,
  meta: Record<string, unknown> = {},
): Promise<AwardXpResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return zeroResult();
  }
  const multiplier = isDoubleXp() ? 2 : 1;
  const delta = Math.round(amount * multiplier);

  // Upsert progression row first so we always have a baseline.
  await tx
    .insert(userProgression)
    .values({ userId, xp: 0, level: 0 })
    .onConflictDoNothing();

  const [prev] = await tx
    .select()
    .from(userProgression)
    .where(eq(userProgression.userId, userId))
    .limit(1);
  const prevSafe = prev ?? {
    userId,
    xp: 0,
    level: 0,
    streakCurrent: 0,
    streakMax: 0,
    lastActiveDate: null,
    freezeCount: 0,
    freezeGrantedMonth: null,
    updatedAt: new Date(),
  };

  const newXp = Number(prevSafe.xp) + delta;
  const levelBefore = prevSafe.level;
  const levelAfter = xpForLevel(newXp);
  const today = todayInTz('Asia/Shanghai');
  const streak = rollStreak(
    {
      streak_current: prevSafe.streakCurrent,
      streak_max: prevSafe.streakMax,
      last_active_date: prevSafe.lastActiveDate ? formatDate(prevSafe.lastActiveDate) : null,
      freeze_count: prevSafe.freezeCount,
    },
    today,
  );

  // Monthly freeze grant: 1 free freeze each new calendar month, max 3 stored.
  const month = monthKey();
  let freezeGranted = false;
  let nextFreeze = streak.freeze_count;
  if (prevSafe.freezeGrantedMonth !== month && nextFreeze < 3) {
    nextFreeze += 1;
    freezeGranted = true;
  }

  await tx
    .update(userProgression)
    .set({
      xp: newXp,
      level: levelAfter,
      streakCurrent: streak.streak_current,
      streakMax: streak.streak_max,
      lastActiveDate: today as unknown as string,
      freezeCount: nextFreeze,
      freezeGrantedMonth: month,
      updatedAt: new Date(),
    })
    .where(eq(userProgression.userId, userId));

  await tx.insert(xpLog).values({
    userId,
    delta,
    source,
    meta: { ...meta, multiplier },
  });

  return {
    awarded: delta,
    multiplier,
    level_before: levelBefore,
    level_after: levelAfter,
    level_up: levelAfter > levelBefore,
    streak_current: streak.streak_current,
    streak_max: streak.streak_max,
    consumed_freeze: streak.consumed_freeze,
    freeze_granted: freezeGranted,
    is_new_day: streak.is_new_day,
  };
}

function formatDate(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function zeroResult(): AwardXpResult {
  return {
    awarded: 0,
    multiplier: 1,
    level_before: 0,
    level_after: 0,
    level_up: false,
    streak_current: 0,
    streak_max: 0,
    consumed_freeze: false,
    freeze_granted: false,
    is_new_day: false,
  };
}
