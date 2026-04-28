import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Database, FileJson, Gamepad2, Languages, LockKeyhole, Pencil, Search, ShieldCheck, Upload } from 'lucide-react';
import { Badge, Button, Card, DataTable, Input, SearchInput, TextArea, Toast } from '@zhiyu/ui';
import { adminRequest } from './api';

type Row = Record<string, unknown>;
type ThemeCode = 'ec' | 'factory' | 'hsk' | 'daily';
type Track = { code: ThemeCode; nameZh: string; description?: Row; stages: Stage[] };
type Stage = { id: string; stageNo: number; nameZh: string; status?: string; isFree?: boolean; description?: Row; chapters: Chapter[] };
type Chapter = { id: string; chapterNo: number; nameZh: string; isFree: boolean; accessReason?: string; status?: string };
type Lesson = { id: string; lessonNo: number; nameZh: string; intro?: Row; status?: string; knowledgePoints?: KnowledgePoint[] };
type KnowledgePoint = { id: string; kpointNo: number; zh: string; pinyin?: string; pinyinTones?: string; tags?: string[]; keyPoint?: Row; translations?: Row };
type Selection = { theme: ThemeCode | null; stage: number; chapter: number | null; lesson: number; kp: string | null };

const themeOrder: ThemeCode[] = ['ec', 'daily', 'factory', 'hsk'];
const themeLabels: Record<ThemeCode, string> = { ec: '电商', daily: '日常', factory: '工厂', hsk: 'HSK' };

function courseId(theme: ThemeCode, stage: number, chapter?: number, lesson?: number, kp?: number) {
  const stagePart = `s${String(stage).padStart(2, '0')}`;
  const chapterPart = chapter ? `-c${String(chapter).padStart(2, '0')}` : '';
  const lessonPart = lesson ? `-l${String(lesson).padStart(2, '0')}` : '';
  const kpPart = kp ? `-k${String(kp).padStart(2, '0')}` : '';
  return `cr-${theme}-${stagePart}${chapterPart}${lessonPart}${kpPart}`;
}

function localized(value: unknown) {
  if (value && typeof value === 'object') return String((value as Row)['zh-CN'] ?? (value as Row).en ?? '');
  return String(value ?? '');
}

