import bcrypt from 'bcryptjs';
import net from 'node:net';
import { randomUUID } from 'node:crypto';
import type { AdminRole, AuditLog, UserPreferences, UserProfile } from '@zhiyu/types';

const now = () => new Date().toISOString();
const passwordHash = bcrypt.hashSync('Password123!', 12);

export type SessionRecord = { id: string; userId: string; deviceName: string; ip: string; lastActiveAt: string; revokedAt?: string | null };
export type OtpRecord = { userId: string; email: string; code: string; purpose: string; expiresAt: number; attempts: number; consumedAt?: string };
export type OrderRecord = { id: string; userId: string; status: string; amountUsd: number; plan: string; createdAt: string; webhookHistory: string[] };
export type AdminRecord = { id: string; email: string; passwordHash: string; displayName: string; role: AdminRole; languages: string[]; isOnline: boolean; status: string; failedAttempts: number; lockedUntil: string | null; lastLoginAt: string | null };
type LocaleKey = 'en' | 'vi' | 'th' | 'id' | 'zh-CN';
type LocalizedText = Record<LocaleKey, string>;
type DiscoverRuntimeSnapshot = { categories: DiscoverCategoryRecord[]; articles: DiscoverArticleRecord[]; contentVersions: Record<string, unknown>[]; contentImports: Record<string, unknown>[]; reviewQueue: ReviewQueueRecord[]; updatedAt: string };
export type DiscoverCategoryRecord = { id: string; slug: string; code: string; nameZh: string; nameTranslations: LocalizedText; description: LocalizedText; coverImageUrl: string; themeColor: string; displayOrder: number; status: 'active' | 'draft'; public: boolean; motif: string; sourceDoc: string; contentBoundary: string; articleCount: number; recentTitles: string[] };
export type DiscoverSentenceRecord = { id: string; articleId: string; sequenceNumber: number; zh: string; pinyin: string; pinyinTones: string; translations: LocalizedText; audio: { default: { url: string; durationMs: number } }; hskLevel: number; tags: string[]; keyPoint: LocalizedText };
export type DiscoverArticleRecord = { id: string; categoryId: string; categorySlug: string; slug: string; titleZh: string; titleTranslations: LocalizedText; summary: LocalizedText; coverImageUrl: string; hskLevel: number; wordCount: number; readingMinutes: number; length: 'short' | 'medium' | 'long'; tags: string[]; keyPoints: Record<LocaleKey, string[]>; status: 'draft' | 'review' | 'published' | 'archived'; publishedAt: string; viewCount: number; ratingAvg: number; ratingCount: number; favoriteCount: number; createdBy: string | null; reviewedBy: string | null; createdAt: string; updatedAt: string; sentences: DiscoverSentenceRecord[] };
export type ReadingProgressRecord = { userId: string; targetType: 'article'; targetId: string; lastSentenceId: string | null; progressPct: number; isCompleted: boolean; readingTimeSeconds: number; lastReadAt: string };
export type FavoriteRecord = { userId: string; targetType: 'article' | 'sentence'; targetId: string; createdAt: string };
export type NoteRecord = { id: string; userId: string; targetType: 'sentence'; targetId: string; content: string; createdAt: string; updatedAt: string };
export type RatingRecord = { userId: string; targetType: 'article'; targetId: string; rating: number; comment?: string; createdAt: string };
export type ReviewQueueRecord = { id: string; resourceType: string; resourceId: string; status: string; language: string; title: string; notes: string; edits: Record<string, unknown> };

const defaultPreferences: UserPreferences = {
  uiLang: 'en',
  pinyinMode: 'tones',
  translationMode: 'inline',
  fontSize: 'M',
  ttsSpeed: 1,
  ttsVoice: 'female_zh',
  emailMarketing: true,
  emailLearningReminder: true,
  pushEnabled: false,
  theme: 'system'
};

function makeUser(email: string, displayName: string, status: UserProfile['status'], coins: number): UserProfile & { passwordHash: string } {
  return {
    id: randomUUID(),
    email,
    passwordHash,
    emailVerifiedAt: email === 'blocked@example.com' ? null : now(),
    displayName,
    avatarUrl: null,
    nativeLang: 'en',
    uiLang: 'en',
    timezone: 'UTC',
    hskLevelSelf: 1,
    hskLevelEstimated: 1,
    personaTags: ['hsk_student'],
    status,
    coins,
    createdAt: now()
  };
}

