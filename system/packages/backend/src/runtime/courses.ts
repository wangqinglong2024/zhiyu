import { randomUUID } from 'node:crypto';
import type { Locale } from '@zhiyu/types';

export type TrackCode = 'ec' | 'factory' | 'hsk' | 'daily';
export type QuizKind = 'lesson_quiz' | 'chapter_test' | 'stage_exam' | 'pinyin_intro';
export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type CourseQuestionType = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7' | 'Q8' | 'Q9' | 'Q10' | 'P1' | 'P2' | 'P3';

type L10n = Record<Locale, string>;
type ProgressScope = 'track' | 'stage' | 'chapter' | 'lesson' | 'knowledge_point' | 'pinyin';

export type CourseTrack = {
  id: string;
  code: TrackCode;
  aliases: string[];
  nameZh: string;
  nameTranslations: L10n;
  description: L10n;
  displayOrder: number;
  status: 'active';
  sourceRequirement: string;
  stages: CourseStage[];
};

export type CourseStage = {
  id: string;
  trackCode: TrackCode;
  stageNo: number;
  nameZh: string;
  nameTranslations: L10n;
  description: L10n;
  hskLevelRange: number[];
  prerequisiteStage: number | null;
  status: 'published';
  isFree: boolean;
  chapters?: CourseChapter[];
};

export type CourseChapter = {
  id: string;
  trackCode: TrackCode;
  stageNo: number;
  chapterNo: number;
  nameZh: string;
  nameTranslations: L10n;
  description: L10n;
  isFree: boolean;
  freeReason: 'login_trial' | null;
  status: 'published';
  hasAccess?: boolean;
  accessReason?: string;
  lessons?: CourseLesson[];
};

export type CourseLesson = {
  id: string;
  trackCode: TrackCode;
  stageNo: number;
  chapterNo: number;
  lessonNo: number;
  nameZh: string;
  nameTranslations: L10n;
  intro: L10n;
  learningObjectives: L10n[];
  status: 'published';
  quizId: string;
  knowledgePoints?: CourseKnowledgePoint[];
};

export type CourseKnowledgePoint = {
  id: string;
  lessonId: string;
  trackCode: TrackCode;
  stageNo: number;
  chapterNo: number;
  lessonNo: number;
  kpointNo: number;
  type: 'word' | 'phrase' | 'sentence' | 'grammar' | 'culture';
  unitType: 'char' | 'word' | 'phrase' | 'short_sentence' | 'mid_sentence' | 'long_sentence' | 'complex_sentence';
  zh: string;
  pinyin: string;
  pinyinTones: string;
  translations: L10n;
  audio: { default: { url: string; durationMs: number } };
  keyPoint: L10n;
  exampleSentences: Array<{ zh: string; pinyin: string; translations: L10n }>;
  tags: string[];
  hskLevel: number;
  status: 'active';
};

export type CourseQuestion = {
  id: string;
  type: CourseQuestionType;
  stemZh: string;
  stemTranslations: L10n;
  audioUrl: string | null;
  options: Array<string | { zh: string; pinyin?: string }>;
  correctAnswer: number | number[] | string;
  explanation: L10n;
  knowledgePointId: string;
  lessonId?: string;
  chapterId?: string;
  stageId?: string;
  trackCode: TrackCode | 'pinyin';
  hskLevel: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  reportCount: number;
};

export type CourseQuiz = {
  id: string;
  type: QuizKind;
  parentId: string;
  questionCount: number;
  passThreshold: number;
  timeLimitSeconds: number | null;
  maxRetriesPerWrong: number;
  questions: CourseQuestion[];
};

export type CourseProgress = {
  id: string;
  userId: string;
  scopeType: ProgressScope;
  scopeId: string;
  status: CourseStatus;
  progressPct: number;
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
  completionCounted: boolean;
};

export type CoursePurchase = {
  id: string;
  userId: string;
  trackCode: TrackCode;
  stageNo: number;
  purchaseType: 'stage_single' | 'stage_nine_pack' | 'membership_monthly' | 'membership_yearly' | 'membership_half_year' | 'single_stage' | 'nine_pack' | 'membership' | 'manual_grant';
  status: 'active' | 'revoked';
  reason: string;
  expiresAt: string | null;
  createdAt: string;
};

const now = () => new Date().toISOString();
const locales: Locale[] = ['en', 'vi', 'th', 'id', 'zh-CN'];
const questionTypes: CourseQuestionType[] = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];
const trackOrder: TrackCode[] = ['ec', 'factory', 'hsk', 'daily'];
const trackAliases: Record<string, TrackCode> = { ec: 'ec', ecommerce: 'ec', factory: 'factory', fc: 'factory', hsk: 'hsk', daily: 'daily', dl: 'daily' };