export function CoursesAdmin() {
  const [tree, setTree] = useState<Track[]>([]);
  const [selected, setSelected] = useState<Selection>({ theme: null, stage: 1, chapter: null, lesson: 1, kp: null });
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Row[]>([]);
  const [coverage, setCoverage] = useState<Row[]>([]);
  const [permissions, setPermissions] = useState<Row | null>(null);
  const [importResult, setImportResult] = useState<Row | null>(null);
  const [message, setMessage] = useState('');

  const activeTheme = useMemo(() => selected.theme ? tree.find((item) => item.code === selected.theme) ?? null : null, [selected.theme, tree]);
  const activeStage = useMemo(() => activeTheme?.stages.find((stage) => stage.stageNo === selected.stage) ?? null, [activeTheme, selected.stage]);
  const activeChapter = useMemo(() => activeStage?.chapters.find((chapter) => chapter.chapterNo === selected.chapter) ?? null, [activeStage, selected.chapter]);
  const lessonId = selected.theme && selected.chapter ? courseId(selected.theme, selected.stage, selected.chapter, selected.lesson) : '';
  const knowledgePoints = lesson?.knowledgePoints ?? [];
  const activeKp = selected.kp ? knowledgePoints.find((item) => item.id === selected.kp) ?? null : knowledgePoints[0] ?? null;

  useEffect(() => { refreshTree(); }, []);
  useEffect(() => {
    adminRequest<Row[]>('/admin/api/content/courses/translation-coverage').then((response) => setCoverage(response.data ?? []));
    adminRequest<Row>('/admin/api/users/user-demo/courses-permissions').then((response) => setPermissions(response.data));
  }, []);
  useEffect(() => {
    if (!lessonId) return;
    adminRequest<Lesson>(`/admin/api/content/courses/lessons/${lessonId}`).then((response) => {
      setLesson(response.data);
      const firstKp = response.data?.knowledgePoints?.[0]?.id ?? null;
      setSelected((current) => ({ ...current, kp: current.kp ?? firstKp }));
    });
    adminRequest<Row[]>(`/admin/api/content/courses/questions?lesson_id=${lessonId}`).then((response) => setQuestions(response.data ?? []));
  }, [lessonId]);

  function refreshTree() {
    adminRequest<Track[]>('/admin/api/content/courses/tree').then((response) => setTree(response.data ?? []));
  }

  function selectTheme(theme: ThemeCode) {
    setSelected({ theme, stage: 1, chapter: null, lesson: 1, kp: null });
    setLesson(null);
    setQuestions([]);
  }

  async function dryRunImport(commit = false) {
    const theme = selected.theme ?? 'daily';
    const items = Array.from({ length: 24 }, (_, index) => ({ slug: `admin-course-seed-${index + 1}`, i18n: { 'zh-CN': { title: `课程 ${index + 1}`, summary: '后台导入校验', body: '课程 seed 项' } }, module_specific: { track: theme, stage: 1, chapter: 1, lesson: index + 1 } }));
    const response = await adminRequest<Row>(`/admin/api/content/courses/import/${commit ? 'commit' : 'dry-run'}`, { method: 'POST', body: JSON.stringify({ $schema_version: '1.0', module: 'courses', items }) });
    setImportResult(response.data);
    setMessage(response.error?.message ?? (commit ? 'Seed committed and audited' : 'Seed dry-run passed'));
  }

  async function grant() {
    if (!selected.theme) return;
    const response = await adminRequest<Row>('/admin/api/users/user-demo/courses-permissions/grant', { method: 'POST', body: JSON.stringify({ trackCode: selected.theme, stageNo: selected.stage, reason: 'manual admin validation' }) });
    setPermissions({ purchases: response.data, matrix: [] });
    setMessage(response.error?.message ?? 'Manual grant effective within 5 seconds');
  }

  if (!selected.theme) {
    return <section className="admin-page stack courses-admin-page">
      <AdminHeading badge="AD-FR-006 · ACR-01" title="课程内容管理" description="默认先选择主题；进入后再管理阶段、章、节和知识点。产品文案统一叫主题，内部仍兼容 track_code。" actions={<><Button onClick={() => dryRunImport(false)}><FileJson size={16} />Dry-run seed</Button><Button variant="secondary" onClick={() => dryRunImport(true)}><Upload size={16} />Commit seed</Button></>} />
      <div className="theme-picker-grid">{themeOrder.map((code) => {
        const theme = tree.find((item) => item.code === code);
        return <button key={code} className="theme-choice zy-glass-panel" onClick={() => selectTheme(code)}>
          <Badge>{code}</Badge><strong>{theme?.nameZh ?? `${themeLabels[code]}主题`}</strong><span>{localized(theme?.description)}</span><small>12 阶段 · Stage 1-3 全部章免费 · 章内 12 节</small>
        </button>;
      })}</div>
      <SystemPanels coverage={coverage} permissions={permissions} importResult={importResult} grant={grant} selected={selected} />
      {message ? <Toast type="info">{message}</Toast> : null}
    </section>;
  }

  if (selected.chapter && activeChapter) {
    return <section className="admin-page stack courses-admin-page">
      <AdminHeading badge="ACR-04" title={`${themeLabels[selected.theme]} · Stage ${selected.stage} · Chapter ${selected.chapter}`} description="章编辑子页面：左侧 12 节，右侧显示当前节的 12 个知识点。章、节、知识点均可编辑并写审计。" actions={<Button variant="ghost" onClick={() => setSelected({ theme: selected.theme, stage: selected.stage, chapter: null, lesson: 1, kp: null })}><ArrowLeft size={16} />返回阶段/章</Button>} />
      <div className="chapter-admin-layout">
        <Card className="lesson-sidebar" variant="porcelain"><PanelTitle icon={<BookOpen />} title="12 节" source="Lesson sidebar" /><div className="lesson-nav">{Array.from({ length: 12 }, (_, index) => index + 1).map((lessonNo) => <button key={lessonNo} aria-current={selected.lesson === lessonNo ? 'true' : undefined} onClick={() => setSelected({ ...selected, lesson: lessonNo, kp: null })}><strong>Lesson {lessonNo}</strong><small>{lessonNo === selected.lesson ? lesson?.nameZh ?? lessonId : '点击切换知识点'}</small></button>)}</div></Card>
        <div className="chapter-detail-stack">
          <ChapterEditor chapter={activeChapter} theme={selected.theme} stageNo={selected.stage} setMessage={setMessage} refreshTree={refreshTree} />
          <LessonEditor lesson={lesson} lessonId={lessonId} setMessage={setMessage} />
          <Card variant="porcelain"><PanelTitle icon={<Database />} title="当前节 12 知识点" source="ACR-04 knowledge points" /><div className="kp-admin-grid">{knowledgePoints.slice(0, 12).map((kp) => <button key={kp.id} aria-current={selected.kp === kp.id ? 'true' : undefined} onClick={() => setSelected({ ...selected, kp: kp.id })}><Badge>{kp.kpointNo}</Badge><strong>{kp.zh}</strong><small>{kp.pinyinTones ?? kp.pinyin}</small></button>)}</div></Card>
          <KnowledgePointEditor kp={activeKp} setMessage={setMessage} />
          <Card variant="porcelain"><PanelTitle icon={<Search />} title="题库与测验预览" source="ACR-05 / CR-FR-007~009" /><DataTable rows={questions.map((question) => ({ id: question.id, type: question.type, stem: question.stemZh, hsk: question.hskLevel, reports: question.reportCount }))} columns={['type', 'stem', 'hsk', 'reports']} /><div className="admin-action-grid"><Button variant="secondary" onClick={() => adminRequest(`/admin/api/content/courses/quizzes/quiz-lesson_quiz-${lessonId}/preview`)}><Search size={16} />预览小测</Button><Button variant="secondary">36 题章测</Button><Button variant="secondary">80-150 题阶段考</Button></div></Card>
        </div>
      </div>
      {message ? <Toast type="success">{message}</Toast> : null}
    </section>;
  }

  return <section className="admin-page stack courses-admin-page">
    <AdminHeading badge="ACR-01~03" title={`${activeTheme?.nameZh ?? themeLabels[selected.theme]} · 阶段与章`} description="左侧固定 12 阶段，右侧只显示当前阶段对应的 12 章。Stage 1-3 全部章默认免费，Stage 4+ 走购买/会员/人工授权。" actions={<><Button variant="ghost" onClick={() => setSelected({ theme: null, stage: 1, chapter: null, lesson: 1, kp: null })}><ArrowLeft size={16} />换主题</Button><Button onClick={() => dryRunImport(false)}><FileJson size={16} />Dry-run seed</Button></>} />
    <div className="theme-admin-layout">
      <Card className="stage-sidebar" variant="porcelain"><SearchInput label="搜索阶段" placeholder="stage / chapter / status" /><div className="stage-nav">{Array.from({ length: 12 }, (_, index) => index + 1).map((stageNo) => {
        const stage = activeTheme?.stages.find((item) => item.stageNo === stageNo);
        return <button key={stageNo} aria-current={selected.stage === stageNo ? 'true' : undefined} onClick={() => setSelected({ ...selected, stage: stageNo, chapter: null, lesson: 1, kp: null })}><Badge tone={stageNo <= 3 ? 'success' : 'neutral'}>Stage {stageNo}</Badge><strong>{stage?.nameZh ?? `Stage ${stageNo}`}</strong><small>{stageNo <= 3 ? '免费阶段' : '付费/授权'}</small></button>;
      })}</div></Card>
      <div className="stage-detail-stack">
        {activeStage ? <StageEditor stage={activeStage} theme={selected.theme} setMessage={setMessage} refreshTree={refreshTree} /> : null}
        <Card variant="porcelain"><PanelTitle icon={<BookOpen />} title="当前阶段 12 章" source="ACR-03 chapter management" /><div className="chapter-admin-grid">{(activeStage?.chapters ?? []).slice(0, 12).map((chapter) => <button key={chapter.id} className="chapter-admin-card" onClick={() => setSelected({ ...selected, chapter: chapter.chapterNo, lesson: 1, kp: null })}><div className="row between"><Badge tone={chapter.isFree ? 'success' : 'warning'}>{chapter.isFree ? '免费试学' : '付费/授权'}</Badge><Pencil size={16} /></div><strong>Chapter {chapter.chapterNo}</strong><span>{chapter.nameZh}</span><small>{chapter.accessReason ?? (chapter.isFree ? 'free_stage' : 'paywall')}</small></button>)}</div></Card>
        <SystemPanels coverage={coverage} permissions={permissions} importResult={importResult} grant={grant} selected={selected} />
      </div>
    </div>
    {message ? <Toast type="success">{message}</Toast> : null}
  </section>;
}

