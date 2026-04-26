/**
 * E06 — User notes index.
 * Lists notes captured from the reader. Auth-required (router gate).
 */
import { useState } from 'react';
import type { JSX } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, EmptyState, HStack, VStack } from '@zhiyu/ui';
import { discover } from '../../lib/api.js';

export function MeNotesPage(): JSX.Element {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['discover', 'notes'],
    queryFn: () => discover.notes.list(),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');

  const remove = useMutation({
    mutationFn: (id: string) => discover.notes.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover', 'notes'] }),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      discover.notes.patch(id, { body }),
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['discover', 'notes'] });
    },
  });

  if (isLoading) return <div className="py-8 text-center text-text-tertiary">加载中…</div>;
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        illustration="search"
        title="暂无笔记"
        description="在阅读页面长按汉字即可添加笔记"
      />
    );
  }

  return (
    <VStack gap={3} data-testid="me-notes">
      <h1 className="text-h1">我的笔记 ({items.length})</h1>
      {items.map((n) => (
        <Card key={n.id} data-testid={`note-${n.id}`}>
          <HStack gap={2} className="mb-2 text-xs text-text-tertiary">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
              {n.target_type}: {n.target_id}
            </span>
            <span>{new Date(n.updated_at).toLocaleString()}</span>
          </HStack>
          {editingId === n.id ? (
            <>
              <textarea
                className="min-h-[80px] w-full rounded-xl border border-border bg-surface-1 p-3 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                data-testid={`note-edit-${n.id}`}
              />
              <HStack gap={2} className="mt-2">
                <Button
                  size="sm"
                  onClick={() => patch.mutate({ id: n.id, body: draft })}
                  disabled={patch.isPending}
                >保存</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
              </HStack>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm text-text-primary">{n.body}</p>
              <HStack gap={2} className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(n.id);
                    setDraft(n.body);
                  }}
                >编辑</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm('删除这条笔记？')) remove.mutate(n.id);
                  }}
                  data-testid={`note-del-${n.id}`}
                >删除</Button>
              </HStack>
            </>
          )}
        </Card>
      ))}
    </VStack>
  );
}