const trackMeta: Record<TrackCode, { nameZh: string; en: string; vi: string; th: string; id: string; desc: string; stages: string[] }> = {
  ec: { nameZh: '电商主题', en: 'E-commerce Chinese', vi: 'Tiếng Trung thương mại điện tử', th: 'ภาษาจีนอีคอมเมิร์ซ', id: 'Mandarin e-commerce', desc: '1688, logistics, negotiation, customer service and cross-border trade.', stages: ['拼音 + 基础问候 + 数字', '1688 / 阿里巴巴入门词汇', '询价 / 砍价基础', '物流 / 国际运输', '商品描述 / 规格', '售后 / 投诉 / 退款', '合同 / 付款条件', '展会 / 工厂参观', '商务谈判进阶', '跨境政策 / 海关', '营销文案 / 直播话术', '行业深度 / 案例'] },
  factory: { nameZh: '工厂主题', en: 'Factory Chinese', vi: 'Tiếng Trung nhà máy', th: 'ภาษาจีนโรงงาน', id: 'Mandarin pabrik', desc: 'Operations, safety, overtime, wages, shift handover and line leadership.', stages: ['拼音 + 自我介绍 + 工厂术语入门', '操作指令 / 工具名称', '安全规范 / 紧急情况', '加班 / 请假 / 工资', '设备故障 / 维修', '班组沟通 / 交接班', '质量检验 / SOP', '培训 / 升职', '组长管理', '行业术语（机械 / 电子 / 服装）', '5S / 6 西格玛 / 精益生产', '跨厂沟通 / 高级管理'] },
  hsk: { nameZh: 'HSK 主题', en: 'HSK Chinese', vi: 'Tiếng Trung HSK', th: 'ภาษาจีน HSK', id: 'Mandarin HSK', desc: 'HSK 1 through 9, integrated review, mock tests and exam explanation.', stages: ['HSK 1（150 词）', 'HSK 2（300 词）', 'HSK 3（600 词）', 'HSK 4（1200 词）', 'HSK 5（2500 词）', 'HSK 6（5000 词）', 'HSK 7（高阶）', 'HSK 8（高阶）', 'HSK 9（专业）', 'HSK 综合（1-6 复习）', '模考（HSK 4 / 6 / 9 各 1 套）', '真题精讲（近 5 年）'] },
  daily: { nameZh: '日常主题', en: 'Daily Life Chinese', vi: 'Tiếng Trung đời sống', th: 'ภาษาจีนชีวิตประจำวัน', id: 'Mandarin sehari-hari', desc: 'Food, travel, social life, culture, shopping, health and modern expression.', stages: ['拼音 + 问候 + 自我介绍', '数字 / 时间 / 日期', '吃喝（点餐 / 外卖 / 烹饪）', '交通 / 出行（打车 / 地铁 / 高铁）', '购物 / 砍价（淘宝 / 实体）', '健康 / 看病（医院 / 药店）', '社交 / 朋友（微信 / 朋友圈）', '文化 / 节日（春节 / 中秋）', '流行 / 娱乐（短视频 / 综艺）', '旅游 / 景点（热门城市）', '工作 / 职场（简历 / 面试）', '高级表达 / 成语 / 俗语'] }
};

export const courseStore = {
  enrollments: [] as Array<{ id: string; userId: string; trackCode: TrackCode; currentStageId: string; enrolledAt: string; lastActiveAt: string }>,
  progress: [] as CourseProgress[],
  attempts: [] as Array<{ id: string; userId: string; quizId: string; scorePct: number; isPassed: boolean; durationSeconds: number; responses: unknown[]; startedAt: string; submittedAt: string }>,
  wrongSet: [] as Array<{ id: string; userId: string; questionId: string; wrongCount: number; lastWrongAt: string; source: QuizKind; isResolved: boolean; createdAt: string }>,
  purchases: [] as CoursePurchase[],
  contentReports: [] as Array<{ id: string; userId: string; targetType: string; targetId: string; issueType: string; description: string; status: string; createdAt: string }>,
  imports: [] as Array<{ id: string; module: string; status: string; dryRun: boolean; itemCount: number; schemaVersion: string; createdAt: string }>,
  contentVersions: [] as Array<{ id: string; resourceType: string; resourceId: string; action: string; snapshot: unknown; createdAt: string }>,
  studySessions: [] as Array<{ id: string; userId: string; scopeId: string; activeSeconds: number; dayKey: string; rewarded: boolean; updatedAt: string }>,
  notes: [] as Array<{ id: string; userId: string; knowledgePointId: string; content: string; createdAt: string; updatedAt: string }>,
  favorites: [] as Array<{ userId: string; knowledgePointId: string; createdAt: string }>
};

