import type { JSX } from 'react';
import { Card, EmptyState, Grid } from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';

const COURSES = [
  { id: 'daily', name: 'Daily 日常汉语', stages: 12 },
  { id: 'ecommerce', name: 'E-commerce 电商汉语', stages: 12 },
  { id: 'factory', name: 'Factory 工厂汉语', stages: 12 },
  { id: 'hsk', name: 'HSK 1-6 备考', stages: 6 },
];

export function LearnPage(): JSX.Element {
  const { t } = useT('common');
  return (
    <div className="pt-2" data-testid="learn-page">
      <header className="mb-4">
        <h1 className="text-h1">{t('nav.courses')}</h1>
        <p className="text-body text-text-secondary">三大主线课程 + HSK 全级别。</p>
      </header>
      <Grid cols={2} gap={4}>
        {COURSES.map((c) => (
          <Card key={c.id}>
            <h3 className="text-h3">{c.name}</h3>
            <p className="mt-2 text-body text-text-secondary">{c.stages} 阶段，每阶段含听说读写练习。</p>
            <p className="mt-3 text-micro text-text-tertiary">{t('states.coming_soon')}</p>
          </Card>
        ))}
      </Grid>
      <div className="mt-8">
        <EmptyState illustration="search" title={t('states.coming_soon')} description="课程内容引擎在 Epic 06/07 上线。" />
      </div>
    </div>
  );
}
