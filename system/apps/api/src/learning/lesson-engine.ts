/**
 * E07 ZY-07-02 — LessonEngine 10-step state machine.
 *
 * Steps (index 0..9) and their pass criteria:
 *   0 intro    — auto pass on view (server marks done when client posts {seen:true})
 *   1 word     — multiple-choice, ≥ 80% correct
 *   2 sentence — fill-in-blank, ≥ 75%
 *   3 pinyin   — match pinyin → hanzi, ≥ 80%
 *   4 listen   — choose meaning, ≥ 70%
 *   5 speak    — read-aloud (server stub: client posts confidence)
 *   6 read     — comprehension Q, ≥ 70%
 *   7 write    — character drawing (client posts strokes ok)
 *   8 practice — mixed drill, ≥ 70%
 *   9 quiz     — final test, ≥ 70% to unlock next lesson
 *
 * Wrong answers funnel into mistake_log; correct attempts on previously
 * mistaken question_id resolve the mistake.
 */
import { z } from 'zod';

export const STEP_TYPES = [
  'intro',
  'word',
  'sentence',
  'pinyin',
  'listen',
  'speak',
  'read',
  'write',
  'practice',
  'quiz',
] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const PASS_THRESHOLDS: Record<StepType, number> = {
  intro: 0,
  word: 0.8,
  sentence: 0.75,
  pinyin: 0.8,
  listen: 0.7,
  speak: 0.5, // self-reported confidence floor
  read: 0.7,
  write: 0.7,
  practice: 0.7,
  quiz: 0.7,
};

// Wire payload posted by the client for an answer.
export const answerPayloadSchema = z.object({
  // For intro/speak/write where there is no graded answer.
  seen: z.boolean().optional(),
  // For graded steps: array of question outcomes.
  answers: z
    .array(
      z.object({
        question_id: z.string().min(1).max(120),
        correct: z.boolean(),
        // Optional: client supplies the prompt + chosen value so we can store
        // a useful payload for the mistake log.
        prompt: z.string().max(500).optional(),
        chosen: z.string().max(500).optional(),
        expected: z.string().max(500).optional(),
      }),
    )
    .max(50)
    .optional(),
  // Free-form telemetry.
  duration_ms: z.number().int().min(0).max(3_600_000).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type AnswerPayload = z.infer<typeof answerPayloadSchema>;

export interface AdvanceResult {
  step_index: number;
  step_type: StepType;
  score: number;
  passed: boolean;
  next_step_index: number | null; // null = lesson complete
  lesson_complete: boolean;
  mistakes: Array<{
    question_id: string;
    payload: Record<string, unknown>;
  }>;
  resolved_mistake_question_ids: string[];
}

/** Compute step result (without persistence). Persistence done by route handler. */
export function evaluateStep(
  stepIndex: number,
  stepType: StepType,
  payload: AnswerPayload,
): AdvanceResult {
  const threshold = PASS_THRESHOLDS[stepType];
  let score = 0;
  let passed = false;
  const mistakes: AdvanceResult['mistakes'] = [];
  const resolved: string[] = [];

  if (stepType === 'intro') {
    score = payload.seen ? 1 : 0;
    passed = score === 1;
  } else if (stepType === 'speak' || stepType === 'write') {
    // Client-reported confidence in [0,1].
    score = clamp01(payload.confidence ?? (payload.seen ? 1 : 0));
    passed = score >= threshold;
  } else {
    const ans = payload.answers ?? [];
    if (ans.length === 0) {
      score = 0;
      passed = false;
    } else {
      const correctCount = ans.filter((a) => a.correct).length;
      score = correctCount / ans.length;
      passed = score >= threshold;
      for (const a of ans) {
        if (!a.correct) {
          mistakes.push({
            question_id: a.question_id,
            payload: {
              prompt: a.prompt,
              chosen: a.chosen,
              expected: a.expected,
              step_type: stepType,
              step_index: stepIndex,
            },
          });
        } else {
          resolved.push(a.question_id);
        }
      }
    }
  }

  const isLast = stepIndex >= 9;
  return {
    step_index: stepIndex,
    step_type: stepType,
    score: roundScore(score),
    passed,
    next_step_index: passed && !isLast ? stepIndex + 1 : null,
    lesson_complete: passed && isLast,
    mistakes,
    resolved_mistake_question_ids: resolved,
  };
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const roundScore = (n: number): number => Math.round(n * 10000) / 10000;

/** Resolve step type for an index using the lesson.steps jsonb. Falls back to default order. */
export function resolveStepType(
  stepsJson: unknown,
  stepIndex: number,
): StepType {
  if (Array.isArray(stepsJson)) {
    const found = stepsJson[stepIndex] as { type?: string } | undefined;
    if (found?.type && (STEP_TYPES as readonly string[]).includes(found.type)) {
      return found.type as StepType;
    }
  }
  return STEP_TYPES[stepIndex] ?? 'practice';
}
