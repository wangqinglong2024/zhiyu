import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, BookOpenCheck, CheckCircle2, Clock3, CreditCard, FileText, Flag, Heart, Languages, LockKeyhole, NotebookPen, PlayCircle, RotateCcw, Route, ShieldCheck, Volume2 } from 'lucide-react';
import { Badge, Button, Card, Input, Segmented, TextArea, Toast } from '@zhiyu/ui';
import { apiBase, token } from '../api';
import { titleCase } from '../data';

type TrackCode = 'ec' | 'factory' | 'hsk' | 'daily';
type ApiResult<T> = { data: T | null; error: { message: string } | null };
type Row = Record<string, unknown>;
type Track = { code: TrackCode; nameZh: string; description: Row; stages: Stage[] };
type Stage = { id: string; trackCode: TrackCode; stageNo: number; nameZh: string; chapters: Chapter[]; progressPct?: number };
type Chapter = { id: string; trackCode: TrackCode; stageNo: number; chapterNo: number; nameZh: string; isFree: boolean; hasAccess?: boolean; accessReason?: string; lessons?: Lesson[] };
type Lesson = { id: string; trackCode: TrackCode; stageNo: number; chapterNo: number; lessonNo: number; nameZh: string; intro: Row; learningObjectives: Row[]; quizId: string; progressPct?: number; previewOnly?: boolean; access?: { hasAccess: boolean; reason: string }; knowledgePoints: KnowledgePoint[] };
type KnowledgePoint = { id: string; kpointNo: number; zh: string; pinyin: string; pinyinTones: string; translations: Row; keyPoint: Row; audio: { default: { url: string } }; exampleSentences: Array<{ zh: string; pinyin: string; translations: Row }>; tags: string[] };
type Quiz = { id: string; type: string; parentId: string; questionCount: number; passThreshold: number; timeLimitSeconds: number | null; questions: Question[] };
type Question = { id: string; type: string; stemZh: string; stemTranslations: Row; audioUrl: string | null; options: Array<string | { zh: string; pinyin?: string }>; explanation: Row };
type PurchaseSku = 'stage_single' | 'stage_nine_pack' | 'membership_monthly' | 'membership_yearly' | 'membership_half_year';

const trackOptions: TrackCode[] = ['daily', 'ec', 'factory', 'hsk'];
const priceOptions: Array<{ type: PurchaseSku; label: string; detail: string }> = [
  { type: 'stage_single', label: '$4 单段', detail: '解锁当前阶段' },
  { type: 'stage_nine_pack', label: '$36 9 段', detail: '从当前阶段起 9 段' },
  { type: 'membership_monthly', label: '$4 月会员', detail: '30 天全站课程' },
  { type: 'membership_yearly', label: '$40 年会员', detail: '365 天全站课程' },
  { type: 'membership_half_year', label: '$12 半年促销', detail: '183 天限时方案' }
];

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const currentToken = token();
  if (currentToken) headers.set('authorization', `Bearer ${currentToken}`);
  try {
    const response = await fetch(`${apiBase()}${path}`, { ...init, headers, credentials: 'include' });
    return response.json() as Promise<ApiResult<T>>;
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Network unavailable' } };
  }
}

function courseId(track: string, stage: string | number, chapter?: string | number, lesson?: string | number) {
  const s = `s${String(stage).padStart(2, '0')}`;
  const c = chapter ? `-c${String(chapter).padStart(2, '0')}` : '';
  const l = lesson ? `-l${String(lesson).padStart(2, '0')}` : '';
  return `cr-${track}-${s}${c}${l}`;
}

function label(value: unknown) {
  return typeof value === 'object' && value ? String((value as Row)['zh-CN'] ?? (value as Row).en ?? '') : String(value ?? '');
}

