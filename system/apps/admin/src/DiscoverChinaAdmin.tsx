import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, CheckCircle2, Copy, History, Lock, Plus, Search, ShieldAlert, SplitSquareHorizontal, Trash2 } from 'lucide-react';
import { Badge, Button, Card, DataTable, Input, Select, TextArea, Toast } from '@zhiyu/ui';
import { locales, type Locale } from '@zhiyu/i18n';
import { adminRequest } from './api';

type Row = Record<string, unknown>;
type Category = { slug: string; nameZh: string; public: boolean; articleCount: number; motif: string; sourceDoc: string; contentBoundary: string; status: string; themeColor?: string };
type Sentence = { id: string; sequenceNumber: number; zh: string; pinyin: string; pinyinTones: string; translations: Partial<Record<Locale, string>> };
type Article = { id: string; slug: string; titleZh: string; categorySlug: string; status: string; length: string; sentences: Sentence[]; titleTranslations?: Partial<Record<Locale, string>>; keyPoints?: Partial<Record<Locale, string[]>>; updatedAt: string };

const DEFAULT_LOCALE: Locale = 'en';

function emptyTranslations(): Partial<Record<Locale, string>> {
  return locales.reduce<Partial<Record<Locale, string>>>((acc, lang) => { acc[lang] = ''; return acc; }, {});
}

