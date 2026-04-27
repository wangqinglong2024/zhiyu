import express from 'express';
import jwt from 'jsonwebtoken';
import { paymentAdapter } from '@zhiyu/adapters';
import { readToken, requireAuth } from '../runtime/auth.js';
import { created, failure, ok } from '../runtime/response.js';
import { addContentReport, dashboard, enrollTracks, grantPurchase, heartbeat, listTracks, makeChapter, makeKnowledgePoints, makeLesson, makeQuiz, makeStage, parseCourseId, permissionFor, pinyinModules, publicQuestion, recommendTracks, reportFor, resolveTrackCode, saveNote, submitQuiz, toggleFavorite, upsertProgress, wordpackScope, courseIds, courseStore } from '../runtime/courses.js';
import type { createBaseApp } from '../runtime/base-app.js';
import type { CoursePurchase, TrackCode } from '../runtime/courses.js';

type Env = ReturnType<typeof createBaseApp>['env'];
const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function optionalUserId(req: express.Request, env: Env) {
  const token = readToken(req, 'user');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId?: string; kind?: string; tokenUse?: string };
    return decoded.kind === 'user' && decoded.tokenUse !== 'refresh' ? decoded.userId ?? null : null;
  } catch {
    return null;
  }
}

function trackParam(req: express.Request): TrackCode | null {
  return resolveTrackCode(firstString(req.params.trackCode) ?? firstString(req.query.track_code) ?? firstString(req.query.trackCode));
}

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === 'string') return value;
  return value == null ? undefined : String(value);
}

function intParam(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : fallback;
}

function purchaseType(value: unknown): CoursePurchase['purchaseType'] {
  const normalized = String(value ?? 'stage_single');
  const aliases: Record<string, CoursePurchase['purchaseType']> = {
    single_stage: 'stage_single',
    stage_single: 'stage_single',
    nine_pack: 'stage_nine_pack',
    stage_nine_pack: 'stage_nine_pack',
    membership: 'membership_monthly',
    membership_monthly: 'membership_monthly',
    membership_yearly: 'membership_yearly',
    membership_half_year: 'membership_half_year',
    year: 'membership_yearly',
    half_year: 'membership_half_year'
  };
  return aliases[normalized] ?? 'stage_single';
}

function purchaseAmountUsd(type: CoursePurchase['purchaseType']) {
  if (type === 'stage_nine_pack') return 36;
  if (type === 'membership_yearly') return 40;
  if (type === 'membership_half_year') return 12;
  return 4;
}

function purchaseExpiry(type: CoursePurchase['purchaseType']) {
  const days = type === 'membership_yearly' ? 365 : type === 'membership_half_year' ? 183 : type === 'membership_monthly' ? 30 : 0;
  return days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;
}

function normalizedResponses(body: unknown) {
  const value = body as { responses?: Array<{ question_id?: string; questionId?: string; answer?: unknown; time_ms?: number; timeMs?: number }> };
  return Array.isArray(value?.responses) ? value.responses.map((item) => {
    const response = { questionId: String(item.questionId ?? item.question_id ?? ''), answer: item.answer } as { questionId: string; answer: unknown; timeMs?: number };
    const timeMs = item.timeMs ?? item.time_ms;
    if (typeof timeMs === 'number') response.timeMs = timeMs;
    return response;
  }) : [];
}

