import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Layout } from './Layout.tsx';
import { HomePage } from '../pages/HomePage.tsx';
import { LoginPage } from '../pages/LoginPage.tsx';
import { RegisterPage } from '../pages/RegisterPage.tsx';
import { DiscoverPage } from '../pages/DiscoverPage.tsx';
import { MePage } from '../pages/MePage.tsx';

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/login', component: LoginPage });
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/register', component: RegisterPage });
const discoverRoute = createRoute({ getParentRoute: () => rootRoute, path: '/discover', component: DiscoverPage });
const meRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me', component: MePage });

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, registerRoute, discoverRoute, meRoute]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
