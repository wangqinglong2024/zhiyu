/**
 * E07 ZY-07-03 — SM-2 simplified spaced repetition.
 *
 * Grades:
 *   1 = again (forgot)
 *   2 = hard
 *   3 = good
 *   4 = easy
 *
 * Update rules (simplified SM-2):
 *   - again: interval = 1 day, reps = 0, ease -= 0.20 (floor 1.30), lapses += 1
 *   - hard:  interval = max(1, round(prevInterval * 1.2)), ease -= 0.15, reps += 1
 *   - good:  reps == 0 → 1d; reps == 1 → 3d; else → round(prev * ease), reps += 1
 *   - easy:  same as good but multiply by 1.3, ease += 0.15, reps += 1
 *
 * The next due date is `today + interval_days` (Asia/Shanghai date, computed
 * by the caller via the Postgres `current_date` of the request transaction).
 */
export type SrsGrade = 1 | 2 | 3 | 4;

export interface SrsState {
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
}

export interface SrsUpdate extends SrsState {
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
  next_due_offset_days: number;
  grade: SrsGrade;
}

const EASE_MIN = 1.3;
const EASE_MAX = 2.8;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const round1 = (n: number): number => Math.round(n * 100) / 100;

export function applySm2(prev: SrsState, grade: SrsGrade): SrsUpdate {
  const reps = Math.max(0, prev.reps);
  const ease = clamp(prev.ease, EASE_MIN, EASE_MAX);
  const lapses = Math.max(0, prev.lapses);
  const prevInterval = Math.max(0, prev.interval_days);

  if (grade === 1) {
    const next: SrsUpdate = {
      interval_days: 1,
      ease: clamp(ease - 0.2, EASE_MIN, EASE_MAX),
      reps: 0,
      lapses: lapses + 1,
      next_due_offset_days: 1,
      grade,
    };
    return roundAll(next);
  }

  if (grade === 2) {
    const newInterval = Math.max(1, Math.round(Math.max(prevInterval, 1) * 1.2));
    const next: SrsUpdate = {
      interval_days: newInterval,
      ease: clamp(ease - 0.15, EASE_MIN, EASE_MAX),
      reps: reps + 1,
      lapses,
      next_due_offset_days: newInterval,
      grade,
    };
    return roundAll(next);
  }

  if (grade === 3) {
    let newInterval: number;
    if (reps === 0) newInterval = 1;
    else if (reps === 1) newInterval = 3;
    else newInterval = Math.max(1, Math.round(prevInterval * ease));
    const next: SrsUpdate = {
      interval_days: newInterval,
      ease,
      reps: reps + 1,
      lapses,
      next_due_offset_days: newInterval,
      grade,
    };
    return roundAll(next);
  }

  // grade === 4 (easy)
  let baseInterval: number;
  if (reps === 0) baseInterval = 1;
  else if (reps === 1) baseInterval = 3;
  else baseInterval = Math.max(1, Math.round(prevInterval * ease));
  const newInterval = Math.max(1, Math.round(baseInterval * 1.3));
  const next: SrsUpdate = {
    interval_days: newInterval,
    ease: clamp(ease + 0.15, EASE_MIN, EASE_MAX),
    reps: reps + 1,
    lapses,
    next_due_offset_days: newInterval,
    grade: 4,
  };
  return roundAll(next);
}

function roundAll(u: SrsUpdate): SrsUpdate {
  return {
    ...u,
    interval_days: round1(u.interval_days),
    ease: round1(u.ease),
  };
}

export const SRS_DEFAULTS: SrsState = { interval_days: 0, ease: 2.5, reps: 0, lapses: 0 };