const users = [
  makeUser('normal@example.com', 'Normal Learner', 'active', 100),
  makeUser('vip@example.com', 'VIP Learner', 'active', 800),
  makeUser('referrer@example.com', 'Referral Partner', 'active', 500),
  makeUser('blocked@example.com', 'Blocked Learner', 'suspended', 0)
];

const adminUsers: AdminRecord[] = [
  { id: randomUUID(), email: 'admin@example.com', passwordHash, displayName: 'Admin', role: 'admin' as AdminRole, languages: ['en', 'vi'], isOnline: false, status: 'active', failedAttempts: 0, lockedUntil: null, lastLoginAt: null },
  { id: randomUUID(), email: 'editor@example.com', passwordHash, displayName: 'Editor', role: 'editor' as AdminRole, languages: ['en'], isOnline: false, status: 'active', failedAttempts: 0, lockedUntil: null, lastLoginAt: null },
  { id: randomUUID(), email: 'reviewer@example.com', passwordHash, displayName: 'Reviewer', role: 'reviewer' as AdminRole, languages: ['en', 'vi', 'th'], isOnline: false, status: 'active', failedAttempts: 0, lockedUntil: null, lastLoginAt: null },
  { id: randomUUID(), email: 'cs@example.com', passwordHash, displayName: 'Customer Support', role: 'cs' as AdminRole, languages: ['en', 'vi', 'th', 'id', 'zh-CN'], isOnline: false, status: 'active', failedAttempts: 0, lockedUntil: null, lastLoginAt: null },
  { id: randomUUID(), email: 'viewer@example.com', passwordHash, displayName: 'Viewer', role: 'viewer' as AdminRole, languages: ['en'], isOnline: false, status: 'active', failedAttempts: 0, lockedUntil: null, lastLoginAt: null }
];

function translations(en: string, vi: string, th: string, id: string): LocalizedText {
  return { en, vi, th, id, 'zh-CN': en };
}

