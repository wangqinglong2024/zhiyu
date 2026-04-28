import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from './Layout.tsx';
import { LoginPage } from '../pages/LoginPage.tsx';
import { HomePage } from '../pages/HomePage.tsx';
import { UsersPage } from '../pages/UsersPage.tsx';
import { AdminChinaCategoryCardsPage } from '../pages/china/AdminChinaCategoryCardsPage.tsx';
import { AdminChinaArticleListPage } from '../pages/china/AdminChinaArticleListPage.tsx';
import { AdminChinaArticleEditPage } from '../pages/china/AdminChinaArticleEditPage.tsx';
import { AdminChinaSearchPage } from '../pages/china/AdminChinaSearchPage.tsx';

const rootRoute = createRootRoute({
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const usersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/users', component: UsersPage });

const chinaIdx = createRoute({ getParentRoute: () => rootRoute, path: '/china', component: AdminChinaCategoryCardsPage });
const chinaSearch = createRoute({ getParentRoute: () => rootRoute, path: '/china/search', component: AdminChinaSearchPage });
const chinaCat = createRoute({ getParentRoute: () => rootRoute, path: '/china/categories/$code', component: AdminChinaArticleListPage });
const chinaArt = createRoute({ getParentRoute: () => rootRoute, path: '/china/articles/$id', component: AdminChinaArticleEditPage });

const routeTree = rootRoute.addChildren([
  indexRoute, loginRoute, usersRoute,
  chinaIdx, chinaSearch, chinaCat, chinaArt,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