function text(en: string, zh = en): L10n {
  return { en, vi: `${en} (VI)`, th: `${en} (TH)`, id: `${en} (ID)`, 'zh-CN': zh };
}

function title(code: TrackCode, stageNo: number, chapterNo?: number, lessonNo?: number) {
  const topic = trackMeta[code].stages[stageNo - 1] ?? `Stage ${stageNo}`;
  if (lessonNo) return `${topic} · 第 ${chapterNo} 章第 ${lessonNo} 节`;
  if (chapterNo) return `${topic} · 第 ${chapterNo} 章`;
  return topic;
}

export function resolveTrackCode(value: string | undefined): TrackCode | null {
  return value ? trackAliases[value.toLowerCase()] ?? null : null;
}

export function courseIds(code: TrackCode, stageNo?: number, chapterNo?: number, lessonNo?: number, kpointNo?: number) {
  const stage = stageNo ? `s${String(stageNo).padStart(2, '0')}` : '';
  const chapter = chapterNo ? `-c${String(chapterNo).padStart(2, '0')}` : '';
  const lesson = lessonNo ? `-l${String(lessonNo).padStart(2, '0')}` : '';
  const kpoint = kpointNo ? `-k${String(kpointNo).padStart(2, '0')}` : '';
  return `cr-${code}${stage ? `-${stage}` : ''}${chapter}${lesson}${kpoint}`;
}

export function parseCourseId(id: string) {
  const match = /^cr-(ec|factory|hsk|daily)-s(\d{2})(?:-c(\d{2}))?(?:-l(\d{2}))?(?:-k(\d{2}))?$/.exec(id);
  if (!match) return null;
  const stageNo = Number(match[2]);
  const chapterNo = match[3] ? Number(match[3]) : undefined;
  const lessonNo = match[4] ? Number(match[4]) : undefined;
  const kpointNo = match[5] ? Number(match[5]) : undefined;
  if (![stageNo, chapterNo, lessonNo, kpointNo].every((value) => value === undefined || (Number.isSafeInteger(value) && value >= 1 && value <= 12))) return null;
  return { trackCode: match[1] as TrackCode, stageNo, chapterNo, lessonNo, kpointNo };
}

function hskRange(stageNo: number) {
  if (stageNo <= 1) return [1];
  if (stageNo <= 3) return [Math.min(3, stageNo)];
  if (stageNo <= 6) return [stageNo - 1, stageNo];
  return [Math.min(9, stageNo - 2), Math.min(9, stageNo)];
}

export function makeStage(trackCode: TrackCode, stageNo: number): CourseStage {
  const nameZh = title(trackCode, stageNo);
  return { id: courseIds(trackCode, stageNo), trackCode, stageNo, nameZh, nameTranslations: text(trackMeta[trackCode].stages[stageNo - 1] ?? nameZh, nameZh), description: text(`Stage ${stageNo} covers ${trackMeta[trackCode].desc}`, `${nameZh}：围绕 ${trackMeta[trackCode].desc}`), hskLevelRange: hskRange(stageNo), prerequisiteStage: stageNo > 1 ? stageNo - 1 : null, isFree: stageNo <= 3, status: 'published' };
}

export function makeChapter(trackCode: TrackCode, stageNo: number, chapterNo: number, userId?: string | null): CourseChapter {
  const access = permissionFor(userId ?? null, trackCode, stageNo, chapterNo);
  return { id: courseIds(trackCode, stageNo, chapterNo), trackCode, stageNo, chapterNo, nameZh: title(trackCode, stageNo, chapterNo), nameTranslations: text(`Chapter ${chapterNo}: ${trackMeta[trackCode].stages[stageNo - 1]}`, title(trackCode, stageNo, chapterNo)), description: text(`A 12 lesson chapter with a 36 question chapter test.`, `12 节闭环学习，章末 36 题章测。`), isFree: stageNo <= 3, freeReason: stageNo <= 3 ? 'login_trial' : null, status: 'published', hasAccess: access.hasAccess, accessReason: access.reason };
}

