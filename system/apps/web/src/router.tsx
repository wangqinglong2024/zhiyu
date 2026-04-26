/**
 * ZY-05-02 — TanStack Router (code-based, no codegen).
 *
 * Two layout shells:
 *  - AppLayout (TopBar + SideNav + BottomNav) for marketing + main app routes.
 *  - PlainLayout (no chrome) for auth + debug routes.
 *
 * `/me/*` routes call `auth.me()` in their `beforeLoad` and redirect to
 * `/signin?next=...` when unauthenticated.
 */
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { AppLayout } from './components/layout/AppLayout.js';
import { auth } from './lib/api.js';
import { DiscoverPage } from './routes/discover.js';
import { PlayPage } from './routes/play.js';
import { LearnPage } from './routes/learn.js';
import { CoinPage } from './routes/coin.js';
import { StyleGuidePage, DebugSupabasePage, DebugThrowPage } from './routes/dev.js';
import { SignInPage, SignUpPage, ResetPasswordPage } from './pages/auth.js';
import {
  AuthCallbackPage,
  MeOverviewPage,
  MeEditPage,
  MeSettingsPage,
  MeSecurityPage,
  MeDataPage,
} from './pages/me.js';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ---- App shell layout (TopBar/SideNav/BottomNav + chrome) ----
const appShellLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-shell',
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => appShellLayout,
  path: '/',
  component: DiscoverPage,
});

const playRoute = createRoute({
  getParentRoute: () => appShellLayout,
  path: '/play',
  component: PlayPage,
});

const learnRoute = createRoute({
  getParentRoute: () => appShellLayout,
  path: '/learn',
  component: LearnPage,
});

const coinRoute = createRoute({
  getParentRoute: () => appShellLayout,
  path: '/coin',
  component: CoinPage,
});

// ---- Plain layout (no chrome) for auth/debug/dev ----
const plainLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'plain',
  component: () => <Outlet />,
});

const signInRoute = createRoute({ getParentRoute: () => plainLayout, path: '/signin', component: SignInPage });
const signUpRoute = createRoute({ getParentRoute: () => plainLayout, path: '/signup', component: SignUpPage });
const resetPwRoute = createRoute({ getParentRoute: () => plainLayout, path: '/reset-password', component: ResetPasswordPage });
const authCbRoute = createRoute({ getParentRoute: () => plainLayout, path: '/auth/callback', component: AuthCallbackPage });

const styleguideRoute = createRoute({ getParentRoute: () => plainLayout, path: '/__styleguide', component: StyleGuidePage });
const debugSupaRoute = createRoute({ getParentRoute: () => plainLayout, path: '/_debug/supabase', component: DebugSupabasePage });
const debugThrowRoute = createRoute({ getParentRoute: () => plainLayout, path: '/_debug/throw', component: DebugThrowPage });

// ---- Me (auth-required), reuses AppLayout chrome ----
async function requireAuth({ location }: { location: { href: string } }): Promise<void> {
  try {
    const r = await auth.me();
    if (!r.user) throw new Error('no user');
  } catch {
    throw redirect({ to: '/signin', search: { next: location.href } });
  }
}

const meOverviewRoute = createRoute({ getParentRoute: () => appShellLayout, path: '/me', beforeLoad: requireAuth, component: MeOverviewPage });
const meEditRoute = createRoute({ getParentRoute: () => appShellLayout, path: '/me/edit', beforeLoad: requireAuth, component: MeEditPage });
const meSettingsRoute = createRoute({ getParentRoute: () => appShellLayout, path: '/me/settings', beforeLoad: requireAuth, component: MeSettingsPage });
const meSecurityRoute = createRoute({ getParentRoute: () => appShellLayout, path: '/me/security', beforeLoad: requireAuth, component: MeSecurityPage });
const meDataRoute = createRoute({ getParentRoute: () => appShellLayout, path: '/me/data', beforeLoad: requireAuth, component: MeDataPage });

const routeTree = rootRoute.addChildren([
  appShellLayout.addChildren([
    indexRoute,
    playRoute,
    learnRoute,
    coinRoute,
    meOverviewRoute,
    meEditRoute,
    meSettingsRoute,
    meSecurityRoute,
    meDataRoute,
  ]),
  plainLayout.addChildren([
    signInRoute,
    signUpRoute,
    resetPwRoute,
    authCbRoute,
    styleguideRoute,
    debugSupaRoute,
    debugThrowRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
