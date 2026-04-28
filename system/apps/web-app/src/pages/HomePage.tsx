import { Link } from '@tanstack/react-router';
import { GlassCard, Button } from '@zhiyu/ui-kit';
import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 920, margin: '40px auto' }}>
      <GlassCard data-testid="home-hero">
        <h1 style={{ marginTop: 0, fontSize: 36 }}>
          {t('common.app_name')} <span style={{ color: 'var(--zy-brand)' }}>·</span> Discover China
        </h1>
        <p style={{ color: 'var(--zy-fg-soft)' }}>
          学中文 · 玩游戏 · 看小说 · 探索中国文化 — 给海外华裔与中文学习者的一站式平台。
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Link to="/discover"><Button data-testid="cta-discover">{t('nav.discover')}</Button></Link>
          <Link to="/auth/login"><Button variant="ghost">{t('common.login')}</Button></Link>
        </div>
      </GlassCard>
    </div>
  );
}
