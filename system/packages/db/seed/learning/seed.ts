/**
 * E07 — Sample courses + lessons seed.
 *
 * Idempotent: uses ON CONFLICT (slug). Creates 4 courses (daily/ecommerce/
 * factory/hsk-bridge) × 3 lessons each. Each lesson has a 10-step `steps`
 * jsonb so the LessonEngine has something real to advance through during
 * tests.
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[learning seed] DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 2, prepare: false });

interface CourseSpec {
  slug: string;
  track: 'daily' | 'ecommerce' | 'factory' | 'hsk';
  hsk_level: number;
  i18n_title: Record<string, string>;
  i18n_summary: Record<string, string>;
  cover_url: string;
  sort_order: number;
  lessons: LessonSpec[];
}

interface LessonSpec {
  slug: string;
  i18n_title: Record<string, string>;
  steps: Array<{ type: string; title: Record<string, string>; data?: Record<string, unknown> }>;
}

function tenSteps(prefix: string): LessonSpec['steps'] {
  const types = ['intro', 'word', 'sentence', 'pinyin', 'listen', 'speak', 'read', 'write', 'practice', 'quiz'];
  return types.map((t) => ({
    type: t,
    title: { en: `${prefix} — ${t}`, zh: `${prefix} · ${t}` },
    data: { hint: `Step ${t} for ${prefix}` },
  }));
}

const COURSES: CourseSpec[] = [
  {
    slug: 'daily-hsk1-basics',
    track: 'daily',
    hsk_level: 1,
    i18n_title: { en: 'Daily Chinese — HSK1 Basics', zh: '日常汉语 · HSK1 基础' },
    i18n_summary: { en: 'Greet, introduce, count, order food.', zh: '问候、介绍、数字、点餐。' },
    cover_url: '/img/courses/daily-hsk1.png',
    sort_order: 10,
    lessons: [
      { slug: 'l1-greetings', i18n_title: { en: 'Greetings', zh: '问候' }, steps: tenSteps('Greetings') },
      { slug: 'l2-numbers', i18n_title: { en: 'Numbers', zh: '数字' }, steps: tenSteps('Numbers') },
      { slug: 'l3-food', i18n_title: { en: 'Ordering Food', zh: '点餐' }, steps: tenSteps('Food') },
    ],
  },
  {
    slug: 'ecommerce-customer-service',
    track: 'ecommerce',
    hsk_level: 3,
    i18n_title: { en: 'E-commerce — Customer Service', zh: '电商 · 客服话术' },
    i18n_summary: { en: 'Apologies, refunds, shipping disputes.', zh: '道歉、退款、物流纠纷。' },
    cover_url: '/img/courses/ecom-cs.png',
    sort_order: 20,
    lessons: [
      { slug: 'l1-apology', i18n_title: { en: 'Apology lines', zh: '道歉用语' }, steps: tenSteps('Apology') },
      { slug: 'l2-refund', i18n_title: { en: 'Refund flow', zh: '退款流程' }, steps: tenSteps('Refund') },
      { slug: 'l3-shipping', i18n_title: { en: 'Shipping issues', zh: '物流问题' }, steps: tenSteps('Shipping') },
    ],
  },
  {
    slug: 'factory-safety-basics',
    track: 'factory',
    hsk_level: 2,
    i18n_title: { en: 'Factory — Safety Basics', zh: '工厂 · 安全基础' },
    i18n_summary: { en: 'PPE, signs, line briefing.', zh: '劳保、标识、晨会。' },
    cover_url: '/img/courses/factory-safety.png',
    sort_order: 30,
    lessons: [
      { slug: 'l1-ppe', i18n_title: { en: 'PPE', zh: '劳保用品' }, steps: tenSteps('PPE') },
      { slug: 'l2-signs', i18n_title: { en: 'Safety signs', zh: '安全标识' }, steps: tenSteps('Signs') },
      { slug: 'l3-briefing', i18n_title: { en: 'Morning briefing', zh: '班前会' }, steps: tenSteps('Briefing') },
    ],
  },
  {
    slug: 'hsk-bridge-1to2',
    track: 'hsk',
    hsk_level: 2,
    i18n_title: { en: 'HSK 1→2 Bridge', zh: 'HSK 1→2 衔接' },
    i18n_summary: { en: 'Vocab and grammar to cross HSK2.', zh: '跨越 HSK2 的词法语法。' },
    cover_url: '/img/courses/hsk-bridge.png',
    sort_order: 40,
    lessons: [
      { slug: 'l1-pronouns', i18n_title: { en: 'Pronouns', zh: '代词' }, steps: tenSteps('Pronouns') },
      { slug: 'l2-time', i18n_title: { en: 'Time words', zh: '时间词' }, steps: tenSteps('Time') },
      { slug: 'l3-questions', i18n_title: { en: 'Questions', zh: '疑问句' }, steps: tenSteps('Questions') },
    ],
  },
];

async function run(): Promise<void> {
  let coursesUpserted = 0;
  let lessonsUpserted = 0;
  for (const c of COURSES) {
    const [course] = await sql<{ id: string }[]>`
      INSERT INTO zhiyu.courses (slug, track, hsk_level, status, i18n_title, i18n_summary, cover_url, sort_order)
      VALUES (
        ${c.slug}, ${c.track}, ${c.hsk_level}, 'published',
        ${sql.json(c.i18n_title)}, ${sql.json(c.i18n_summary)},
        ${c.cover_url}, ${c.sort_order}
      )
      ON CONFLICT (slug) DO UPDATE
        SET track = EXCLUDED.track,
            hsk_level = EXCLUDED.hsk_level,
            status = EXCLUDED.status,
            i18n_title = EXCLUDED.i18n_title,
            i18n_summary = EXCLUDED.i18n_summary,
            cover_url = EXCLUDED.cover_url,
            sort_order = EXCLUDED.sort_order,
            updated_at = now()
      RETURNING id
    `;
    coursesUpserted += 1;
    for (let idx = 0; idx < c.lessons.length; idx += 1) {
      const l = c.lessons[idx]!;
      await sql`
        INSERT INTO zhiyu.lessons (course_id, slug, position, i18n_title, steps)
        VALUES (${course!.id}, ${l.slug}, ${idx + 1}, ${sql.json(l.i18n_title)}, ${sql.json(l.steps)})
        ON CONFLICT (course_id, slug) DO UPDATE
          SET position = EXCLUDED.position,
              i18n_title = EXCLUDED.i18n_title,
              steps = EXCLUDED.steps,
              updated_at = now()
      `;
      lessonsUpserted += 1;
    }
  }
  console.info(`[learning seed] courses=${coursesUpserted} lessons=${lessonsUpserted}`);
  await sql.end({ timeout: 5 });
}

run().catch(async (err) => {
  console.error('[learning seed] failed', err);
  try {
    await sql.end({ timeout: 1 });
  } catch {
    // noop
  }
  process.exit(1);
});
