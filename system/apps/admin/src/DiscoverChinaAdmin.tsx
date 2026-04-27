import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, History, Lock, Plus, Search, ShieldAlert, SplitSquareHorizontal, ArrowLeft, Trash2 } from 'lucide-react';
import { Badge, Button, Card, DataTable, Input, Select, TextArea, Toast } from '@zhiyu/ui';
import { locales, type Locale } from '@zhiyu/i18n';
import { adminRequest } from './api';

type Row = Record<string, unknown>;
type Category = { slug: string; nameZh: string; public: boolean; articleCount: number; motif: string; sourceDoc: string; contentBoundary: string; status: string };
type Sentence = { id: string; sequenceNumber: number; zh: string; pinyin: string; pinyinTones: string; translations: Partial<Record<Locale, string>> };
type Article = { id: string; slug: string; titleZh: string; categorySlug: string; status: string; length: string; sentences: Sentence[]; keyPoints?: Partial<Record<Locale, string[]>>; updatedAt: string };

const SENTENCES_PAGE_SIZE = 10;
const DEFAULT_LOCALE: Locale = 'en';

function emptyTranslations(): Partial<Record<Locale, string>> {
  return locales.reduce<Partial<Record<Locale, string>>>((acc, lang) => { acc[lang] = ''; return acc; }, {});
}