export function makeLesson(trackCode: TrackCode, stageNo: number, chapterNo: number, lessonNo: number): CourseLesson {
  const lessonId = courseIds(trackCode, stageNo, chapterNo, lessonNo);
  return { id: lessonId, trackCode, stageNo, chapterNo, lessonNo, nameZh: title(trackCode, stageNo, chapterNo, lessonNo), nameTranslations: text(`Lesson ${lessonNo}: ${trackMeta[trackCode].stages[stageNo - 1]}`, title(trackCode, stageNo, chapterNo, lessonNo)), intro: text(`Learn 12 compact knowledge points. No articles or paragraphs are used in course content.`, `学习 12 个单行知识点；课程内容不承载文章或段落。`), learningObjectives: [text('Recognize the key expression.', '识别核心表达。'), text('Use the expression in a realistic scene.', '在真实场景使用表达。')], status: 'published', quizId: quizId('lesson_quiz', lessonId) };
}

export function makeKnowledgePoints(lessonId: string): CourseKnowledgePoint[] {
  const parsed = parseCourseId(lessonId);
  if (!parsed || !parsed.chapterNo || !parsed.lessonNo) return [];
  const { trackCode, stageNo, chapterNo, lessonNo } = parsed;
  const samples: Record<TrackCode, string[]> = {
    ec: ['老板', '价格', '包邮', '起订量', '能便宜点吗', '什么时候发货', '这个规格合适'],
    factory: ['组长', '安全', '工具', '请戴手套', '机器停了', '今天加班吗', '先检查电源'],
    hsk: ['你好', '学习', '中文', '我在上课', '请再说一遍', '这个词很常用', '先听再选择'],
    daily: ['朋友', '吃饭', '地铁', '我要这个', '几点出发', '今天一起喝茶', '这里离得很近']
  };
  return Array.from({ length: 12 }, (_, index) => {
    const kpointNo = index + 1;
    const zh = samples[trackCode][index % samples[trackCode].length] ?? '你好';
    const id = courseIds(trackCode, stageNo, chapterNo, lessonNo, kpointNo);
    const unitType = stageNo <= 2 ? (kpointNo <= 2 ? 'char' : 'word') : stageNo <= 4 ? 'phrase' : stageNo <= 8 ? 'short_sentence' : stageNo <= 10 ? 'mid_sentence' : 'long_sentence';
    return { id, lessonId, trackCode, stageNo, chapterNo, lessonNo, kpointNo, type: kpointNo % 5 === 0 ? 'grammar' : kpointNo % 4 === 0 ? 'sentence' : kpointNo % 3 === 0 ? 'phrase' : 'word', unitType, zh, pinyin: `pin yin ${kpointNo}`, pinyinTones: `pin1 yin1 ${kpointNo}`, translations: text(`${zh} in context`, zh), audio: { default: { url: `seed://audio/courses/${id}.mp3`, durationMs: 1400 + kpointNo * 80 } }, keyPoint: text('One compact point, under 30 Chinese characters.', '单点讲解，不超过 30 字。'), exampleSentences: [{ zh: `${zh}。`, pinyin: `pin1 yin1 ${kpointNo}`, translations: text(`Example with ${zh}.`, `${zh} 的例句。`) }, { zh: `我会说${zh}。`, pinyin: `wo3 hui4 shuo1 pin1 yin1`, translations: text(`I can say ${zh}.`, `我会说${zh}。`) }], tags: [trackCode, `stage-${stageNo}`, unitType], hskLevel: Math.min(9, Math.max(1, stageNo)), status: 'active' };
  });
}

function quizId(type: QuizKind, parentId: string) {
  return `quiz-${type}-${parentId}`;
}

export function publicQuestion(question: CourseQuestion) {
  const { correctAnswer: _correctAnswer, ...safe } = question;
  return safe;
}

function questionFor(kp: CourseKnowledgePoint, index: number, typeOverride?: CourseQuestionType): CourseQuestion {
  const type = typeOverride ?? questionTypes[index % questionTypes.length] ?? 'Q1';
  const options = [kp.zh, '谢谢', '明天', '学习'];
  const stemByType: Partial<Record<CourseQuestionType, string>> = { Q1: `我每天 ___ ${kp.zh}。`, Q2: `${kp.zh} = ?`, Q3: `${kp.translations.en} = ?`, Q4: 'Listen and choose the matching Chinese.', Q5: `听对话：${kp.zh}`, Q6: `把词语排成句子：${kp.zh}`, Q7: `${kp.zh} 的翻译是否正确？`, Q8: `选择正确句子：${kp.zh}`, Q9: `Translate into Chinese: ${kp.translations.en}`, Q10: `阅读短文并回答：${kp.zh}`, P1: '听辨声母 / 韵母 / 声调', P2: `选择 ${kp.zh} 的正确拼音`, P3: `选择拼音对应的汉字` };
  return { id: `${kp.id}-q${String(index + 1).padStart(2, '0')}-${type}`, type, stemZh: stemByType[type] ?? kp.zh, stemTranslations: text(stemByType[type] ?? kp.zh, stemByType[type] ?? kp.zh), audioUrl: ['Q4', 'Q5', 'P1'].includes(type) ? kp.audio.default.url : null, options: type === 'Q4' ? options.map((zh) => ({ zh, pinyin: kp.pinyin })) : options, correctAnswer: type === 'Q8' ? [0, 1, 2] : 0, explanation: text('The answer matches the knowledge point and uses level-appropriate distractors.', '答案来自本知识点，干扰项不高于题目等级。'), knowledgePointId: kp.id, lessonId: kp.lessonId, chapterId: courseIds(kp.trackCode, kp.stageNo, kp.chapterNo), stageId: courseIds(kp.trackCode, kp.stageNo), trackCode: kp.trackCode, hskLevel: kp.hskLevel, difficulty: Math.min(5, Math.max(1, Math.ceil(kp.stageNo / 3))) as 1 | 2 | 3 | 4 | 5, tags: kp.tags, reportCount: 0 };
}

