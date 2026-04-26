import { describe, it, expect } from 'vitest';
import { rollStreak, xpForLevel, todayInTz } from '../src/learning/xp-algo.js';

describe('XP / level math', () => {
  it('xpForLevel: 100→1, 400→2, 900→3, 0→0', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(99)).toBe(0);
    expect(xpForLevel(100)).toBe(1);
    expect(xpForLevel(399)).toBe(1);
    expect(xpForLevel(400)).toBe(2);
    expect(xpForLevel(900)).toBe(3);
  });
});

describe('Streak rolling', () => {
  const base = { streak_current: 0, streak_max: 0, last_active_date: null, freeze_count: 0 };

  it('first ever activity sets streak=1', () => {
    const r = rollStreak(base, '2026-04-26');
    expect(r.streak_current).toBe(1);
    expect(r.is_new_day).toBe(true);
  });

  it('same-day call is idempotent (no delta)', () => {
    const r = rollStreak({ ...base, streak_current: 5, streak_max: 5, last_active_date: '2026-04-26' }, '2026-04-26');
    expect(r.streak_current).toBe(5);
    expect(r.is_new_day).toBe(false);
  });

  it('next-day continues streak', () => {
    const r = rollStreak({ ...base, streak_current: 4, streak_max: 4, last_active_date: '2026-04-25' }, '2026-04-26');
    expect(r.streak_current).toBe(5);
    expect(r.streak_max).toBe(5);
  });

  it('skip 1 day with freeze available consumes 1 freeze and keeps streak', () => {
    const r = rollStreak({ ...base, streak_current: 7, streak_max: 7, last_active_date: '2026-04-24', freeze_count: 1 }, '2026-04-26');
    expect(r.streak_current).toBe(8);
    expect(r.freeze_count).toBe(0);
    expect(r.consumed_freeze).toBe(true);
  });

  it('skip 1 day without freeze resets to 1', () => {
    const r = rollStreak({ ...base, streak_current: 9, streak_max: 9, last_active_date: '2026-04-24' }, '2026-04-26');
    expect(r.streak_current).toBe(1);
    expect(r.consumed_freeze).toBe(false);
  });

  it('skip 3 days always resets', () => {
    const r = rollStreak({ ...base, streak_current: 9, streak_max: 9, last_active_date: '2026-04-22', freeze_count: 5 }, '2026-04-26');
    expect(r.streak_current).toBe(1);
  });
});

describe('todayInTz', () => {
  it('returns YYYY-MM-DD', () => {
    expect(todayInTz('Asia/Shanghai')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