export function CoursePage({ route, navigate, loggedIn }: { route: string; navigate: (path: string) => void; loggedIn: boolean }) {
  const normalized = route.replace(/^\/courses/, '/learn');
  const parts = normalized.split('/').filter(Boolean);
  if (parts[1] === 'onboarding') return <CourseOnboarding navigate={navigate} loggedIn={loggedIn} />;
  if (parts[1] === 'pinyin') return <PinyinIntro navigate={navigate} loggedIn={loggedIn} />;
  if (parts[1] === 'quiz' && parts[2]) return <QuizPage quizId={parts[2]} navigate={navigate} loggedIn={loggedIn} />;
  if (parts[1] === 'report' && parts[2] && parts[3]) return <ReportPage type={parts[2]} id={parts[3]} navigate={navigate} />;
  const track = (parts[1] ?? 'daily') as TrackCode;
  const stage = parts[2];
  const chapter = parts[3];
  const lesson = parts[4];
  if (stage && chapter === 'exam') return <QuizPage quizId={`quiz-stage_exam-${courseId(track, stage)}`} navigate={navigate} loggedIn={loggedIn} />;
  if (stage && chapter && lesson === 'test') return <QuizPage quizId={`quiz-chapter_test-${courseId(track, stage, chapter)}`} navigate={navigate} loggedIn={loggedIn} />;
  if (stage && chapter && lesson) return <LessonLearning track={track} stage={stage} chapter={chapter} lesson={lesson} navigate={navigate} loggedIn={loggedIn} />;
  if (stage && chapter) return <ChapterOverview track={track} stage={stage} chapter={chapter} navigate={navigate} />;
  if (stage) return <StageOverview track={track} stage={stage} navigate={navigate} />;
  return <CourseDashboard navigate={navigate} loggedIn={loggedIn} />;
}

function CourseOnboarding({ navigate, loggedIn }: { navigate: (path: string) => void; loggedIn: boolean }) {
  const [goal, setGoal] = useState('HSK 备考');
  const [level, setLevel] = useState('零基础');
  const [result, setResult] = useState<Row | null>(null);
  async function recommend() {
    const response = await request<Row>('/api/v1/learn/onboarding/recommend', { method: 'POST', body: JSON.stringify({ goal, level }) });
    setResult(response.data);
  }
  async function confirm() {
    const tracks = Array.isArray(result?.tracks) ? result?.tracks : ['daily'];
    await request('/api/v1/learn/onboarding/confirm', { method: 'POST', body: JSON.stringify({ tracks, pinyinRequired: result?.pinyinRequired }) });
    navigate(result?.pinyinRequired ? '/learn/pinyin' : `/learn/${tracks[0] ?? 'daily'}`);
  }
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-001" title="课程欢迎引导" subtitle="选择目标、水平，系统推荐 1-2 条轨道；可跳过进入 Dashboard 自选。" /><div className="course-split"><Card className="glass-panel"><Segmented label="学习目标" items={['HSK 备考', '工作 / 工厂', '电商采购', '兴趣日常']} value={goal} onChange={setGoal} /><Segmented label="当前水平" items={['零基础', 'HSK 1-3', 'HSK 4-6', 'HSK 7+']} value={level} onChange={setLevel} /><div className="course-actions"><Button onClick={recommend}><Route size={18} />推荐轨道</Button><Button variant="secondary" onClick={() => navigate('/learn')}>跳过</Button></div></Card><Card className="glass-panel"><h2>推荐结果</h2>{result ? <div className="recommend-list">{(result.tracks as string[]).map((track) => <button key={track} onClick={() => navigate(`/learn/${track}`)}><Badge>{track}</Badge><strong>{titleCase(track === 'ec' ? 'ecommerce' : track)}</strong><small>起始阶段 {String(result.startStage)} · {result.pinyinRequired ? '建议先拼音入门' : '可直接进入主轨道'}</small></button>)}</div> : <p>点击推荐后展示 1-2 条轨道。</p>}<Button disabled={!result || !loggedIn} onClick={confirm}><CheckCircle2 size={18} />确认并写入报名</Button>{!loggedIn ? <Toast type="warning">登录后可保存多轨报名和跨设备进度。</Toast> : null}</Card></div></section>;
}