export function DiscoverChinaAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [view, setView] = useState<'list' | 'sentences'>('list');
  const [article, setArticle] = useState<Article | null>(null);
  const [access, setAccess] = useState<Row>({});
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);

  function refresh() {
    adminRequest<Row[]>('/admin/api/content/articles').then((result) => { const next = result.data ?? []; setRows(next); if (!selectedId && next[0]?.id) setSelectedId(String(next[0].id)); });
    adminRequest<Category[]>('/admin/api/content/articles/categories').then((result) => setCategories(result.data ?? []));
    adminRequest<Row>('/admin/api/content/articles/access-model').then((result) => setAccess(result.data ?? {}));
  }
  useEffect(refresh, []);
  useEffect(() => { if (selectedId) adminRequest<Article>(`/admin/api/content/articles/${selectedId}`).then((result) => setArticle(result.data)); }, [selectedId]);

  async function createArticle() {
    const categorySlug = categories[0]?.slug ?? 'history';
    const slug = `new-discover-${Date.now()}`;
    const titleTranslations = locales.reduce<Partial<Record<Locale, string>>>((acc, lang) => { acc[lang] = lang === 'zh-CN' ? '新发现中国文章' : `New Discover China article (${lang})`; return acc; }, {});
    const summary = locales.reduce<Partial<Record<Locale, string>>>((acc, lang) => { acc[lang] = ''; return acc; }, {});
    const result = await adminRequest<Article>('/admin/api/content/articles', { method: 'POST', body: JSON.stringify({ categorySlug, titleZh: '新发现中国文章', slug, titleTranslations, summary, status: 'draft' }) });
    if (result.error) {
      setMessage(`新建失败: ${result.error.message ?? '未知错误'}`);
      return;
    }
    setMessage('Article created and audited');
    refresh();
    if (result.data?.id) setSelectedId(result.data.id);
  }
  async function updateArticle(patch: Row) {
    if (!article) return;
    const result = await adminRequest<Article>(`/admin/api/content/articles/${article.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setArticle(result.data ?? article);
    setMessage(result.error?.message ?? 'Article saved and versioned');
    refresh();
  }
  async function addSentence() {
    if (!article) return;
    const result = await adminRequest<Sentence>(`/admin/api/content/articles/${article.id}/sentences`, { method: 'POST', body: JSON.stringify({ zh: '这是一句新的发现中国内容。', pinyin: 'zhe shi yi ju xin de nei rong', pinyinTones: 'zhe4 shi4 yi1 ju4 xin1 de nei4 rong2', translations: emptyTranslations() }) });
    setMessage(result.error?.message ?? 'Sentence added and audited');
    if (article) adminRequest<Article>(`/admin/api/content/articles/${article.id}`).then((next) => setArticle(next.data));
  }
  async function runAction(action: string) {
    if (!article) return;
    const result = await adminRequest<Row>(`/admin/api/content/articles/${article.id}/${action}`, { method: 'POST', body: JSON.stringify({ reason: 'manual admin action' }) });
    setMessage(result.error?.message ?? `${action} done and audited`);
    refresh();
    adminRequest<Article>(`/admin/api/content/articles/${article.id}`).then((next) => setArticle(next.data ?? article));
  }
  async function redline() {
    if (!article) return;
    const result = await adminRequest<Row>(`/admin/api/content/articles/${article.id}/redline`, { method: 'POST' });
    setMessage(result.error?.message ?? `Redline passed: ${String(result.data?.passed)}`);
  }

  if (view === 'sentences' && article) {
    return <SentencesSubpage article={article} onBack={() => setView('list')} onChanged={() => adminRequest<Article>(`/admin/api/content/articles/${article.id}`).then((next) => setArticle(next.data))} setMessage={setMessage} message={message} />;
  }

  return <section className="admin-page stack discover-admin-page">
    <div className="admin-section-head"><div><Badge>AD-FR-006</Badge><h2>Discover China content workbench</h2><p>12 categories, article CRUD, redline, preview, publish, version, access-model visibility. 句子编辑已拆分到独立子页面，按页加载，避免单页过长。</p></div><div className="row"><Button onClick={createArticle}><Plus size={16} />New article</Button></div></div>
    <div className="access-grid"><Card><h3>Access model</h3><p><Lock size={16} /> Anonymous: {String((access.anonymousOpenCategories as string[] | undefined)?.join(', ') ?? 'history,cuisine,scenic')}</p><p>Login unlocks all: {String(access.loginUnlocksAll ?? true)}</p></Card><Card><h3>W0 gate</h3><p>Dev seed: {rows.length} / 36 articles. W0 gate remains 600 and is reported in audit.</p></Card><Card><h3>Review queue</h3><p>Native language review uses `/admin/content/review` and audit logs.</p></Card></div>
    <div className="category-admin-grid">{categories.map((category) => <Card key={category.slug} variant="porcelain"><div className="row between"><strong>{category.nameZh}</strong>{category.public ? <Badge tone="success">Anonymous</Badge> : <Badge tone="warning">Login</Badge>}</div><small>{category.sourceDoc}</small><p>{category.contentBoundary}</p></Card>)}</div>
    <div className="admin-split"><Card><div className="filterbar"><Input label="Search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /><Button variant="secondary"><Search size={16} />Filter</Button></div><DataTable rows={filtered} columns={['title', 'category', 'status', 'sentences', 'access']} /><div className="row article-picks">{filtered.slice(0, 8).map((row) => <button key={String(row.id)} aria-current={selectedId === row.id ? 'true' : undefined} onClick={() => setSelectedId(String(row.id))}>{String(row.title)}</button>)}</div></Card><EditorPanel article={article} categories={categories} updateArticle={updateArticle} addSentence={addSentence} runAction={runAction} redline={redline} openSentences={() => setView('sentences')} /></div>
    {message ? <Toast type="info">{message}</Toast> : null}
  </section>;
}

function EditorPanel({ article, categories, updateArticle, addSentence, runAction, redline, openSentences }: { article: Article | null; categories: Category[]; updateArticle: (patch: Row) => void; addSentence: () => void; runAction: (action: string) => void; redline: () => void; openSentences: () => void }) {
  const [title, setTitle] = useState('');
  const [titleI18n, setTitleI18n] = useState<Partial<Record<Locale, string>>>(emptyTranslations());
  const [categorySlug, setCategorySlug] = useState('history');
  const [status, setStatus] = useState('draft');
  const [activeLang, setActiveLang] = useState<Locale>(locales[0] ?? DEFAULT_LOCALE);
  useEffect(() => {
    setTitle(article?.titleZh ?? '');
    setTitleI18n((article as { titleTranslations?: Partial<Record<Locale, string>> } | null)?.titleTranslations ?? emptyTranslations());
    setCategorySlug(article?.categorySlug ?? 'history');
    setStatus(article?.status ?? 'draft');
  }, [article?.id]);
  if (!article) return <Card><h3>Select an article</h3><p>Choose a row to edit article metadata, review state and publishing actions.</p></Card>;
  return <Card className="article-editor">
    <div className="row between"><div><Badge>{status}</Badge><h3>{article.titleZh}</h3></div><Button variant="secondary" onClick={() => updateArticle({ titleZh: title, titleTranslations: titleI18n, categorySlug, status })}>Save draft</Button></div>
    <Input label="Title zh" value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
    <div className="lang-tabs row" role="tablist" aria-label="Title translations">
      {locales.map((lang) => <button key={lang} type="button" role="tab" aria-selected={activeLang === lang} aria-current={activeLang === lang ? 'true' : undefined} onClick={() => setActiveLang(lang)} className="lang-tab">{lang}{!titleI18n[lang] ? ' ●' : ''}</button>)}
    </div>
    <Input label={`Title (${activeLang})`} value={titleI18n[activeLang] ?? ''} onChange={(event) => setTitleI18n({ ...titleI18n, [activeLang]: event.currentTarget.value })} />
    <Select label="Category" value={categorySlug} onChange={(event) => setCategorySlug(event.currentTarget.value)}>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.nameZh}</option>)}</Select>
    <Select label="Status" value={status} onChange={(event) => setStatus(event.currentTarget.value)}><option value="draft">draft</option><option value="review">review</option><option value="published">published</option><option value="archived">archived</option></Select>
    <div className="admin-action-grid"><Button variant="secondary" onClick={() => runAction('preview')}><SplitSquareHorizontal size={16} />Preview</Button><Button variant="secondary" onClick={() => runAction('version')}><History size={16} />Version</Button><Button variant="secondary" onClick={() => runAction('copy')}><Copy size={16} />Copy</Button><Button variant="secondary" onClick={redline}><ShieldAlert size={16} />Redline</Button><Button onClick={() => runAction('publish')}><CheckCircle2 size={16} />Publish</Button><Button variant="danger" onClick={() => runAction('withdraw')}>Withdraw</Button></div>
    <div className="row between"><h3>Sentence editor</h3><div className="row"><Button variant="secondary" onClick={addSentence}><Plus size={16} />Add sentence</Button><Button onClick={openSentences}>Open sentences subpage ({article.sentences.length})</Button></div></div>
    <p>句子按 {SENTENCES_PAGE_SIZE} 条/页 在子页面分页编辑。点击上方按钮进入。</p>
  </Card>;
}

function SentencesSubpage({ article, onBack, onChanged, setMessage, message }: { article: Article; onBack: () => void; onChanged: () => void; setMessage: (m: string) => void; message: string }) {
  const [page, setPage] = useState(1);
  const total = article.sentences.length;
  const totalPages = Math.max(1, Math.ceil(total / SENTENCES_PAGE_SIZE));
  const start = (page - 1) * SENTENCES_PAGE_SIZE;
  const slice = article.sentences.slice(start, start + SENTENCES_PAGE_SIZE);
  return <section className="admin-page stack discover-admin-sentences">
    <div className="admin-section-head row between">
      <div><Button variant="ghost" onClick={onBack}><ArrowLeft size={16} />Back to article</Button><h2>{article.titleZh} · 句子编辑</h2><p>共 {total} 句，第 {page}/{totalPages} 页（每页 {SENTENCES_PAGE_SIZE} 条）。</p></div>
      <div className="row"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button></div>
    </div>
    <div className="sentence-admin-list">{slice.map((sentence) => <SentenceEdit key={sentence.id} articleId={article.id} sentence={sentence} onChanged={onChanged} setMessage={setMessage} />)}</div>
    {message ? <Toast type="info">{message}</Toast> : null}
  </section>;
}

function SentenceEdit({ articleId, sentence, onChanged, setMessage }: { articleId: string; sentence: Sentence; onChanged: () => void; setMessage: (m: string) => void }) {
  const [zh, setZh] = useState(sentence.zh);
  const [pinyin, setPinyin] = useState(sentence.pinyin);
  const [pinyinTones, setPinyinTones] = useState(sentence.pinyinTones);
  const [translations, setTranslations] = useState<Partial<Record<Locale, string>>>(() => ({ ...emptyTranslations(), ...sentence.translations }));
  const [activeLang, setActiveLang] = useState<Locale>(locales[0] ?? DEFAULT_LOCALE);
  async function save() {
    const result = await adminRequest<Sentence>(`/admin/api/content/articles/${articleId}/sentences/${sentence.id}`, { method: 'PATCH', body: JSON.stringify({ zh, pinyin, pinyinTones, translations }) });
    setMessage(result.error?.message ?? 'Sentence saved and audited');
    onChanged();
  }
  async function remove() {
    if (!confirm('删除这句话？')) return;
    const result = await adminRequest(`/admin/api/content/articles/${articleId}/sentences/${sentence.id}`, { method: 'DELETE' });
    setMessage(result.error?.message ?? 'Sentence deleted');
    onChanged();
  }
  return <Card className="sentence-edit">
    <div className="row between"><strong>Sentence {sentence.sequenceNumber}</strong><Button variant="danger" size="sm" onClick={remove}><Trash2 size={14} />Delete</Button></div>
    <TextArea label="中文 (zh)" value={zh} onChange={(event) => setZh(event.currentTarget.value)} />
    <Input label="Pinyin" value={pinyin} onChange={(event) => setPinyin(event.currentTarget.value)} />
    <Input label="Pinyin tones (numeric)" value={pinyinTones} onChange={(event) => setPinyinTones(event.currentTarget.value)} />
    <div className="lang-tabs row" role="tablist" aria-label="Sentence translations">
      {locales.map((lang) => <button key={lang} type="button" role="tab" aria-selected={activeLang === lang} onClick={() => setActiveLang(lang)} className="lang-tab">{lang}{!translations[lang] ? ' ●' : ''}</button>)}
    </div>
    <TextArea label={`Translation (${activeLang})`} value={translations[activeLang] ?? ''} onChange={(event) => setTranslations({ ...translations, [activeLang]: event.currentTarget.value })} />
    <Button size="sm" variant="secondary" onClick={save}>Save sentence</Button>
  </Card>;
}

