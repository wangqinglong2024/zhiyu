import bcrypt from 'bcryptjs';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { captchaAdapter, emailAdapter } from '@zhiyu/adapters';
import { readToken, requireAuth, signToken } from '../runtime/auth.js';
import { createBaseApp, installErrorHandler } from '../runtime/base-app.js';
import { audit, defaultPreferences, now, publicUser, refreshDiscoverContent, state } from '../runtime/state.js';
import { created, failure, ok, pageMeta } from '../runtime/response.js';
import type { DiscoverArticleRecord } from '../runtime/state.js';
import { registerCourseAppRoutes } from './course-api.js';

const rateLimitHandler = (_req: express.Request, res: express.Response) => failure(res, 429, 'RATE_LIMITED', 'Too many requests');
const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, handler: rateLimitHandler });
const otpLimiter = rateLimit({ windowMs: 60_000, limit: 1, standardHeaders: true, legacyHeaders: false, handler: rateLimitHandler });
const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function validPassword(password: unknown) {
  return typeof password === 'string' && password.length >= 8;
}

function userByEmail(email: string) {
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function issueSession(env: ReturnType<typeof createBaseApp>['env'], user: (typeof state.users)[number], deviceId = 'browser') {
  const session = { id: randomUUID(), userId: user.id, deviceName: deviceId, ip: '127.0.0.1', lastActiveAt: now(), revokedAt: null };
  state.sessions.push(session);
  const accessToken = signToken(env, { userId: user.id, email: user.email, kind: 'user', sessionId: session.id, tokenUse: 'access' }, '15m');
  const refreshToken = signToken(env, { userId: user.id, email: user.email, kind: 'user', sessionId: session.id, tokenUse: 'refresh' }, '30d');
  return { session, accessToken, refreshToken };
}

function activeUser(req: express.Request, res: express.Response) {
  const user = state.users.find((item) => item.id === req.auth?.userId);
  if (!user) {
    failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    return null;
  }
  if (user.status !== 'active') {
    failure(res, 403, 'ACCOUNT_RESTRICTED', 'Account is not active');
    return null;
  }
  return user;
}

function hasValidUserToken(req: express.Request, env: ReturnType<typeof createBaseApp>['env']) {
  const token = readToken(req, 'user');
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { kind?: string; tokenUse?: string; userId?: string };
    return decoded.kind === 'user' && decoded.tokenUse !== 'refresh' && state.users.some((user) => user.id === decoded.userId && user.status === 'active');
  } catch {
    return false;
  }
}

function localeParam(req: express.Request) {
  const value = String(req.query.locale ?? req.headers['x-zhiyu-locale'] ?? 'en');
  return ['en', 'vi', 'th', 'id', 'zh-CN'].includes(value) ? value as 'en' | 'vi' | 'th' | 'id' | 'zh-CN' : 'en';
}