function AdminHeading({ badge, title, description, actions }: { badge: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="admin-section-head"><div><Badge>{badge}</Badge><h2>{title}</h2><p>{description}</p></div>{actions ? <div className="admin-action-grid">{actions}</div> : null}</div>;
}

function PanelTitle({ icon, title, source }: { icon: ReactNode; title: string; source: string }) {
  return <div className="row between"><div className="row">{icon}<div><h2>{title}</h2><small>{source}</small></div></div><Badge>audited</Badge></div>;
}

function StageEditor({ stage, theme, setMessage, refreshTree }: { stage: Stage; theme: ThemeCode; setMessage: (message: string) => void; refreshTree: () => void }) {
  const [nameZh, setNameZh] = useState(stage.nameZh);
  const [description, setDescription] = useState(localized(stage.description));
  useEffect(() => { setNameZh(stage.nameZh); setDescription(localized(stage.description)); }, [stage.id, stage.nameZh, stage.description]);
  async function save() {
    const response = await adminRequest<Row>(`/admin/api/content/courses/stages/${courseId(theme, stage.stageNo)}`, { method: 'PATCH', body: JSON.stringify({ nameZh, description: { 'zh-CN': description } }) });
    setMessage(response.error?.message ?? 'Stage saved and audited');
    refreshTree();
  }
  return <Card variant="porcelain"><PanelTitle icon={<CheckCircle2 />} title={`Stage ${stage.stageNo} 编辑`} source="ACR-02 stage metadata" /><div className="editor-grid"><Input label="阶段标题" value={nameZh} onChange={(event) => setNameZh(event.currentTarget.value)} /><Input label="免费规则" value={stage.stageNo <= 3 ? 'Stage 1-3 全部章免费' : 'Stage 4+ 权限判断'} readOnly /></div><TextArea label="阶段描述" value={description} onChange={(event) => setDescription(event.currentTarget.value)} /><Button onClick={save}><CheckCircle2 size={16} />保存阶段</Button></Card>;
}

function ChapterEditor({ chapter, theme, stageNo, setMessage, refreshTree }: { chapter: Chapter; theme: ThemeCode; stageNo: number; setMessage: (message: string) => void; refreshTree: () => void }) {
  const [nameZh, setNameZh] = useState(chapter.nameZh);
  const [freeReason, setFreeReason] = useState(chapter.isFree ? 'login_trial' : '');
  useEffect(() => { setNameZh(chapter.nameZh); setFreeReason(chapter.isFree ? 'login_trial' : ''); }, [chapter.id, chapter.nameZh, chapter.isFree]);
  async function save() {
    const response = await adminRequest<Row>(`/admin/api/content/courses/chapters/${courseId(theme, stageNo, chapter.chapterNo)}`, { method: 'PATCH', body: JSON.stringify({ nameZh, isFree: chapter.isFree, freeReason: freeReason || null }) });
    setMessage(response.error?.message ?? 'Chapter saved and audited');
    refreshTree();
  }
  return <Card variant="porcelain"><PanelTitle icon={<BookOpen />} title={`Chapter ${chapter.chapterNo} 编辑`} source="ACR-03 chapter metadata" /><div className="editor-grid"><Input label="章标题" value={nameZh} onChange={(event) => setNameZh(event.currentTarget.value)} /><Input label="免费状态" value={chapter.isFree ? 'Stage 1-3 自动免费' : 'Stage 4+ 权限控制'} readOnly /></div><Input label="免费原因 / 人工覆盖" value={freeReason} onChange={(event) => setFreeReason(event.currentTarget.value)} /><Button onClick={save}><CheckCircle2 size={16} />保存章</Button></Card>;
}

function LessonEditor({ lesson, lessonId, setMessage }: { lesson: Lesson | null; lessonId: string; setMessage: (message: string) => void }) {
  const [nameZh, setNameZh] = useState(lesson?.nameZh ?? '');
  const [intro, setIntro] = useState(localized(lesson?.intro));
  useEffect(() => { setNameZh(lesson?.nameZh ?? ''); setIntro(localized(lesson?.intro)); }, [lesson?.id, lesson?.nameZh, lesson?.intro]);
  async function save() {
    const response = await adminRequest<Row>(`/admin/api/content/courses/lessons/${lessonId}`, { method: 'PATCH', body: JSON.stringify({ nameZh, intro: { 'zh-CN': intro }, status: 'published' }) });
    setMessage(response.error?.message ?? 'Lesson saved and audited');
  }
  return <Card variant="porcelain"><PanelTitle icon={<CheckCircle2 />} title="当前节编辑" source="ACR-04 lesson metadata" /><div className="editor-grid"><Input label="节标题" value={nameZh} onChange={(event) => setNameZh(event.currentTarget.value)} /><Input label="Lesson ID" value={lessonId} readOnly /></div><TextArea label="学习目标 / 母语介绍" value={intro} onChange={(event) => setIntro(event.currentTarget.value)} /><Button onClick={save}><CheckCircle2 size={16} />保存节</Button></Card>;
}

function KnowledgePointEditor({ kp, setMessage }: { kp: KnowledgePoint | null; setMessage: (message: string) => void }) {
  const [zh, setZh] = useState(kp?.zh ?? '');
  const [pinyinTones, setPinyinTones] = useState(kp?.pinyinTones ?? kp?.pinyin ?? '');
  const [keyPoint, setKeyPoint] = useState(localized(kp?.keyPoint));
  useEffect(() => { setZh(kp?.zh ?? ''); setPinyinTones(kp?.pinyinTones ?? kp?.pinyin ?? ''); setKeyPoint(localized(kp?.keyPoint)); }, [kp?.id, kp?.zh, kp?.pinyinTones, kp?.pinyin, kp?.keyPoint]);
  async function save() {
    if (!kp) return;
    const response = await adminRequest<Row>(`/admin/api/content/courses/knowledge-points/${kp.id}`, { method: 'PATCH', body: JSON.stringify({ zh, pinyinTones, keyPoint: { 'zh-CN': keyPoint } }) });
    setMessage(response.error?.message ?? 'Knowledge point saved and audited');
  }
  return <Card variant="porcelain"><PanelTitle icon={<Pencil />} title="知识点编辑" source="ACR-04 KP editor" />{kp ? <><div className="editor-grid"><Input label="中文" value={zh} onChange={(event) => setZh(event.currentTarget.value)} /><Input label="拼音 / 声调" value={pinyinTones} onChange={(event) => setPinyinTones(event.currentTarget.value)} /></div><TextArea label="Key point / 例句审校" value={keyPoint} onChange={(event) => setKeyPoint(event.currentTarget.value)} /><Button onClick={save}><CheckCircle2 size={16} />保存知识点</Button></> : <p>选择一个知识点后编辑。</p>}</Card>;
}

function SystemPanels({ coverage, permissions, importResult, grant, selected }: { coverage: Row[]; permissions: Row | null; importResult: Row | null; grant: () => void; selected: Selection }) {
  return <div className="system-panel-grid">
    <Card variant="porcelain"><PanelTitle icon={<LockKeyhole />} title="权限矩阵" source="ACR-06 / CR-FR-010" /><div className="admin-matrix">{themeOrder.map((theme) => <div key={theme} className="matrix-cell"><strong>{themeLabels[theme]}</strong><p>Stage 1-3 全章免费</p><small>{selected.theme === theme ? `当前 Stage ${selected.stage}` : '可跨级购买'}</small></div>)}</div><Button disabled={!selected.theme} onClick={grant}><ShieldCheck size={16} />授予当前阶段权限</Button><pre>{JSON.stringify(permissions, null, 2)}</pre></Card>
    <Card variant="porcelain"><PanelTitle icon={<Gamepad2 />} title="游戏词包权限摘要" source="ACR-07" /><p>游戏词包按课程权限生成；免费范围包含每个主题 Stage 1-3。</p><Button variant="secondary" disabled={!selected.theme}>刷新词包范围</Button></Card>
    <Card variant="porcelain"><PanelTitle icon={<Languages />} title="翻译完整度" source="ACR-09" /><div className="coverage-grid">{coverage.map((item) => <div key={String(item.trackCode)} className="coverage-cell"><strong>{String(item.trackCode)}</strong><p>{String(item.percent)}%</p><small>{String(item.complete)} / {String(item.totalNodes)} nodes</small></div>)}</div></Card>
    <Card variant="porcelain"><PanelTitle icon={<FileJson />} title="Seed / 导入 / 发布" source="ACR-08" /><pre>{JSON.stringify(importResult, null, 2)}</pre></Card>
  </div>;
}