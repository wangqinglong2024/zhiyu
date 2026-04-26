import { describe, it, expect } from 'vitest';
import { scoreHskAssessment, getHskQuestions, HSK_PASS_THRESHOLD } from '@zhiyu/sdk';

const bank = getHskQuestions();
const allWrong = bank.map((q) => ({ question_id: q.id, selected: -1 }));
const allCorrect = bank.map((q) => ({ question_id: q.id, selected: q.answer }));

describe('HSK assessment scoring', () => {
  it('threshold default = 0.6', () => {
    expect(HSK_PASS_THRESHOLD).toBe(0.6);
  });

  it('all wrong → recommended_level=0', () => {
    const r = scoreHskAssessment(allWrong);
    expect(r.recommended_level).toBe(0);
    expect(r.correct_count).toBe(0);
    expect(r.total_questions).toBe(bank.length);
  });

  it('all correct → recommended_level=6', () => {
    const r = scoreHskAssessment(allCorrect);
    expect(r.recommended_level).toBe(6);
    expect(r.correct_count).toBe(bank.length);
  });

  it('only HSK1+2 correct → ≥2 (cumulative)', () => {
    const ans = bank.map((q) => ({ question_id: q.id, selected: q.level <= 2 ? q.answer : -1 }));
    const r = scoreHskAssessment(ans);
    expect(r.recommended_level).toBeGreaterThanOrEqual(1);
    // cumulative L=2: asked=10 correct=10 acc=1
    // cumulative L=3: asked=15 correct=10 acc=0.66 → still pass
    // cumulative L=4: asked=20 correct=10 acc=0.5 → fail → recommended=3
    expect(r.recommended_level).toBe(3);
  });

  it('half correct evenly → small cumulative pass', () => {
    const ans = bank.map((q, i) => ({
      question_id: q.id,
      selected: i % 2 === 0 ? q.answer : -1,
    }));
    const r = scoreHskAssessment(ans);
    // Even-index pattern lands at the threshold for low levels then dips below.
    expect(r.recommended_level).toBeGreaterThanOrEqual(0);
    expect(r.recommended_level).toBeLessThanOrEqual(2);
    expect(r.correct_count).toBe(15);
  });

  it('per_level breakdown sums to total', () => {
    const r = scoreHskAssessment(allCorrect);
    const sum = Object.values(r.per_level).reduce((a, b) => a + b.asked, 0);
    expect(sum).toBe(bank.length);
  });

  it('unknown question id is ignored', () => {
    const r = scoreHskAssessment([{ question_id: 'doesnotexist', selected: 0 }]);
    expect(r.total_questions).toBe(0);
    expect(r.recommended_level).toBe(0);
  });
});