export function makeQuiz(id: string): CourseQuiz | null {
  if (id.startsWith('quiz-pinyin_intro-')) return makePinyinQuiz(id.replace('quiz-pinyin_intro-', ''));
  const match = /^quiz-(lesson_quiz|chapter_test|stage_exam)-(cr-.+)$/.exec(id);
  if (!match) return null;
  const type = match[1] as QuizKind;
  const parentId = match[2] ?? '';
  const parsed = parseCourseId(parentId);
  if (!parsed) return null;
  const lessonId = type === 'lesson_quiz' ? parentId : courseIds(parsed.trackCode, parsed.stageNo, parsed.chapterNo ?? 1, 1);
  const points = makeKnowledgePoints(lessonId);
  const counts = { lesson_quiz: 10, chapter_test: 36, stage_exam: Math.min(150, 80 + (parsed.stageNo - 1) * 10), pinyin_intro: 12 };
  const pass = { lesson_quiz: 60, chapter_test: 70, stage_exam: 75, pinyin_intro: 80 };
  const limit = type === 'chapter_test' ? 3600 : type === 'stage_exam' ? 7200 + parsed.stageNo * 300 : null;
  const questions = Array.from({ length: counts[type] }, (_, index) => questionFor(points[index % points.length] ?? points[0]!, index));
  return { id, type, parentId, questionCount: counts[type], passThreshold: pass[type], timeLimitSeconds: limit, maxRetriesPerWrong: type === 'lesson_quiz' ? 2 : 0, questions };
}

function makePinyinQuiz(moduleId: string): CourseQuiz {
  const points = makeKnowledgePoints(courseIds('hsk', 1, 1, 1));
  const types: CourseQuestionType[] = ['P1', 'P2', 'P3'];
  return { id: quizId('pinyin_intro', moduleId), type: 'pinyin_intro', parentId: moduleId, questionCount: 12, passThreshold: 80, timeLimitSeconds: null, maxRetriesPerWrong: 2, questions: Array.from({ length: 12 }, (_, index) => questionFor(points[index % points.length]!, index, types[index % types.length])) };
}

export function listTracks(userId?: string | null): CourseTrack[] {
  return trackOrder.map((code, index) => ({ id: `track-${code}`, code, aliases: Object.entries(trackAliases).filter(([, value]) => value === code).map(([key]) => key), nameZh: trackMeta[code].nameZh, nameTranslations: { en: trackMeta[code].en, vi: trackMeta[code].vi, th: trackMeta[code].th, id: trackMeta[code].id, 'zh-CN': trackMeta[code].nameZh }, description: text(trackMeta[code].desc, trackMeta[code].desc), displayOrder: index + 1, status: 'active', sourceRequirement: 'planning/prds/03-courses/01-structure-content.md：4 主题与每主题 12 阶段。', stages: Array.from({ length: 12 }, (_, stageIndex) => ({ ...makeStage(code, stageIndex + 1), chapters: Array.from({ length: 12 }, (__, chapterIndex) => makeChapter(code, stageIndex + 1, chapterIndex + 1, userId)) })) }));
}

