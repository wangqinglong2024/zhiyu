/**
 * E06 — /api/v1/discover/* routes.
 *
 * Composes per-resource handlers. Each handler is a small file kept under
 * 300 lines for clarity and the project's hard 800-line ceiling.
 */
import type { FastifyInstance } from 'fastify';
import { registerDiscoverCategoriesRoutes } from './discover/categories.js';
import { registerDiscoverArticlesRoutes } from './discover/articles.js';
import { registerDiscoverInteractionsRoutes } from './discover/interactions.js';
import { registerDiscoverDictRoutes } from './discover/dict.js';
import { registerDiscoverSearchRoutes } from './discover/search.js';

export async function registerDiscoverRoutes(app: FastifyInstance): Promise<void> {
  await registerDiscoverCategoriesRoutes(app);
  await registerDiscoverArticlesRoutes(app);
  await registerDiscoverInteractionsRoutes(app);
  await registerDiscoverDictRoutes(app);
  await registerDiscoverSearchRoutes(app);
}
