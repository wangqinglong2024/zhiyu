/**
 * AppLayout — used by routes that share TopBar / SideNav / BottomNav.
 * Auth and debug routes opt out via their own `__root` layout.
 */
import { Outlet } from '@tanstack/react-router';
import type { JSX } from 'react';
import { Container, PageShell } from '@zhiyu/ui';
import { TopBar } from './TopBar.js';
import { SideNav } from './SideNav.js';
import { BottomNav } from './BottomNav.js';
import { CommandPalette } from '../search/CommandPalette.js';
import { NotificationCenter } from '../notifications/NotificationCenter.js';
import { OfflineBanner, UpdateToast } from './ShellNotices.js';

export function AppLayout(): JSX.Element {
  return (
    <PageShell>
      <TopBar />
      <Container className="flex gap-6 pt-4">
        <SideNav />
        <main className="min-w-0 flex-1 pb-24 md:pb-12">
          <Outlet />
        </main>
      </Container>
      <BottomNav />
      <CommandPalette />
      <NotificationCenter />
      <OfflineBanner />
      <UpdateToast />
    </PageShell>
  );
}