function CourseDashboard({ navigate, loggedIn }: { navigate: (path: string) => void; loggedIn: boolean }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState<TrackCode>('daily');
  const [dashboard, setDashboard] = useState<Row | null>(null);
  useEffect(() => { request<Track[]>('/api/v1/learn/tracks').then((response) => setTracks(response.data ?? [])); }, []);
  useEffect(() => { request<Row>(`/api/v1/learn/dashboard?track_code=${activeTrack}`).then((response) => setDashboard(response.data)); }, [activeTrack]);
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-003" title="系统课程" subtitle="4 轨道 × 12 阶段 × 12 章 × 12 节 × 12 知识点；免费权限仅限每轨 Stage 1 前 3 章。" actions={<Button onClick={() => navigate('/learn/onboarding')}>欢迎引导</Button>} /><div className="course-command glass-panel"><Segmented label="切换轨道" items={trackOptions} value={activeTrack} onChange={(value) => setActiveTrack(value as TrackCode)} /><Button variant="secondary" onClick={() => navigate('/learn/pinyin')}>拼音入门</Button><Button onClick={() => navigate(String(dashboard?.continuePath ?? `/learn/${activeTrack}/1/1/5`))}><PlayCircle size={18} />继续学习</Button></div><div className="course-kpis"><Metric icon={<BookOpenCheck />} label="当前轨道" value={activeTrack} /><Metric icon={<Clock3 />} label="本周学习" value={`${Math.round(Number(dashboard?.weekStudySeconds ?? 0) / 60)} min`} /><Metric icon={<ShieldCheck />} label="免费范围" value="S1 C1-C3" /><Metric icon={<Languages />} label="语言覆盖" value="5 / 5" /></div><div className="course-split"><Card className="glass-panel"><h2>今日任务</h2><div className="task-list">{((dashboard?.todayTasks as Row[] | undefined) ?? []).map((task) => <button key={String(task.title)} onClick={() => navigate(String(task.path))}><Flag size={18} /><span>{String(task.title)}</span><Badge>{String(task.type)}</Badge></button>)}</div>{!loggedIn ? <Toast type="info">未登录可浏览结构；开始学习、付费、进度同步需登录。</Toast> : null}</Card><Card className="glass-panel"><h2>阶段地图</h2><StageGrid track={activeTrack} navigate={navigate} /></Card></div><div className="track-grid">{tracks.map((track) => <button key={track.code} className="track-card glass-panel" onClick={() => { setActiveTrack(track.code); navigate(`/learn/${track.code}`); }}><Badge>{track.code}</Badge><strong>{track.nameZh}</strong><small>{label(track.description)}</small></button>)}</div></section>;
}

function StageGrid({ track, navigate }: { track: TrackCode; navigate: (path: string) => void }) {
  return <div className="stage-grid modern">{Array.from({ length: 12 }, (_, index) => <button key={index} onClick={() => navigate(`/learn/${track}/${index + 1}`)}><span>{index + 1}</span><small>{index < 3 ? 'W0 上架' : '跨级购买'}</small></button>)}</div>;
}

function StageOverview({ track, stage, navigate }: { track: TrackCode; stage: string; navigate: (path: string) => void }) {
  const [data, setData] = useState<Stage | null>(null);
  useEffect(() => { request<Stage>(`/api/v1/learn/stages/${courseId(track, stage)}`).then((response) => setData(response.data)); }, [track, stage]);
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-004" title={data?.nameZh ?? `Stage ${stage}`} subtitle="12 章网格展示已完成、进行中、未解锁；12 章完成后进入阶段考。" actions={<Button onClick={() => navigate(`/learn/${track}/${stage}/exam`)}>阶段考</Button>} /><Progress value={Number(data?.progressPct ?? 0)} /><div className="chapter-grid">{(data?.chapters ?? []).map((chapter) => <button key={chapter.id} className="glass-panel" onClick={() => chapter.hasAccess ? navigate(`/learn/${track}/${stage}/${chapter.chapterNo}`) : navigate(`/learn/${track}/${stage}/${chapter.chapterNo}/1`)}><strong>Chapter {chapter.chapterNo}</strong><span>{chapter.nameZh}</span><Badge tone={chapter.hasAccess ? 'success' : 'warning'}>{chapter.accessReason ?? 'paywall'}</Badge></button>)}</div></section>;
}

