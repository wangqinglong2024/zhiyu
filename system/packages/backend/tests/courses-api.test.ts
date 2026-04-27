import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAdminApi } from '../src/modules/admin-api';
import { createAppApi } from '../src/modules/app-api';

describe('course app api PRD path', () => {
  const app = createAppApi();

  it('serves tracks, free lesson content, safe quiz payload and reports', async () => {
    const email = `course-${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({ email, password: 'Password123!', native_lang: 'en', privacyAccepted: true });
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
    const token = login.body.data.accessToken;

    const tracks = await request(app).get('/api/v1/learn/tracks').set('authorization', `Bearer ${token}`);
    expect(tracks.status).toBe(200);
    expect(tracks.body.data).toHaveLength(4);
    expect(tracks.body.data[0].stages).toHaveLength(12);

    const stage = await request(app).get('/api/v1/learn/stages/cr-hsk-s01').set('authorization', `Bearer ${token}`);
    expect(stage.body.data.chapters).toHaveLength(12);
    expect(stage.body.data.chapters[0].hasAccess).toBe(true);
    expect(stage.body.data.chapters[3].hasAccess).toBe(false);

    const invalidStage = await request(app).get('/api/v1/learn/stages/cr-hsk-s99').set('authorization', `Bearer ${token}`);
    expect(invalidStage.status).toBe(404);

    const lesson = await request(app).get('/api/v1/learn/lessons/cr-hsk-s01-c01-l01').set('authorization', `Bearer ${token}`);
    expect(lesson.body.data.knowledgePoints).toHaveLength(12);
    const quizId = lesson.body.data.quizId;
    const quiz = await request(app).get(`/api/v1/learn/quizzes/${quizId}`).set('authorization', `Bearer ${token}`);
    expect(quiz.status).toBe(200);
    expect(quiz.body.data.questions).toHaveLength(10);
    expect(quiz.body.data.questions[0].correctAnswer).toBeUndefined();

    const responses = quiz.body.data.questions.map((question: { id: string; type: string }) => ({ questionId: question.id, answer: question.type === 'Q8' ? ['2', '0', '1'] : '0' }));
    const submit = await request(app).post(`/api/v1/learn/quizzes/${quizId}/submit`).set('authorization', `Bearer ${token}`).send({ responses, durationSeconds: 120 });
    expect(submit.status).toBe(200);
    expect(submit.body.data.isPassed).toBe(true);

    const report = await request(app).get('/api/v1/learn/reports/lesson/cr-hsk-s01-c01-l01').set('authorization', `Bearer ${token}`);
    expect(report.status).toBe(200);
    expect(report.body.data.recommendations.length).toBeGreaterThan(0);
  });

  it('uses dummy checkout for cross-stage purchase permissions', async () => {
    const email = `buyer-${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({ email, password: 'Password123!', native_lang: 'en', privacyAccepted: true });
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
    const token = login.body.data.accessToken;

    const before = await request(app).get('/api/v1/learn/permissions?track_code=ec&stage_no=9&chapter_no=1').set('authorization', `Bearer ${token}`);
    expect(before.body.data.hasAccess).toBe(false);
    const checkout = await request(app).post('/api/v1/learn/checkout/dummy').set('authorization', `Bearer ${token}`).send({ trackCode: 'ec', stageNo: 9, purchaseType: 'single_stage' });
    expect(checkout.status).toBe(201);
    const after = await request(app).get('/api/v1/learn/permissions?track_code=ec&stage_no=9&chapter_no=1').set('authorization', `Bearer ${token}`);
    expect(after.body.data.hasAccess).toBe(true);

    const pack = await request(app).post('/api/v1/learn/checkout/dummy').set('authorization', `Bearer ${token}`).send({ trackCode: 'factory', stageNo: 4, purchaseType: 'stage_nine_pack' });
    expect(pack.status).toBe(201);
    const beforePack = await request(app).get('/api/v1/learn/permissions?track_code=factory&stage_no=3&chapter_no=1').set('authorization', `Bearer ${token}`);
    expect(beforePack.body.data.hasAccess).toBe(false);
    const endOfPack = await request(app).get('/api/v1/learn/permissions?track_code=factory&stage_no=12&chapter_no=1').set('authorization', `Bearer ${token}`);
    expect(endOfPack.body.data.hasAccess).toBe(true);
  });
});

describe('course admin api PRD path', () => {
  const app = createAdminApi();

  it('serves course tree, validates seed import and grants permissions with audit', async () => {
    const login = await request(app).post('/admin/api/auth/login').send({ email: 'admin@example.com', password: 'Password123!', totp: '123456' });
    const token = login.body.data.token;
    const tree = await request(app).get('/admin/api/content/courses/tree').set('authorization', `Bearer ${token}`);
    expect(tree.status).toBe(200);
    expect(tree.body.data).toHaveLength(4);

    const items = Array.from({ length: 24 }, (_, index) => ({ slug: `seed-${index}`, module_specific: { track: 'hsk', stage: 1 }, i18n: { 'zh-CN': { title: 't', summary: 's', body: 'b' } } }));
    const dryRun = await request(app).post('/admin/api/content/courses/import/dry-run').set('authorization', `Bearer ${token}`).send({ module: 'courses', items });
    expect(dryRun.status).toBe(200);
    expect(dryRun.body.data.status).toBe('validated');

    const grant = await request(app).post('/admin/api/users/user-demo/courses-permissions/grant').set('authorization', `Bearer ${token}`).send({ trackCode: 'hsk', stageNo: 9, reason: 'vitest' });
    expect(grant.status).toBe(200);
    const audit = await request(app).get('/admin/api/audit').set('authorization', `Bearer ${token}`);
    expect(audit.body.data.some((row: { action: string }) => row.action === 'course.permission.grant')).toBe(true);
  });
});