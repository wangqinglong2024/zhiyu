import type { FastifyInstance } from 'fastify';
import { asc } from 'drizzle-orm';
import { categories } from '@zhiyu/db';
import { db } from '../../db.js';

/**
 * GET /api/v1/discover/categories
 * Always returns all 12 cultural buckets sorted by sort_order. Public.
 */
export async function registerDiscoverCategoriesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/discover/categories', async () => {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return { categories: rows };
  });
}