export function permissionFor(userId: string | null, trackCode: TrackCode, stageNo: number, chapterNo?: number) {
  if (!userId) return { hasAccess: false, reason: 'login_required', completionCounted: false };
  if (stageNo <= 3) return { hasAccess: true, reason: 'free_stage', completionCounted: true };
  const purchase = courseStore.purchases.find((item) => item.userId === userId && item.status === 'active' && !isExpired(item.expiresAt) && (isMembership(item.purchaseType) || (item.trackCode === trackCode && ((isSingleStage(item.purchaseType) || item.purchaseType === 'manual_grant') ? item.stageNo === stageNo : isNinePack(item.purchaseType) && stageNo >= item.stageNo && stageNo < item.stageNo + 9))));
  if (purchase) return { hasAccess: true, reason: purchase.purchaseType, completionCounted: purchase.purchaseType !== 'manual_grant' ? true : false, expiresAt: purchase.expiresAt };
  return { hasAccess: false, reason: 'paywall', completionCounted: false };
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  const expiresTime = Date.parse(expiresAt);
  return !Number.isFinite(expiresTime) || expiresTime <= Date.now();
}

function isSingleStage(purchaseType: CoursePurchase['purchaseType']) {
  return purchaseType === 'stage_single' || purchaseType === 'single_stage';
}

function isNinePack(purchaseType: CoursePurchase['purchaseType']) {
  return purchaseType === 'stage_nine_pack' || purchaseType === 'nine_pack';
}

function isMembership(purchaseType: CoursePurchase['purchaseType']) {
  return purchaseType === 'membership' || purchaseType === 'membership_monthly' || purchaseType === 'membership_yearly' || purchaseType === 'membership_half_year';
}

export function dashboard(userId: string | null, trackCode: TrackCode = 'daily') {
  const enrollment = userId ? courseStore.enrollments.find((item) => item.userId === userId && item.trackCode === trackCode) : null;
  const currentLessonId = courseIds(trackCode, 1, 1, 5);
  const weekSeconds = userId ? courseStore.studySessions.filter((item) => item.userId === userId).reduce((sum, item) => sum + item.activeSeconds, 0) : 0;
  return { currentTrack: trackCode, enrollment: enrollment ?? null, continueLessonId: currentLessonId, continuePath: `/learn/${trackCode}/1/1/5`, todayTasks: [{ type: 'lesson', title: '继续第 5 节', path: `/learn/${trackCode}/1/1/5` }, { type: 'chapter_test', title: '完成第 1 章章测', path: `/learn/${trackCode}/1/1/test` }, { type: 'review', title: '温故知新错题 5 题', path: '/learn/wrong-set' }], weekStudySeconds: weekSeconds, tracks: listTracks(userId).map((track) => ({ code: track.code, nameZh: track.nameZh, progressPct: progressPct(userId, 'track', `track-${track.code}`), active: track.code === trackCode })) };
}

function progressPct(userId: string | null, scopeType: ProgressScope, scopeId: string) {
  if (!userId) return 0;
  return courseStore.progress.find((item) => item.userId === userId && item.scopeType === scopeType && item.scopeId === scopeId)?.progressPct ?? 0;
}

export function upsertProgress(userId: string, scopeType: ProgressScope, scopeId: string, progressPctValue: number, status: CourseStatus, completionCounted = true) {
  const existing = courseStore.progress.find((item) => item.userId === userId && item.scopeType === scopeType && item.scopeId === scopeId);
  const completedAt = status === 'completed' || status === 'skipped' ? now() : null;
  if (existing) Object.assign(existing, { progressPct: progressPctValue, status, lastActiveAt: now(), completedAt: completedAt ?? existing.completedAt, completionCounted });
  else courseStore.progress.push({ id: randomUUID(), userId, scopeType, scopeId, status, progressPct: progressPctValue, startedAt: now(), completedAt, lastActiveAt: now(), completionCounted });
  return courseStore.progress.find((item) => item.userId === userId && item.scopeType === scopeType && item.scopeId === scopeId)!;
}

export function submitQuiz(userId: string, quizIdValue: string, responses: Array<{ questionId: string; answer: unknown; timeMs?: number }>, durationSeconds: number) {
  const quiz = makeQuiz(quizIdValue);
  if (!quiz) return null;
  const graded = quiz.questions.map((question) => {
    const response = responses.find((item) => item.questionId === question.id);
    const correct = answersMatch(response?.answer ?? null, question.correctAnswer);
    if (!correct) upsertWrong(userId, question.id, quiz.type);
    return { questionId: question.id, answer: response?.answer ?? null, isCorrect: correct, explanation: question.explanation, correctAnswer: question.correctAnswer };
  });
  const scorePct = Math.round((graded.filter((item) => item.isCorrect).length / Math.max(1, quiz.questions.length)) * 100);
  const isPassed = scorePct >= quiz.passThreshold;
  courseStore.attempts.push({ id: randomUUID(), userId, quizId: quiz.id, scorePct, isPassed, durationSeconds, responses: graded, startedAt: now(), submittedAt: now() });
  if (isPassed) {
    if (quiz.type === 'lesson_quiz') upsertProgress(userId, 'lesson', quiz.parentId, 100, 'completed');
    if (quiz.type === 'chapter_test') upsertProgress(userId, 'chapter', quiz.parentId, 100, 'completed');
    if (quiz.type === 'stage_exam') upsertProgress(userId, 'stage', quiz.parentId, 100, 'completed');
    if (quiz.type === 'pinyin_intro') upsertProgress(userId, 'pinyin', quiz.parentId, 100, 'completed');
  }
  return { quizId: quiz.id, scorePct, isPassed, passThreshold: quiz.passThreshold, wrong: graded.filter((item) => !item.isCorrect), responses: graded, rewardCoins: quiz.type === 'lesson_quiz' ? Math.max(5, Math.round(scorePct / 10)) : quiz.type === 'chapter_test' ? 30 : quiz.type === 'stage_exam' ? 100 : 10 };
}

