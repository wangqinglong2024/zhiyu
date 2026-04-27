import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Globe2, Moon, Search, Share2, Sun } from 'lucide-react';
import { Button, Card, IconButton, Toast } from '@zhiyu/ui';
import { localeFromPath, localeLabels, locales, stripLocale, t, type Locale } from '@zhiyu/i18n';
import { navItems } from './data';
import { AuthPages, OnboardingPage, ProfilePage } from './pages/AuthPages';
import { GamePage } from './pages/LearningPages';
import { CoursePage } from './pages/CoursePages';
import { DiscoverPage, ArticlePage, CategoryPage, DiscoverSearchPage } from './pages/DiscoverPages';

type RouteState = { locale: Locale; route: string };

function readRoute(): RouteState {
  const locale = localeFromPath(window.location.pathname);
  const route = stripLocale(window.location.pathname) || '/discover';
  return { locale, route: route === '/' ? '/discover' : route };
}

export function App() {
  const [route, setRoute] = useState(readRoute);
  const [theme, setTheme] = useState(localStorage.getItem('zhiyu.theme') ?? 'system');
  const loggedIn = Boolean(localStorage.getItem('zy.token'));

  useEffect(() => {
    const listener = () => setRoute(readRoute());
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);

  useEffect(() => {
    const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('zhiyu.theme', theme);
  }, [theme]);

  const navigate = (path: string) => {
    window.history.pushState(null, '', `/${route.locale}${path}`);
    setRoute(readRoute());
  };
  const changeLocale = (locale: Locale) => {
    const nextPath = stripLocale(window.location.pathname) || '/discover';
    window.history.pushState(null, '', `/${locale}${nextPath}`);
    localStorage.setItem('zhiyu.locale', locale);
    document.documentElement.lang = locale;
    setRoute(readRoute());
  };

  const page = useMemo(() => renderPage(route.route, route.locale, navigate, changeLocale, loggedIn), [route.route, route.locale, loggedIn]);
  const immersive = route.route.includes('/play') || route.route.includes('/auth') || route.route.includes('/onboarding');

  return <div className="app-shell surface-wash">
    <AppHeader route={route} navigate={navigate} changeLocale={changeLocale} theme={theme} setTheme={setTheme} immersive={immersive} />
    <main id="main" className={immersive ? 'app-main immersive' : 'app-main'}>{page}</main>
    {!immersive ? <nav className="tabbar glass-porcelain" aria-label="Primary navigation">{navItems.map((item) => { const Icon = item.icon; const active = route.route.startsWith(item.path); return <button key={item.path} aria-current={active ? 'page' : undefined} onClick={() => navigate(item.path)}><Icon size={20} /><span>{t(route.locale, item.key)}</span></button>; })}</nav> : null}
    <OfflineBanner />
  </div>;
}

function AppHeader({ route, navigate, changeLocale, theme, setTheme, immersive }: { route: RouteState; navigate: (path: string) => void; changeLocale: (locale: Locale) => void; theme: string; setTheme: (theme: string) => void; immersive: boolean }) {
  return <header className={immersive ? 'app-header transparent' : 'app-header glass-porcelain'}>
    <div className="brand" onClick={() => navigate('/discover')} role="button" tabIndex={0}><span className="seal">知</span><strong>知语 Zhiyu</strong></div>
    <div className="header-actions">
      {route.route !== '/discover' ? <IconButton label="Back" onClick={() => history.back()}><ArrowLeft size={20} /></IconButton> : null}
      <IconButton label="Search" onClick={() => navigate('/discover/search')}><Search size={20} /></IconButton>
      <label className="locale-pill" title={t(route.locale, 'language')}><Globe2 size={16} /><select value={route.locale} onChange={(event) => changeLocale(event.currentTarget.value as Locale)}>{locales.map((locale) => <option key={locale} value={locale}>{localeLabels[locale]}</option>)}</select></label>
      <IconButton label="Share" onClick={() => navigator.clipboard?.writeText(location.href)}><Share2 size={20} /></IconButton>
      <IconButton label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</IconButton>
    </div>
  </header>;
}

function renderPage(route: string, locale: Locale, navigate: (path: string) => void, changeLocale: (locale: Locale) => void, loggedIn: boolean) {
  if (route.startsWith('/auth')) return <AuthPages route={route} navigate={navigate} />;
  if (route.startsWith('/onboarding')) return <OnboardingPage navigate={navigate} />;
  if (route.startsWith('/profile')) return <ProfilePage navigate={navigate} locale={locale} changeLocale={changeLocale} />;
  if (route.startsWith('/learn') || route.startsWith('/courses')) return <CoursePage route={route} navigate={navigate} loggedIn={loggedIn} />;
  if (route.startsWith('/games')) return <GamePage route={route} navigate={navigate} loggedIn={loggedIn} />;
  if (route.startsWith('/discover/') && route.split('/').length >= 4) return <ArticlePage route={route} locale={locale} loggedIn={loggedIn} navigate={navigate} />;
  if (route.startsWith('/discover/') && route !== '/discover/search') return <CategoryPage route={route} locale={locale} loggedIn={loggedIn} navigate={navigate} />;
  if (route === '/discover/search') return <DiscoverSearchPage locale={locale} navigate={navigate} />;
  return <DiscoverPage locale={locale} navigate={navigate} loggedIn={loggedIn} />;
}

function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online ? null : <div className="offline"><Toast type="warning">Offline shell active. Cached content remains readable.</Toast></div>;
}

export function Paywall({ onLogin }: { onLogin: () => void }) {
  return <Card variant="paper" className="paywall"><BookOpen size={28} /><h2>Login unlocks the full library</h2><p>Anonymous visitors can read the first three Discover China categories and preview the first novel chapter.</p><Button onClick={onLogin}>Login</Button></Card>;
}