import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserProfile, UILanguage, LearningMode, UserPermission } from '../../types/api'
import type { ThemeMode, ResolvedTheme } from '../../features/theme/types'

interface AppContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  userPermission: UserPermission
  uiLanguage: UILanguage
  learningMode: LearningMode
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  isOnline: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

interface AppContextProviderProps {
  children: ReactNode
  user?: UserProfile | null
  uiLanguage?: UILanguage
  learningMode?: LearningMode
  themeMode?: ThemeMode
  resolvedTheme?: ResolvedTheme
}

export function AppContextProvider({
  children,
  user = null,
  uiLanguage = 'zh',
  learningMode = 'pinyin_chinese',
  themeMode = 'system',
  resolvedTheme = 'light',
}: AppContextProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isAuthenticated = !!user
  const userPermission: UserPermission = !user ? 'guest' : user.is_paid ? 'paid' : 'free'

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated,
      userPermission,
      uiLanguage,
      learningMode,
      themeMode,
      resolvedTheme,
      isOnline,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider')
  return ctx
}
