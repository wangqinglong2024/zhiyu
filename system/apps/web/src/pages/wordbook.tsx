import { useEffect, useState, type JSX } from 'react';
import { Button, Card, EmptyState, Input, Spinner } from '@zhiyu/ui';
import { wordbook } from '../lib/api.js';

interface Item {
  id: string;
  word: string;
  pinyin: string | null;
  i18n_gloss: Record<string, string> | null;
  source: string | null;
  created_at: string;
}

export function WordbookPage(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [word, setWord] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [gloss, setGloss] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const r = await wordbook.list();
      setItems(r.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(): Promise<void> {
    if (!word.trim()) return;
    setBusy(true);
    try {
      await wordbook.add({
        word: word.trim(),
        pinyin: pinyin.trim() || undefined,
        i18n_gloss: gloss.trim() ? { en: gloss.trim() } : undefined,
        source: 'manual',
      });
      setWord('');
      setPinyin('');
      setGloss('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-2 max-w-3xl" data-testid="wordbook-page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-h1">生词本</h1>
          <p className="text-body text-text-secondary">收集你的单词，自动加入 SRS 记忆队列。</p>
        </div>
        <a
          href="/api/v1/me/wordbook/export.csv"
          className="text-sm text-primary hover:underline"
          data-testid="wordbook-export"
        >
          导出 CSV
        </a>
      </header>

      <Card>
        <h2 className="text-h2 mb-3">添加新词</h2>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="汉字" value={word} onChange={(e) => setWord(e.target.value)} data-testid="wb-word" />
          <Input placeholder="拼音 (可选)" value={pinyin} onChange={(e) => setPinyin(e.target.value)} data-testid="wb-pinyin" />
          <Input placeholder="释义 (可选)" value={gloss} onChange={(e) => setGloss(e.target.value)} data-testid="wb-gloss" />
        </div>
        <div className="mt-3">
          <Button onClick={() => void add()} disabled={busy || !word.trim()} data-testid="wb-add">
            {busy ? '添加中…' : '加入生词本'}
          </Button>
        </div>
      </Card>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState illustration="search" title="还没有生词" description="开始学习课程或手动添加你的第一个词。" />
        ) : (
          <Card>
            <table className="w-full text-sm" data-testid="wb-table">
              <thead className="text-text-secondary text-left">
                <tr>
                  <th className="py-2">汉字</th>
                  <th>拼音</th>
                  <th>释义</th>
                  <th>来源</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-border" data-testid={`wb-row-${i.id}`}>
                    <td className="py-2 font-medium">{i.word}</td>
                    <td>{i.pinyin ?? ''}</td>
                    <td>{i.i18n_gloss ? Object.values(i.i18n_gloss)[0] : ''}</td>
                    <td className="text-text-tertiary">{i.source ?? ''}</td>
                    <td className="text-right">
                      <button
                        className="text-red-600 text-xs hover:underline"
                        onClick={async () => {
                          await wordbook.remove(i.id);
                          await load();
                        }}
                        data-testid={`wb-del-${i.id}`}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
