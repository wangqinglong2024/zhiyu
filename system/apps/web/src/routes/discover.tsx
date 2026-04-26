/**
 * ZY-05-05 — Discover home page.
 * Hero, recommended carousel, continue learning, content cards.
 * Skeletons are shown while a 600ms simulated load completes; in M2 these will
 * be wired to /api/v1/recommend, /api/v1/me/progress, /api/v1/articles.
 */
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link } from '@tanstack/react-router';
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
  Progress,
  Skeleton,
  VStack,
} from '@zhiyu/ui';
import { useT } from '@zhiyu/i18n/client';

interface ContinueItem {
  id: string;
  title: string;
  desc: string;
  progress: number;
  tone: 'rose' | 'amber' | 'success';
}

const MOCK_CONTINUE: ContinueItem[] = [
  { id: 'c1', title: 'HSK 3 · 第 12 课', desc: '语法：把字句', progress: 68, tone: 'rose' },
  { id: 'c2', title: '商务汉语', desc: '电话沟通', progress: 42, tone: 'amber' },
  { id: 'c3', title: '汉字 200', desc: '今日 12 个', progress: 91, tone: 'success' },
];

const RECOMMENDED = [
  { id: 'r1', title: '日常会话精讲', tag: '入门', desc: '50 课时，涵盖问候、购物、出行' },
  { id: 'r2', title: '电商汉语', tag: '商务', desc: '采购、议价、合同的实战表达' },
  { id: 'r3', title: '工厂汉语', tag: '职场', desc: '车间术语 + 安全口令' },
  { id: 'r4', title: 'HSK 4 突破', tag: '考试', desc: '600 词高频题型' },
];

const ARTICLES = [
  { id: 'a1', title: '中国节日漫谈', desc: '从春节到中秋的故事', readingMins: 6 },
  { id: 'a2', title: '武侠小说入门', desc: '三大流派与代表作', readingMins: 8 },
  { id: 'a3', title: '茶文化简史', desc: '喝懂中国茶的 5 个关键词', readingMins: 5 },
];

function HeroSkeleton(): JSX.Element {
  return (
    <Card>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="mt-3 h-12 w-2/3" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <HStack gap={3} className="mt-6">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </HStack>
    </Card>
  );
}

export function DiscoverPage(): JSX.Element {
  const { t } = useT('common');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col gap-10 pt-2" data-testid="discover-page">
      {/* Hero */}
      <section data-testid="discover-hero">
        {loading ? (
          <HeroSkeleton />
        ) : (
          <Card>
            <VStack gap={4}>
              <Badge tone="rose" variant="soft">{t('home.badge')}</Badge>
              <h1 className="text-display max-w-2xl text-balance text-text-primary">{t('home.headline')}</h1>
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
        )}
      </section>

      {/* Continue learning */}
      <section data-testid="discover-continue">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-h2">{t('home.card1_title')}</h2>
          <Link to="/learn" className="text-small text-rose-600 hover:underline">{t('actions.more')} →</Link>
        </header>
        {loading ? (
          <Grid cols={3} gap={4}>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-4 h-2 w-full" />
              </Card>
            ))}
          </Grid>
        ) : (
          <Grid cols={3} gap={4}>
            {MOCK_CONTINUE.map((c) => (
              <Card key={c.id} data-testid={`continue-${c.id}`}>
                <CardHeader>
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription>{c.desc}</CardDescription>
                </CardHeader>
                <Progress value={c.progress} tone={c.tone} />
                <CardFooter>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/learn">{t('actions.next')} →</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        )}
      </section>

      {/* Recommended courses */}
      <section data-testid="discover-recommended">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-h2">{t('home.card2_title')}</h2>
        </header>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="min-w-[260px]">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2 scroll-smooth snap-x" data-testid="rec-scroller">
            {RECOMMENDED.map((r) => (
              <Card key={r.id} className="min-w-[260px] snap-start">
                <Badge tone="amber" variant="soft">{r.tag}</Badge>
                <CardHeader>
                  <CardTitle>{r.title}</CardTitle>
                  <CardDescription>{r.desc}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button size="sm" asChild>
                    <Link to="/learn">{t('home.cta_start')}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Articles */}
      <section data-testid="discover-articles">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-h2">{t('home.card3_title')}</h2>
        </header>
        {loading ? (
          <Grid cols={3} gap={4}>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
              </Card>
            ))}
          </Grid>
        ) : ARTICLES.length === 0 ? (
          <EmptyState illustration="search" title={t('search.empty_title')} description={t('search.empty_desc')} />
        ) : (
          <Grid cols={3} gap={4}>
            {ARTICLES.map((a) => (
              <Card key={a.id} data-testid={`article-${a.id}`}>
                <CardHeader>
                  <CardTitle>{a.title}</CardTitle>
                  <CardDescription>{a.desc}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <span className="text-micro text-text-tertiary">{a.readingMins} min read</span>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        )}
      </section>
    </div>
  );
}
