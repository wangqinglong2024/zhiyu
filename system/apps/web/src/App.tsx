import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  EmptyState,
  Grid,
  HStack,
  PageShell,
  Progress,
  Spinner,
  ThemeMenu,
  VStack,
  toast,
} from '@zhiyu/ui';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export default function App(): JSX.Element {
  const [path, setPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const onPop = (): void => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (path === '/_debug/supabase') return <DebugSupabase />;
  if (path === '/_debug/throw') return <DebugThrow />;
  if (path === '/__styleguide') return <StyleGuide />;
  return <Home />;
}

function Header(): JSX.Element {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md">
      <Container>
        <HStack className="h-16 justify-between">
          <a href="/" className="text-title font-semibold tracking-tight text-text-primary">
            <span className="bg-gradient-to-r from-rose-600 to-amber-500 bg-clip-text text-transparent">知语</span>{' '}
            Zhiyu
          </a>
          <HStack gap={3}>
            <ThemeMenu />
            <Button asChild size="sm" variant="ghost">
              <a href="/__styleguide">样式指南</a>
            </Button>
          </HStack>
        </HStack>
      </Container>
    </header>
  );
}

function Home(): JSX.Element {
  return (
    <PageShell>
      <Header />
      <Container>
        <section className="py-16">
          <VStack gap={6}>
            <Badge tone="rose" variant="soft">
              Cosmic Refraction · Glass UI
            </Badge>
            <h1 className="text-display max-w-3xl text-balance text-text-primary">
              用<span className="bg-gradient-to-r from-rose-600 via-amber-500 to-sky-500 bg-clip-text text-transparent">玻璃</span>质感重塑中文学习体验
            </h1>
            <p className="max-w-2xl text-body-lg text-text-secondary">
              知语让 50 余种母语学员在沉浸式 UI 中练习汉字、拼音与语调。每一次轻触，皆有微光回响。
            </p>
            <HStack gap={3}>
              <Button onClick={() => toast.success('欢迎来到知语！', { description: 'Glass UI 已就绪' })}>开始体验</Button>
              <Button variant="glass" asChild>
                <a href="/__styleguide">浏览组件库</a>
              </Button>
            </HStack>
          </VStack>
        </section>

        <section className="pb-16">
          <Grid cols={3} gap={6}>
            <Card>
              <CardHeader>
                <CardTitle>沉浸场景</CardTitle>
                <CardDescription>故事化情景驱动 HSK 1-9 课程</CardDescription>
              </CardHeader>
              <Progress value={68} />
              <CardFooter>
                <Button variant="ghost" size="sm">继续学习</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>双语阅读</CardTitle>
                <CardDescription>EN/TH/AR/VI/ID 互译，悬停发音</CardDescription>
              </CardHeader>
              <Progress value={42} tone="amber" />
              <CardFooter>
                <Button variant="ghost" size="sm">打开书架</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>SRS 复习</CardTitle>
                <CardDescription>遗忘曲线驱动的卡片队列</CardDescription>
              </CardHeader>
              <Progress value={91} tone="success" />
              <CardFooter>
                <Button variant="ghost" size="sm">今日 12 张</Button>
              </CardFooter>
            </Card>
          </Grid>
        </section>

        <section className="pb-24">
          <Card variant="flat">
            <HStack gap={3}>
              <Spinner />
              <VStack gap={1}>
                <p className="text-small text-text-secondary">系统检测</p>
                <p className="text-body">
                  API 基址 <code className="rounded bg-bg-elevated px-1">{API_BASE || '(unset)'}</code>，Supabase{' '}
                  <code className="rounded bg-bg-elevated px-1">{SUPABASE_URL || '(unset)'}</code>
                </p>
                <p className="text-small text-text-secondary">
                  调试入口：
                  <a href="/_debug/supabase" data-testid="link-supabase" className="ms-1">/_debug/supabase</a>
                  <span className="mx-2">·</span>
                  <a href="/_debug/throw" data-testid="link-throw">/_debug/throw</a>
                </p>
              </VStack>
            </HStack>
          </Card>
        </section>
      </Container>
    </PageShell>
  );
}

function StyleGuide(): JSX.Element {
  return (
    <PageShell>
      <Header />
      <Container>
        <section className="py-12">
          <VStack gap={3}>
            <h1 className="text-h1">样式指南 · Style Guide</h1>
            <p className="text-body-lg text-text-secondary">
              当前主题随系统切换，可通过右上角「主题」按钮覆盖。下方组件覆盖 Light/Dark + 5 级 Glass 层级。
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
}

function DebugSupabase(): JSX.Element {
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
    return () => {
      cancelled = true;
    };
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

function DebugThrow(): JSX.Element {
  useEffect(() => {
    setTimeout(() => {
      throw new Error('frontend debug-throw');
    }, 50);
  }, []);
  return <p className="p-8">Throwing in 50ms…</p>;
}
