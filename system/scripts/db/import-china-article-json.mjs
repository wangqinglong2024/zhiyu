#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');

const args = parseArgs(process.argv.slice(2));
loadEnvFile(args.envFile);

const dataRoot = path.resolve(repoRoot, args.dataRoot ?? 'content/01-china/data/articles/01-history/phase1');
const databaseUrl = args.databaseUrl ?? process.env.DATABASE_URL;
const dockerNetwork = args.network ?? 'supabase_default';

if (!databaseUrl && !args.dryRun) {
  fail('DATABASE_URL is required. Pass --database-url or --env-file.');
}

const files = findArticleFiles(dataRoot);
if (files.length === 0) fail(`No *.article.json files found under ${dataRoot}`);

const docs = files.map((filePath) => ({ filePath, doc: readJson(filePath) }));
const errors = [];
for (const item of docs) validateDoc(item.filePath, item.doc, errors);

const summary = {
  dataRoot,
  files: docs.length,
  articles: docs.length,
  sentences: docs.reduce((sum, item) => sum + item.doc.sentences.length, 0),
  dryRun: Boolean(args.dryRun),
  replace: Boolean(args.replace),
  publish: Boolean(args.publish),
  errors: errors.length,
};

if (errors.length > 0) {
  console.error(JSON.stringify({ summary, errors }, null, 2));
  process.exit(1);
}

if (args.dryRun) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const sql = buildSql(docs.map((item) => item.doc), { replace: args.replace, publish: args.publish });
const result = runPsql(sql, databaseUrl, { forceDocker: args.docker, dockerNetwork });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
console.log(JSON.stringify(summary, null, 2));

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--dry-run') out.dryRun = true;
    else if (current === '--replace') out.replace = true;
    else if (current === '--publish') out.publish = true;
    else if (current === '--docker') out.docker = true;
    else if (current === '--data-root') out.dataRoot = argv[++index];
    else if (current === '--env-file') out.envFile = argv[++index];
    else if (current === '--database-url') out.databaseUrl = argv[++index];
    else if (current === '--network') out.network = argv[++index];
    else fail(`Unknown argument: ${current}`);
  }
  return out;
}

function loadEnvFile(envFile) {
  if (!envFile) return;
  const fullPath = path.resolve(repoRoot, envFile);
  if (!existsSync(fullPath)) fail(`Env file not found: ${fullPath}`);
  const lines = readFileSync(fullPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function findArticleFiles(root) {
  if (!existsSync(root)) fail(`Data root not found: ${root}`);
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.article.json')) out.push(fullPath);
    }
  }
  walk(root);
  return out.sort((left, right) => left.localeCompare(right));
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function validateDoc(filePath, doc, errors) {
  const push = (field, message) => errors.push({ file: path.relative(repoRoot, filePath), field, message });
  if (doc.schema !== 'china.article.v2') push('schema', 'must be china.article.v2');
  if (!/^0[1-9]$|^1[0-2]$/.test(doc.category_code ?? '')) push('category_code', 'must be 01..12');
  if (!doc.article || typeof doc.article !== 'object') push('article', 'required');
  if (!doc.seo?.primary_keywords) push('seo.primary_keywords', 'required');
  if (!doc.geo?.bluf) push('geo.bluf', 'required');
  if (!Array.isArray(doc.geo?.entities) || doc.geo.entities.length === 0) push('geo.entities', 'required');
  if (!Array.isArray(doc.sentences)) push('sentences', 'required array');
  if (!doc.article) return;
  if (doc.article.category_code !== doc.category_code) push('article.category_code', 'must match top-level category_code');
  validateText(doc.article.title_pinyin, 1, 200, 'article.title_pinyin', push);
  validateI18n(doc.article.title_i18n, 1, 80, 'article.title_i18n', push);
  if (!Array.isArray(doc.sentences)) return;
  if (doc.sentences.length < 1 || doc.sentences.length > 120) push('sentences.length', 'must be 1..120');
  const seen = new Set();
  doc.sentences.forEach((row, index) => {
    const expected = index + 1;
    if (row.seq_in_article !== expected) push(`sentences[${index}].seq_in_article`, `expected ${expected}`);
    if (seen.has(row.seq_in_article)) push(`sentences[${index}].seq_in_article`, 'duplicate');
    seen.add(row.seq_in_article);
    validateText(row.pinyin, 1, 600, `sentences[${index}].pinyin`, push);
    if (/\b[a-zA-Z]+[1-5]\b/.test(row.pinyin ?? '')) push(`sentences[${index}].pinyin`, 'contains numeric tone');
    validateText(row.content_zh, 1, 400, `sentences[${index}].content_zh`, push);
    validateText(row.content_en, 1, 400, `sentences[${index}].content_en`, push);
    validateText(row.content_vi, 1, 400, `sentences[${index}].content_vi`, push);
    validateText(row.content_th, 1, 400, `sentences[${index}].content_th`, push);
    validateText(row.content_id, 1, 400, `sentences[${index}].content_id`, push);
    validateBodyText(row, index, push);
  });
}

function validateBodyText(row, index, push) {
  const forbidden = /AI摘要|AI 摘要|\bSEO\b|\bGEO\b|关键词|搜索热点|长尾搜索|搜索页|这条信息|这篇文章适合|适合放在/i;
  for (const field of ['content_zh', 'content_en', 'content_vi', 'content_th', 'content_id']) {
    const value = row[field];
    if (typeof value === 'string' && forbidden.test(value)) {
      push(`sentences[${index}].${field}`, 'contains meta SEO/GEO/AI narration that must not appear in article body');
    }
  }
}

function validateI18n(value, min, max, field, push) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    push(field, 'required object');
    return;
  }
  for (const lang of ['zh', 'en', 'vi', 'th', 'id']) {
    validateText(value[lang], min, max, `${field}.${lang}`, push);
  }
}

