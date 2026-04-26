import { useEffect, useState, type JSX } from 'react';
import { Button, Card, EmptyState, Spinner } from '@zhiyu/ui';
import { mistakes } from '../lib/api.js';

interface Item {
  id: string;
  lesson_id: string;
  question_id: string;
  question_type: string;
  payload: Record<string, unknown>;
  reason: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function MistakesPage(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const r = await mistakes.list({ resolved: showResolved });
      setItems(r.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [showResolved]);

  if (loading) {
    return (
      <div className="pt-6 flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-2 max-w-3xl" data-testid="mistakes-page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-h1">错题本</h1>
          <p className="text-body text-text-secondary">所有未通过的题目都会出现在这里。</p>
        </div>
        <a
          href="/api/v1/me/mistakes/export.csv"
          className="text-sm text-primary hover:underline"
          data-testid="mk-export"
        >
          导出 CSV
        </a>
      </header>

      <div className="mb-3 flex items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            data-testid="mk-show-resolved"
          />
          显示已解决
        </label>
      </div>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {items.length === 0 ? (
        <EmptyState illustration="success" title="目前没有错题" description="继续学习，错题会自动收录。" />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id} data-testid={`mk-row-${m.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-micro text-text-tertiary">
                    {new Date(m.created_at).toLocaleString()} · {m.question_type}
                  </p>
                  <p className="font-medium mt-1">题目 ID: {m.question_id}</p>
                  {m.reason && <p className="text-sm text-red-600 mt-1">原因：{m.reason}</p>}
                </div>
                {!m.resolved_at && (
                  <Button
                    size="sm"
                    disabled={busy === m.id}
                    onClick={async () => {
                      setBusy(m.id);
                      try {
                        await mistakes.redo(m.id);
                        await load();
                      } finally {
                        setBusy(null);
                      }
                    }}
                    data-testid={`mk-redo-${m.id}`}
                  >
                    {busy === m.id ? '处理中…' : '标记已掌握'}
                  </Button>
                )}
                {m.resolved_at && (
                  <span className="text-xs text-emerald-600">已解决</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
