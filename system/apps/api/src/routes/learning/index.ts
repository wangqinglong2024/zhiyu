/**
 * E07 — Learning engine route registrar.
 */
import type { FastifyInstance } from 'fastify';
import { registerEnrollmentRoutes } from './enrollments.js';
import { registerLessonRoutes } from './lessons.js';
import { registerSrsRoutes } from './srs.js';
import { registerWordbookMistakeRoutes } from './wordbook-mistakes.js';
import { registerProgressionRoutes } from './progression.js';
import { registerHskRoutes } from './hsk.js';
import { registerDashboardRoutes } from './dashboard.js';

export async function registerLearningRoutes(app: FastifyInstance): Promise<void> {
  await registerEnrollmentRoutes(app);
  await registerLessonRoutes(app);
  await registerSrsRoutes(app);
  await registerWordbookMistakeRoutes(app);
  await registerProgressionRoutes(app);
  await registerHskRoutes(app);
  await registerDashboardRoutes(app);
}
