/**
 * E07 ZY-07-05 — XP / level / streak helpers.
 *
 * - level = floor(sqrt(xp / 100))  (so 100xp = 1, 400xp = 2, 900xp = 3 ...)
 * - streak rolls per Asia/Shanghai date.
 *   - same day → no change
 *   - next day → streak += 1
 *   - skipped 1 day && freeze_count > 0 → consume freeze, keep streak
 *   - else → reset to 1
 * - freeze grant: at most 1 per calendar month (UTC month)
 * - XP_DOUBLE flag from env multiplies awarded delta x2
 */
export const XP_AMOUNTS = {
  lessonStepDone: 5,
  lessonComplete: 30,
  srsReview: 2,
  articleRead: 8,
  dailyStreak: 5,
} as const;

export type XpSource = keyof typeof XP_AMOUNTS | 'manual' | 'event';

export const xpForLevel = (xp: number): number => {
  if (!Number.isFinite(xp) || xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / 100));
};

export interface StreakState {
  streak_current: number;
  streak_max: number;
  last_active_date: string | null; // YYYY-MM-DD
  freeze_count: number;
}

export interface StreakResult extends StreakState {
  delta_streak: number;
  consumed_freeze: boolean;
  is_new_day: boolean;
}

/** Compute next streak state for the given activity date. */
export function rollStreak(prev: StreakState, today: string): StreakResult {
  if (!prev.last_active_date) {
    return {
      streak_current: 1,
      streak_max: Math.max(prev.streak_max, 1),
      last_active_date: today,
      freeze_count: prev.freeze_count,
      delta_streak: 1,
      consumed_freeze: false,
      is_new_day: true,
    };
  }
  if (prev.last_active_date === today) {
    return {
      ...prev,
      delta_streak: 0,
      consumed_freeze: false,
      is_new_day: false,
    };
  }
  const diff = daysBetween(prev.last_active_date, today);
  if (diff === 1) {
    const next = prev.streak_current + 1;
    return {
      streak_current: next,
      streak_max: Math.max(prev.streak_max, next),
      last_active_date: today,
      freeze_count: prev.freeze_count,
      delta_streak: 1,
      consumed_freeze: false,
      is_new_day: true,
    };
  }
  if (diff === 2 && prev.freeze_count > 0) {
    const next = prev.streak_current + 1;
    return {
      streak_current: next,
      streak_max: Math.max(prev.streak_max, next),
      last_active_date: today,
      freeze_count: prev.freeze_count - 1,
      delta_streak: 1,
      consumed_freeze: true,
      is_new_day: true,
    };
  }
  // Reset
  return {
    streak_current: 1,
    streak_max: Math.max(prev.streak_max, 1),
    last_active_date: today,
    freeze_count: prev.freeze_count,
    delta_streak: 1 - prev.streak_current,
    consumed_freeze: false,
    is_new_day: true,
  };
}

/** YYYY-MM-DD diff (positive when b is after a). */
function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return Number.POSITIVE_INFINITY;
  return Math.round((db - da) / 86400_000);
}

export const todayInTz = (tz = 'Asia/Shanghai', now: Date = new Date()): string => {
  // Format YYYY-MM-DD in given IANA TZ.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now);
};

export const monthKey = (d: Date = new Date()): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};
