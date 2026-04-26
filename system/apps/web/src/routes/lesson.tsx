import { useEffect, useMemo, useState, type JSX } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button, Card, Spinner } from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';
import {
  learning,
  type AdvanceResult,
  type LessonDetail,
  type LessonStep,
} from '../lib/api.js';

function pickI18n(map: Record<string, string> | undefined, lang: string): string {
  if (!map) return '';
  return map[lang] ?? map['en'] ?? Object.values(map)[0] ?? '';
}

interface SyntheticQuestion {
  question_id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

function buildQuestions(step: LessonStep | undefined, stepIdx: number): SyntheticQuestion[] {
  const declared = (step?.data?.questions as SyntheticQuestion[] | undefined) ?? null;
  if (declared && Array.isArray(declared) && declared.length > 0) return declared;
  // Auto-generate 5 placeholder questions so the page is usable without
  // seeded content.
  return Array.from({ length: 5 }, (_, i) => ({
    question_id: `s${stepIdx}-q${i + 1}`,
    prompt: `Step ${stepIdx + 1} · Question ${i + 1}`,
    options: ['你好 (correct)', '再见', '谢谢', '对不起'],
    correctIndex: 0,
  }));
}

/**
 * Builds a payload for the /answer endpoint that the LessonEngine accepts.
 * - intro              → { seen: true }
 * - speak / write      → { confidence }
 * - everything else    → { answers: [{ question_id, correct }] }
 */
function buildPayload(stepType: string, selections: Record<string, number>, questions: SyntheticQuestion[]): Record<string, unknown> {
  if (stepType === 'intro') return { seen: true };
  if (stepType === 'speak' || stepType === 'write') {
    // Use selection-as-self-rating: average of "I selected the right one" booleans.
    const ok = questions.filter((q) => selections[q.question_id] === q.correctIndex).length;
    const confidence = questions.length > 0 ? ok / questions.length : 0.8;
    return { confidence };
  }
  return {
    answers: questions.map((q) => ({
      question_id: q.question_id,
      correct: selections[q.question_id] === q.correctIndex,
    })),
  };
}

export function LessonPage(): JSX.Element {
  const { lessonId } = useParams({ strict: false }) as { lessonId: string };
  const navigate = useNavigate();
  const { t: _t, i18n } = useT('common');
  const lang = i18n.language ?? 'en';

  const [data, setData] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AdvanceResult | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const d = await learning.lesson(lessonId);
      setData(d);
      // Resume at first not-yet-passed step.
      const passedSet = new Set(d.progress.filter((p) => p.passed).map((p) => p.step_index));
      let next = 0;
      for (let i = 0; i < d.lesson.steps.length; i += 1) {
        if (!passedSet.has(i)) {
          next = i;
          break;
        }
        if (i === d.lesson.steps.length - 1) next = i;
      }
      setStepIdx(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    setSelections({});
    setLastResult(null);
  }, [lessonId]);

  const currentStep = data?.lesson.steps[stepIdx];
  const stepType = currentStep?.type ?? 'intro';
  const questions = useMemo(() => buildQuestions(currentStep, stepIdx), [currentStep, stepIdx]);

  async function handleSubmit(): Promise<void> {
    if (!data) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildPayload(stepType, selections, questions);
      const res = await learning.answerStep(lessonId, stepIdx, payload);
      setLastResult(res);
      if (res.passed && !res.lesson_complete && res.next_step_index !== null) {
        setStepIdx(res.next_step_index);
        setSelections({});
      }
      if (res.lesson_complete) {
        // refresh to reflect completion in progress list.
        await load();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickPass(): void {
    // Helper that fills selections so that all questions are correct, useful
    // for tests / demos.
    const next: Record<string, number> = {};
    for (const q of questions) next[q.question_id] = q.correctIndex;
    setSelections(next);
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center justify-center min-h-[40vh]" data-testid="lesson-loading">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="pt-6" data-testid="lesson-error">
        <Card>
          <p className="text-red-600">{error}</p>
          <Button className="mt-3" onClick={() => void load()}>
            重试
          </Button>
        </Card>
      </div>
    );
  }
  if (!data || !currentStep) {
    return (
      <div className="pt-6" data-testid="lesson-empty">
        <Card>课时为空。</Card>
      </div>
    );
  }

  const total = data.lesson.steps.length;
  const passedCount = data.progress.filter((p) => p.passed).length;
  const lessonTitle = pickI18n(data.lesson.i18n_title, lang) || data.lesson.slug;

  return (
    <div className="pt-2 max-w-3xl" data-testid="lesson-page">
      <header className="mb-4">
        <button
          onClick={() => navigate({ to: '/learn' })}
          className="text-sm text-text-secondary hover:underline"
          data-testid="lesson-back"
        >
          ← 返回课程
        </button>
        <h1 className="mt-1 text-h1">{lessonTitle}</h1>
        <div className="mt-3 h-2 w-full rounded-full bg-surface-2">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${Math.round((passedCount / total) * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-micro text-text-tertiary">
          {passedCount}/{total} 步骤完成 · 当前 step #{stepIdx + 1} ({stepType})
        </p>
      </header>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h2">
            {pickI18n(currentStep.title, lang) || `Step ${stepIdx + 1} — ${stepType}`}
          </h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-micro text-text-secondary">{stepType}</span>
        </div>

        {stepType === 'intro' ? (
          <p className="text-body" data-testid="lesson-intro">
            {(currentStep.data?.hint as string | undefined) ?? '准备好了吗？点击「完成此步」开始本课的学习。'}
          </p>
        ) : stepType === 'speak' || stepType === 'write' ? (
          <div className="space-y-3" data-testid={`lesson-step-${stepType}`}>
            <p className="text-body text-text-secondary">请自评本步骤的完成度：</p>
            {questions.map((q) => (
              <div key={q.question_id} className="rounded border border-border p-3">
                <p className="font-medium">{q.prompt}</p>
                <div className="mt-2 flex gap-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelections((prev) => ({ ...prev, [q.question_id]: i }))}
                      className={`rounded px-3 py-1 text-sm border ${
                        selections[q.question_id] === i ? 'bg-primary text-white border-primary' : 'border-border'
                      }`}
                      data-testid={`opt-${q.question_id}-${i}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3" data-testid={`lesson-step-${stepType}`}>
            {questions.map((q) => (
              <div key={q.question_id} className="rounded border border-border p-3">
                <p className="font-medium">{q.prompt}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelections((prev) => ({ ...prev, [q.question_id]: i }))}
                      className={`rounded px-3 py-2 text-sm text-left border ${
                        selections[q.question_id] === i ? 'bg-primary text-white border-primary' : 'border-border'
                      }`}
                      data-testid={`opt-${q.question_id}-${i}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleSubmit()} disabled={submitting} data-testid="lesson-submit">
            {submitting ? '提交中…' : '完成此步'}
          </Button>
          <Button variant="secondary" onClick={handleQuickPass} data-testid="lesson-quickpass">
            一键全选正确（演示）
          </Button>
          {lastResult && (
            <span
              className={`text-sm ${lastResult.passed ? 'text-emerald-600' : 'text-red-600'}`}
              data-testid="lesson-last-result"
            >
              score={(lastResult.score * 100).toFixed(0)}% · {lastResult.passed ? 'passed' : 'failed'}
              {lastResult.xp ? ` · +${lastResult.xp.awarded}XP` : ''}
              {lastResult.lesson_complete ? ' · 课时完成 🎉' : ''}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
