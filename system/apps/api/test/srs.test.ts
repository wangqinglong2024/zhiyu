import { describe, it, expect } from 'vitest';
import { applySm2, SRS_DEFAULTS } from '../src/learning/srs-algo.js';

describe('SRS SM-2 simplified', () => {
  it('first review good → 1 day, reps=1, ease unchanged', () => {
    const u = applySm2(SRS_DEFAULTS, 3);
    expect(u.interval_days).toBe(1);
    expect(u.reps).toBe(1);
    expect(u.ease).toBeCloseTo(2.5, 2);
    expect(u.next_due_offset_days).toBe(1);
  });

  it('second review good → 3 days, reps=2', () => {
    const u = applySm2({ interval_days: 1, ease: 2.5, reps: 1, lapses: 0 }, 3);
    expect(u.interval_days).toBe(3);
    expect(u.reps).toBe(2);
  });

  it('third+ review good → multiplies by ease (~7d)', () => {
    const u = applySm2({ interval_days: 3, ease: 2.5, reps: 2, lapses: 0 }, 3);
    expect(u.interval_days).toBe(8); // round(3*2.5)
  });

  it('again → reset interval=1, reps=0, lapses+1, ease drops', () => {
    const u = applySm2({ interval_days: 30, ease: 2.5, reps: 5, lapses: 1 }, 1);
    expect(u.interval_days).toBe(1);
    expect(u.reps).toBe(0);
    expect(u.lapses).toBe(2);
    expect(u.ease).toBeCloseTo(2.3, 2);
  });

  it('hard → x1.2, ease -0.15', () => {
    const u = applySm2({ interval_days: 10, ease: 2.5, reps: 3, lapses: 0 }, 2);
    expect(u.interval_days).toBe(12);
    expect(u.ease).toBeCloseTo(2.35, 2);
  });

  it('easy → 1.3x of good baseline, ease +0.15', () => {
    const u = applySm2({ interval_days: 7, ease: 2.5, reps: 3, lapses: 0 }, 4);
    // base = round(7*2.5)=18; *1.3 = 23.4 → 23
    expect(u.interval_days).toBe(23);
    expect(u.ease).toBeCloseTo(2.65, 2);
  });

  it('ease floor 1.30 holds against repeated agains', () => {
    let s = SRS_DEFAULTS;
    for (let i = 0; i < 20; i += 1) s = applySm2(s, 1);
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('ease ceiling 2.80 holds against repeated easies', () => {
    let s = SRS_DEFAULTS;
    for (let i = 0; i < 20; i += 1) s = applySm2(s, 4);
    expect(s.ease).toBeLessThanOrEqual(2.8);
  });
});
