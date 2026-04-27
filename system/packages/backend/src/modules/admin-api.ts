import bcrypt from 'bcryptjs';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { paymentAdapter } from '@zhiyu/adapters';
import { requireAuth, requireRole, signToken } from '../runtime/auth.js';
import { createBaseApp, installErrorHandler } from '../runtime/base-app.js';
import { audit, now, persistDiscoverContent, publicUser, refreshDiscoverContent, state } from '../runtime/state.js';
import { created, failure, ok, pageMeta } from '../runtime/response.js';
import type { DiscoverArticleRecord, DiscoverSentenceRecord } from '../runtime/state.js';
import { courseCatalogRows } from '../runtime/courses.js';
import { registerCourseAdminRoutes } from './course-admin-api.js';

const writeRoles = ['admin', 'editor'] as const;
const adminLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, handler: (_req, res) => failure(res, 429, 'RATE_LIMITED', 'Too many requests') });
const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function param(req: express.Request, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function headerText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(',') : value ?? 'unknown';
}

function adminAudit(req: express.Request, action: string, resourceType: string, resourceId: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const actor = state.adminUsers.find((item) => item.id === req.auth?.userId);
  return audit({ actorId: req.auth?.userId ?? 'anonymous', actorEmail: actor?.email ?? 'unknown', action, resourceType, resourceId, before, after, ip: req.ip ?? 'unknown', userAgent: headerText(req.headers['user-agent']) });
}

function findDiscoverArticle(id: string) {
  return state.articles.find((item) => item.id === id || item.slug === id);
}

function redlineHits(text: string) {
  return state.redLineRules.filter((rule) => text.toLowerCase().includes(String(rule.term).toLowerCase()));
}

const articleStatuses = ['draft', 'review', 'published', 'archived'] as const;

function validArticleStatus(value: unknown) {
  return typeof value === 'string' && articleStatuses.includes(value as (typeof articleStatuses)[number]);
}

function localizedValues(value: unknown) {
  if (!value || typeof value !== 'object') return [] as string[];
  return Object.values(value as Record<string, unknown>).filter((item): item is string => typeof item === 'string');
}

