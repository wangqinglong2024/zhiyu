import type { JSX } from 'react';
import { Card, EmptyState, HStack, VStack } from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';

export function CoinPage(): JSX.Element {
  const { t } = useT('common');
  return (
    <div className="pt-2" data-testid="coin-page">
      <header className="mb-4">
        <h1 className="text-h1">{t('nav.coin')}</h1>
        <p className="text-body text-text-secondary">用学习赚知语币，用知语币换内容与服务。</p>
      </header>

      <Card>
        <HStack gap={4} className="items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-h2 text-amber-700">¥</div>
          <VStack gap={1}>
            <p className="text-h2">0</p>
            <p className="text-small text-text-secondary">可用知语币</p>
          </VStack>
        </HStack>
      </Card>

      <div className="mt-8">
        <EmptyState illustration="search" title={t('states.coming_soon')} description="知语币 ZC 系统在 Epic 11 上线。" />
      </div>
    </div>
  );
}