function requestParam(req: express.Request, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function positiveInt(value: unknown, fallback: number, max = 50) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function canReadCategory(req: express.Request, env: ReturnType<typeof createBaseApp>['env'], categorySlug: string) {
  const category = state.categories.find((item) => item.slug === categorySlug);
  return Boolean(category && category.status === 'active' && (category.public || hasValidUserToken(req, env)));
}

function gateDiscover(req: express.Request, res: express.Response, env: ReturnType<typeof createBaseApp>['env'], categorySlug: string) {
  const category = state.categories.find((item) => item.slug === categorySlug);
  if (!category || category.status !== 'active') {
    failure(res, 404, 'CATEGORY_NOT_FOUND', 'Discover China category not found');
    return true;
  }
  if (canReadCategory(req, env, categorySlug)) return false;
  state.events.push({ id: randomUUID(), ts: now(), type: 'discover_gate', anonId: req.headers['x-anon-id'] ?? 'anon-browser', deviceId: req.headers['x-device-id'] ?? 'browser', ipHash: `dev-${req.ip ?? 'local'}`, props: { categorySlug } });
  failure(res, 401, 'discover_category_login_required', 'Register free to unlock all Discover China categories');
  return true;
}

function publishedArticle(slugOrId: string) {
  return state.articles.find((item) => (item.slug === slugOrId || item.id === slugOrId) && item.status === 'published') ?? null;
}

function assertReadableArticle(req: express.Request, res: express.Response, env: ReturnType<typeof createBaseApp>['env'], slugOrId: string) {
  const article = publishedArticle(slugOrId);
  if (!article) {
    failure(res, 404, 'ARTICLE_NOT_FOUND', 'Article not found');
    return null;
  }
  if (gateDiscover(req, res, env, article.categorySlug)) return null;
  return article;
}

function articleListItem(article: DiscoverArticleRecord) {
  return { ...article, sentences: undefined, category: article.categorySlug, title: article.titleZh, estimatedMinutes: article.readingMinutes };
}

function articlePayload(article: DiscoverArticleRecord, userId?: string) {
  return {
    ...article,
    category: article.categorySlug,
    title: article.titleZh,
    estimatedMinutes: article.readingMinutes,
    progress: userId ? state.readingProgress.find((item) => item.userId === userId && item.targetId === article.id) ?? null : null,
    favorite: userId ? state.favorites.some((item) => item.userId === userId && item.targetType === 'article' && item.targetId === article.id) : false,
    userRating: userId ? state.ratings.find((item) => item.userId === userId && item.targetId === article.id)?.rating ?? null : null
  };
}

function activeUserId(req: express.Request, env: ReturnType<typeof createBaseApp>['env']) {
  const token = readToken(req, 'user');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { kind?: string; tokenUse?: string; userId?: string };
    return decoded.kind === 'user' && decoded.tokenUse !== 'refresh' ? decoded.userId ?? null : null;
  } catch {
    return null;
  }
}

