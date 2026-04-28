// 管理端 china 路由组装
import type { Hono } from 'hono';
import type { Env } from '../../env.ts';
import { adminCategoriesRoutes } from './categories.routes.ts';
import { adminArticlesRoutes } from './articles.routes.ts';
import { adminSentencesRoutes } from './sentences.routes.ts';
import { adminSearchRoutes } from './search.routes.ts';

export function mountAdminChinaRoutes(app: Hono, env: Env): void {
  app.route('/admin/v1/china/categories', adminCategoriesRoutes(env));
  app.route('/admin/v1/china/articles', adminArticlesRoutes(env));
  app.route('/admin/v1/china/sentences', adminSentencesRoutes(env));
  app.route('/admin/v1/china/search', adminSearchRoutes(env));
}
