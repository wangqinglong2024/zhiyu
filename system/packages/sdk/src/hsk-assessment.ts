/**
 * E07 — HSK self-assessment scoring algorithm.
 *
 * Strategy: per-level accuracy. For each HSK level L (1..6) compute the
 * percentage of correctly answered questions whose tag is ≤ L. The
 * recommended_level is the highest L where accuracy ≥ THRESHOLD (default
 * 0.6). When user answers nothing correctly the recommendation is 0.
 *
 * Returns the per-level breakdown so the FE can show progress + the API can
 * persist meta in `hsk_results.per_level`.
 */
import type { HskQuestion } from './data/hsk-assessment.js';
import { HSK_QUESTIONS } from './data/hsk-assessment.js';

export const HSK_PASS_THRESHOLD = 0.6;

export interface HskAnswer {
  question_id: string;
  selected: number; // -1 means skipped
}

export interface HskBreakdown {
  asked: number;
  correct: number;
  accuracy: number;
}

export interface HskScoreResult {
  total_questions: number;
  correct_count: number;
  per_level: Record<string, HskBreakdown>;
  recommended_level: number;
}

export function getHskQuestions(): readonly HskQuestion[] {
  return HSK_QUESTIONS;
}

export function scoreHskAssessment(
  answers: ReadonlyArray<HskAnswer>,
  bank: ReadonlyArray<HskQuestion> = HSK_QUESTIONS,
): HskScoreResult {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const counters: Record<string, { asked: number; correct: number }> = {};
  let total = 0;
  let correct = 0;
  for (const a of answers) {
    const q = byId.get(a.question_id);
    if (!q) continue; // ignore unknown ids — defensive
    total += 1;
    const lvl = String(q.level);
    counters[lvl] ??= { asked: 0, correct: 0 };
    counters[lvl]!.asked += 1;
    if (a.selected === q.answer) {
      counters[lvl]!.correct += 1;
      correct += 1;
    }
  }

  const per_level: Record<string, HskBreakdown> = {};
  for (const lvl of ['1', '2', '3', '4', '5', '6']) {
    const c = counters[lvl] ?? { asked: 0, correct: 0 };
    per_level[lvl] = {
      asked: c.asked,
      correct: c.correct,
      accuracy: c.asked === 0 ? 0 : c.correct / c.asked,
    };
  }

  // Cumulative pass: pass level L means accuracy(<=L) >= threshold.
  let recommended = 0;
  let cumAsked = 0;
  let cumCorrect = 0;
  for (const lvl of [1, 2, 3, 4, 5, 6] as const) {
    const c = counters[String(lvl)] ?? { asked: 0, correct: 0 };
    cumAsked += c.asked;
    cumCorrect += c.correct;
    if (cumAsked === 0) continue;
    if (cumCorrect / cumAsked >= HSK_PASS_THRESHOLD) {
      recommended = lvl;
    } else {
      break;
    }
  }

  return {
    total_questions: total,
    correct_count: correct,
    per_level,
    recommended_level: recommended,
  };
}