function registerAuthRoutes(router: express.Router, env: ReturnType<typeof createBaseApp>['env']) {
  router.post('/register', authLimiter, asyncRoute(async (req, res) => {
    const { email, password, native_lang, nativeLang, privacyAccepted, turnstile_token } = req.body ?? {};
    if (!email || !password || privacyAccepted !== true) return failure(res, 400, 'REGISTER_INVALID', 'email, password and privacy consent are required');
    if (!validPassword(password)) return failure(res, 400, 'PASSWORD_INVALID', 'Password must be at least 8 characters');
    const captcha = await captchaAdapter.verify(turnstile_token);
    if (!captcha.data.ok) return failure(res, 400, 'CAPTCHA_FAILED', 'Captcha verification failed');
    if (userByEmail(email)) return failure(res, 409, 'EMAIL_EXISTS', 'Email already registered');
    const user = {
      id: randomUUID(),
      email,
      passwordHash: bcrypt.hashSync(password, 12),
      emailVerifiedAt: null,
      displayName: email.split('@')[0],
      avatarUrl: null,
      nativeLang: native_lang ?? nativeLang ?? 'en',
      uiLang: native_lang ?? nativeLang ?? 'en',
      timezone: 'UTC',
      hskLevelSelf: null,
      hskLevelEstimated: null,
      personaTags: [],
      status: 'active' as const,
      coins: 100,
      createdAt: now()
    };
    state.users.push(user);
    state.preferences.set(user.id, { ...defaultPreferences, emailMarketing: true });
    state.otps.push({ userId: user.id, email, code: '123456', purpose: 'verify_email', expiresAt: Date.now() + 15 * 60_000, attempts: 0 });
    await emailAdapter.send({ to: email, subject: 'Verify your Zhiyu email', text: 'Your dev OTP is 123456', locale: user.uiLang });
    return created(res, { user: publicUser(user), grantedCoins: 100, otpDevCode: '123456' });
  }));

  router.post('/login', authLimiter, (req, res) => {
    const { email, password, device_id } = req.body ?? {};
    const user = userByEmail(email ?? '');
    if (!user || !bcrypt.compareSync(password ?? '', user.passwordHash)) return failure(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    if (user.status !== 'active') return failure(res, 403, 'ACCOUNT_RESTRICTED', 'Account is not active');
    const tokens = issueSession(env, user, device_id ?? 'browser');
    res.cookie('zy_session', tokens.accessToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 15 * 60_000 });
    return ok(res, { user: publicUser(user), ...tokens });
  });

  router.post('/oauth/google', authLimiter, (req, res) => {
    const { id_token, device_id } = req.body ?? {};
    if (!id_token || id_token === 'missing') return failure(res, 503, 'OAUTH_FAKE_PROVIDER', 'Google provider is configured but no dev token was supplied');
    let user = userByEmail('google-dev@example.com');
    if (!user) {
      user = {
        id: randomUUID(),
        email: 'google-dev@example.com',
        passwordHash: bcrypt.hashSync('Password123!', 12),
        emailVerifiedAt: now(),
        displayName: 'Google Dev User',
        avatarUrl: null,
        nativeLang: 'en',
        uiLang: 'en',
        timezone: 'UTC',
        hskLevelSelf: null,
        hskLevelEstimated: null,
        personaTags: [],
        status: 'active',
        coins: 100,
        createdAt: now()
      };
      state.users.push(user);
      state.preferences.set(user.id, { ...defaultPreferences });
    }
    const tokens = issueSession(env, user, device_id ?? 'google-oauth');
    return ok(res, { user: publicUser(user), onboardingRequired: true, grantedCoins: 100, ...tokens });
  });

  router.post('/refresh', (req, res) => {
    const token = req.body?.refresh_token;
    if (!token) return failure(res, 400, 'REFRESH_REQUIRED', 'refresh_token is required');
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId?: string; email?: string; kind?: string; sessionId?: string; tokenUse?: string };
      const session = state.sessions.find((item) => item.id === decoded.sessionId && item.userId === decoded.userId && !item.revokedAt);
      const user = state.users.find((item) => item.id === decoded.userId && item.status === 'active');
      if (decoded.kind !== 'user' || decoded.tokenUse !== 'refresh' || !session || !user || !decoded.email) return failure(res, 401, 'REFRESH_INVALID', 'Refresh token is invalid or revoked');
      session.lastActiveAt = now();
      return ok(res, { accessToken: signToken(env, { userId: user.id, email: decoded.email, kind: 'user', sessionId: session.id, tokenUse: 'access' }, '15m') });
    } catch {
      return failure(res, 401, 'REFRESH_INVALID', 'Refresh token is invalid or revoked');
    }
  });

  router.post('/logout', requireAuth(env, 'user'), (req, res) => {
    const session = state.sessions.find((item) => item.userId === req.auth?.userId && !item.revokedAt);
    if (session) session.revokedAt = now();
    res.clearCookie('zy_session');
    return ok(res, { loggedOut: true });
  });

  router.post('/logout-all', requireAuth(env, 'user'), (req, res) => {
    for (const session of state.sessions.filter((item) => item.userId === req.auth?.userId)) session.revokedAt = now();
    return ok(res, { revoked: true });
  });

  router.post('/email/send-otp', otpLimiter, requireAuth(env, 'user'), asyncRoute(async (req, res) => {
    const user = state.users.find((item) => item.id === req.auth?.userId);
    if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    const purpose = req.body?.purpose ?? 'verify_email';
    if (purpose !== 'verify_email') return failure(res, 400, 'OTP_PURPOSE_INVALID', 'OTP purpose is not supported');
    state.otps.push({ userId: user.id, email: user.email, code: '123456', purpose, expiresAt: Date.now() + 15 * 60_000, attempts: 0 });
    await emailAdapter.send({ to: user.email, subject: `Zhiyu ${purpose}`, text: 'Your dev OTP is 123456' });
    return ok(res, { sent: true, cooldownSeconds: 60, otpDevCode: '123456' });
  }));

  router.post('/email/verify-otp', requireAuth(env, 'user'), (req, res) => {
    const otp = state.otps.find((item) => item.userId === req.auth?.userId && item.purpose === 'verify_email' && !item.consumedAt);
    if (!otp || otp.expiresAt < Date.now()) return failure(res, 400, 'OTP_INVALID', 'OTP is invalid or expired');
    otp.attempts += 1;
    if (otp.attempts > 5) return failure(res, 429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many OTP attempts');
    if (otp.code !== req.body?.code) return failure(res, 400, 'OTP_INVALID', 'OTP is invalid or expired');
    otp.consumedAt = now();
    const user = state.users.find((item) => item.id === req.auth?.userId);
    if (user) user.emailVerifiedAt = now();
    return ok(res, { verified: true, user: user ? publicUser(user) : null });
  });

  router.post('/password/reset-request', authLimiter, asyncRoute(async (req, res) => {
    const user = userByEmail(req.body?.email ?? '');
    if (user) {
      state.otps.push({ userId: user.id, email: user.email, code: 'RESET123', purpose: 'reset_password', expiresAt: Date.now() + 10 * 60_000, attempts: 0 });
      await emailAdapter.send({ to: user.email, subject: 'Reset your Zhiyu password', text: 'Your dev reset token is RESET123' });
    }
    return ok(res, { sent: true, tokenDevOnly: user ? 'RESET123' : null });
  }));

  router.post('/password/reset', authLimiter, (req, res) => {
    const nextPassword = req.body?.new_password ?? req.body?.new;
    if (!validPassword(nextPassword)) return failure(res, 400, 'PASSWORD_INVALID', 'Password must be at least 8 characters');
    const otp = state.otps.find((item) => item.code === req.body?.token && item.purpose === 'reset_password' && !item.consumedAt && (!req.body?.email || item.email.toLowerCase() === String(req.body.email).toLowerCase()));
    if (!otp || otp.expiresAt < Date.now()) return failure(res, 400, 'RESET_TOKEN_INVALID', 'Reset token is invalid or expired');
    const user = state.users.find((item) => item.id === otp.userId);
    if (user) user.passwordHash = bcrypt.hashSync(nextPassword, 12);
    for (const session of state.sessions.filter((item) => item.userId === otp.userId)) session.revokedAt = now();
    otp.consumedAt = now();
    return ok(res, { reset: true, sessionsRevoked: true });
  });

  router.post('/password/change', requireAuth(env, 'user'), (req, res) => {
    const user = state.users.find((item) => item.id === req.auth?.userId);
    if (!user || !bcrypt.compareSync(req.body?.old ?? '', user.passwordHash)) return failure(res, 401, 'PASSWORD_INVALID', 'Current password is incorrect');
    if (!validPassword(req.body?.new)) return failure(res, 400, 'PASSWORD_INVALID', 'Password must be at least 8 characters');
    user.passwordHash = bcrypt.hashSync(req.body.new, 12);
    return ok(res, { changed: true });
  });
}