export function DiscoverChinaAdmin() {
  const [articles, setArticles] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Category | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [access, setAccess] = useState<Row>({});
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const topicArticles = useMemo(() => articles.filter((row) => String(row.category) === selectedTopic?.slug), [articles, selectedTopic]);
  const filteredArticles = useMemo(() => topicArticles.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [topicArticles, query]);

  function refresh() {
    adminRequest<Row[]>('/admin/api/content/articles').then((result) => setArticles(result.data ?? []));
    adminRequest<Category[]>('/admin/api/content/articles/categories').then((result) => setCategories(result.data ?? []));
    adminRequest<Row>('/admin/api/content/articles/access-model').then((result) => setAccess(result.data ?? {}));
  }

  useEffect(refresh, []);
  useEffect(() => {
    if (!selectedArticleId) return;
    adminRequest<Article>(`/admin/api/content/articles/${selectedArticleId}`).then((result) => setArticle(result.data));
  }, [selectedArticleId]);

  function openTopic(topic: Category) {
    setSelectedTopic(topic);
    setSelectedArticleId('');
    setArticle(null);
    setQuery('');
  }

  function openArticle(id: string) {
    setSelectedArticleId(id);
  }

  async function createArticle() {
    const categorySlug = selectedTopic?.slug ?? categories[0]?.slug ?? 'history';
    const slug = `new-discover-${Date.now()}`;
    const titleTranslations = locales.reduce<Partial<Record<Locale, string>>>((acc, lang) => { acc[lang] = lang === 'zh-CN' ? '新发现中国文章' : `New Discover China article (${lang})`; return acc; }, {});
    const summary = locales.reduce<Partial<Record<Locale, string>>>((acc, lang) => { acc[lang] = ''; return acc; }, {});
    const result = await adminRequest<Article>('/admin/api/content/articles', { method: 'POST', body: JSON.stringify({ categorySlug, titleZh: '新发现中国文章', slug, titleTranslations, summary, status: 'draft' }) });
    if (result.error) return setMessage(`新建失败: ${result.error.message ?? '未知错误'}`);
    setMessage('Article created and audited');
    refresh();
    if (result.data?.id) openArticle(result.data.id);
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
    adminRequest<Article>(`/admin/api/content/articles/${article.id}`).then((next) => setArticle(next.data));
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

  if (article) {
    return <ArticleSentencesPage article={article} categories={categories} updateArticle={updateArticle} addSentence={addSentence} runAction={runAction} redline={redline} onBack={() => { setArticle(null); setSelectedArticleId(''); }} setMessage={setMessage} message={message} />;
  }

  if (selectedTopic) {
    return <section className="admin-page stack discover-admin-page">
      <AdminHeading badge="ADC-01 · 文章列表" title={`${selectedTopic.nameZh} · 文章列表`} description="这是第二层：只展示当前主题下的文章。点击文章后进入句子级子页面。" actions={<><Button variant="ghost" onClick={() => setSelectedTopic(null)}><ArrowLeft size={16} />返回 12 主题</Button><Button onClick={createArticle}><Plus size={16} />New article</Button></>} />
      <div className="topic-summary-grid"><Card variant="porcelain"><h3>访问模型</h3><p><Lock size={16} />{selectedTopic.public ? '匿名可读' : '登录后可读'}</p><small>{String((access.anonymousOpenCategories as string[] | undefined)?.join(', ') ?? 'history,cuisine,scenic')}</small></Card><Card variant="porcelain"><h3>主题边界</h3><p>{selectedTopic.contentBoundary}</p></Card><Card variant="porcelain"><h3>审校</h3><p>{filteredArticles.length} 篇 · 待审与红线在文章子页处理。</p></Card></div>
      <Card variant="porcelain"><div className="filterbar"><Input label="Search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /><Button variant="secondary"><Search size={16} />Filter</Button></div><DataTable rows={filteredArticles} columns={['title', 'status', 'sentences', 'access', 'updatedAt']} /><div className="article-card-grid">{filteredArticles.map((row) => <button key={String(row.id)} onClick={() => openArticle(String(row.id))}><Badge>{String(row.status)}</Badge><strong>{String(row.title)}</strong><small>{String(row.sentences)} sentences · {String(row.updatedAt)}</small></button>)}</div></Card>
      {message ? <Toast type="info">{message}</Toast> : null}
    </section>;
  }

  return <section className="admin-page stack discover-admin-page">
    <AdminHeading badge="ADC-01 · 12 主题" title="发现中国内容管理" description="默认进入第一层：12 个主题。选择一个主题后进入文章列表，再点击文章进入句子级编辑。发现中国不进入 SRS。" actions={<Button onClick={createArticle}><Plus size={16} />New article</Button>} />
    <div className="topic-picker-grid">{categories.map((category, index) => <button key={category.slug} className="topic-choice zy-glass-panel" onClick={() => openTopic(category)} style={{ '--topic-accent': category.themeColor ?? 'var(--brand-jade)' } as CSSProperties}>
      <span className="seal small">{category.nameZh.slice(0, 1)}</span><Badge tone={category.public ? 'success' : 'warning'}>{category.public ? '匿名' : '登录'}</Badge><strong>{category.nameZh}</strong><small>{String(index + 1).padStart(2, '0')} · {category.motif}</small><p>{category.contentBoundary}</p><span>{category.articleCount} articles · {category.status}</span>
    </button>)}</div>
    {message ? <Toast type="info">{message}</Toast> : null}
  </section>;
}

function AdminHeading({ badge, title, description, actions }: { badge: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="admin-section-head"><div><Badge>{badge}</Badge><h2>{title}</h2><p>{description}</p></div>{actions ? <div className="admin-action-grid">{actions}</div> : null}</div>;
}

function ArticleSentencesPage({ article: initialArticle, categories, updateArticle, addSentence, runAction, redline, onBack, setMessage, message }: { article: Article; categories: Category[]; updateArticle: (patch: Row) => void; addSentence: () => void; runAction: (action: string) => void; redline: () => void; onBack: () => void; setMessage: (m: string) => void; message: string }) {
  const [article, setArticle] = useState(initialArticle);
  useEffect(() => { setArticle(initialArticle); }, [initialArticle.id, initialArticle.updatedAt, initialArticle.sentences.length]);
  function refreshArticle() {
    adminRequest<Article>(`/admin/api/content/articles/${article.id}`).then((next) => { if (next.data) setArticle(next.data); });
  }
  return <section className="admin-page stack discover-admin-sentences">
    <AdminHeading badge="ADC-04 · 句子级编辑" title={article.titleZh} description="第三层：文章对应句子。每句可维护中文、拼音、翻译、音频占位、红线与审校状态。" actions={<><Button variant="ghost" onClick={onBack}><ArrowLeft size={16} />返回文章列表</Button><Button variant="secondary" onClick={addSentence}><Plus size={16} />Add sentence</Button></>} />
    <ArticleMetaPanel article={article} categories={categories} updateArticle={updateArticle} runAction={runAction} redline={redline} />
    <div className="sentence-admin-list">{article.sentences.map((sentence) => <SentenceEdit key={sentence.id} articleId={article.id} sentence={sentence} onChanged={refreshArticle} setMessage={setMessage} />)}</div>
    {message ? <Toast type="info">{message}</Toast> : null}
  </section>;
}

function ArticleMetaPanel({ article, categories, updateArticle, runAction, redline }: { article: Article; categories: Category[]; updateArticle: (patch: Row) => void; runAction: (action: string) => void; redline: () => void }) {
  const [title, setTitle] = useState(article.titleZh);
  const [titleI18n, setTitleI18n] = useState<Partial<Record<Locale, string>>>(article.titleTranslations ?? emptyTranslations());
  const [categorySlug, setCategorySlug] = useState(article.categorySlug);
  const [status, setStatus] = useState(article.status);
  const [activeLang, setActiveLang] = useState<Locale>(locales[0] ?? DEFAULT_LOCALE);
  useEffect(() => { setTitle(article.titleZh); setTitleI18n(article.titleTranslations ?? emptyTranslations()); setCategorySlug(article.categorySlug); setStatus(article.status); }, [article.id, article.titleZh, article.titleTranslations, article.categorySlug, article.status]);
  return <Card className="article-editor" variant="porcelain">
    <div className="row between"><div><Badge>{status}</Badge><h3>文章元信息</h3></div><Button variant="secondary" onClick={() => updateArticle({ titleZh: title, titleTranslations: titleI18n, categorySlug, status })}>Save draft</Button></div>
    <div className="editor-grid"><Input label="Title zh" value={title} onChange={(event) => setTitle(event.currentTarget.value)} /><Select label="Category" value={categorySlug} onChange={(event) => setCategorySlug(event.currentTarget.value)}>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.nameZh}</option>)}</Select></div>
    <div className="lang-tabs row" role="tablist" aria-label="Title translations">{locales.map((lang) => <button key={lang} type="button" role="tab" aria-selected={activeLang === lang} aria-current={activeLang === lang ? 'true' : undefined} onClick={() => setActiveLang(lang)} className="lang-tab">{lang}{!titleI18n[lang] ? ' *' : ''}</button>)}</div>
    <Input label={`Title (${activeLang})`} value={titleI18n[activeLang] ?? ''} onChange={(event) => setTitleI18n({ ...titleI18n, [activeLang]: event.currentTarget.value })} />
    <Select label="Status" value={status} onChange={(event) => setStatus(event.currentTarget.value)}><option value="draft">draft</option><option value="review">review</option><option value="published">published</option><option value="archived">archived</option></Select>
    <div className="admin-action-grid"><Button variant="secondary" onClick={() => runAction('preview')}><SplitSquareHorizontal size={16} />Preview</Button><Button variant="secondary" onClick={() => runAction('version')}><History size={16} />Version</Button><Button variant="secondary" onClick={() => runAction('copy')}><Copy size={16} />Copy</Button><Button variant="secondary" onClick={redline}><ShieldAlert size={16} />Redline</Button><Button onClick={() => runAction('publish')}><CheckCircle2 size={16} />Publish</Button><Button variant="danger" onClick={() => runAction('withdraw')}>Withdraw</Button></div>
  </Card>;
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
  return <Card className="sentence-edit" variant="paper">
    <div className="row between"><strong>Sentence {sentence.sequenceNumber}</strong><div className="row"><Badge>redline ready</Badge><Badge tone="info">audio seed</Badge><Button variant="danger" size="sm" onClick={remove}><Trash2 size={14} />Delete</Button></div></div>
    <TextArea label="中文 (zh)" value={zh} onChange={(event) => setZh(event.currentTarget.value)} />
    <div className="editor-grid"><Input label="Pinyin" value={pinyin} onChange={(event) => setPinyin(event.currentTarget.value)} /><Input label="Pinyin tones (numeric)" value={pinyinTones} onChange={(event) => setPinyinTones(event.currentTarget.value)} /></div>
    <div className="lang-tabs row" role="tablist" aria-label="Sentence translations">{locales.map((lang) => <button key={lang} type="button" role="tab" aria-selected={activeLang === lang} onClick={() => setActiveLang(lang)} className="lang-tab">{lang}{!translations[lang] ? ' *' : ''}</button>)}</div>
    <TextArea label={`Translation (${activeLang})`} value={translations[activeLang] ?? ''} onChange={(event) => setTranslations({ ...translations, [activeLang]: event.currentTarget.value })} />
    <Button size="sm" variant="secondary" onClick={save}>Save sentence</Button>
  </Card>;
}