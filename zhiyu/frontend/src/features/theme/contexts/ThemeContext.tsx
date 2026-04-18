import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { ThemeMode, ResolvedTheme, ThemeContextValue } from '../types'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return getSystemTheme()
  return mode
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  // 保持 .dark 类兼容旧 CSS
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })

  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(mode))

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)

    // 添加过渡类
    document.documentElement.classList.add('theme-transition')
    const r = resolveTheme(newMode)
    setResolved(r)
    applyTheme(r)

    // 移除过渡类（避免其他动画受影响）
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 350)
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        const r = e.matches ? 'dark' : 'light'
        setResolved(r)
        applyTheme(r)
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mode])

  // 初始化
  useEffect(() => {
    applyTheme(resolved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