function registerMeRoutes(router: express.Router, env: ReturnType<typeof createBaseApp>['env']) {
  router.get('/', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    return ok(res, { profile: publicUser(user), preferences: state.preferences.get(user.id) });
  });

  router.patch('/', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    Object.assign(user, {
      displayName: req.body.display_name ?? req.body.displayName ?? user.displayName,
      nativeLang: req.body.native_lang ?? req.body.nativeLang ?? user.nativeLang,
      uiLang: req.body.ui_lang ?? req.body.uiLang ?? user.uiLang,
      timezone: req.body.timezone ?? user.timezone,
      hskLevelSelf: req.body.hsk_level_self ?? req.body.hskLevelSelf ?? user.hskLevelSelf,
      personaTags: req.body.persona_tags ?? req.body.personaTags ?? user.personaTags
    });
    return ok(res, { profile: publicUser(user) });
  });

  router.patch('/preferences', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    const current = state.preferences.get(user.id) ?? { ...defaultPreferences };
    const next = {
      ...current,
      uiLang: req.body?.ui_lang ?? req.body?.uiLang ?? current.uiLang,
      pinyinMode: req.body?.pinyin_mode ?? req.body?.pinyinMode ?? current.pinyinMode,
      translationMode: req.body?.translation_mode ?? req.body?.translationMode ?? current.translationMode,
      fontSize: req.body?.font_size ?? req.body?.fontSize ?? current.fontSize,
      ttsSpeed: req.body?.tts_speed ?? req.body?.ttsSpeed ?? current.ttsSpeed,
      ttsVoice: req.body?.tts_voice ?? req.body?.ttsVoice ?? current.ttsVoice,
      emailMarketing: req.body?.email_marketing ?? req.body?.emailMarketing ?? current.emailMarketing,
      emailLearningReminder: req.body?.email_learning_reminder ?? req.body?.emailLearningReminder ?? current.emailLearningReminder,
      pushEnabled: req.body?.push_enabled ?? req.body?.pushEnabled ?? current.pushEnabled,
      theme: req.body?.theme ?? current.theme
    };
    if (['en', 'vi', 'th', 'id', 'zh-CN'].includes(next.uiLang)) user.uiLang = next.uiLang;
    state.preferences.set(user.id, next);
    return ok(res, { preferences: next });
  });

  router.get('/sessions', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    return ok(res, state.sessions.filter((item) => item.userId === user.id));
  });
  router.delete('/sessions/:id', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    const session = state.sessions.find((item) => item.id === req.params.id && item.userId === user.id);
    if (!session) return failure(res, 404, 'SESSION_NOT_FOUND', 'Session not found');
    session.revokedAt = now();
    return ok(res, { revoked: true });
  });

  router.post('/avatar', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    user.avatarUrl = req.body?.avatar_url ?? `https://www.gravatar.com/avatar/${user.id}?d=identicon`;
    return ok(res, { avatarUrl: user.avatarUrl });
  });

  router.post('/data-exports', requireAuth(env, 'user'), (req, res) => {
    const user = activeUser(req, res);
    if (!user) return;
    const monthKey = now().slice(0, 7);
    const monthlyExisting = state.exports.find((item) => item['userId'] === user.id && String(item['requestedAt'] ?? '').slice(0, 7) === monthKey);
    if (monthlyExisting) return failure(res, 429, 'EXPORT_MONTHLY_LIMIT', 'Data export is limited to once per month');
    const exportJob = { id: randomUUID(), userId: user.id, status: 'completed', fileUrl: `seed://exports/${user.id}.json`, expiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(), requestedAt: now() };
    state.exports.push(exportJob);
    return created(res, exportJob);
  });

  router.get('/data-exports/:id', requireAuth(env, 'user'), (req, res) => {
    const job = state.exports.find((item) => item['id'] === req.params.id && item['userId'] === req.auth?.userId);
    if (!job) return failure(res, 404, 'EXPORT_NOT_FOUND', 'Export not found');
    if (Date.parse(String(job['expiresAt'])) <= Date.now()) return failure(res, 410, 'EXPORT_EXPIRED', 'Export has expired');
    return ok(res, job);
  });

  router.post('/delete-account', requireAuth(env, 'user'), (req, res) => {
    const user = state.users.find((item) => item.id === req.auth?.userId && item.status === 'active');
    if (!user || !bcrypt.compareSync(req.body?.password ?? '', user.passwordHash)) return failure(res, 401, 'PASSWORD_INVALID', 'Password confirmation is required');
    user.status = 'deleted_pending';
    user.coins = 0;
    for (const session of state.sessions.filter((item) => item.userId === user.id)) session.revokedAt = now();
    return ok(res, { status: user.status, restoreUntil: new Date(Date.now() + 90 * 24 * 60 * 60_000).toISOString(), coinsCleared: true });
  });
}

