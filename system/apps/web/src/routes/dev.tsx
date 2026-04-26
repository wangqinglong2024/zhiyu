/**
 * Internal/dev pages extracted from the legacy App.tsx so the router can
 * mount them without spinning up the marketing chrome.
 */
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Badge,
  Button,
  Container,
  EmptyState,
  Grid,
  HStack,
  PageShell,
  VStack,
} from '@zhiyu/ui';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export function StyleGuidePage(): JSX.Element {
  // i18n-skip-start: developer-only page.
  return (
    <PageShell>
      <Container>
        <section className="py-12">
          <VStack gap={3}>
            <h1 className="text-h1">样式指南 · Style Guide</h1>
            <p className="text-body-lg text-text-secondary">
              主题随系统切换，可通过右上角「主题」按钮覆盖。
            </p>
          </VStack>
        </section>

        <section className="pb-12">
          <h2 className="text-h2 mb-4">Glass 层级</h2>
          <Grid cols={4} gap={4}>
            {(['glass', 'glass-card', 'glass-elevated', 'glass-floating'] as const).map((cls) => (
              <div key={cls} className={`${cls} flex h-32 items-center justify-center text-text-primary`}>
                <span className="text-small font-medium">.{cls}</span>
              </div>
            ))}
          </Grid>
        </section>

        <section className="pb-12">
          <h2 className="text-h2 mb-4">Buttons</h2>
          <HStack gap={3}>
            <Button>主要</Button>
            <Button variant="secondary">次要</Button>
            <Button variant="ghost">幽灵</Button>
            <Button variant="glass">玻璃</Button>
            <Button variant="danger">危险</Button>
            <Button loading>加载中</Button>
          </HStack>
        </section>

        <section className="pb-12">
          <h2 className="text-h2 mb-4">Badges</h2>
          <HStack gap={2}>
            <Badge tone="rose">Rose</Badge>
            <Badge tone="sky">Sky</Badge>
            <Badge tone="amber">Amber</Badge>
            <Badge tone="success" variant="solid">Success</Badge>
            <Badge tone="warning" variant="solid">Warning</Badge>
            <Badge tone="danger" variant="solid">Danger</Badge>
          </HStack>
        </section>

        <section className="pb-24">
          <EmptyState
            illustration="search"
            title="未找到结果"
            description="请尝试更换关键字或浏览今日推荐"
            action={<Button variant="secondary">查看推荐</Button>}
          />
        </section>
      </Container>
    </PageShell>
  );
  // i18n-skip-end
}

export function DebugSupabasePage(): JSX.Element {
  const [state, setState] = useState<{ loading: boolean; rows?: number; error?: string }>({ loading: true });
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        if (!cancelled) setState({ loading: false, error: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing' });
        return;
      }
      try {
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await client.schema('zhiyu').from('_meta').select('*');
        if (cancelled) return;
        if (error) setState({ loading: false, error: error.message });
        else setState({ loading: false, rows: data?.length ?? 0 });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: (e as Error).message });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <PageShell withMesh={false}>
      <Container size="md" className="py-16">
        <h2 className="text-h2 mb-4">Supabase debug</h2>
        {state.loading ? (
          <p data-testid="status">Loading…</p>
        ) : state.error ? (
          <p data-testid="status" className="text-danger">error: {state.error}</p>
        ) : (
          <p data-testid="status">rows: {state.rows}</p>
        )}
      </Container>
    </PageShell>
  );
}

export function DebugThrowPage(): JSX.Element {
  useEffect(() => {
    setTimeout(() => { throw new Error('frontend debug-throw'); }, 50);
  }, []);
  return <p className="p-8">Throwing in 50ms…</p>;
}
