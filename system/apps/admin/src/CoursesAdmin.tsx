import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, CheckCircle2, Database, FileJson, Gamepad2, GitBranch, Languages, LockKeyhole, Search, ShieldCheck, Upload } from 'lucide-react';
import { Badge, Button, Card, DataTable, Input, SearchInput, TextArea, Toast } from '@zhiyu/ui';
import { adminRequest } from './api';

type Row = Record<string, unknown>;
type Track = { code: string; nameZh: string; stages: Stage[] };
type Stage = { id: string; stageNo: number; nameZh: string; chapters: Chapter[] };
type Chapter = { id: string; chapterNo: number; nameZh: string; isFree: boolean; accessReason?: string };

export function CoursesAdmin() {
  const [tree, setTree] = useState<Track[]>([]);
  const [selected, setSelected] = useState<{ track: string; stage: number; chapter: number; lesson: number }>({ track: 'daily', stage: 1, chapter: 1, lesson: 1 });
  const [lesson, setLesson] = useState<Row | null>(null);
  const [questions, setQuestions] = useState<Row[]>([]);
  const [coverage, setCoverage] = useState<Row[]>([]);
  const [permissions, setPermissions] = useState<Row | null>(null);
  const [importResult, setImportResult] = useState<Row | null>(null);
  const [message, setMessage] = useState('');
  const lessonId = useMemo(() => `cr-${selected.track}-s${String(selected.stage).padStart(2, '0')}-c${String(selected.chapter).padStart(2, '0')}-l${String(selected.lesson).padStart(2, '0')}`, [selected]);

  useEffect(() => { adminRequest<Track[]>('/admin/api/content/courses/tree').then((response) => setTree(response.data ?? [])); }, []);
  useEffect(() => { adminRequest<Row>(`/admin/api/content/courses/lessons/${lessonId}`).then((response) => setLesson(response.data)); adminRequest<Row[]>(`/admin/api/content/courses/questions?lesson_id=${lessonId}`).then((response) => setQuestions(response.data ?? [])); }, [lessonId]);
  useEffect(() => { adminRequest<Row[]>('/admin/api/content/courses/translation-coverage').then((response) => setCoverage(response.data ?? [])); adminRequest<Row>('/admin/api/users/user-demo/courses-permissions').then((response) => setPermissions(response.data)); }, []);

  async function patchLesson() {
    const response = await adminRequest<Row>(`/admin/api/content/courses/lessons/${lessonId}`, { method: 'PATCH', body: JSON.stringify({ status: 'published', updatedBy: 'admin-ui' }) });
    setMessage(response.error?.message ?? 'Lesson saved and audited');
  }

  async function grant() {
    const response = await adminRequest<Row>('/admin/api/users/user-demo/courses-permissions/grant', { method: 'POST', body: JSON.stringify({ trackCode: selected.track, stageNo: selected.stage, reason: 'manual admin validation' }) });
    setPermissions({ purchases: response.data, matrix: [] });
    setMessage(response.error?.message ?? 'Manual grant effective within 5 seconds');
  }

  async function dryRunImport(commit = false) {
    const items = Array.from({ length: 24 }, (_, index) => ({ slug: `admin-course-seed-${index + 1}`, i18n: { 'zh-CN': { title: `课程 ${index + 1}`, summary: '后台导入校验', body: '课程 seed 项' } }, module_specific: { track: selected.track, stage: 1, chapter: 1, lesson: index + 1 } }));
    const response = await adminRequest<Row>(`/admin/api/content/courses/import/${commit ? 'commit' : 'dry-run'}`, { method: 'POST', body: JSON.stringify({ $schema_version: '1.0', module: 'courses', items }) });
    setImportResult(response.data);
  }

  return <section className="admin-page stack"><div className="admin-section-head"><div><Badge>AD-FR-006 · ACR-01~10</Badge><h2>课程内容管理</h2><p>4 轨道 → 12 阶段 → 12 章 → 12 节 → 知识点 / 题库；所有写操作走 RBAC 与 audit。</p></div><div className="admin-action-grid"><Button onClick={() => dryRunImport(false)}><FileJson size={16} />Dry-run seed</Button><Button variant="secondary" onClick={() => dryRunImport(true)}><Upload size={16} />Commit seed</Button></div></div><div className="course-admin-grid"><Card className="glass-panel"><SearchInput label="Search course tree" placeholder="track / stage / chapter" /><div className="course-tree">{tree.map((track) => <div key={track.code}><button onClick={() => setSelected({ track: track.code, stage: 1, chapter: 1, lesson: 1 })}><GitBranch size={16} /><strong>{track.nameZh}</strong><small>{track.code} · 12 stages</small></button>{track.stages.slice(0, 12).map((stage) => <button key={stage.id} onClick={() => setSelected({ track: track.code, stage: stage.stageNo, chapter: 1, lesson: 1 })}><Badge>Stage {stage.stageNo}</Badge><span>{stage.nameZh}</span><small>12 chapters · published</small></button>)}</div>)}</div></Card><div className="course-admin-panels"><Card className="glass-panel"><PanelTitle icon={<BookOpen />} title="节与知识点编辑" source="ACR-04 / CR-FR-006" /><div className="editor-grid"><Input label="Track" value={selected.track} onChange={(event) => setSelected({ ...selected, track: event.currentTarget.value })} /><Input label="Stage" value={selected.stage} type="number" min={1} max={12} onChange={(event) => setSelected({ ...selected, stage: Number(event.currentTarget.value) })} /><Input label="Chapter" value={selected.chapter} type="number" min={1} max={12} onChange={(event) => setSelected({ ...selected, chapter: Number(event.currentTarget.value) })} /><Input label="Lesson" value={selected.lesson} type="number" min={1} max={12} onChange={(event) => setSelected({ ...selected, lesson: Number(event.currentTarget.value) })} /></div><h3>{String(lesson?.nameZh ?? lessonId)}</h3><DataTable rows={((lesson?.knowledgePoints as Row[] | undefined) ?? []).slice(0, 12).map((kp) => ({ id: kp.id, no: kp.kpointNo, zh: kp.zh, pinyin: kp.pinyinTones, tags: Array.isArray(kp.tags) ? kp.tags.join('/') : '' }))} columns={['no', 'zh', 'pinyin', 'tags']} /><TextArea label="编辑说明 / 审校备注" defaultValue="拼音、翻译、音频、key_point、例句均需审校。" /><Button onClick={patchLesson}><CheckCircle2 size={16} />保存并写审计</Button></Card><Card className="glass-panel"><PanelTitle icon={<Database />} title="题库与测验预览" source="ACR-05 / CR-FR-007~009" /><DataTable rows={questions.map((question) => ({ id: question.id, type: question.type, stem: question.stemZh, hsk: question.hskLevel, reports: question.reportCount }))} columns={['type', 'stem', 'hsk', 'reports']} /><div className="admin-action-grid"><Button variant="secondary" onClick={() => adminRequest(`/admin/api/content/courses/quizzes/quiz-lesson_quiz-${lessonId}/preview`)}><Search size={16} />预览小测</Button><Button variant="secondary">36 题章测</Button><Button variant="secondary">80-150 题阶段考</Button></div></Card><Card className="glass-panel"><PanelTitle icon={<LockKeyhole />} title="权限矩阵与跨级购买" source="ACR-06 / CR-FR-010 / CR-FR-019" /><div className="admin-matrix">{['ec', 'factory', 'hsk', 'daily'].map((track) => <div key={track} className="matrix-cell"><strong>{track}</strong><p>S1 C1-C3 free</p><small>Stage {selected.stage}: manual grant ready</small></div>)}</div><Button onClick={grant}><ShieldCheck size={16} />授予当前阶段权限</Button><pre>{JSON.stringify(permissions, null, 2)}</pre></Card><Card className="glass-panel"><PanelTitle icon={<Gamepad2 />} title="游戏词包权限摘要" source="ACR-07" /><p>游戏模块读取课程权限生成 accessible_stages，支持用户跨级购买后立即解锁对应词包。</p><Button variant="secondary" onClick={() => adminRequest('/admin/api/users/user-demo/game-wordpack-scope').then((response) => setPermissions({ wordpack: response.data }))}>刷新词包范围</Button></Card><Card className="glass-panel"><PanelTitle icon={<Languages />} title="翻译完整度" source="ACR-09 / CR-NFR-005" /><div className="coverage-grid">{coverage.map((item) => <div key={String(item.trackCode)} className="coverage-cell"><strong>{String(item.trackCode)}</strong><p>{String(item.percent)}%</p><small>{String(item.complete)} / {String(item.totalNodes)} nodes</small></div>)}</div></Card><Card className="glass-panel"><PanelTitle icon={<FileJson />} title="Seed / 导入 / 发布" source="ACR-08 / CR-26 / CR-27" /><pre>{JSON.stringify(importResult, null, 2)}</pre><Button variant="secondary" onClick={() => adminRequest(`/admin/api/content/courses/lesson/${lessonId}/publish`, { method: 'POST', body: JSON.stringify({}) })}>发布当前节并创建版本</Button></Card>{message ? <Toast type="success">{message}</Toast> : null}</div></div></section>;
}

function PanelTitle({ icon, title, source }: { icon: ReactNode; title: string; source: string }) {
  return <div className="row between"><div className="row">{icon}<div><h2>{title}</h2><small>{source}</small></div></div><Badge>audited</Badge></div>;
}