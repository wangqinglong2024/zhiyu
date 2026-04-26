import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { applyTheme, getStoredTheme, resolveTheme, type ThemeMode, type ResolvedTheme } from '@zhiyu/tokens/apply';
import { useGlassSupport } from '../lib/glass-support.js';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Optional callback invoked after every change — e.g. PATCH /api/v1/me/settings. */
  onChange?: (mode: ThemeMode, resolved: ResolvedTheme) => void;
  /** Force a specific mode (e.g. SSR pre-hydration) — overrides storage on first render. */
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, onChange, defaultMode }: ThemeProviderProps): JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(() => defaultMode ?? getStoredTheme());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(defaultMode ?? getStoredTheme()));
  // Detect glass support; sets :root.no-glass when unavailable.
  useGlassSupport();

  // Keep DOM in sync.
  useEffect(() => {
    const r = applyTheme(mode);
    setResolved(r);
  }, [mode]);

  // Listen to system preference change while in `system` mode.
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (): void => {
      const r = applyTheme('system');
      setResolved(r);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      // Brief transition class for smooth color/background animation
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('theme-transition');
        window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transition');
        }, 320);
      }
      setModeState(next);
      const r = applyTheme(next);
      setResolved(r);
      onChange?.(next, r);
    },
    [onChange],
  );

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider />');
  return ctx;
}