const categoryDefinitions = [
  { slug: 'history', nameZh: '中国历史', names: translations('Chinese History', 'Lịch sử Trung Quốc', 'ประวัติศาสตร์จีน', 'Sejarah Tiongkok'), motif: '碑拓线条与松烟墨', sourceDoc: 'content/china/01-chinese-history.md', boundary: '历史故事、人物、朝代与中外交流；不做敏感争议评价。', themeColor: '#2F6F5E', titles: ['中国朝代速览：五分钟了解五千年', '秦始皇：统一文字、货币和度量衡的故事', '丝绸之路：连接中国与世界的古老商路'] },
  { slug: 'cuisine', nameZh: '中国美食', names: translations('Chinese Cuisine', 'Ẩm thực Trung Hoa', 'อาหารจีน', 'Kuliner Tiongkok'), motif: '温瓷与蒸汽曲线', sourceDoc: 'content/china/02-chinese-cuisine.md', boundary: '菜品故事、点菜中文与礼仪；不做完整菜谱或品牌推广。', themeColor: '#A37A32', titles: ['四川火锅：为什么中国人这么爱吃辣？', '北京烤鸭：300 年历史的国宝级美食', '广东早茶：一盅两件的悠闲时光'] },
  { slug: 'scenic', nameZh: '名胜风光', names: translations('Scenic Wonders', 'Danh thắng Trung Quốc', 'ทิวทัศน์จีน', 'Pesona Alam Tiongkok'), motif: '山水留白', sourceDoc: 'content/china/03-scenic-wonders.md', boundary: '景点文化、历史遗迹和旅行中文；不做酒店机票和地缘争议。', themeColor: '#6F9F8D', titles: ['万里长城：世界最长的城墙有多长？', '张家界：阿凡达的灵感来源', '西安兵马俑：沉睡两千年的地下军队'] },
  { slug: 'festivals', nameZh: '传统节日', names: translations('Festivals and Customs', 'Lễ hội và phong tục', 'เทศกาลและประเพณี', 'Festival dan Adat'), motif: '节气纹理', sourceDoc: 'content/china/04-festivals-customs.md', boundary: '节日由来、习俗和节气科学；不宣扬迷信或宗教仪式细节。', themeColor: '#B64032', titles: ['春节：为什么中国人要过两个新年？', '十二生肖：你是哪个动物？', '中秋节：嫦娥、月亮和月饼的故事'] },
  { slug: 'arts', nameZh: '艺术非遗', names: translations('Arts and Heritage', 'Nghệ thuật và di sản', 'ศิลปะและมรดก', 'Seni dan Warisan'), motif: '宣纸笔触', sourceDoc: 'content/china/05-arts-heritage.md', boundary: '艺术欣赏、非遗项目和传承故事；不做收藏投资或鉴定。', themeColor: '#526879', titles: ['中国书法入门：为什么汉字可以是艺术？', '景德镇青花瓷：惊艳世界的中国蓝', '剪纸艺术：一张纸能变出什么花样？'] },
  { slug: 'music-opera', nameZh: '音乐戏曲', names: translations('Music and Opera', 'Âm nhạc và hí khúc', 'ดนตรีและอุปรากร', 'Musik dan Opera'), motif: '弦线声波', sourceDoc: 'content/china/06-music-opera.md', boundary: '音乐文化、戏曲入门和歌词赏析；不提供未授权完整音频。', themeColor: '#6F8FA6', titles: ['古筝：最让外国人着迷的中国乐器', '京剧脸谱：颜色背后的秘密', '茉莉花：全世界都在唱的中国民歌'] },
  { slug: 'literature', nameZh: '文学经典', names: translations('Classic Literature', 'Văn học kinh điển', 'วรรณกรรมคลาสสิก', 'Sastra Klasik'), motif: '书页节奏', sourceDoc: 'content/china/07-classic-literature.md', boundary: '名著梗概、诗词赏析和寓言；不复制受版权保护全文。', themeColor: '#AEBFCC', titles: ['孙悟空：中国最有名的超级英雄', '李白：一个爱喝酒的天才诗人', '静夜思：中国人人会背的第一首诗'] },
  { slug: 'idioms', nameZh: '成语典故', names: translations('Idioms and Allusions', 'Thành ngữ điển tích', 'สำนวนและเรื่องอ้างอิง', 'Peribahasa dan Kisah'), motif: '印章短签', sourceDoc: 'content/china/08-idioms-allusions.md', boundary: '成语故事、例句和歇后语；不收录粗俗或过冷内容。', themeColor: '#E06B5C', titles: ['画龙点睛：为什么龙不能画眼睛？', '守株待兔 vs 刻舟求剑：两个关于等的成语', '中国人最爱说的 10 个成语'] },
  { slug: 'philosophy', nameZh: '哲学思想', names: translations('Philosophy and Wisdom', 'Triết học và trí tuệ', 'ปรัชญาและปัญญา', 'Filsafat dan Kebijaksanaan'), motif: '圆相竹简', sourceDoc: 'content/china/09-philosophy-wisdom.md', boundary: '核心思想通俗解读和日常影响；不做宗教传教或政治意识形态。', themeColor: '#8DBBA8', titles: ['孔子：影响中国两千年的老师', '道是什么？老子用五千字改变世界', '孙子兵法：全世界商人都在读的中国古书'] },
  { slug: 'modern', nameZh: '当代中国', names: translations('Modern China', 'Trung Quốc đương đại', 'จีนร่วมสมัย', 'Tiongkok Modern'), motif: '城市线稿', sourceDoc: 'content/china/10-modern-china.md', boundary: '科技、城市生活和流行文化；不做负面社会新闻或价值判断。', themeColor: '#253A35', titles: ['移动支付：中国人出门为什么不带钱包？', '微信：10 亿人离不开的 App', '中国高铁：坐一次就会爱上的交通工具'] },
  { slug: 'fun-hanzi', nameZh: '趣味汉字', names: translations('Fun with Chinese', 'Vui học chữ Hán', 'สนุกกับภาษาจีน', 'Seru dengan Hanzi'), motif: '字形演变', sourceDoc: 'content/china/11-fun-with-chinese.md', boundary: '汉字演变、数字密码和网络用语；不做完整语法教学。', themeColor: '#C6A15A', titles: ['520 = 我爱你：中文数字密码大揭秘', '汉字是画出来的：10 个象形字的前世今生', '不好意思和对不起到底有什么区别？'] },
  { slug: 'myths', nameZh: '中国神话传说', names: translations('Chinese Myths and Legends', 'Thần thoại Trung Hoa', 'ตำนานจีน', 'Mitos dan Legenda Tiongkok'), motif: '云水星图', sourceDoc: 'content/china/12-myths-legends.md', boundary: '创世神话、神仙人物和民间传说；不宣扬迷信或恐怖暴力。', themeColor: '#526879', titles: ['盘古开天辟地：中国人的宇宙起源故事', '十二生肖的来历：动物们的一场大赛跑', '牛郎织女：银河两岸的爱情传说'] }
];