function ChapterOverview({ track, stage, chapter, navigate }: { track: TrackCode; stage: string; chapter: string; navigate: (path: string) => void }) {
  const [data, setData] = useState<Chapter | null>(null);
  useEffect(() => { request<Chapter>(`/api/v1/learn/chapters/${courseId(track, stage, chapter)}`).then((response) => setData(response.data)); }, [track, stage, chapter]);
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-005" title={data?.nameZh ?? `Chapter ${chapter}`} subtitle="12 节列表 + 章测入口；跳过节会在报告中标注，章测为 36 题 60 分钟。" actions={<Button onClick={() => navigate(`/learn/${track}/${stage}/${chapter}/test`)}>章测</Button>} /><div className="lesson-list">{(data?.lessons ?? []).map((lesson) => <button key={lesson.id} className="glass-panel" onClick={() => navigate(`/learn/${track}/${stage}/${chapter}/${lesson.lessonNo}`)}><span>{String(lesson.lessonNo).padStart(2, '0')}</span><strong>{lesson.nameZh}</strong><small>12 知识点 · 节小测 10 题</small><Badge>{String(lesson.progressPct ?? 0)}%</Badge></button>)}</div></section>;
}

function LessonLearning({ track, stage, chapter, lesson, navigate, loggedIn }: { track: TrackCode; stage: string; chapter: string; lesson: string; navigate: (path: string) => void; loggedIn: boolean }) {
  const lessonId = courseId(track, stage, chapter, lesson);
  const [data, setData] = useState<Lesson | null>(null);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState('');
  const kp = data?.knowledgePoints?.[active];
  useEffect(() => { request<Lesson>(`/api/v1/learn/lessons/${lessonId}`).then((response) => setData(response.data)); }, [lessonId]);
  useEffect(() => { const id = window.setInterval(() => { if (loggedIn) void request('/api/v1/learn/study/heartbeat', { method: 'POST', body: JSON.stringify({ scopeId: lessonId, activeSeconds: 5 }) }); }, 5000); return () => window.clearInterval(id); }, [lessonId, loggedIn]);
  async function markViewed() { if (kp && loggedIn) await request(`/api/v1/learn/knowledge-points/${kp.id}/viewed`, { method: 'POST' }); setActive(Math.min((data?.knowledgePoints.length ?? 1) - 1, active + 1)); }
  async function start() { await request(`/api/v1/learn/lessons/${lessonId}/start`, { method: 'POST' }); }
  async function saveNote() { if (kp) await request(`/api/v1/learn/knowledge-points/${kp.id}/note`, { method: 'POST', body: JSON.stringify({ content: note }) }); }
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-006" title={data?.nameZh ?? 'Lesson'} subtitle={label(data?.intro)} actions={<><Button variant="secondary" onClick={() => request(`/api/v1/learn/lessons/${lessonId}/skip`, { method: 'POST' })}>跳过此节</Button><Button onClick={() => navigate(`/learn/quiz/${data?.quizId ?? `quiz-lesson_quiz-${lessonId}`}`)}>开始小测</Button></>} />{data?.previewOnly ? <PaywallPanel track={track} stage={Number(stage)} navigate={navigate} loggedIn={loggedIn} /> : null}<div className="kp-strip">{(data?.knowledgePoints ?? []).map((item, index) => <button key={item.id} aria-current={index === active} onClick={() => setActive(index)}>{item.kpointNo}</button>)}</div>{kp ? <Card className="knowledge-card glass-panel"><div className="kp-head"><Badge>{kp.tags.join(' / ')}</Badge><Button variant="ghost" onClick={start}><PlayCircle size={18} />开始</Button></div><p className="kp-zh">{kp.zh}</p><p className="kp-pinyin">{kp.pinyinTones}</p><p>{label(kp.translations)}</p><div className="kp-key"><Volume2 size={18} /><span>{label(kp.keyPoint)}</span></div><div className="example-grid">{kp.exampleSentences.map((example) => <span key={example.zh}>{example.zh}<small>{example.pinyin}</small></span>)}</div><div className="course-actions"><Button variant="secondary" onClick={() => request(`/api/v1/learn/knowledge-points/${kp.id}/favorite`, { method: 'POST' })}><Heart size={18} />收藏</Button><Button variant="secondary" onClick={saveNote}><NotebookPen size={18} />笔记</Button><Button variant="ghost" onClick={() => request('/api/v1/learn/content-reports', { method: 'POST', body: JSON.stringify({ targetType: 'knowledge_point', targetId: kp.id, issueType: 'pinyin', description: 'learner report' }) })}><AlertTriangle size={18} />报错</Button><Button onClick={markViewed}>下一个</Button></div><TextArea label="知识点笔记（500 字内）" maxLength={500} value={note} onChange={(event) => setNote(event.currentTarget.value)} /></Card> : null}</section>;
}

