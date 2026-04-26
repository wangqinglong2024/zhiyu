import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Card, Spinner } from '@zhiyu/ui';
import { hsk } from '../lib/api.js';

interface Question {
  id: string;
  level: number;
  prompt: string;
  choices: string[];
}

export function OnboardingHskPage(): JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ recommended_level: number; correct_count: number; total_questions: number } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await hsk.questions();
        setQuestions(r.questions);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submit(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(answers).map(([question_id, selected]) => ({ question_id, selected }));
      const r = await hsk.submit(payload);
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    );
  }

  if (result) {
    return (
      <div className="pt-2 max-w-2xl" data-testid="hsk-result">
        <Card>
          <h1 className="text-h1">测试完成</h1>
          <p className="mt-3 text-body">
            正确 <span className="font-bold">{result.correct_count}</span> / {result.total_questions}
          </p>
          <p className="mt-1 text-h2">
            推荐等级：<span className="text-primary">HSK {result.recommended_level}</span>
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate({ to: '/learn' })} data-testid="hsk-go-learn">
              开始学习
            </Button>
            <Button variant="secondary" onClick={() => { setResult(null); setAnswers({}); }} data-testid="hsk-retry">
              重新测试
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const total = questions.length;
  const answered = Object.keys(answers).length;

  return (
    <div className="pt-2 max-w-2xl" data-testid="hsk-onboarding">
      <header className="mb-4">
        <h1 className="text-h1">HSK 水平测试</h1>
        <p className="text-body text-text-secondary">{total} 道题，约 5 分钟。</p>
        <div className="mt-2 h-2 w-full rounded-full bg-surface-2">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(answered / Math.max(1, total)) * 100}%` }} />
        </div>
      </header>

      {error && <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} data-testid={`hsk-q-${q.id}`}>
            <p className="text-micro text-text-tertiary">第 {i + 1} 题 · HSK{q.level}</p>
            <p className="mt-1 font-medium">{q.prompt}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {q.choices.map((c, idx) => (
                <button
                  key={idx}
                  className={`rounded border px-3 py-2 text-sm text-left ${
                    answers[q.id] === idx ? 'bg-primary text-white border-primary' : 'border-border'
                  }`}
                  onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                  data-testid={`hsk-opt-${q.id}-${idx}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-5">
        <Button
          onClick={() => void submit()}
          disabled={submitting || answered < total}
          data-testid="hsk-submit"
        >
          {submitting ? '提交中…' : `提交 (${answered}/${total})`}
        </Button>
      </div>
    </div>
  );
}
