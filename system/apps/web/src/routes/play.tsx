import type { JSX } from 'react';
import { Card, EmptyState, Grid } from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';

const GAMES = [
  { id: 'g1', name: '汉字忍者', desc: '滑动切水果式记字' },
  { id: 'g2', name: '拼音射击', desc: '声调瞄准训练' },
  { id: 'g3', name: '声调泡泡', desc: '听音辨调' },
  { id: 'g4', name: '汉字俄罗斯方块', desc: '部首叠合' },
];

export function PlayPage(): JSX.Element {
  const { t } = useT('common');
  return (
    <div className="pt-2" data-testid="play-page">
      <header className="mb-4">
        <h1 className="text-h1">{t('nav.games')}</h1>
        <p className="text-body text-text-secondary">12 款核心游戏，预计在 E08 上线。</p>
      </header>
      <Grid cols={2} gap={4}>
        {GAMES.map((g) => (
          <Card key={g.id}>
            <h3 className="text-h3">{g.name}</h3>
            <p className="mt-2 text-body text-text-secondary">{g.desc}</p>
            <p className="mt-3 text-micro text-text-tertiary">{t('states.coming_soon')}</p>
          </Card>
        ))}
      </Grid>
      <div className="mt-8">
        <EmptyState
          illustration="search"
          title={t('states.coming_soon')}
          description="完整游戏库将在 Epic 08 上线。"
        />
      </div>
    </div>
  );
}