export function registerCourseAppRoutes(app: express.Express, env: Env) {
  const router = express.Router();

  router.get('/tracks', (req, res) => ok(res, listTracks(optionalUserId(req, env)), { cache: 'public-1h', source: 'CR-FR-003 / planning/prds/03-courses/04-data-model-api.md GET /api/learn/tracks' }));

  router.post('/onboarding/recommend', (req, res) => {
    const result = recommendTracks(String(req.body?.goal ?? ''), String(req.body?.level ?? ''));
    return ok(res, result, { source: 'CR-FR-001' });
  });

  router.post('/onboarding/confirm', requireAuth(env, 'user'), (req, res) => {
    const requested = Array.isArray(req.body?.tracks) ? req.body.tracks : [];
    const codes = requested.map((item: unknown) => resolveTrackCode(String(item))).filter(Boolean) as TrackCode[];
    const enrollments = enrollTracks(req.auth?.userId ?? '', codes.length ? codes.slice(0, 4) : ['daily']);
    return ok(res, { enrollments, pinyinRecommended: Boolean(req.body?.pinyinRequired) }, { source: 'CR-FR-001 / CR-FR-017' });
  });

  router.get('/dashboard', (req, res) => ok(res, dashboard(optionalUserId(req, env), trackParam(req) ?? 'daily'), { source: 'CR-FR-003' }));
  router.get('/tracks/:trackCode/dashboard', (req, res) => {
    const track = trackParam(req);
    if (!track) return failure(res, 404, 'TRACK_NOT_FOUND', 'Course track not found');
    return ok(res, dashboard(optionalUserId(req, env), track), { source: 'CR-FR-003 / CR-FR-017' });
  });

  router.get('/stages/:stageId', (req, res) => {
    const stageId = firstString(req.params.stageId) ?? '';
    const parsed = parseCourseId(stageId);
    if (!parsed) return failure(res, 404, 'STAGE_NOT_FOUND', 'Course stage not found');
    const userId = optionalUserId(req, env);
    const stage = { ...makeStage(parsed.trackCode, parsed.stageNo), progressPct: courseStore.progress.find((item) => item.userId === userId && item.scopeId === stageId)?.progressPct ?? 0, chapters: Array.from({ length: 12 }, (_, index) => makeChapter(parsed.trackCode, parsed.stageNo, index + 1, userId)) };
    return ok(res, stage, { source: 'CR-FR-004' });
  });

  router.get('/chapters/:chapterId', (req, res) => {
    const parsed = parseCourseId(firstString(req.params.chapterId) ?? '');
    if (!parsed?.chapterNo) return failure(res, 404, 'CHAPTER_NOT_FOUND', 'Course chapter not found');
    const userId = optionalUserId(req, env);
    const chapter = { ...makeChapter(parsed.trackCode, parsed.stageNo, parsed.chapterNo, userId), lessons: Array.from({ length: 12 }, (_, index) => ({ ...makeLesson(parsed.trackCode, parsed.stageNo, parsed.chapterNo!, index + 1), progressPct: userId ? courseStore.progress.find((item) => item.userId === userId && item.scopeId === courseIds(parsed.trackCode, parsed.stageNo, parsed.chapterNo!, index + 1))?.progressPct ?? 0 : 0 })) };
    return ok(res, chapter, { source: 'CR-FR-005' });
  });

  router.get('/lessons/:lessonId', (req, res) => {
    const lessonId = firstString(req.params.lessonId) ?? '';
    const parsed = parseCourseId(lessonId);
    if (!parsed?.chapterNo || !parsed.lessonNo) return failure(res, 404, 'LESSON_NOT_FOUND', 'Course lesson not found');
    const userId = optionalUserId(req, env);
    const access = permissionFor(userId, parsed.trackCode, parsed.stageNo, parsed.chapterNo);
    const lesson = { ...makeLesson(parsed.trackCode, parsed.stageNo, parsed.chapterNo, parsed.lessonNo), access, knowledgePoints: access.hasAccess ? makeKnowledgePoints(lessonId) : makeKnowledgePoints(lessonId).slice(0, 1), previewOnly: !access.hasAccess };
    return ok(res, lesson, { source: 'CR-FR-006 / CR-FR-010' });
  });

  router.post('/lessons/:lessonId/start', requireAuth(env, 'user'), (req, res) => {
    const lessonId = firstString(req.params.lessonId) ?? '';
    const parsed = parseCourseId(lessonId);
    if (!parsed?.chapterNo) return failure(res, 404, 'LESSON_NOT_FOUND', 'Course lesson not found');
    const access = permissionFor(req.auth?.userId ?? '', parsed.trackCode, parsed.stageNo, parsed.chapterNo);
    if (!access.hasAccess) return failure(res, 402, 'COURSE_PAYWALL', 'Course access requires free trial, purchase, membership, or manual grant', access);
    return ok(res, upsertProgress(req.auth?.userId ?? '', 'lesson', lessonId, 1, 'in_progress', access.completionCounted), { source: 'CR-FR-011' });
  });

  router.post('/lessons/:lessonId/skip', requireAuth(env, 'user'), (req, res) => {
    const progress = upsertProgress(req.auth?.userId ?? '', 'lesson', firstString(req.params.lessonId) ?? '', 100, 'skipped', false);
    return ok(res, { progress, reportLabel: 'skipped', makeUpQuizAllowed: true }, { source: 'CR-FR-014' });
  });

  router.post('/knowledge-points/:kpId/viewed', requireAuth(env, 'user'), (req, res) => {
    const progress = upsertProgress(req.auth?.userId ?? '', 'knowledge_point', firstString(req.params.kpId) ?? '', 100, 'completed');
    return ok(res, progress, { source: 'CR-FR-011 1s debounce write' });
  });

  router.get('/quizzes/:quizId', (req, res) => {
    const quiz = makeQuiz(firstString(req.params.quizId) ?? '');
    if (!quiz) return failure(res, 404, 'QUIZ_NOT_FOUND', 'Course quiz not found');
    return ok(res, { ...quiz, questions: quiz.questions.map(publicQuestion) }, { source: 'CR-FR-007 / CR-FR-008 / CR-FR-009; answers hidden until submit' });
  });

  router.post('/quizzes/:quizId/submit', requireAuth(env, 'user'), (req, res) => {
    const result = submitQuiz(req.auth?.userId ?? '', firstString(req.params.quizId) ?? '', normalizedResponses(req.body), Number(req.body?.duration_seconds ?? req.body?.durationSeconds ?? 0));
    if (!result) return failure(res, 404, 'QUIZ_NOT_FOUND', 'Course quiz not found');
    return ok(res, result, { source: 'CR-FR-007 / CR-FR-012 / CR-FR-013' });
  });

  router.get('/wrong-set', requireAuth(env, 'user'), (req, res) => ok(res, courseStore.wrongSet.filter((item) => item.userId === req.auth?.userId), { source: 'CR-FR-012' }));

  router.get('/permissions', (req, res) => {
    const track = trackParam(req);
    if (!track) return failure(res, 404, 'TRACK_NOT_FOUND', 'Course track not found');
    const result = permissionFor(optionalUserId(req, env), track, intParam(req.query.stage_no ?? req.query.stageNo, 1), req.query.chapter_no || req.query.chapterNo ? intParam(req.query.chapter_no ?? req.query.chapterNo, 1) : undefined);
    return ok(res, result, { source: 'CR-FR-010 / CR-FR-017' });
  });

  router.get('/reports/:type/:id', (req, res) => {
    const type = ['lesson', 'chapter', 'stage'].includes(req.params.type) ? req.params.type as 'lesson' | 'chapter' | 'stage' : null;
    if (!type) return failure(res, 404, 'REPORT_NOT_FOUND', 'Course report type not found');
    return ok(res, reportFor(optionalUserId(req, env), type, firstString(req.params.id) ?? ''), { source: 'CR-FR-013' });
  });

  router.get('/pinyin/modules', (req, res) => ok(res, pinyinModules(optionalUserId(req, env)), { source: 'CR-FR-002 / content/course/shared/01-pinyin-system.md' }));

  router.post('/pinyin/:moduleId/skip', requireAuth(env, 'user'), (req, res) => ok(res, upsertProgress(req.auth?.userId ?? '', 'pinyin', firstString(req.params.moduleId) ?? '', 100, 'skipped', false), { source: 'CR-FR-002 skip with recommendation' }));

  router.post('/checkout/dummy', requireAuth(env, 'user'), asyncRoute(async (req, res) => {
    const track = resolveTrackCode(String(req.body?.trackCode ?? req.body?.track_code ?? ''));
    const stageNo = intParam(req.body?.stageNo ?? req.body?.stage_no, 1);
    const selectedPurchaseType = purchaseType(req.body?.purchaseType ?? req.body?.purchase_type);
    if (!track) return failure(res, 404, 'TRACK_NOT_FOUND', 'Course track not found');
    const checkout = await paymentAdapter.checkout({ userId: req.auth?.userId ?? '', plan: `course-${selectedPurchaseType}-${track}-${stageNo}`, amountUsd: purchaseAmountUsd(selectedPurchaseType) });
    const purchases = grantPurchase(req.auth?.userId ?? '', track, stageNo, selectedPurchaseType, 'PaymentAdapter dummy checkout', purchaseExpiry(selectedPurchaseType));
    return created(res, { checkout, purchases }, { source: 'CR-FR-010 / CR-FR-019' });
  }));

  router.post('/content-reports', requireAuth(env, 'user'), (req, res) => created(res, addContentReport(req.auth?.userId ?? '', String(req.body?.target_type ?? req.body?.targetType ?? 'knowledge_point'), String(req.body?.target_id ?? req.body?.targetId ?? ''), String(req.body?.issue_type ?? req.body?.issueType ?? 'pinyin'), String(req.body?.description ?? '')), { source: 'CR-FR-020' }));
  router.post('/knowledge-points/:kpId/favorite', requireAuth(env, 'user'), (req, res) => ok(res, toggleFavorite(req.auth?.userId ?? '', firstString(req.params.kpId) ?? ''), { source: 'CR-FR-018' }));
  router.post('/knowledge-points/:kpId/note', requireAuth(env, 'user'), (req, res) => {
    const note = saveNote(req.auth?.userId ?? '', firstString(req.params.kpId) ?? '', String(req.body?.content ?? ''));
    if (!note) return failure(res, 400, 'NOTE_INVALID', 'Course knowledge point note must be 1-500 characters');
    return ok(res, note, { source: 'CR-FR-019' });
  });
  router.post('/study/heartbeat', requireAuth(env, 'user'), (req, res) => ok(res, heartbeat(req.auth?.userId ?? '', String(req.body?.scope_id ?? req.body?.scopeId ?? 'learn'), Number(req.body?.active_seconds ?? req.body?.activeSeconds ?? 5)), { source: 'CR-FR-016' }));
  router.get('/game-wordpack-scope', requireAuth(env, 'user'), (req, res) => ok(res, wordpackScope(req.auth?.userId ?? ''), { source: 'ACR-07 / GM wordpack permission summary' }));

  app.use('/api/learn', router);
  app.use('/api/v1/learn', router);
  app.get('/api/v1/courses/map', (_req, res) => ok(res, listTracks().map((track) => ({ track: track.code, stages: 12, chaptersPerStage: 12, free: 'stage-1 chapters 1-3' }))));
}