import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '@zhiyu/ui-kit';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/http.ts';

type TopicsResp = {
  authenticated: boolean;
  guest_limit: number | null;
  items: Array<{ id: number; slug: string; order_no: number; title_zh: string; title_en: string | null }>;
};

export function DiscoverPage() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: ['discover-topics'], queryFn: () => api<TopicsResp>('/discover/topics') });
  return (
    <div style={{ maxWidth: 1080, margin: '24px auto' }}>
      <h2>{t('nav.discover')}</h2>
      {q.isLoading && <p>{t('common.loading')}</p>}
      {q.error && <p style={{ color: 'var(--zy-brand)' }}>{(q.error as Error).message}</p>}
      {q.data && !q.data.authenticated && (
        <p data-testid="guest-banner" style={{ color: 'var(--zy-fg-soft)' }}>{t('auth.guest_discover_limit')}</p>
      )}
      <div
        data-testid="discover-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}
      >
        {q.data?.items.map((it) => (
          <GlassCard key={it.id} data-testid={`topic-${it.slug}`}>
            <div style={{ fontSize: 12, color: 'var(--zy-fg-mute)' }}>#{it.order_no}</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{it.title_zh}</div>
            <div style={{ fontSize: 13, color: 'var(--zy-fg-soft)' }}>{it.title_en}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
