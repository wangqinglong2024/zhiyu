/**
 * 主题状态管理（Light / Dark 双模式）
 * - 持久化到 localStorage
 * - 同步写入 <html data-theme="...">
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (t) => {
        applyTheme(t)
        set({ theme: t })
      },
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },
    }),
    {
      name: 'neiguan-theme',
      onRehydrateStorage: () => (state) => {
        // 页面加载时立即应用持久化的主题，避免闪白
        if (state) applyTheme(state.theme)
      },
    }
  )
)

/** 在应用启动时调用，确保主题在首帧即生效（防止 FOUC） */
export function initTheme() {
  try {
    const raw = localStorage.getItem('neiguan-theme')
    if (raw) {
      const parsed = JSON.parse(raw)
      applyTheme(parsed?.state?.theme ?? 'dark')
    } else {
      applyTheme('dark')
    }
  } catch {
    applyTheme('dark')
  }
}