export function createAdminApi() {
  const { app, env } = createBaseApp('admin-api');
  const api = express.Router();

  app.post('/admin/api/auth/login', adminLimiter, (req, res) => {
    const admin = state.adminUsers.find((item) => item.email.toLowerCase() === String(req.body?.email ?? '').toLowerCase());
    if (!admin) return failure(res, 401, 'ADMIN_INVALID_CREDENTIALS', 'Admin email or password is incorrect');
    if (admin.lockedUntil && Date.parse(admin.lockedUntil) > Date.now()) return failure(res, 423, 'ADMIN_LOCKED', 'Admin account is locked');
    if (admin.status !== 'active') return failure(res, 403, 'ADMIN_DISABLED', 'Admin account is disabled');
    if (!bcrypt.compareSync(req.body?.password ?? '', admin.passwordHash)) {
      admin.failedAttempts += 1;
      if (admin.failedAttempts >= 5) admin.lockedUntil = new Date(Date.now() + 30 * 60_000).toISOString();
      adminAudit(req, 'admin.login_failed', 'admin_user', admin.id, null, { reason: 'bad_password' });
      return failure(res, 401, 'ADMIN_INVALID_CREDENTIALS', 'Admin email or password is incorrect');
    }
    if (req.body?.totp !== '123456') {
      admin.failedAttempts += 1;
      if (admin.failedAttempts >= 5) admin.lockedUntil = new Date(Date.now() + 30 * 60_000).toISOString();
      return failure(res, 401, 'TOTP_REQUIRED', 'TOTP code is required; dev code is 123456');
    }
    admin.failedAttempts = 0;
    admin.lockedUntil = null;
    admin.lastLoginAt = now();
    admin.isOnline = true;
    const token = signToken(env, { userId: admin.id, email: admin.email, role: admin.role, kind: 'admin' }, '8h');
    res.cookie('zy_admin', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 8 * 60 * 60_000 });
    adminAudit(req, 'admin.login', 'admin_user', admin.id, null, { email: admin.email, role: admin.role });
    return ok(res, { token, admin: { ...admin, passwordHash: undefined } });
  });

  app.post('/admin/api/auth/totp/verify', (_req, res) => ok(res, { verified: _req.body?.totp === '123456' }));
  api.use(requireAuth(env, 'admin'));
  registerCourseAdminRoutes(api, adminAudit);

  api.get('/dashboard/summary', (_req, res) => ok(res, { dau: 128, wau: 860, mau: 2400, orders: state.orders.length, gmv: 16, churn: 0.04, nps: null, csPending: 3, alerts: state.securityEvents.length }));
  api.get('/dashboard/trends', (_req, res) => ok(res, [7, 30, 90].map((days) => ({ days, registrations: days * 12, orders: days, errors: Math.max(1, Math.round(days / 10)) }))));

  api.get('/users', requireRole(['admin', 'cs']), (_req, res) => ok(res, state.users.map(publicUser), pageMeta(1, 20, state.users.length)));
  api.get('/users/:id', requireRole(['admin', 'cs']), (req, res) => {
    const userId = param(req, 'id');
    const user = state.users.find((item) => item.id === userId);
    if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    return ok(res, { profile: publicUser(user), orders: state.orders.filter((item) => item.userId === user.id), sessions: state.sessions.filter((item) => item.userId === user.id), audits: state.audits.filter((item) => item.resourceId === user.id) });
  });
  api.post('/users/:id/freeze', requireRole(['admin', 'cs']), (req, res) => {
    const user = state.users.find((item) => item.id === param(req, 'id'));
    if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    const before = publicUser(user);
    user.status = 'suspended';
    adminAudit(req, 'user.freeze', 'user', user.id, before, { reason: req.body?.reason, status: user.status });
    return ok(res, { profile: publicUser(user) });
  });
  api.post('/users/:id/unfreeze', requireRole(['admin']), (req, res) => {
    const user = state.users.find((item) => item.id === param(req, 'id'));
    if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    const before = publicUser(user);
    user.status = 'active';
    adminAudit(req, 'user.unfreeze', 'user', user.id, before, { status: user.status });
    return ok(res, { profile: publicUser(user) });
  });
  api.post('/users/:id/reset-password', requireRole(['admin']), (req, res) => {
    const user = state.users.find((item) => item.id === param(req, 'id'));
    if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    adminAudit(req, 'user.reset_password', 'user', user.id, null, { forced: true, reason: req.body?.reason });
    return ok(res, { resetTokenDevOnly: 'RESET123' });
  });
  api.post('/users/:id/force-logout', requireRole(['admin', 'cs']), (req, res) => {
    const userId = param(req, 'id');
    const user = state.users.find((item) => item.id === userId);
    if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
    for (const session of state.sessions.filter((item) => item.userId === userId)) session.revokedAt = now();
    adminAudit(req, 'user.force_logout', 'user', userId, null, { revoked: true });
    return ok(res, { revoked: true });
  });
  api.post('/users/:id/coins/grant', requireRole(['admin']), (req, res) => changeCoins(req, res, Math.abs(Number(req.body?.amount ?? 0)), 'coin.grant'));
  api.post('/users/:id/coins/deduct', requireRole(['admin']), (req, res) => changeCoins(req, res, -Math.abs(Number(req.body?.amount ?? 0)), 'coin.deduct'));
  api.post('/users/:id/impersonate', requireRole(['admin']), (req, res) => {
    const userId = param(req, 'id');
    adminAudit(req, 'user.impersonate', 'user', userId, null, { readonly: true });
    return ok(res, { readonlyToken: `impersonate_${userId}` });
  });

  api.get('/orders', (_req, res) => ok(res, state.orders, pageMeta(1, 20, state.orders.length)));
  api.post('/orders/:id/refund', requireRole(['admin']), asyncRoute(async (req, res) => {
    const order = state.orders.find((item) => item.id === param(req, 'id'));
    if (!order) return failure(res, 404, 'ORDER_NOT_FOUND', 'Order not found');
    const before = { ...order };
    await paymentAdapter.refund({ orderId: order.id, reason: req.body?.reason ?? 'manual approval' });
    order.status = 'refund_pending';
    order.webhookHistory.push('dummy.refund.pending');
    adminAudit(req, 'order.refund', 'order', order.id, before, order);
    return ok(res, order);
  }));

  api.get('/coins/summary', (_req, res) => ok(res, { issued: state.users.reduce((sum, user) => sum + user.coins, 0), consumed: 120, suspicious: state.users.filter((user) => user.coins > 700).map(publicUser) }));
  api.use('/content/articles', asyncRoute(async (_req, _res, next) => {
    await refreshDiscoverContent();
    next();
  }));

  api.get('/content/:module', (req, res) => ok(res, contentRows(param(req, 'module'))));

  api.get('/content/articles/categories', (_req, res) => ok(res, state.categories));
  api.patch('/content/articles/categories/:slug', requireRole([...writeRoles]), asyncRoute(async (req, res) => {
    const category = state.categories.find((item) => item.slug === param(req, 'slug'));
    if (!category) return failure(res, 404, 'CATEGORY_NOT_FOUND', 'Discover China category not found');
    const before = { ...category };
    Object.assign(category, {
      nameTranslations: req.body?.nameTranslations ?? req.body?.name_translations ?? category.nameTranslations,
      description: req.body?.description ?? category.description,
      coverImageUrl: req.body?.coverImageUrl ?? req.body?.cover_image_url ?? category.coverImageUrl,
      themeColor: req.body?.themeColor ?? req.body?.theme_color ?? category.themeColor,
      status: req.body?.status ?? category.status
    });
    adminAudit(req, 'discover.category.update', 'content_category', category.slug, before, category);
    await persistDiscoverContent();
    return ok(res, category);
  }));

  api.get('/content/articles/access-model', (_req, res) => ok(res, { anonymousOpenCategories: state.categories.filter((item) => item.public).map((item) => item.slug), loginUnlocksAll: true, restrictedCategories: state.categories.filter((item) => !item.public).map((item) => item.slug), noBodyLeakForRestricted: true, source: 'content/china/00-index.md' }));
  api.get('/content/articles/:id', (req, res) => {
    const article = findDiscoverArticle(param(req, 'id'));
    if (!article) return failure(res, 404, 'ARTICLE_NOT_FOUND', 'Discover China article not found');
    return ok(res, article);
  });
  api.get('/content/articles/:id/versions', (req, res) => ok(res, state.contentVersions.filter((item) => item['articleId'] === param(req, 'id'))));

  api.post('/content/articles', requireRole([...writeRoles]), asyncRoute(async (req, res) => {
    const category = state.categories.find((item) => item.slug === (req.body?.categorySlug ?? req.body?.category_slug ?? 'history')) ?? state.categories[0];
    if (!category) return failure(res, 404, 'CATEGORY_NOT_FOUND', 'Discover China category not found');
    const titleZh = String(req.body?.titleZh ?? req.body?.title_zh ?? '新发现中国文章');
    const slug = String(req.body?.slug ?? `draft-${Date.now()}`);
    if (state.articles.some((item) => item.slug === slug)) return failure(res, 409, 'ARTICLE_SLUG_EXISTS', 'Discover China article slug already exists');
    const article: DiscoverArticleRecord = {
      id: randomUUID(), categoryId: category.id, categorySlug: category.slug, slug, titleZh,
      titleTranslations: req.body?.titleTranslations ?? { en: titleZh, vi: titleZh, th: titleZh, id: titleZh },
      summary: req.body?.summary ?? { en: 'Draft summary', vi: 'Draft summary', th: 'Draft summary', id: 'Draft summary' },
      coverImageUrl: req.body?.coverImageUrl ?? `seed://images/discover-china/${category.slug}-draft.webp`, hskLevel: Number(req.body?.hskLevel ?? req.body?.hsk_level ?? 2), wordCount: Number(req.body?.wordCount ?? req.body?.word_count ?? 360), readingMinutes: Number(req.body?.readingMinutes ?? req.body?.reading_minutes ?? 4), length: req.body?.length ?? 'short', tags: req.body?.tags ?? [category.slug], keyPoints: req.body?.keyPoints ?? { en: [], vi: [], th: [], id: [] }, status: 'draft', publishedAt: '', viewCount: 0, ratingAvg: 0, ratingCount: 0, favoriteCount: 0, createdBy: req.auth?.userId ?? null, reviewedBy: null, createdAt: now(), updatedAt: now(), sentences: []
    };
    state.articles.unshift(article);
    state.contentVersions.unshift({ id: randomUUID(), articleId: article.id, action: 'created', snapshot: article, createdAt: now() });
    adminAudit(req, 'discover.article.create', 'content_article', article.id, null, article);
    await persistDiscoverContent();
    return created(res, article);
  }));

  api.patch('/content/articles/:id', requireRole([...writeRoles]), asyncRoute(async (req, res) => {
    const article = findDiscoverArticle(param(req, 'id'));
    if (!article) return failure(res, 404, 'ARTICLE_NOT_FOUND', 'Discover China article not found');
    const categorySlug = req.body?.categorySlug ?? req.body?.category_slug ?? article.categorySlug;
    const category = state.categories.find((item) => item.slug === categorySlug);
    if (!category) return failure(res, 404, 'CATEGORY_NOT_FOUND', 'Discover China category not found');
    if (req.body?.status !== undefined && !validArticleStatus(req.body.status)) return failure(res, 400, 'ARTICLE_STATUS_INVALID', 'Article status is invalid');
    const before = { ...article, sentences: article.sentences.map((item) => ({ ...item })) };
    Object.assign(article, {
      categoryId: category.id,
      categorySlug: category.slug,
      titleZh: req.body?.titleZh ?? req.body?.title_zh ?? article.titleZh,
      titleTranslations: req.body?.titleTranslations ?? req.body?.title_translations ?? article.titleTranslations,
      summary: req.body?.summary ?? article.summary,
      hskLevel: req.body?.hskLevel ?? req.body?.hsk_level ?? article.hskLevel,
      length: req.body?.length ?? article.length,
      status: req.body?.status ?? article.status,
      tags: req.body?.tags ?? article.tags,
      keyPoints: req.body?.keyPoints ?? req.body?.key_points ?? article.keyPoints,
      updatedAt: now()
    });
    state.contentVersions.unshift({ id: randomUUID(), articleId: article.id, action: 'updated', snapshot: article, createdAt: now() });
    adminAudit(req, 'discover.article.update', 'content_article', article.id, before, article);
    await persistDiscoverContent();
    return ok(res, article);
  }));

  api.delete('/content/articles/:id', requireRole([...writeRoles]), asyncRoute(async (req, res) => {
    const article = findDiscoverArticle(param(req, 'id'));
    if (!article) return failure(res, 404, 'ARTICLE_NOT_FOUND', 'Discover China article not found');
    const before = { ...article };
    article.status = 'archived';
    article.updatedAt = now();
    adminAudit(req, 'discover.article.archive', 'content_article', article.id, before, article);
    await persistDiscoverContent();
    return ok(res, article);
  }));

  api.post('/content/articles/:id/sentences', requireRole([...writeRoles]), asyncRoute(async (req, res) => {
    const article = findDiscoverArticle(param(req, 'id'));
    if (!article) return failure(res, 404, 'ARTICLE_NOT_FOUND', 'Discover China article not found');
    const zh = String(req.body?.zh ?? '新的中文句子。');
    const sentence: DiscoverSentenceRecord = { id: randomUUID(), articleId: article.id, sequenceNumber: article.sentences.length + 1, zh, pinyin: req.body?.pinyin ?? 'xin de zhong wen ju zi', pinyinTones: req.body?.pinyinTones ?? req.body?.pinyin_tones ?? 'xin1 de zhong1 wen2 ju4 zi', translations: req.body?.translations ?? { en: zh, vi: zh, th: zh, id: zh }, audio: req.body?.audio ?? { default: { url: `seed://audio/discover-china/${article.slug}-${article.sentences.length + 1}.mp3`, durationMs: 1800 } }, hskLevel: Number(req.body?.hskLevel ?? req.body?.hsk_level ?? article.hskLevel), tags: req.body?.tags ?? [], keyPoint: req.body?.keyPoint ?? req.body?.key_point ?? { en: '', vi: '', th: '', id: '' } };
    article.sentences.push(sentence);
    article.updatedAt = now();
    adminAudit(req, 'discover.sentence.create', 'content_sentence', sentence.id, null, sentence);
    await persistDiscoverContent();
    return created(res, sentence);
  }));

  api.patch('/content/articles/:id/sentences/:sentenceId', requireRole([...writeRoles]), asyncRoute(async (req, res) => {
    const article = findDiscoverArticle(param(req, 'id'));
    const sentence = article?.sentences.find((item) => item.id === param(req, 'sentenceId'));
    if (!article || !sentence) return failure(res, 404, 'SENTENCE_NOT_FOUND', 'Discover China sentence not found');
    const before = { ...sentence };
    Object.assign(sentence, { zh: req.body?.zh ?? sentence.zh, pinyin: req.body?.pinyin ?? sentence.pinyin, pinyinTones: req.body?.pinyinTones ?? req.body?.pinyin_tones ?? sentence.pinyinTones, translations: req.body?.translations ?? sentence.translations, audio: req.body?.audio ?? sentence.audio, keyPoint: req.body?.keyPoint ?? req.body?.key_point ?? sentence.keyPoint, hskLevel: req.body?.hskLevel ?? req.body?.hsk_level ?? sentence.hskLevel });
    article.updatedAt = now();
    adminAudit(req, 'discover.sentence.update', 'content_sentence', sentence.id, before, sentence);
    await persistDiscoverContent();
    return ok(res, sentence);
  }));

  api.post('/content/articles/:id/redline', requireRole(['admin', 'editor', 'reviewer']), (req, res) => {
    const article = findDiscoverArticle(param(req, 'id'));
    if (!article) return failure(res, 404, 'ARTICLE_NOT_FOUND', 'Discover China article not found');
    const text = [article.titleZh, ...localizedValues(article.titleTranslations), ...localizedValues(article.summary), ...Object.values(article.keyPoints).flat(), ...article.sentences.flatMap((item) => [item.zh, ...localizedValues(item.translations), ...localizedValues(item.keyPoint)]), String(req.body?.draft ?? '')].join('\n');
    const hits = redlineHits(text);
    adminAudit(req, 'discover.redline.check', 'content_article', article.id, null, { hits });
    return ok(res, { passed: hits.length === 0, hits });
  });

  api.post('/content/articles/import', requireRole(['admin', 'editor']), asyncRoute(async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return failure(res, 400, 'IMPORT_EMPTY', 'Import file must include at least one item');
    const result = { id: randomUUID(), status: 'validated', imported: items.length, schemaVersion: req.body?.$schema_version ?? req.body?.schemaVersion ?? '1.0', module: 'discover-china', createdAt: now() };
    state.contentImports.unshift(result);
    adminAudit(req, 'discover.import', 'content_import', result.id, null, result);
    await persistDiscoverContent();
    return created(res, result);
  }));

  for (const action of ['publish', 'withdraw', 'copy', 'version', 'preview']) {
    api.post('/content/:module/:id/' + action, requireRole([...writeRoles]), asyncRoute(async (req, res) => {
      const moduleName = param(req, 'module');
      const resourceId = param(req, 'id');
      const article = moduleName === 'articles' ? findDiscoverArticle(resourceId) : null;
      if (moduleName === 'articles' && !article) return failure(res, 404, 'ARTICLE_NOT_FOUND', 'Discover China article not found');
      const before = article ? { ...article } : null;
      if (article && action === 'publish') { article.status = 'published'; article.publishedAt = now(); article.updatedAt = now(); }
      if (article && action === 'withdraw') { article.status = 'draft'; article.updatedAt = now(); }
      if (article && action === 'copy') {
        const copyId = randomUUID();
        state.articles.unshift({ ...article, id: copyId, slug: `${article.slug}-copy-${Date.now()}`, titleZh: `${article.titleZh} Copy`, status: 'draft', createdAt: now(), updatedAt: now(), sentences: article.sentences.map((sentence) => ({ ...sentence, id: randomUUID(), articleId: copyId })) });
      }
      if (article && action === 'version') state.contentVersions.unshift({ id: randomUUID(), articleId: article.id, action: 'snapshot', snapshot: article, createdAt: now() });
      adminAudit(req, `content.${action}`, moduleName, resourceId, before, { body: req.body, article });
      if (article && action !== 'preview') await persistDiscoverContent();
      return ok(res, { module: moduleName, id: resourceId, action, status: action === 'publish' ? 'published' : action === 'withdraw' ? 'draft' : article?.status ?? 'draft', previewUrl: moduleName === 'articles' ? `/discover/${article?.categorySlug ?? 'history'}/${article?.slug ?? resourceId}?preview=admin` : undefined });
    }));
  }

  api.post('/factory/import', requireRole(['admin', 'editor']), (req, res) => {
    adminAudit(req, 'factory.import', 'content_factory', 'manual', null, { format: req.body?.format ?? 'csv' });
    return created(res, { status: 'queued', format: req.body?.format ?? 'csv', note: 'v1.5 workflow placeholder; manual import accepted' });
  });

  api.get('/review/queue', (_req, res) => ok(res, state.reviewQueue));
  api.post('/review/:id/approve', requireRole(['admin', 'reviewer', 'editor']), reviewAction('approved'));
  api.post('/review/:id/reject', requireRole(['admin', 'reviewer', 'editor']), reviewAction('rejected'));
  api.post('/review/:id/edits', requireRole(['admin', 'reviewer', 'editor']), reviewAction('requested_changes'));

  api.get('/cs/queues', requireRole(['admin', 'cs']), (_req, res) => ok(res, { waiting: [{ id: 'cs-1', lang: 'vi', subject: 'billing' }], current: null, quickReplies: ['Hello, how can I help?', 'Please share your account email.'] }));
  api.post('/cs/reply', requireRole(['admin', 'cs']), (req, res) => { adminAudit(req, 'cs.reply', 'conversation', req.body?.conversationId ?? 'cs-1', null, req.body); return ok(res, { sent: true }); });

  api.get('/referral/summary', (_req, res) => ok(res, { totalCommissionZc: 1800, pendingZc: 400, issuedZc: 1400, cashWithdrawal: false, alerts: state.securityEvents }));
  api.post('/referral/:id/freeze', requireRole(['admin']), (req, res) => { adminAudit(req, 'referral.freeze', 'referrer', param(req, 'id'), null, req.body); return ok(res, { frozen: true }); });

  api.get('/flags', (_req, res) => ok(res, state.featureFlags));
  api.patch('/flags/:key', requireRole(['admin']), (req, res) => {
    const key = param(req, 'key');
    const flag = state.featureFlags.find((item) => item.key === key);
    if (!flag) return failure(res, 404, 'FLAG_NOT_FOUND', 'Feature flag not found');
    const before = { ...flag };
    const patch: Record<string, unknown> = {};
    for (const field of ['value', 'description', 'rollout']) {
      if (Object.prototype.hasOwnProperty.call(req.body ?? {}, field)) patch[field] = req.body[field];
    }
    Object.assign(flag, patch, { updatedAt: now() });
    adminAudit(req, 'flag.update', 'feature_flag', flag.key, before, flag);
    return ok(res, flag);
  });

  api.get('/audit', requireRole(['admin']), (_req, res) => ok(res, state.audits, pageMeta(1, 50, state.audits.length)));
  api.post('/exports', requireRole(['admin', 'editor']), (req, res) => {
    const job = { id: randomUUID(), scope: req.body?.scope ?? 'users', format: req.body?.format ?? 'csv', status: 'completed', fileUrl: `seed://exports/admin-${Date.now()}.csv`, createdAt: now() };
    state.exports.push(job);
    adminAudit(req, 'export.create', 'export_job', String(job.id), null, job);
    return created(res, job);
  });
  api.get('/exports/:id', requireRole(['admin', 'editor']), (req, res) => ok(res, state.exports.find((item) => item['id'] === param(req, 'id')) ?? null));

  api.get('/announcements', (_req, res) => ok(res, state.announcements));
  api.post('/announcements', requireRole(['admin', 'editor']), (req, res) => {
    const item = { id: randomUUID(), ...req.body, status: req.body?.status ?? 'draft', createdAt: now() };
    state.announcements.push(item);
    adminAudit(req, 'announcement.create', 'announcement', item.id, null, item);
    return created(res, item);
  });

  api.get('/security/events', requireRole(['admin']), (_req, res) => ok(res, state.securityEvents));
  api.post('/security/blocklist', requireRole(['admin']), (req, res) => {
    const item = { id: randomUUID(), ...req.body, createdAt: now() };
    state.blockedEntities.push(item);
    adminAudit(req, 'security.blocklist.create', 'blocked_entity', item.id, null, item);
    return created(res, item);
  });
  api.post('/security/red-line-rules', requireRole(['admin']), (req, res) => {
    const item = { id: randomUUID(), ...req.body, updatedAt: now() };
    state.redLineRules.push(item);
    adminAudit(req, 'security.red_line_rule.create', 'red_line_rule', item.id, null, item);
    return created(res, item);
  });
  api.get('/compliance/status', (_req, res) => ok(res, { privacyPolicy: 'draft-4-locale-ready', terms: 'draft-4-locale-ready', cookieConsent: 'implemented', dpoContact: 'configured', refunds: 'draft' }));

  app.use('/admin/api', api);
  app.use((req, res) => failure(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
  installErrorHandler(app);
  return app;
}

function changeCoins(req: express.Request, res: express.Response, delta: number, action: string) {
  if (!req.body?.reason) return failure(res, 400, 'REASON_REQUIRED', 'Manual coin adjustment requires a reason');
  const amount = Number(req.body?.amount ?? 0);
  if (!Number.isSafeInteger(amount) || amount <= 0) return failure(res, 400, 'COIN_AMOUNT_INVALID', 'Coin amount must be a positive integer');
  const user = state.users.find((item) => item.id === param(req, 'id'));
  if (!user) return failure(res, 404, 'USER_NOT_FOUND', 'User not found');
  if (user.coins + delta < 0) return failure(res, 400, 'COIN_BALANCE_INVALID', 'Coin balance cannot become negative');
  const before = publicUser(user);
  user.coins += delta;
  adminAudit(req, action, 'user', user.id, before, { coins: user.coins, delta, reason: req.body.reason });
  return ok(res, { profile: publicUser(user), delta });
}

function contentRows(moduleName: string) {
  if (moduleName === 'articles') return state.articles.map((item) => ({ id: item.id, slug: item.slug, title: item.titleZh, status: item.status, category: item.categorySlug, hskLevel: item.hskLevel, sentences: item.sentences.length, access: state.categories.find((category) => category.slug === item.categorySlug)?.public ? 'anonymous' : 'login', updatedAt: item.updatedAt }));
  if (moduleName === 'courses') return courseCatalogRows();
  if (moduleName === 'games') return ['hanzi-ninja', 'pinyin-shooter', 'tone-bubbles'].map((slug) => ({ id: slug, title: slug, status: 'active', wordpacks: 1 }));
  if (moduleName === 'novels') return [{ id: 'ancient-romance-demo', title: 'Ancient Romance Demo', status: 'draft', chapters: 3 }];
  return [];
}

function reviewAction(status: string) {
  return (req: express.Request, res: express.Response) => {
    const item = state.reviewQueue.find((row) => row.id === param(req, 'id'));
    if (!item) return failure(res, 404, 'REVIEW_ITEM_NOT_FOUND', 'Review item not found');
    const before = { ...item };
    item.status = status;
    item.notes = req.body?.reason ?? req.body?.notes ?? item.notes;
    item.edits = req.body?.edits ?? item.edits;
    adminAudit(req, `review.${status}`, item.resourceType, item.id, before, item);
    return ok(res, item);
  };
}