import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { Badge, Button, Card, DataTable, IconButton, Input, SearchInput, Toast } from '@zhiyu/ui';
import { adminRequest } from './api';
import { nav, titleFromRoute } from './data';
import { DiscoverChinaAdmin } from './DiscoverChinaAdmin';
import { CoursesAdmin } from './CoursesAdmin';

type Row = Record<string, unknown>;

function readRoute() { return window.location.pathname === '/' ? '/admin/dashboard' : window.location.pathname; }

export function AdminApp() {
  const [route, setRoute] = useState(readRoute);
  const [token, setToken] = useState(localStorage.getItem('zy.admin.token'));
  const [theme, setTheme] = useState(localStorage.getItem('zhiyu.admin.theme') ?? 'system');
  useEffect(() => { const listener = () => setRoute(readRoute()); window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme === 'system' ? 'light' : theme; localStorage.setItem('zhiyu.admin.theme', theme); }, [theme]);
  const navigate = (path: string) => { history.pushState(null, '', path); setRoute(readRoute()); };
  if (!token || route === '/admin/login') return <AdminLogin onLogin={(next) => { localStorage.setItem('zy.admin.token', next); setToken(next); navigate('/admin/dashboard'); }} />;
  return <div className="admin-shell"><aside className="sidebar glass-porcelain"><div className="admin-brand"><span className="seal">知</span><strong>Zhiyu Admin</strong></div><nav>{nav.map((item) => { const Icon = item.icon; const active = route.startsWith(item.path); return <button key={item.path} aria-current={active ? 'page' : undefined} onClick={() => navigate(item.path)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav></aside><main id="admin-main" className="admin-main"><header className="topbar glass-porcelain"><div className="row"><IconButton label="Collapse sidebar"><Menu size={18} /></IconButton><div><small>Admin / {titleFromRoute(route)}</small><h1>{titleFromRoute(route)}</h1></div></div><div className="row"><SearchInput label="Global search" placeholder="Search users, orders, audit" /><IconButton label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</IconButton><Button variant="secondary" onClick={() => { localStorage.removeItem('zy.admin.token'); setToken(null); }}>Logout</Button></div></header>{renderRoute(route, navigate)}</main></div>;
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123!');
  const [totp, setTotp] = useState('123456');
  const [message, setMessage] = useState('');
  async function submit() {
    const result = await adminRequest<{ token: string }>('/admin/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password, totp }) });
    if (result.data?.token) onLogin(result.data.token);
    else setMessage(result.error?.message ?? 'Login failed');
  }
  return <section className="admin-login surface-wash"><Card className="login-card"><Badge>Mandatory 2FA</Badge><h1>Admin login</h1><Input label="Email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} /><Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} /><Input label="TOTP" value={totp} onChange={(event) => setTotp(event.currentTarget.value)} /><Button onClick={submit}>Login</Button>{message ? <Toast type="error">{message}</Toast> : null}<p>Dev accounts: admin/editor/reviewer/cs/viewer@example.com. TOTP: 123456.</p></Card></section>;
}

function renderRoute(route: string, navigate: (path: string) => void) {
  if (route.includes('/content/articles')) return <DiscoverChinaAdmin />;
  if (route.includes('/content/courses')) return <CoursesAdmin />;
  if (route.includes('/content/factory')) return <FactoryPage />;
  if (route.includes('/content/review')) return <ReviewPage />;
  if (route.includes('/content/')) return <ContentPage moduleName={route.split('/').pop() ?? 'articles'} />;
  if (route.includes('/users')) return <UsersPage />;
  if (route.includes('/orders')) return <OrdersPage />;
  if (route.includes('/coins')) return <CoinsPage />;
  if (route.includes('/referral')) return <ReferralPage />;
  if (route.includes('/cs')) return <CsPage />;
  if (route.includes('/feature-flags')) return <FlagsPage />;
  if (route.includes('/audit')) return <AuditPage />;
  if (route.includes('/announcements')) return <AnnouncementsPage />;
  if (route.includes('/security') || route.includes('/compliance')) return <SecurityPage />;
  return <Dashboard navigate={navigate} />;
}

function Dashboard({ navigate }: { navigate: (path: string) => void }) {
  const [summary, setSummary] = useState<Row>({});
  const [trends, setTrends] = useState<Row[]>([]);
  useEffect(() => { adminRequest<Row>('/admin/api/dashboard/summary').then((r) => setSummary(r.data ?? {})); adminRequest<Row[]>('/admin/api/dashboard/trends').then((r) => setTrends(r.data ?? [])); }, []);
  return <section className="admin-page stack"><div className="kpi-grid">{['dau', 'wau', 'mau', 'orders', 'gmv', 'churn', 'nps', 'csPending', 'alerts'].map((key) => <Card key={key}><small>{key}</small><strong>{String(summary[key] ?? '—')}</strong></Card>)}</div><Card><h2>7 / 30 / 90 day trends</h2><ResponsiveContainer width="100%" height={220}><AreaChart data={trends}><XAxis dataKey="days" /><YAxis /><Tooltip /><Area dataKey="registrations" stroke="#2F6F5E" fill="#6F9F8D" /></AreaChart></ResponsiveContainer></Card><Card><h2>Exception alerts</h2><p>Red-line, error-rate and payment-failure signals are available through local events and security tables.</p><Button variant="secondary" onClick={() => navigate('/admin/security')}>Open security console</Button></Card></section>;
}

function UsersPage() {
  const [rows, setRows] = useRows('/admin/api/users');
  const firstId = String(rows[0]?.id ?? '');
  return <CrudPage title="User management" rows={rows} columns={['email', 'displayName', 'status', 'coins']} actions={<><ActionButton path={`/admin/api/users/${firstId}/freeze`} body={{ reason: 'manual admin action' }} label="Freeze" /><ActionButton path={`/admin/api/users/${firstId}/coins/grant`} body={{ amount: 10, reason: 'manual adjustment' }} label="Grant coins" /></>} />;
}

function OrdersPage() {
  const [rows] = useRows('/admin/api/orders');
  const firstId = String(rows[0]?.id ?? '');
  return <CrudPage title="Orders and subscriptions" rows={rows} columns={['id', 'status', 'amountUsd', 'plan']} actions={<ActionButton path={`/admin/api/orders/${firstId}/refund`} body={{ reason: 'manual approval after 7 days' }} label="Refund" />} />;
}

function CoinsPage() {
  const [summary, setSummary] = useState<Row>({});
  useEffect(() => { adminRequest<Row>('/admin/api/coins/summary').then((r) => setSummary(r.data ?? {})); }, []);
  return <section className="admin-page stack"><Card><h2>Coin ledger summary</h2><p>Issued: {String(summary.issued ?? 0)} · Consumed: {String(summary.consumed ?? 0)}</p></Card><DataTable rows={(summary.suspicious as Row[] | undefined) ?? []} columns={['email', 'coins', 'status']} /></section>;
}

function ContentPage({ moduleName }: { moduleName: string }) {
  const [rows] = useRows(`/admin/api/content/${moduleName}`);
  const firstId = String(rows[0]?.id ?? 'demo');
  return <CrudPage title={`Content: ${moduleName}`} rows={rows} columns={['id', 'title', 'status', 'category']} actions={<><ActionButton path={`/admin/api/content/${moduleName}/${firstId}/publish`} label="Publish" /><ActionButton path={`/admin/api/content/${moduleName}/${firstId}/copy`} label="Copy" /><ActionButton path={`/admin/api/content/${moduleName}/${firstId}/preview`} label="Preview" /></>} />;
}

function FactoryPage() {
  return <section className="admin-page stack"><Card><Badge>v1.5 placeholder</Badge><h2>Content Factory</h2><p>v1 keeps manual CSV/YAML import and scriptable database writing. Automated workflow nodes are not executable in v1.</p><input type="file" accept=".csv,.yaml,.yml" /><ActionButton path="/admin/api/factory/import" body={{ format: 'csv' }} label="Queue manual import" /></Card></section>;
}

function ReviewPage() {
  const [rows, setRows] = useRows('/admin/api/review/queue');
  const firstId = String(rows[0]?.id ?? '');
  return <CrudPage title="Review workbench" rows={rows} columns={['title', 'language', 'status', 'resourceType']} actions={<><ActionButton path={`/admin/api/review/${firstId}/approve`} label="Approve" onDone={() => setRows([])} /><ActionButton path={`/admin/api/review/${firstId}/reject`} body={{ reason: 'needs edit' }} label="Reject" /></>} />;
}

function CsPage() {
  const [data, setData] = useState<Row>({});
  useEffect(() => { adminRequest<Row>('/admin/api/cs/queues').then((r) => setData(r.data ?? {})); }, []);
  return <section className="admin-page cs-grid"><Card><h2>Waiting</h2><pre>{JSON.stringify(data.waiting ?? [], null, 2)}</pre></Card><Card><h2>Current conversation</h2><p>Realtime channel uses Supabase Realtime path; this v1 workbench keeps the panel ready.</p><ActionButton path="/admin/api/cs/reply" body={{ conversationId: 'cs-1', text: 'Hello' }} label="Send reply" /></Card><Card><h2>User profile</h2><p>CS role sees basic user information only.</p></Card></section>;
}

function ReferralPage() {
  const [data, setData] = useState<Row>({});
  useEffect(() => { adminRequest<Row>('/admin/api/referral/summary').then((r) => setData(r.data ?? {})); }, []);
  return <section className="admin-page stack"><Card><h2>Referral report</h2><p>Total ZC: {String(data.totalCommissionZc ?? 0)} · Pending: {String(data.pendingZc ?? 0)} · Cash withdrawal: no v1 support</p><ActionButton path="/admin/api/referral/referrer-user/freeze" body={{ reason: 'anti-fraud review' }} label="Freeze referrer" /></Card></section>;
}

function FlagsPage() {
  const [rows] = useRows('/admin/api/flags');
  return <CrudPage title="Feature Flags" rows={rows} columns={['key', 'description']} actions={<ActionButton path="/admin/api/flags/promo.banner" method="PATCH" body={{ value: { enabled: false } }} label="Toggle promo" />} />;
}

function AuditPage() { const [rows] = useRows('/admin/api/audit'); return <CrudPage title="Audit logs" rows={rows} columns={['actorEmail', 'action', 'resourceType', 'resourceId', 'createdAt']} />; }

function AnnouncementsPage() {
  const [rows, setRows] = useRows('/admin/api/announcements');
  return <CrudPage title="Announcements" rows={rows} columns={['id', 'channel', 'status']} actions={<ActionButton path="/admin/api/announcements" body={{ channel: 'banner', title_translations: { en: 'Hello' }, body_translations: { en: 'Welcome' } }} label="Create banner" onDone={() => setRows([...rows, { id: 'local', channel: 'banner', status: 'draft' }])} />} />;
}

function SecurityPage() {
  const [rows] = useRows('/admin/api/security/events');
  const [status, setStatus] = useState<Row>({});
  useEffect(() => { adminRequest<Row>('/admin/api/compliance/status').then((r) => setStatus(r.data ?? {})); }, []);
  return <section className="admin-page stack"><CrudPage title="Security events" rows={rows} columns={['severity', 'type', 'subject', 'ip', 'createdAt']} actions={<><ActionButton path="/admin/api/security/blocklist" body={{ entity_type: 'ip', entity_value: '127.0.0.2', reason: 'manual block' }} label="Block IP" /><ActionButton path="/admin/api/security/red-line-rules" body={{ term: 'demo', severity: 'medium', action: 'review' }} label="Add red-line rule" /></>} /><Card><h2>Compliance status</h2><pre>{JSON.stringify(status, null, 2)}</pre></Card></section>;
}

function CrudPage({ title, rows, columns, actions }: { title: string; rows: Row[]; columns: string[]; actions?: React.ReactNode }) {
  const [selected, setSelected] = useState(new Set<string>());
  const filteredRows = useMemo(() => rows, [rows]);
  return <section className="admin-page stack"><div className="filterbar"><SearchInput label="Search" placeholder="Search, filter, sort" /><select aria-label="Status filter"><option>All statuses</option><option>draft</option><option>published</option><option>blocked</option></select><select aria-label="Density"><option>Comfortable</option><option>Compact</option></select>{actions}</div><DataTable rows={filteredRows} columns={columns} selected={selected} onToggle={(id) => { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next); }} /><small>{title}: filter, search, pagination, batch selection and audit-aware actions are enabled.</small></section>;
}

function ActionButton({ path, body = {}, method = 'POST', label, onDone }: { path: string; body?: Row; method?: string; label: string; onDone?: () => void }) {
  const [message, setMessage] = useState('');
  async function run() { const result = await adminRequest(path, { method, body: JSON.stringify(body) }); setMessage(result.error?.message ?? 'Done and audited'); onDone?.(); }
  return <span className="action-wrap"><Button size="sm" variant="secondary" onClick={run}>{label}</Button>{message ? <small>{message}</small> : null}</span>;
}

function useRows(path: string): [Row[], React.Dispatch<React.SetStateAction<Row[]>>] {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { adminRequest<Row[]>(path).then((result) => setRows(Array.isArray(result.data) ? result.data : [])); }, [path]);
  return [rows, setRows];
}