const categories: DiscoverCategoryRecord[] = categoryDefinitions.map((category, index) => ({
  id: randomUUID(),
  slug: category.slug,
  code: category.slug,
  nameZh: category.nameZh,
  nameTranslations: category.names,
  description: translations(`Read stories from ${category.names.en}.`, `Đọc các câu chuyện về ${category.nameZh}.`, `อ่านเรื่องราวเกี่ยวกับ${category.nameZh}`, `Baca kisah tentang ${category.nameZh}.`),
  coverImageUrl: `seed://images/discover-china/${category.slug}.webp`,
  themeColor: category.themeColor,
  displayOrder: index + 1,
  status: 'active',
  public: index < 3,
  motif: category.motif,
  sourceDoc: category.sourceDoc,
  contentBoundary: category.boundary,
  articleCount: category.titles.length,
  recentTitles: category.titles.slice(0, 3)
}));

function makeSentences(articleId: string, categoryName: string, titleZh: string, hskLevel: number): DiscoverSentenceRecord[] {
  const rows = [
    { zh: `${categoryName}是理解中国文化的一扇窗。`, pinyin: 'wen2 hua4 shi4 li3 jie3 zhong1 guo2 de yi1 shan4 chuang1', en: `${categoryName} is a window into Chinese culture.` },
    { zh: `这篇文章用简单中文介绍：${titleZh}。`, pinyin: 'zhe4 pian1 wen2 zhang1 yong4 jian3 dan1 zhong1 wen2 jie4 shao4 zhu3 ti2', en: `This article introduces ${titleZh} in simple Chinese.` },
    { zh: '每个句子都有拼音、翻译和朗读占位。', pinyin: 'mei3 ge4 ju4 zi dou1 you3 pin1 yin1 fan1 yi4 he2 lang3 du2', en: 'Every sentence has pinyin, translation, and audio placeholders.' },
    { zh: '读完以后，可以继续学习课程、游戏或相关故事。', pinyin: 'du2 wan2 yi3 hou4 ke3 yi3 ji4 xu4 xue2 xi2 ke4 cheng2 you2 xi4 huo4 gu4 shi4', en: 'After reading, continue with courses, games, or related stories.' }
  ];
  return rows.map((row, index) => ({
    id: randomUUID(),
    articleId,
    sequenceNumber: index + 1,
    zh: row.zh,
    pinyin: row.pinyin.replace(/[1-5]/g, ''),
    pinyinTones: row.pinyin,
    translations: translations(row.en, `${row.en} (VI)`, `${row.en} (TH)`, `${row.en} (ID)`),
    audio: { default: { url: `seed://audio/discover-china/${articleId}-${index + 1}.mp3`, durationMs: 1800 + index * 220 } },
    hskLevel,
    tags: ['discover-china', categoryName],
    keyPoint: translations('Read the Chinese first, then compare the translation.', 'Đọc tiếng Trung trước rồi so sánh bản dịch.', 'อ่านภาษาจีนก่อนแล้วค่อยเทียบคำแปล', 'Baca bahasa Mandarin dulu, lalu bandingkan terjemahan.')
  }));
}

