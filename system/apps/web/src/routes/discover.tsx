/**
 * E06 — Discover China home.
 *
 * Replaces the M1 mock with live data from /api/v1/discover/*:
 *  - Hero (kept from E05 design)
 *  - Continue learning rail (reading_progress)
 *  - Category strip (12 cultural buckets)
 *  - HSK filter chips
 *  - Featured articles grid with infinite-scroll keyset cursor
 */
import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Grid,
  HStack,
  Skeleton,
  VStack,
} from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';
import { discover, auth as authApi, type DiscoverArticleCard, type DiscoverCategory } from '../lib/api.js';

const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function pickI18n(map: Record<string, string> | null | undefined, lng: string): string {
  if (!map) return '';
  return map[lng] || map['en'] || map['zh-CN'] || Object.values(map)[0] || '';
}

function ArticleCard({ a, lng }: { a: DiscoverArticleCard; lng: string }): JSX.Element {
  const title = pickI18n(a.i18n_title, lng);
  const summary = pickI18n(a.i18n_summary, lng);
  return (
    <Link
      to="/discover/$slug"
      params={{ slug: a.slug }}
      className="group block"
      data-testid={`article-${a.slug}`}
    >
      <Card className="h-full transition-shadow group-hover:shadow-lg">
        {a.cover_url ? (
          <div
            className="mb-3 h-32 w-full rounded-2xl bg-cover bg-center"
            style={{ backgroundImage: `url(${a.cover_url})` }}
          />
        ) : (
          <div className="mb-3 flex h-32 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 text-4xl">
            🇨🇳
          </div>
        )}
        <HStack gap={2} className="mb-2">
          <Badge tone="rose" variant="soft">{`HSK ${a.hsk_level}`}</Badge>
          <Badge tone="amber" variant="soft">{`${a.estimated_minutes} min`}</Badge>
          {Number(a.rating_avg) > 0 && (
            <Badge tone="success" variant="soft">{`★ ${Number(a.rating_avg).toFixed(1)}`}</Badge>
          )}
        </HStack>
        <CardHeader>
          <CardTitle className="line-clamp-2">{title || a.slug}</CardTitle>
          <CardDescription className="line-clamp-2">{summary}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function DiscoverPage(): JSX.Element {
  const { t, i18n } = useT('common');
  const lng = i18n.language || 'en';
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [hsk, setHsk] = useState<number | undefined>(undefined);

  const { data: catData, isLoading: catsLoading } = useQuery({
    queryKey: ['discover', 'categories'],
    queryFn: () => discover.categories(),
    staleTime: 5 * 60_000,
  });

  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().catch(() => ({ user: null })),
    staleTime: 60_000,
  });

  const { data: progressData } = useQuery({
    queryKey: ['discover', 'progress'],
    queryFn: () => discover.progress.list().catch(() => ({ items: [] })),
    enabled: !!meData?.user,
    staleTime: 60_000,
  });

  const articlesQ = useInfiniteQuery({
    queryKey: ['discover', 'articles', { categorySlug, hsk }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      discover.articles({ category: categorySlug, hsk, cursor: pageParam, limit: 12 }),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const flatItems = useMemo(
    () => articlesQ.data?.pages.flatMap((p) => p.items) ?? [],
    [articlesQ.data],
  );

  const slugById = useMemo(() => {
    const m = new Map<string, DiscoverArticleCard>();
    for (const a of flatItems) m.set(a.id, a);
    return m;
  }, [flatItems]);

  useEffect(() => {
    const onScroll = (): void => {
      if (!articlesQ.hasNextPage || articlesQ.isFetchingNextPage) return;
      const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (remaining < 600) void articlesQ.fetchNextPage();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [articlesQ]);

  const continueItems = (progressData?.items ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-10 pt-2" data-testid="discover-page">
      <section data-testid="discover-hero">
        <Card>
          <VStack gap={4}>
            <Badge tone="rose" variant="soft">{t('home.badge')}</Badge>
            <h1 className="text-display max-w-2xl text-balance text-text-primary">
              {t('home.headline')}
            </h1>
            <p className="max-w-2xl text-body-lg text-text-secondary">{t('home.lead')}</p>
            <HStack gap={3}>
              <Button asChild>
                <Link to="/learn">{t('home.cta_start')}</Link>
              </Button>
              <Button variant="glass" asChild>
                <Link to="/play">{t('home.cta_explore')}</Link>
              </Button>
            </HStack>
          </VStack>
        </Card>
      </section>

      {continueItems.length > 0 && (
        <section data-testid="discover-continue">
          <header className="mb-3 flex items-end justify-between">
            <h2 className="text-h2">{t('home.card1_title')}</h2>
          </header>
          <Grid cols={3} gap={4}>
            {continueItems.map((p) => {
              const a = slugById.get(p.article_id);
              return (
                <Card key={p.article_id} data-testid={`continue-${p.article_id}`}>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      {a ? pickI18n(a.i18n_title, lng) : p.article_id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {Math.round(Number(p.scroll_pct))}% · {Math.round(p.accumulated_seconds / 60)} min
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    {a ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/discover/$slug" params={{ slug: a.slug }}>
                          {t('actions.next')} →
                        </Link>
                      </Button>
                    ) : null}
                  </CardFooter>
                </Card>
              );
            })}
          </Grid>
        </section>
      )}

      <section data-testid="discover-categories">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-h2">Discover China</h2>
        </header>
        {catsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 scroll-smooth snap-x">
            <button
              type="button"
              onClick={() => setCategorySlug(undefined)}
              className={`min-w-[140px] snap-start rounded-2xl border-2 p-4 text-left transition ${
                categorySlug === undefined
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-transparent bg-surface-2 hover:border-rose-200'
              }`}
              data-testid="cat-all"
            >
              <div className="text-2xl">✨</div>
              <div className="mt-2 text-sm font-semibold">All</div>
            </button>
            {(catData?.categories ?? []).map((c: DiscoverCategory) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategorySlug(c.slug)}
                className={`min-w-[140px] snap-start rounded-2xl border-2 p-4 text-left transition ${
                  categorySlug === c.slug
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-transparent bg-surface-2 hover:border-rose-200'
                }`}
                data-testid={`cat-${c.slug}`}
              >
                <div className="text-2xl">{c.emoji ?? '📚'}</div>
                <div className="mt-2 text-sm font-semibold line-clamp-1">
                  {pickI18n(c.i18n_name, lng) || c.slug}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <HStack gap={2} className="flex-wrap">
          <button
            type="button"
            onClick={() => setHsk(undefined)}
            className={`rounded-full px-3 py-1 text-sm ${
              hsk === undefined ? 'bg-rose-500 text-white' : 'bg-surface-2 text-text-secondary'
            }`}
            data-testid="hsk-all"
          >
            All HSK
          </button>
          {HSK_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setHsk(hsk === lvl ? undefined : lvl)}
              className={`rounded-full px-3 py-1 text-sm ${
                hsk === lvl ? 'bg-rose-500 text-white' : 'bg-surface-2 text-text-secondary'
              }`}
              data-testid={`hsk-${lvl}`}
            >{`HSK ${lvl}`}</button>
          ))}
        </HStack>
      </section>

      <section data-testid="discover-articles">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-h2">Featured articles</h2>
        </header>
        {articlesQ.isLoading ? (
          <Grid cols={3} gap={4}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
              </Card>
            ))}
          </Grid>
        ) : flatItems.length === 0 ? (
          <EmptyState
            illustration="search"
            title={t('search.empty_title')}
            description={t('search.empty_desc')}
          />
        ) : (
          <>
            <Grid cols={3} gap={4}>
              {flatItems.map((a) => (
                <ArticleCard key={a.id} a={a} lng={lng} />
              ))}
            </Grid>
            <div className="mt-6 flex justify-center">
              {articlesQ.hasNextPage && (
                <Button
                  variant="ghost"
                  onClick={() => void articlesQ.fetchNextPage()}
                  disabled={articlesQ.isFetchingNextPage}
                  data-testid="load-more"
                >
                  {articlesQ.isFetchingNextPage ? '…' : (t('actions.more') ?? 'Load more')}
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
