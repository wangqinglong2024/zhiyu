import { Badge, Button, Card, CardHeader, CardTitle, CardDescription, Container, HStack, PageShell, ThemeMenu, VStack } from '@zhiyu/ui';

// i18n-skip-file: admin v1 dashboard; back office is internal CN-first.

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? '';

export default function App(): JSX.Element {
  return (
    <PageShell>
      <header className="sticky top-0 z-30 backdrop-blur-md">
        <Container>
          <HStack className="h-16 justify-between">
            <h1 className="text-title font-semibold">知语 · Admin</h1>
            <ThemeMenu />
          </HStack>
        </Container>
      </header>
      <Container size="md" className="py-12">
        <VStack gap={6}>
          <Badge tone="sky" variant="soft">B 端控制台</Badge>
          <h2 className="text-h2">运营、内容、用户、数据</h2>
          <Card>
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
              <CardDescription>
                Admin API: <code className="rounded bg-bg-elevated px-1">{ADMIN_API_BASE || '(unset)'}</code>
              </CardDescription>
            </CardHeader>
            <HStack gap={3} className="pt-2">
              <Button variant="secondary">查看日志</Button>
              <Button variant="glass">健康检查</Button>
            </HStack>
          </Card>
        </VStack>
      </Container>
    </PageShell>
  );
}