const articles: DiscoverArticleRecord[] = categories.flatMap((category, categoryIndex) => {
  const source = categoryDefinitions.find((item) => item.slug === category.slug);
  if (!source) return [];
  return source.titles.map((titleZh, articleIndex) => {
    const id = randomUUID();
    const hskLevel = articleIndex === 0 ? 2 : articleIndex === 1 ? 4 : 6;
    const length = articleIndex === 0 ? 'short' : articleIndex === 1 ? 'medium' : 'long';
    return {
      id,
      categoryId: category.id,
      categorySlug: category.slug,
      slug: `${category.slug}-${articleIndex + 1}`,
      titleZh,
      titleTranslations: translations(titleZh, `${titleZh} (VI)`, `${titleZh} (TH)`, `${titleZh} (ID)`),
      summary: translations(`A learner-friendly article about ${source.names.en}.`, `Bài đọc dễ học về ${category.nameZh}.`, `บทอ่านเข้าใจง่ายเกี่ยวกับ${category.nameZh}`, `Artikel ramah pelajar tentang ${category.nameZh}.`),
      coverImageUrl: `seed://images/discover-china/${category.slug}-${articleIndex + 1}.webp`,
      hskLevel,
      wordCount: 360 + articleIndex * 180,
      readingMinutes: 4 + articleIndex,
      length,
      tags: [category.slug, source.names.en.toLowerCase().replaceAll(' ', '-')],
      keyPoints: {
        en: [source.boundary, 'Use the CTA to continue into courses, games, novels, or related categories.'],
        vi: [source.boundary, 'Tiếp tục qua khóa học, trò chơi, truyện hoặc chủ đề liên quan.'],
        th: [source.boundary, 'ไปต่อด้วยคอร์ส เกม นิยาย หรือหมวดที่เกี่ยวข้อง'],
        id: [source.boundary, 'Lanjutkan ke kursus, game, novel, atau kategori terkait.'],
        'zh-CN': [source.boundary, '继续进入课程、游戏、小说或相关分类。']
      },
      status: 'published',
      publishedAt: now(),
      viewCount: 80 + categoryIndex * 12 + articleIndex,
      ratingAvg: 4.2 + articleIndex * 0.2,
      ratingCount: 8 + articleIndex,
      favoriteCount: 4 + articleIndex,
      createdBy: null,
      reviewedBy: null,
      createdAt: now(),
      updatedAt: now(),
      sentences: makeSentences(id, category.nameZh, titleZh, hskLevel)
    };
  });
});

export const state = {
  users,
  preferences: new Map(users.map((user) => [user.id, { ...defaultPreferences }])),
  sessions: [] as SessionRecord[],
  otps: [] as OtpRecord[],
  adminUsers,
  audits: [] as AuditLog[],
  categories,
  articles,
  readingProgress: [] as ReadingProgressRecord[],
  favorites: [] as FavoriteRecord[],
  notes: [] as NoteRecord[],
  ratings: [] as RatingRecord[],
  shareCards: [] as Record<string, unknown>[],
  contentVersions: [] as Record<string, unknown>[],
  contentImports: [] as Record<string, unknown>[],
  events: [] as Record<string, unknown>[],
  errorEvents: [] as Record<string, unknown>[],
  orders: users.slice(0, 2).map((user, index): OrderRecord => ({ id: randomUUID(), userId: user.id, status: index === 0 ? 'paid' : 'refund_pending', amountUsd: index === 0 ? 4 : 12, plan: index === 0 ? 'monthly' : 'half-year-launch', createdAt: now(), webhookHistory: ['dummy.checkout.completed'] })),
  featureFlags: [
    { key: 'payment.provider', value: { provider: 'dummy' }, description: 'PaymentAdapter dummy provider', rollout: { strategy: 'all' } },
    { key: 'promo.banner', value: { enabled: true }, description: 'Multi-language promo banner', rollout: { countries: ['VN', 'TH', 'ID'] } },
    { key: 'game.live', value: { enabled: true }, description: '12 MVP games visible', rollout: { percent: 100 } }
  ],
  reviewQueue: [{ id: randomUUID(), resourceType: 'article', resourceId: articles[0]?.id ?? randomUUID(), status: 'to_review', language: 'vi', title: articles[0]?.titleZh ?? '中国历史 1', notes: '', edits: {} }] as ReviewQueueRecord[],
  exports: [] as Record<string, unknown>[],
  announcements: [] as Record<string, unknown>[],
  securityEvents: [{ id: randomUUID(), severity: 'warning', type: 'rate_limit', subject: 'login', ip: '127.0.0.1', createdAt: now() }],
  blockedEntities: [] as Record<string, unknown>[],
  redLineRules: [{ id: randomUUID(), term: 'forbidden-demo', severity: 'high', action: 'block' }]
};

export function audit(input: Omit<AuditLog, 'id' | 'createdAt'>) {
  const log: AuditLog = { ...input, id: randomUUID(), createdAt: now() };
  state.audits.unshift(log);
  return log;
}

export function publicUser(user: UserProfile & { passwordHash?: string }) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

const DISCOVER_STATE_KEY = 'zhiyu:runtime:discover:v1';
const DISCOVER_STATE_VERSION_KEY = `${DISCOVER_STATE_KEY}:version`;
let discoverStoreReady = false;
let discoverStoreVersion: string | null = null;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function discoverSnapshot(): DiscoverRuntimeSnapshot {
  return cloneJson({
    categories: state.categories,
    articles: state.articles,
    contentVersions: state.contentVersions,
    contentImports: state.contentImports,
    reviewQueue: state.reviewQueue,
    updatedAt: now()
  });
}