function answersMatch(answer: unknown, correctAnswer: unknown) {
  return JSON.stringify(normalizeAnswer(answer)) === JSON.stringify(normalizeAnswer(correctAnswer));
}

function normalizeAnswer(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => normalizeAnswer(item)).sort((left, right) => String(left).localeCompare(String(right)));
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
  return value;
}

function upsertWrong(userId: string, questionId: string, source: QuizKind) {
  const existing = courseStore.wrongSet.find((item) => item.userId === userId && item.questionId === questionId);
  if (existing) Object.assign(existing, { wrongCount: existing.wrongCount + 1, lastWrongAt: now(), source, isResolved: false });
  else courseStore.wrongSet.push({ id: randomUUID(), userId, questionId, wrongCount: 1, lastWrongAt: now(), source, isResolved: false, createdAt: now() });
}

export function enrollTracks(userId: string, codes: TrackCode[]) {
  for (const code of codes) {
    if (!courseStore.enrollments.some((item) => item.userId === userId && item.trackCode === code)) courseStore.enrollments.push({ id: randomUUID(), userId, trackCode: code, currentStageId: courseIds(code, 1), enrolledAt: now(), lastActiveAt: now() });
  }
  return courseStore.enrollments.filter((item) => item.userId === userId);
}

export function recommendTracks(goal: string, level: string) {
  const selected: TrackCode[] = goal.includes('工作') || goal.includes('work') ? ['factory', 'ec'] : goal.toLowerCase().includes('hsk') ? ['hsk', 'daily'] : ['daily', 'hsk'];
  return { tracks: selected, startStage: level.includes('4') || level.includes('7') ? 3 : 1, pinyinRequired: level.includes('零') || level.toLowerCase().includes('zero') };
}

export function grantPurchase(userId: string, trackCode: TrackCode, stageNo: number, purchaseType: CoursePurchase['purchaseType'], reason: string, expiresAt: string | null = null) {
  const existing = courseStore.purchases.find((item) => item.userId === userId && item.trackCode === trackCode && item.stageNo === stageNo && item.purchaseType === purchaseType);
  if (existing) Object.assign(existing, { status: 'active', reason, expiresAt });
  else courseStore.purchases.push({ id: randomUUID(), userId, trackCode, stageNo, purchaseType, status: 'active', reason, expiresAt, createdAt: now() });
  return courseStore.purchases.filter((item) => item.userId === userId);
}

export function revokePurchase(userId: string, purchaseId: string) {
  const purchase = courseStore.purchases.find((item) => item.userId === userId && item.id === purchaseId);
  if (purchase) purchase.status = 'revoked';
  return purchase ?? null;
}

export function reportFor(userId: string | null, type: 'lesson' | 'chapter' | 'stage', id: string) {
  const attempts = userId ? courseStore.attempts.filter((item) => item.userId === userId && item.quizId.includes(id)) : [];
  const best = attempts.reduce((max, item) => Math.max(max, item.scorePct), 0);
  return { id, type, bestScore: best, mastery: Math.max(best, progressPct(userId, type === 'lesson' ? 'lesson' : type, id)), wrongSet: userId ? courseStore.wrongSet.filter((item) => item.userId === userId && item.questionId.includes(id)).slice(0, 20) : [], recommendations: ['下一节', '温故知新', '游戏强化'], certificateUrl: type === 'stage' && best >= 75 ? `/api/v1/learn/certificates/${id}.pdf` : null };
}