function QuizPage({ quizId, navigate, loggedIn }: { quizId: string; navigate: (path: string) => void; loggedIn: boolean }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<Row | null>(null);
  useEffect(() => { request<Quiz>(`/api/v1/learn/quizzes/${quizId}`).then((response) => setQuiz(response.data)); }, [quizId]);
  async function submit() {
    const responses = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer, timeMs: 1200 }));
    const response = await request<Row>(`/api/v1/learn/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ responses, durationSeconds: 180 }) });
    setResult(response.data ?? { error: response.error?.message });
  }
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-007/008/009" title={quiz ? `${quiz.type} · ${quiz.questionCount} 题` : 'Quiz'} subtitle="GET 题目不泄露答案；提交后后端评分、错题去重入库并更新进度。" />{quiz?.timeLimitSeconds ? <Toast type="info">限时 {Math.round(quiz.timeLimitSeconds / 60)} 分钟，可暂停规则由测验类型控制。</Toast> : null}<div className="quiz-list">{(quiz?.questions ?? []).map((question, index) => <Card key={question.id} className="glass-panel"><Badge>{question.type}</Badge><h2>{index + 1}. {question.stemZh}</h2>{question.audioUrl ? <Button variant="secondary"><Volume2 size={18} />播放</Button> : null}<div className="option-grid">{question.options.map((option, optionIndex) => <button key={optionIndex} aria-pressed={answers[question.id] === optionIndex} onClick={() => setAnswers({ ...answers, [question.id]: optionIndex })}>{typeof option === 'string' ? option : option.zh}</button>)}</div></Card>)}</div><div className="sticky-actions glass-panel"><Button disabled={!loggedIn} onClick={submit}>提交测验</Button><Button variant="secondary" onClick={() => setAnswers({})}><RotateCcw size={18} />重做</Button></div>{result ? <Card className="glass-panel"><h2>报告</h2><p>得分：{String(result.scorePct ?? result.error)} · 通过线：{String(result.passThreshold ?? '-')}</p><Button onClick={() => navigate(`/learn/report/lesson/${String(quiz?.parentId ?? '')}`)}>查看学习报告</Button></Card> : null}{!loggedIn ? <Toast type="warning">登录后才能提交并写入错题集。</Toast> : null}</section>;
}

function PinyinIntro({ navigate, loggedIn }: { navigate: (path: string) => void; loggedIn: boolean }) {
  const [modules, setModules] = useState<Row[]>([]);
  useEffect(() => { request<Row[]>('/api/v1/learn/pinyin/modules').then((response) => setModules(response.data ?? [])); }, []);
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-002" title="拼音入门" subtitle="GB/T 16159-2012；23 声母、24 韵母、16 整体认读、四声轻声、变调、儿化、隔音符号。" /><div className="track-grid">{modules.map((module) => <Card key={String(module.id)} className="glass-panel"><Badge>P1/P2/P3</Badge><h2>{String(module.title)}</h2><p>{((module.includes as string[] | undefined) ?? []).join(' / ')}</p><Progress value={Number(module.progressPct ?? 0)} /><Button onClick={() => navigate(`/learn/quiz/${String(module.quizId)}`)}>综合练习</Button><Button variant="ghost" disabled={!loggedIn} onClick={() => request(`/api/v1/learn/pinyin/${String(module.id)}/skip`, { method: 'POST' })}>跳过但保留提醒</Button></Card>)}</div></section>;
}

function ReportPage({ type, id, navigate }: { type: string; id: string; navigate: (path: string) => void }) {
  const [report, setReport] = useState<Row | null>(null);
  useEffect(() => { request<Row>(`/api/v1/learn/reports/${type}/${id}`).then((response) => setReport(response.data)); }, [type, id]);
  return <section className="page course-page stack"><PageTitle eyebrow="CR-FR-013" title="学习报告" subtitle="节 / 章 / 阶段报告展示得分、错题、掌握度、推荐和阶段证书。" /><div className="course-kpis"><Metric icon={<FileText />} label="最佳得分" value={String(report?.bestScore ?? 0)} /><Metric icon={<ShieldCheck />} label="掌握度" value={`${String(report?.mastery ?? 0)}%`} /><Metric icon={<AlertTriangle />} label="错题" value={String((report?.wrongSet as unknown[] | undefined)?.length ?? 0)} /><Metric icon={<CreditCard />} label="证书" value={report?.certificateUrl ? 'ready' : 'locked'} /></div><Card className="glass-panel"><h2>推荐</h2><div className="course-actions">{((report?.recommendations as string[] | undefined) ?? []).map((item) => <Badge key={item}>{item}</Badge>)}</div><Button onClick={() => navigate('/learn')}>回到 Dashboard</Button></Card></section>;
}

function PaywallPanel({ track, stage, navigate, loggedIn }: { track: TrackCode; stage: number; navigate: (path: string) => void; loggedIn: boolean }) {
  const [message, setMessage] = useState('');
  async function buy(purchaseType: PurchaseSku) {
    const response = await request<Row>('/api/v1/learn/checkout/dummy', { method: 'POST', body: JSON.stringify({ trackCode: track, stageNo: stage, purchaseType }) });
    setMessage(response.error?.message ?? '已通过 PaymentAdapter dummy 解锁，刷新页面即可进入。');
  }
  return <Card className="paywall glass-panel"><LockKeyhole size={24} /><h2>解锁阶段 {stage}</h2><p>免费试学只开放每轨 Stage 1 前 3 章；跨级购买允许直接买任意轨道任意阶段。</p><div className="price-grid">{priceOptions.map((option) => <button key={option.type} disabled={!loggedIn} onClick={() => buy(option.type)}><strong>{option.label}</strong><small>{option.detail}</small></button>)}</div><Button variant="secondary" onClick={() => navigate(`/learn/${track}/1/1`)}>继续免费试看</Button>{message ? <Toast type="success">{message}</Toast> : null}{!loggedIn ? <Toast type="warning">请先登录再购买或记录学习完成度。</Toast> : null}</Card>;
}

function PageTitle({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="course-title"><div><Badge>{eyebrow}</Badge><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>{actions ? <div className="course-actions">{actions}</div> : null}</div>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <Card className="metric-card glass-panel"><span>{icon}</span><small>{label}</small><strong>{value}</strong></Card>;
}

function Progress({ value }: { value: number }) {
  return <div className="course-progress" aria-label="progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}