function applyDiscoverSnapshot(snapshot: DiscoverRuntimeSnapshot) {
  state.categories.splice(0, state.categories.length, ...cloneJson(snapshot.categories ?? []));
  state.articles.splice(0, state.articles.length, ...cloneJson(snapshot.articles ?? []));
  state.contentVersions.splice(0, state.contentVersions.length, ...cloneJson(snapshot.contentVersions ?? []));
  state.contentImports.splice(0, state.contentImports.length, ...cloneJson(snapshot.contentImports ?? []));
  state.reviewQueue.splice(0, state.reviewQueue.length, ...cloneJson(snapshot.reviewQueue ?? []));
}

function encodeRedisCommand(args: string[]) {
  const parts = [Buffer.from(`*${args.length}\r\n`)];
  for (const arg of args) parts.push(Buffer.from(`$${Buffer.byteLength(arg)}\r\n`), Buffer.from(arg), Buffer.from('\r\n'));
  return Buffer.concat(parts);
}

function parseResp(buffer: Buffer): { value: string | number | null; consumed: number } | null {
  if (buffer.length < 3) return null;
  const type = String.fromCharCode(buffer[0] ?? 0);
  const lineEnd = buffer.indexOf('\r\n');
  if (lineEnd === -1) return null;
  const line = buffer.subarray(1, lineEnd).toString('utf8');
  if (type === '+' || type === ':') return { value: type === ':' ? Number(line) : line, consumed: lineEnd + 2 };
  if (type === '-') throw new Error(line);
  if (type !== '$') throw new Error(`Unsupported Redis response type ${type}`);
  const length = Number(line);
  if (length === -1) return { value: null, consumed: lineEnd + 2 };
  const start = lineEnd + 2;
  const end = start + length;
  if (buffer.length < end + 2) return null;
  return { value: buffer.subarray(start, end).toString('utf8'), consumed: end + 2 };
}

async function redisCommand(args: string[]) {
  if (!process.env.REDIS_URL) return null;
  const url = new URL(process.env.REDIS_URL);
  const db = Number(url.pathname.replace('/', '') || '0');
  const commands = db > 0 ? [encodeRedisCommand(['SELECT', String(db)]), encodeRedisCommand(args)] : [encodeRedisCommand(args)];
  return new Promise<string | number | null>((resolve, reject) => {
    const socket = net.createConnection({ host: url.hostname, port: Number(url.port || 6379) });
    let buffer = Buffer.alloc(0);
    let expectedResponses = commands.length;
    let lastValue: string | number | null = null;
    const finish = (value: string | number | null) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1200, () => {
      socket.destroy();
      reject(new Error('Redis command timed out'));
    });
    socket.on('connect', () => {
      for (const command of commands) socket.write(command);
    });
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (expectedResponses > 0) {
        const parsed = parseResp(buffer);
        if (!parsed) return;
        lastValue = parsed.value;
        expectedResponses -= 1;
        buffer = buffer.subarray(parsed.consumed);
      }
      finish(lastValue);
    });
    socket.on('error', reject);
  });
}

export async function refreshDiscoverContent() {
  if (!process.env.REDIS_URL) return;
  try {
    const version = await redisCommand(['GET', DISCOVER_STATE_VERSION_KEY]);
    if (typeof version !== 'string') {
      await persistDiscoverContent();
      discoverStoreReady = true;
      return;
    }
    if (discoverStoreReady && version === discoverStoreVersion) return;
    const payload = await redisCommand(['GET', DISCOVER_STATE_KEY]);
    if (typeof payload !== 'string') return;
    applyDiscoverSnapshot(JSON.parse(payload) as DiscoverRuntimeSnapshot);
    discoverStoreVersion = version;
    discoverStoreReady = true;
  } catch {
    discoverStoreReady = true;
  }
}

export async function persistDiscoverContent() {
  if (!process.env.REDIS_URL) return;
  try {
    const version = String(Date.now());
    await redisCommand(['SET', DISCOVER_STATE_KEY, JSON.stringify(discoverSnapshot())]);
    await redisCommand(['SET', DISCOVER_STATE_VERSION_KEY, version]);
    discoverStoreVersion = version;
    discoverStoreReady = true;
  } catch {
    discoverStoreReady = true;
  }
}

export { defaultPreferences, now, passwordHash };