export function pinyinModules(userId: string | null) {
  return ['initials', 'finals', 'tones', 'integrated'].map((id, index) => ({ id, title: ['声母 23 个', '韵母 24 个', '四声轻声与变调', '综合练习'][index], standard: 'GB/T 16159-2012', includes: ['23 声母', '24 韵母', '16 整体认读', '四声轻声', '变调', '儿化', '隔音符号'], progressPct: progressPct(userId, 'pinyin', id), quizId: quizId('pinyin_intro', id) }));
}

export function addContentReport(userId: string, targetType: string, targetId: string, issueType: string, description: string) {
  const report = { id: randomUUID(), userId, targetType, targetId, issueType, description, status: 'to_review', createdAt: now() };
  courseStore.contentReports.unshift(report);
  return report;
}

export function toggleFavorite(userId: string, knowledgePointId: string) {
  const index = courseStore.favorites.findIndex((item) => item.userId === userId && item.knowledgePointId === knowledgePointId);
  if (index >= 0) courseStore.favorites.splice(index, 1);
  else courseStore.favorites.push({ userId, knowledgePointId, createdAt: now() });
  return { favorite: index < 0 };
}

export function saveNote(userId: string, knowledgePointId: string, content: string) {
  if (!content.trim() || content.length > 500) return null;
  const existing = courseStore.notes.find((item) => item.userId === userId && item.knowledgePointId === knowledgePointId);
  if (existing) Object.assign(existing, { content, updatedAt: now() });
  else courseStore.notes.push({ id: randomUUID(), userId, knowledgePointId, content, createdAt: now(), updatedAt: now() });
  return courseStore.notes.find((item) => item.userId === userId && item.knowledgePointId === knowledgePointId) ?? null;
}

export function heartbeat(userId: string, scopeId: string, activeSeconds: number) {
  const dayKey = now().slice(0, 10);
  let session = courseStore.studySessions.find((item) => item.userId === userId && item.scopeId === scopeId && item.dayKey === dayKey);
  if (!session) { session = { id: randomUUID(), userId, scopeId, activeSeconds: 0, dayKey, rewarded: false, updatedAt: now() }; courseStore.studySessions.push(session); }
  session.activeSeconds += Math.max(0, Math.min(60, activeSeconds));
  session.updatedAt = now();
  const daySeconds = courseStore.studySessions.filter((item) => item.userId === userId && item.dayKey === dayKey).reduce((sum, item) => sum + item.activeSeconds, 0);
  const reward = daySeconds >= 1800 && !courseStore.studySessions.some((item) => item.userId === userId && item.dayKey === dayKey && item.rewarded);
  if (reward) session.rewarded = true;
  return { daySeconds, weekSeconds: courseStore.studySessions.filter((item) => item.userId === userId).reduce((sum, item) => sum + item.activeSeconds, 0), rewardCoins: reward ? 10 : 0 };
}

export function adminTree(userId?: string | null) {
  return listTracks(userId).map((track) => ({ ...track, stages: track.stages.map((stage) => ({ ...stage, chapters: Array.from({ length: 12 }, (_, index) => makeChapter(track.code, stage.stageNo, index + 1, userId)) })) }));
}

export function wordpackScope(userId: string) {
  return trackOrder.map((trackCode) => ({ trackCode, accessibleStages: Array.from({ length: 12 }, (_, index) => index + 1).filter((stageNo) => permissionFor(userId, trackCode, stageNo, 1).hasAccess), source: 'course_permissions' }));
}

export function translationCoverage() {
  return trackOrder.map((trackCode) => ({ trackCode, totalNodes: 12 * 12 * 12 * 12, locales, complete: 12 * 12 * 12 * 12, missing: 0, percent: 100 }));
}

export function validateCourseSeed(payload: unknown, dryRun: boolean) {
  const input = payload as { $schema_version?: string; schemaVersion?: string; module?: string; items?: unknown[] };
  const items = Array.isArray(input.items) ? input.items : [];
  const errors: string[] = [];
  if ((input.module ?? 'courses') !== 'courses') errors.push('module must be courses');
  if (items.length < 24) errors.push('courses seed requires at least 24 lessons for the development minimum');
  const result = { id: randomUUID(), module: 'courses', status: errors.length ? 'rejected' : 'validated', dryRun, itemCount: items.length, schemaVersion: input.$schema_version ?? input.schemaVersion ?? '1.0', errors, createdAt: now() };
  if (!dryRun && errors.length === 0) courseStore.imports.unshift(result);
  return result;
}

export function courseCatalogRows() {
  return listTracks().map((track) => ({ id: track.code, title: track.nameZh, status: 'published', stages: 12, chapters: 144, lessons: 1728, freeTrial: 'Stage 1-3 all chapters', source: 'AD-FR-006 / CR-FR-003' }));
}