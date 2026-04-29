// 应用端 china 路由组装
import type { Hono } from 'hono';
import type { Env } from '../../env.ts';
import { categoriesRoutes } from './categories.routes.ts';
import { articlesRoutes } from './articles.routes.ts';
import { sentencesRoutes } from './sentences.routes.ts';
import { healthRoutes } from './health.routes.ts';
// 阅读进度功能（C6/C7）已下线 — 不再挂载 progressRoutes
// 旧文件 progress.routes.ts / progress.service.ts 暂保留以便日后恢复

export function mountChinaRoutes(app: Hono, env: Env): void {
  app.route('/api/v1/china/categories', categoriesRoutes(env));
  app.route('/api/v1/china/articles', articlesRoutes(env));
  app.route('/api/v1/china/sentences', sentencesRoutes(env));
  app.route('/api/v1/china/health', healthRoutes(env));
}
