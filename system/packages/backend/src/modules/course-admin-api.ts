import express from 'express';
import { randomUUID } from 'node:crypto';
import { requireRole } from '../runtime/auth.js';
import { created, failure, ok } from '../runtime/response.js';
import { adminTree, courseCatalogRows, courseIds, courseStore, grantPurchase, listTracks, makeChapter, makeKnowledgePoints, makeLesson, makeQuiz, makeStage, parseCourseId, publicQuestion, resolveTrackCode, revokePurchase, translationCoverage, validateCourseSeed, wordpackScope } from '../runtime/courses.js';
import type { TrackCode } from '../runtime/courses.js';

type AuditFn = (req: express.Request, action: string, resourceType: string, resourceId: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null) => unknown;
const writeRoles = ['admin', 'editor'] as const;

function param(req: express.Request, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function intParam(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : fallback;
}

function trackBody(req: express.Request): TrackCode | null {
  return resolveTrackCode(String(req.body?.trackCode ?? req.body?.track_code ?? req.query.trackCode ?? req.query.track_code ?? ''));
}

export function registerCourseAdminRoutes(api: express.Router, adminAudit: AuditFn) {
  api.get('/content/courses', (_req, res) => ok(res, courseCatalogRows(), { source: 'AD-FR-006 / ACR-01' }));
  api.get('/content/courses/tree', (req, res) => ok(res, adminTree(String(req.query.user_id ?? '') || null), { source: 'ACR-01 tree shell' }));
  api.get('/content/courses/tracks', (_req, res) => ok(res, listTracks(), { source: 'ACR-02 tracks/stages metadata' }));

  api.patch('/content/courses/tracks/:trackCode', requireRole([...writeRoles]), (req, res) => {
    const track = resolveTrackCode(param(req, 'trackCode'));
    if (!track) return failure(res, 404, 'TRACK_NOT_FOUND', 'Course track not found');
    const after = { trackCode: track, patch: req.body, note: 'Runtime metadata patch accepted; track code remains immutable.' };
    adminAudit(req, 'course.track.update', 'content_track', track, null, after);
    return ok(res, after, { source: 'ACR-02 track code immutable; metadata editable' });
  });

  api.patch('/content/courses/stages/:stageId', requireRole([...writeRoles]), (req, res) => {
    const parsed = parseCourseId(param(req, 'stageId'));
    if (!parsed) return failure(res, 404, 'STAGE_NOT_FOUND', 'Course stage not found');
    const before = makeStage(parsed.trackCode, parsed.stageNo) as unknown as Record<string, unknown>;
    const after = { ...before, ...req.body, id: param(req, 'stageId'), trackCode: parsed.trackCode, stageNo: parsed.stageNo };
    adminAudit(req, 'course.stage.update', 'content_stage', param(req, 'stageId'), before, after);
    return ok(res, after, { source: 'ACR-02 stage metadata + audit diff' });
  });

  api.patch('/content/courses/chapters/:chapterId', requireRole([...writeRoles]), (req, res) => {
    const parsed = parseCourseId(param(req, 'chapterId'));
    if (!parsed?.chapterNo) return failure(res, 404, 'CHAPTER_NOT_FOUND', 'Course chapter not found');
    const before = makeChapter(parsed.trackCode, parsed.stageNo, parsed.chapterNo) as unknown as Record<string, unknown>;
    const after = { ...before, ...req.body, isFree: req.body?.isFree ?? req.body?.is_free ?? before.isFree, freeReason: req.body?.freeReason ?? req.body?.free_reason ?? before.freeReason };
    adminAudit(req, 'course.chapter.update', 'content_chapter', param(req, 'chapterId'), before, after);
    return ok(res, after, { source: 'ACR-03 chapter free trial range + audit' });
  });

  api.post('/content/courses/chapters/bulk-free-trial', requireRole(['admin']), (req, res) => {
    const track = trackBody(req);
    if (!track) return failure(res, 404, 'TRACK_NOT_FOUND', 'Course track not found');
    const result = { trackCode: track, stageNo: 1, freeChapters: [1, 2, 3], reason: req.body?.reason ?? 'login_trial', cacheInvalidated: true };
    adminAudit(req, 'course.chapter.bulk_free_trial', 'content_chapter', track, null, result);
    return ok(res, result, { source: 'ACR-03 / CR-FR-010 free trial only Stage 1 Chapter 1-3' });
  });

  api.get('/content/courses/lessons/:lessonId', (req, res) => {
    const parsed = parseCourseId(param(req, 'lessonId'));
    if (!parsed?.chapterNo || !parsed.lessonNo) return failure(res, 404, 'LESSON_NOT_FOUND', 'Course lesson not found');
    return ok(res, { ...makeLesson(parsed.trackCode, parsed.stageNo, parsed.chapterNo, parsed.lessonNo), knowledgePoints: makeKnowledgePoints(param(req, 'lessonId')) }, { source: 'ACR-04' });
  });

  api.patch('/content/courses/lessons/:lessonId', requireRole([...writeRoles]), (req, res) => {
    const parsed = parseCourseId(param(req, 'lessonId'));
    if (!parsed?.chapterNo || !parsed.lessonNo) return failure(res, 404, 'LESSON_NOT_FOUND', 'Course lesson not found');
    const before = makeLesson(parsed.trackCode, parsed.stageNo, parsed.chapterNo, parsed.lessonNo) as unknown as Record<string, unknown>;
    const after = { ...before, ...req.body };
    adminAudit(req, 'course.lesson.update', 'content_lesson', param(req, 'lessonId'), before, after);
    return ok(res, after, { source: 'ACR-04 lesson edit + audit' });
  });

  api.patch('/content/courses/knowledge-points/:kpId', requireRole([...writeRoles]), (req, res) => {
    const parsed = parseCourseId(param(req, 'kpId'));
    if (!parsed?.chapterNo || !parsed.lessonNo || !parsed.kpointNo) return failure(res, 404, 'KNOWLEDGE_POINT_NOT_FOUND', 'Course knowledge point not found');
    const before = makeKnowledgePoints(courseIds(parsed.trackCode, parsed.stageNo, parsed.chapterNo, parsed.lessonNo)).find((item) => item.id === param(req, 'kpId')) as unknown as Record<string, unknown> | undefined;
    const after = { ...before, ...req.body, id: param(req, 'kpId') };
    adminAudit(req, 'course.knowledge_point.update', 'content_knowledge_point', param(req, 'kpId'), before ?? null, after);
    return ok(res, after, { source: 'ACR-04 knowledge point editor; validation source content/course/shared/04-knowledge-point-format.md' });
  });

  api.get('/content/courses/questions', (req, res) => {
    const lessonId = String(req.query.lesson_id ?? req.query.lessonId ?? courseIds('hsk', 1, 1, 1));
    const quiz = makeQuiz(`quiz-lesson_quiz-${lessonId}`);
    return ok(res, quiz?.questions.map(publicQuestion) ?? [], { source: 'ACR-05 Q1-Q10/P1-P3 question bank' });
  });

  api.get('/content/courses/quizzes/:quizId/preview', (req, res) => {
    const quiz = makeQuiz(param(req, 'quizId'));
    if (!quiz) return failure(res, 404, 'QUIZ_NOT_FOUND', 'Course quiz not found');
    return ok(res, { ...quiz, questions: quiz.questions.map(publicQuestion) }, { source: 'ACR-05 preview reuses front-end safe payload' });
  });

  api.post('/content/courses/import/dry-run', requireRole([...writeRoles]), (req, res) => ok(res, validateCourseSeed(req.body, true), { source: 'ACR-08 dry-run required before commit' }));
  api.post('/content/courses/import/commit', requireRole([...writeRoles]), (req, res) => {
    const result = validateCourseSeed(req.body, false);
    adminAudit(req, 'course.seed.import', 'content_import', result.id, null, result);
    return created(res, result, { source: 'ACR-08 seed/import publish' });
  });

  api.post('/content/courses/:resourceType/:resourceId/publish', requireRole([...writeRoles]), (req, res) => {
    const snapshot = { resourceType: param(req, 'resourceType'), resourceId: param(req, 'resourceId'), status: 'published', previewUrl: `/learn/${param(req, 'resourceId')}` };
    courseStore.contentVersions.unshift({ id: randomUUID(), resourceType: snapshot.resourceType, resourceId: snapshot.resourceId, action: 'published', snapshot, createdAt: new Date().toISOString() });
    adminAudit(req, 'course.publish', snapshot.resourceType, snapshot.resourceId, null, snapshot);
    return ok(res, snapshot, { source: 'ACR-08 publish + version snapshot' });
  });

  api.get('/content/courses/translation-coverage', (_req, res) => ok(res, translationCoverage(), { source: 'ACR-09 translation completeness' }));

  api.get('/users/:id/courses-permissions', requireRole(['admin', 'cs']), (req, res) => ok(res, { userId: param(req, 'id'), purchases: courseStore.purchases.filter((item) => item.userId === param(req, 'id')), matrix: wordpackScope(param(req, 'id')) }, { source: 'ACR-06 permission matrix' }));

  api.post('/users/:id/courses-permissions/grant', requireRole(['admin']), (req, res) => {
    const track = trackBody(req);
    if (!track) return failure(res, 404, 'TRACK_NOT_FOUND', 'Course track not found');
    const purchases = grantPurchase(param(req, 'id'), track, intParam(req.body?.stageNo ?? req.body?.stage_no, 1), 'manual_grant', String(req.body?.reason ?? 'manual admin grant'));
    adminAudit(req, 'course.permission.grant', 'user_stage_purchase', param(req, 'id'), null, { track, purchases });
    return ok(res, { purchases, effectiveWithinSeconds: 5 }, { source: 'ACR-06 manual grant + audit' });
  });

  api.post('/users/:id/courses-permissions/revoke', requireRole(['admin']), (req, res) => {
    const purchase = revokePurchase(param(req, 'id'), String(req.body?.purchaseId ?? req.body?.purchase_id ?? ''));
    if (!purchase) return failure(res, 404, 'PURCHASE_NOT_FOUND', 'Course permission purchase not found');
    adminAudit(req, 'course.permission.revoke', 'user_stage_purchase', purchase.id, purchase as unknown as Record<string, unknown>, { status: 'revoked' });
    return ok(res, purchase, { source: 'ACR-06 revoke + cache invalidation' });
  });

  api.get('/users/:id/game-wordpack-scope', requireRole(['admin', 'cs']), (req, res) => ok(res, wordpackScope(param(req, 'id')), { source: 'ACR-07 game wordpack permission summary' }));
}