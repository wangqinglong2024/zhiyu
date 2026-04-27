import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const moduleName = process.argv[2] ?? 'all';
const root = process.cwd();

async function seedCourses() {
  const file = join(root, 'seed/courses/blueprint.json');
  const json = JSON.parse(await readFile(file, 'utf8')) as { module: string; requirements: { tracks: string[]; minimumStagesPerTrack: number; minimumLessonsPerStage: number; minimumQuestionsPerLesson: number; minimumQuestionTypesCovered: number; stageExamMinimumQuestions: number }; items: Array<{ module_specific: { track: string; stage: number; questionTypes: string[] } }>; stage_exam: { questionCount: number; questionTypes: string[] } };
  const tracks = new Set(json.items.map((item) => item.module_specific.track));
  const types = new Set(json.items.flatMap((item) => item.module_specific.questionTypes));
  if (json.module !== 'courses') throw new Error('courses seed module must be courses');
  if (json.items.length < json.requirements.tracks.length * json.requirements.minimumStagesPerTrack * json.requirements.minimumLessonsPerStage) throw new Error(`courses seed requires at least 24 lessons, got ${json.items.length}`);
  for (const track of json.requirements.tracks) if (!tracks.has(track)) throw new Error(`missing course track seed: ${track}`);
  if (types.size < json.requirements.minimumQuestionTypesCovered) throw new Error(`courses seed requires >= ${json.requirements.minimumQuestionTypesCovered} question types, got ${types.size}`);
  if (json.items.some((item) => item.module_specific.questionTypes.length < json.requirements.minimumQuestionsPerLesson)) throw new Error('each course lesson seed must include at least 5 questions');
  if (json.stage_exam.questionCount < json.requirements.stageExamMinimumQuestions) throw new Error('stage exam seed requires at least 10 questions');
  console.log(JSON.stringify({ status: 'ok', module: 'courses', tracks: tracks.size, lessons: json.items.length, questionTypes: types.size, stageExamQuestions: json.stage_exam.questionCount, seedProtocol: 'seed://', mode: process.env.ALLOW_FAKE_DATABASE === 'true' ? 'fake-safe' : 'database' }));
}

async function seedDiscoverChina() {
  const file = join(root, 'seed/discover-china/blueprint.json');
  const text = await readFile(file, 'utf8');
  const json = JSON.parse(text) as { categories: Array<{ slug: string; titles: string[]; public: boolean }>; minimumArticlesPerCategory: number; locales: string[] };
  const articleCount = json.categories.reduce((sum, category) => sum + category.titles.length, 0);
  const missing = json.categories.filter((category) => category.titles.length < json.minimumArticlesPerCategory).map((category) => category.slug);
  if (json.categories.length !== 12) throw new Error(`discover-china requires 12 categories, got ${json.categories.length}`);
  if (articleCount < 36) throw new Error(`discover-china requires at least 36 dev articles, got ${articleCount}`);
  if (missing.length) throw new Error(`discover-china categories below minimum: ${missing.join(', ')}`);
  console.log(JSON.stringify({ status: 'ok', module: 'discover-china', categories: json.categories.length, articles: articleCount, openCategories: json.categories.filter((category) => category.public).map((category) => category.slug), locales: json.locales, mode: process.env.ALLOW_FAKE_DATABASE === 'true' ? 'fake-safe' : 'database' }));
}

async function seedUser() {
  const file = join(root, 'seed/user/users.json');
  const text = await readFile(file, 'utf8');
  const json = JSON.parse(text) as { items: unknown[] };
  console.log(JSON.stringify({ status: 'ok', module: 'user', count: json.items.length, mode: process.env.ALLOW_FAKE_DATABASE === 'true' ? 'fake-safe' : 'database' }));
}

async function main() {
  if (moduleName !== 'all' && moduleName !== 'user' && moduleName !== 'discover-china' && moduleName !== 'courses' && moduleName !== 'from-file') {
    throw new Error(`Unsupported seed module ${moduleName}`);
  }
  if (moduleName === 'from-file') {
    const file = process.argv[3];
    if (!file) throw new Error('seed:from-file requires a JSON file path');
    const json = JSON.parse(await readFile(file, 'utf8')) as { module?: string; items?: unknown[] };
    console.log(JSON.stringify({ status: 'ok', module: json.module ?? 'unknown', count: Array.isArray(json.items) ? json.items.length : 0, mode: 'validated-only' }));
    return;
  }
  if (moduleName === 'courses') {
    await seedCourses();
    return;
  }
  if (moduleName === 'discover-china') {
    await seedDiscoverChina();
    return;
  }
  if (moduleName === 'all') {
    await seedCourses();
    await seedDiscoverChina();
    await seedUser();
    return;
  }
  await seedUser();
}

await main();