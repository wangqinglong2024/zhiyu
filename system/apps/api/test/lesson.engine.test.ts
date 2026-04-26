import { describe, it, expect } from 'vitest';
import { evaluateStep, resolveStepType } from '../src/learning/lesson-engine.js';

describe('LessonEngine evaluateStep', () => {
  it('intro: seen=true → pass score=1', () => {
    const r = evaluateStep(0, 'intro', { seen: true });
    expect(r.passed).toBe(true);
    expect(r.next_step_index).toBe(1);
    expect(r.lesson_complete).toBe(false);
  });

  it('intro: seen=false → fail', () => {
    const r = evaluateStep(0, 'intro', {});
    expect(r.passed).toBe(false);
    expect(r.next_step_index).toBe(null);
  });

  it('word: 4/5 correct = 0.8 → pass at threshold', () => {
    const r = evaluateStep(1, 'word', {
      answers: [
        { question_id: 'q1', correct: true },
        { question_id: 'q2', correct: true },
        { question_id: 'q3', correct: true },
        { question_id: 'q4', correct: true },
        { question_id: 'q5', correct: false },
      ],
    });
    expect(r.score).toBe(0.8);
    expect(r.passed).toBe(true);
    expect(r.mistakes).toHaveLength(1);
    expect(r.resolved_mistake_question_ids).toEqual(['q1', 'q2', 'q3', 'q4']);
  });

  it('word: 3/5 correct = 0.6 → fail (below 0.8)', () => {
    const r = evaluateStep(1, 'word', {
      answers: [
        { question_id: 'q1', correct: true },
        { question_id: 'q2', correct: true },
        { question_id: 'q3', correct: true },
        { question_id: 'q4', correct: false },
        { question_id: 'q5', correct: false },
      ],
    });
    expect(r.passed).toBe(false);
  });

  it('quiz: 7/10 = 0.7 → pass and lesson_complete', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      question_id: `q${i}`,
      correct: i < 7,
    }));
    const r = evaluateStep(9, 'quiz', { answers });
    expect(r.passed).toBe(true);
    expect(r.lesson_complete).toBe(true);
    expect(r.next_step_index).toBe(null);
  });

  it('quiz: 6/10 = 0.6 → fail, no lesson complete', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      question_id: `q${i}`,
      correct: i < 6,
    }));
    const r = evaluateStep(9, 'quiz', { answers });
    expect(r.passed).toBe(false);
    expect(r.lesson_complete).toBe(false);
  });

  it('speak/write use confidence', () => {
    const ok = evaluateStep(5, 'speak', { confidence: 0.6 });
    expect(ok.passed).toBe(true);
    const bad = evaluateStep(7, 'write', { confidence: 0.2 });
    expect(bad.passed).toBe(false);
  });

  it('listen/read/practice thresholds (0.7)', () => {
    for (const t of ['listen', 'read', 'practice'] as const) {
      const ans = Array.from({ length: 10 }, (_, i) => ({ question_id: `q${i}`, correct: i < 7 }));
      const r = evaluateStep(2, t, { answers: ans });
      expect(r.passed).toBe(true);
    }
  });

  it('pinyin threshold (0.8)', () => {
    const ans = Array.from({ length: 5 }, (_, i) => ({ question_id: `q${i}`, correct: i < 4 }));
    const r = evaluateStep(3, 'pinyin', { answers: ans });
    expect(r.passed).toBe(true);
  });

  it('sentence threshold (0.75)', () => {
    const ans = Array.from({ length: 4 }, (_, i) => ({ question_id: `q${i}`, correct: i < 3 }));
    const r = evaluateStep(2, 'sentence', { answers: ans });
    expect(r.score).toBeCloseTo(0.75, 4);
    expect(r.passed).toBe(true);
  });

  it('resolveStepType honours custom lesson.steps[].type', () => {
    expect(resolveStepType([{ type: 'quiz' }, { type: 'word' }], 0)).toBe('quiz');
    expect(resolveStepType(null, 0)).toBe('intro');
    expect(resolveStepType(null, 9)).toBe('quiz');
  });
});
