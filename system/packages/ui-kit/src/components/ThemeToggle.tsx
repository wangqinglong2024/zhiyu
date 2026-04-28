import { useEffect, useState } from 'react';

const KEY = 'zhiyu-theme';
type Theme = 'light' | 'dark';

export function applyInitialTheme(): void {
  try {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null) as Theme | null;
    const theme = saved ?? 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

export function ThemeToggle({ label }: { label?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(t);
  }, []);
  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch { /* noop */ }
  }
  return (
    <button onClick={toggle} className="zy-btn zy-btn-ghost" aria-label={label ?? 'toggle theme'} data-testid="theme-toggle">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
