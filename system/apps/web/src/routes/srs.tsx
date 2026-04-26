import { useEffect, useState, type JSX } from 'react';
import { Button, Card, EmptyState, Spinner } from '@zhiyu/ui';
import { srs, type SrsCard } from '../lib/api.js';

const GRADES = [
  { v: 1 as const, label: '不会 (Again)', cls: 'bg-red-600' },
  { v: 2 as const, label: '困难 (Hard)', cls: 'bg-orange-500' },
  { v: 3 as const, label: '一般 (Good)', cls: 'bg-emerald-600' },
  { v: 4 as const, label: '简单 (Easy)', cls: 'bg-blue-600' },
];

export function SrsPage(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [stats, setStats] = useState<{ due: number; total: number; lapses: number; due_tomorrow: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [q, s] = await Promise.all([srs.queue(20), srs.stats()]);
      setQueue(q.items);
      setStats(s);
      setIdx(0);
      setReveal(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function grade(g: 1 | 2 | 3 | 4): Promise<void> {
    const card = queue[idx];
    if (!card) return;
    setBusy(true);
    try {
      await srs.review(card.id, g);
      if (idx + 1 >= queue.length) {
        await load();
      } else {
        setIdx(idx + 1);
        setReveal(false);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center justify-center min-h-[40vh]" data-testid="srs-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-2 max-w-2xl" data-testid="srs-page">
      <header className="mb-5">
        <h1 className="text-h1">单词记忆 (SRS)</h1>
        {stats && (
          <p className="text-body text-text-secondary mt-1" data-testid="srs-stats">
            今日待复习 {stats.due} · 累计 {stats.total} · 失误 {stats.lapses}
          </p>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {queue.length === 0 ? (
        <EmptyState illustration="success" title="今日已无待复习" description="明天再来吧 🎉" />
      ) : (
        <Card>
          <div className="text-center py-6" data-testid="srs-card">
            <p className="text-micro text-text-tertiary">{idx + 1} / {queue.length}</p>
            <p className="mt-2 text-5xl font-semibold" data-testid="srs-word">{queue[idx]?.word}</p>
            {reveal ? (
              <div className="mt-4 space-y-1" data-testid="srs-reveal">
                {queue[idx]?.pinyin && <p className="text-h2">{queue[idx]?.pinyin}</p>}
                {queue[idx]?.i18n_gloss && (
                  <p className="text-body text-text-secondary">
                    {Object.values(queue[idx]?.i18n_gloss ?? {})[0]}
                  </p>
                )}
              </div>
            ) : (
              <Button className="mt-6" onClick={() => setReveal(true)} data-testid="srs-show">
                显示答案
              </Button>
            )}
          </div>

          {reveal && (
            <div className="mt-2 grid grid-cols-2 gap-2" data-testid="srs-grades">
              {GRADES.map((g) => (
                <button
                  key={g.v}
                  className={`${g.cls} text-white rounded px-3 py-2 disabled:opacity-50`}
                  disabled={busy}
                  onClick={() => void grade(g.v)}
                  data-testid={`srs-grade-${g.v}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