export function createAppApi() {
  const { app, env } = createBaseApp('app-api');
  const authRouter = express.Router();
  const meRouter = express.Router();
  registerAuthRoutes(authRouter, env);
  registerMeRoutes(meRouter, env);
  registerCourseAppRoutes(app, env);

  app.post('/api/v1/_telemetry/error', (req, res) => {
    const event = { id: randomUUID(), ts: now(), service: 'app-fe', ...req.body };
    state.errorEvents.push(event);
    return created(res, event);
  });
  app.post('/api/v1/_telemetry/events', (req, res) => {
    const event = { id: randomUUID(), ts: now(), ...req.body };
    state.events.push(event);
    return created(res, event);
  });

  app.use('/api/v1/discover', asyncRoute(async (_req, _res, next) => {
    await refreshDiscoverContent();
    next();
  }));

  app.get('/api/v1/discover/categories', (req, res) => {
    const userId = activeUserId(req, env);
    const readCounts = new Map(state.readingProgress.filter((item) => item.userId === userId && item.isCompleted).map((item) => [item.targetId, item]));
    return ok(res, state.categories.filter((category) => category.status === 'active').map((category) => ({ ...category, readCount: state.articles.filter((article) => article.categorySlug === category.slug && article.status === 'published' && readCounts.has(article.id)).length, locked: !category.public && !userId })));
  });

  app.get('/api/v1/discover/categories/:slug/articles', (req, res) => {
    if (gateDiscover(req, res, env, req.params.slug)) return;
    const page = positiveInt(req.query.page, 1);
    const limit = positiveInt(req.query.limit, 20);
    const hskFilter = String(req.query.hsk_level ?? 'all');
    const lengthFilter = String(req.query.length ?? 'all');
    const sort = String(req.query.sort ?? 'latest');
    let rows = state.articles.filter((item) => item.categorySlug === req.params.slug && item.status === 'published');
    if (hskFilter === '1') rows = rows.filter((item) => item.hskLevel <= 1);
    if (hskFilter === '2-3') rows = rows.filter((item) => item.hskLevel >= 2 && item.hskLevel <= 3);
    if (hskFilter === '4-5') rows = rows.filter((item) => item.hskLevel >= 4 && item.hskLevel <= 5);
    if (hskFilter === '6+') rows = rows.filter((item) => item.hskLevel >= 6);
    if (['short', 'medium', 'long'].includes(lengthFilter)) rows = rows.filter((item) => item.length === lengthFilter);
    rows = [...rows].sort((left, right) => sort === 'popular' ? right.viewCount - left.viewCount : Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
    const start = (page - 1) * limit;
    return ok(res, rows.slice(start, start + limit).map(articleListItem), pageMeta(page, limit, rows.length));
  });

  app.get('/api/v1/discover/articles/:slug', (req, res) => {
    const article = assertReadableArticle(req, res, env, req.params.slug);
    if (!article) return;
    article.viewCount += 1;
    const userId = activeUserId(req, env) ?? undefined;
    return ok(res, articlePayload(article, userId));
  });

  app.get('/api/v1/discover/search', (req, res) => {
    const keyword = String(req.query.q ?? '').trim().toLowerCase();
    const locale = localeParam(req);
    const page = positiveInt(req.query.page, 1);
    const limit = positiveInt(req.query.limit, 20);
    let rows = state.articles.filter((article) => article.status === 'published' && canReadCategory(req, env, article.categorySlug));
    if (keyword) {
      rows = rows.filter((article) => [article.titleZh, article.titleTranslations[locale], article.summary[locale], ...article.sentences.map((sentence) => `${sentence.zh} ${sentence.translations[locale]}`)].join(' ').toLowerCase().includes(keyword));
    }
    const start = (page - 1) * limit;
    return ok(res, rows.slice(start, start + limit).map((article) => ({ ...articleListItem(article), highlight: keyword || null })), pageMeta(page, limit, rows.length));
  });

  app.post('/api/v1/discover/articles/:id/progress', requireAuth(env, 'user'), (req, res) => {
    const article = assertReadableArticle(req, res, env, requestParam(req, 'id'));
    if (!article) return;
    const progressPct = Number(req.body?.progress_pct ?? req.body?.progressPct ?? 0);
    const readingTimeDelta = Number(req.body?.reading_time_delta ?? req.body?.readingTimeDelta ?? 0);
    const lastSentenceId = req.body?.last_sentence_id ?? req.body?.lastSentenceId ?? null;
    if (!Number.isFinite(progressPct) || progressPct < 0 || progressPct > 100) return failure(res, 400, 'PROGRESS_INVALID', 'progressPct must be between 0 and 100');
    if (!Number.isFinite(readingTimeDelta) || readingTimeDelta < 0) return failure(res, 400, 'READING_TIME_INVALID', 'readingTimeDelta must be a non-negative number');
    if (lastSentenceId && !article.sentences.some((sentence) => sentence.id === lastSentenceId)) return failure(res, 400, 'SENTENCE_INVALID', 'lastSentenceId is not part of this article');
    const current = state.readingProgress.find((item) => item.userId === req.auth?.userId && item.targetId === article.id);
    const next = { userId: req.auth?.userId ?? '', targetType: 'article' as const, targetId: article.id, lastSentenceId, progressPct, isCompleted: progressPct >= 100 || Boolean(req.body?.is_completed ?? req.body?.isCompleted), readingTimeSeconds: readingTimeDelta, lastReadAt: now() };
    if (current) Object.assign(current, { ...next, readingTimeSeconds: current.readingTimeSeconds + next.readingTimeSeconds });
    else state.readingProgress.push(next);
    state.events.push({ id: randomUUID(), ts: now(), userId: req.auth?.userId, type: next.isCompleted ? 'discover_completed' : 'discover_progress', props: { articleId: article.id, progressPct: next.progressPct } });
    return ok(res, current ?? next);
  });

  app.post('/api/v1/discover/articles/:id/favorite', requireAuth(env, 'user'), (req, res) => {
    const article = assertReadableArticle(req, res, env, requestParam(req, 'id'));
    if (!article) return;
    const index = state.favorites.findIndex((item) => item.userId === req.auth?.userId && item.targetType === 'article' && item.targetId === article.id);
    const favorite = index === -1;
    if (favorite) state.favorites.push({ userId: req.auth?.userId ?? '', targetType: 'article', targetId: article.id, createdAt: now() });
    else state.favorites.splice(index, 1);
    article.favoriteCount = Math.max(0, article.favoriteCount + (favorite ? 1 : -1));
    state.events.push({ id: randomUUID(), ts: now(), userId: req.auth?.userId, type: 'discover_favorite', props: { articleId: article.id, favorite } });
    return ok(res, { favorite, favoriteCount: article.favoriteCount });
  });

  app.post('/api/v1/discover/sentences/:id/note', requireAuth(env, 'user'), (req, res) => {
    const article = state.articles.find((item) => item.status === 'published' && item.sentences.some((sentence) => sentence.id === req.params.id));
    if (!article) return failure(res, 404, 'SENTENCE_NOT_FOUND', 'Sentence not found');
    if (gateDiscover(req, res, env, article.categorySlug)) return;
    const sentence = article.sentences.find((item) => item.id === req.params.id);
    if (!sentence) return failure(res, 404, 'SENTENCE_NOT_FOUND', 'Sentence not found');
    const content = String(req.body?.content ?? '').trim();
    if (!content || content.length > 500) return failure(res, 400, 'NOTE_INVALID', 'Note must be 1-500 characters');
    const existing = state.notes.find((item) => item.userId === req.auth?.userId && item.targetId === sentence.id);
    if (existing) Object.assign(existing, { content, updatedAt: now() });
    else state.notes.push({ id: randomUUID(), userId: req.auth?.userId ?? '', targetType: 'sentence', targetId: sentence.id, content, createdAt: now(), updatedAt: now() });
    return ok(res, state.notes.find((item) => item.userId === req.auth?.userId && item.targetId === sentence.id) ?? null);
  });

  app.post('/api/v1/discover/articles/:id/rating', requireAuth(env, 'user'), (req, res) => {
    const article = assertReadableArticle(req, res, env, requestParam(req, 'id'));
    if (!article) return;
    const rating = Number(req.body?.rating);
    if (!Number.isSafeInteger(rating) || rating < 1 || rating > 5) return failure(res, 400, 'RATING_INVALID', 'Rating must be 1-5');
    const existing = state.ratings.find((item) => item.userId === req.auth?.userId && item.targetId === article.id);
    if (existing) existing.rating = rating;
    else state.ratings.push({ userId: req.auth?.userId ?? '', targetType: 'article', targetId: article.id, rating, comment: req.body?.comment, createdAt: now() });
    const ratings = state.ratings.filter((item) => item.targetId === article.id);
    article.ratingCount = ratings.length;
    article.ratingAvg = Number((ratings.reduce((sum, item) => sum + item.rating, 0) / Math.max(1, ratings.length)).toFixed(2));
    return ok(res, { rating, ratingAvg: article.ratingAvg, ratingCount: article.ratingCount });
  });

  app.post('/api/v1/discover/articles/:id/share-card', requireAuth(env, 'user'), (req, res) => {
    const article = assertReadableArticle(req, res, env, requestParam(req, 'id'));
    if (!article) return;
    const card = { id: randomUUID(), userId: req.auth?.userId, articleId: article.id, width: 1080, height: 1920, url: `seed://share/discover/${article.slug}.png`, qr: `/discover/${article.categorySlug}/${article.slug}?ref=${req.auth?.userId?.slice(0, 6) ?? 'DEV'}`, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60_000).toISOString(), createdAt: now() };
    state.shareCards.push(card);
    state.events.push({ id: randomUUID(), ts: now(), userId: req.auth?.userId, type: 'discover_share', props: { articleId: article.id } });
    return created(res, card);
  });

  app.get('/api/v1/me/discover-summary', requireAuth(env, 'user'), asyncRoute(async (req, res) => {
    await refreshDiscoverContent();
    const completed = state.readingProgress.filter((item) => item.userId === req.auth?.userId && item.isCompleted);
    const favoriteRows = state.favorites.filter((item) => item.userId === req.auth?.userId && item.targetType === 'article');
    return ok(res, { readArticles: completed.length, readWords: completed.reduce((sum, item) => sum + (state.articles.find((article) => article.id === item.targetId)?.wordCount ?? 0), 0), favorites: favoriteRows.length, notes: state.notes.filter((item) => item.userId === req.auth?.userId).length, favoriteArticles: favoriteRows.map((favorite) => state.articles.find((article) => article.id === favorite.targetId)).filter(Boolean).map((article) => article ? articleListItem(article) : null).filter(Boolean), notesList: state.notes.filter((item) => item.userId === req.auth?.userId) });
  }));
  app.get('/api/v1/games', (_req, res) => ok(res, ['hanzi-ninja', 'pinyin-shooter', 'tone-bubbles', 'hanzi-tetris', 'whack-hanzi', 'hanzi-match3', 'hanzi-snake', 'hanzi-rhythm', 'hanzi-runner', 'pinyin-defense', 'memory-match', 'hanzi-slingshot'].map((slug, index) => ({ slug, title: slug.replaceAll('-', ' '), active: true, seconds: 60, recommendedHsk: [(index % 3) + 1] }))));
  app.get('/api/v1/games/:slug/wordpacks', (_req, res) => ok(res, [{ track: 'hsk', stage: 1, available: true }, { track: 'ecommerce', stage: 9, available: Boolean(_req.headers.authorization) }]));
  app.get('/api/v1/novels/preview', (_req, res) => ok(res, [{ slug: 'ancient-romance-demo', freeChapter: 1, loginUnlocksAll: true }]));

  app.use('/api/auth', authRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/me', meRouter);
  app.use('/api/v1/me', meRouter);
  app.post('/api/me/restore-account', requireAuth(env, 'user'), (req, res) => {
    const user = state.users.find((item) => item.id === req.auth?.userId);
    if (user?.status === 'deleted_pending') user.status = 'active';
    return ok(res, { restored: user?.status === 'active' });
  });

  app.use((req, res) => failure(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
  installErrorHandler(app);
  return app;
}