function validateText(value, min, max, field, push) {
  if (typeof value !== 'string') {
    push(field, 'must be string');
    return;
  }
  if (value.length < min || value.length > max) push(field, `length must be ${min}..${max}`);
}

function buildSql(docs, options) {
  const parts = [
    'set search_path to zhiyu, public;',
    'begin;',
  ];
  if (options.replace) {
    parts.push(`
do $$
begin
  if to_regclass('zhiyu.learning_progress') is not null then
    delete from zhiyu.learning_progress where source = 'china';
  end if;
end $$;

delete from zhiyu.china_articles where deleted_at is null or deleted_at is not null;`);
  }
  for (const doc of docs) parts.push(buildArticleDoBlock(doc, options));
  parts.push('commit;');
  return parts.join('\n\n');
}

function buildArticleDoBlock(doc, options) {
  const quotedDoc = dollarQuote(JSON.stringify(doc));
  const publishSql = options.publish ? 'perform zhiyu.fn_publish_article(v_article_id);' : '';
  return `
do $$
declare
  v_doc jsonb := ${quotedDoc}::jsonb;
  v_article jsonb := ${quotedDoc}::jsonb -> 'article';
  v_sentence jsonb;
  v_category_id uuid;
  v_article_id uuid;
  v_code text;
begin
  select id into v_category_id
    from zhiyu.china_categories
   where code = v_article->>'category_code';

  if v_category_id is null then
    raise exception 'CHINA_CATEGORY_NOT_FOUND: %', v_article->>'category_code';
  end if;

  v_code := zhiyu.fn_gen_article_code();

  insert into zhiyu.china_articles (code, category_id, title_pinyin, title_i18n, status)
  values (v_code, v_category_id, v_article->>'title_pinyin', v_article->'title_i18n', 'draft')
  returning id into v_article_id;

  for v_sentence in
    select value from jsonb_array_elements(v_doc->'sentences') as item(value)
  loop
    insert into zhiyu.china_sentences (
      article_id, seq_no, pinyin,
      content_zh, content_en, content_vi, content_th, content_id
    ) values (
      v_article_id,
      (v_sentence->>'seq_in_article')::int,
      v_sentence->>'pinyin',
      v_sentence->>'content_zh',
      v_sentence->>'content_en',
      v_sentence->>'content_vi',
      v_sentence->>'content_th',
      v_sentence->>'content_id'
    );
  end loop;

  ${publishSql}
  raise notice 'imported china article %, code %, sentences %', v_article->'title_i18n'->>'zh', v_code, jsonb_array_length(v_doc->'sentences');
end $$;`;
}

function dollarQuote(text) {
  let tagIndex = 0;
  while (true) {
    const tag = `$json_${tagIndex}$`;
    if (!text.includes(tag)) return `${tag}${text}${tag}`;
    tagIndex += 1;
  }
}

function runPsql(sql, url, options) {
  const useDocker = options.forceDocker || !hasCommand('psql') || /@supabase-db[:/]/.test(url);
  const command = useDocker ? 'docker' : 'psql';
  const args = useDocker
    ? ['run', '--rm', '-i', '--network', options.dockerNetwork, 'postgres:16-alpine', 'psql', url, '-v', 'ON_ERROR_STOP=1']
    : [url, '-v', 'ON_ERROR_STOP=1'];
  const result = spawnSync(command, args, { input: sql, stdio: ['pipe', 'inherit', 'inherit'], encoding: 'utf8' });
  if (result.error) {
    console.error(result.error.message);
    return { status: 1 };
  }
  return result;
}

function hasCommand(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`], { stdio: 'ignore' });
  return result.status === 0;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
