import { type FC, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Compass, BookOpen, Gamepad2, User } from 'lucide-react'
import { TabBadge } from '../ui/Badge'

interface TabItem {
  key: string
  path: string
  label: string
  icon: typeof Compass
  requireAuth: boolean
}

const tabs: TabItem[] = [
  { key: 'discover', path: '/discover', label: '发现', icon: Compass, requireAuth: false },
  { key: 'courses', path: '/courses', label: '课程', icon: BookOpen, requireAuth: true },
  { key: 'games', path: '/games', label: '游戏', icon: Gamepad2, requireAuth: true },
  { key: 'profile', path: '/profile', label: '我的', icon: User, requireAuth: true },
]

interface TabBarProps {
  onLoginRequired?: (targetTab: string) => void
  isAuthenticated?: boolean
  badges?: Record<string, number>
}

export const TabBar: FC<TabBarProps> = ({
  onLoginRequired,
  isAuthenticated = false,
  badges = {},
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const handleTabClick = useCallback((tab: TabItem) => {
    if (tab.requireAuth && !isAuthenticated) {
      onLoginRequired?.(tab.path)
      return
    }
    navigate(tab.path)
  }, [isAuthenticated, navigate, onLoginRequired])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--tabbar-bg)',
        borderTop: '1px solid var(--tabbar-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      role="tablist"
      aria-label="主导航"
    >
      <div className="flex h-14 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = currentPath.startsWith(tab.path)
          const Icon = tab.icon
          const badgeCount = badges[tab.key] || 0

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150"
              onClick={() => handleTabClick(tab)}
            >
              <span className="relative">
                <Icon
                  size={24}
                  className={`transition-all duration-150 ${
                    isActive
                      ? 'text-[var(--color-accent-rose)] scale-105'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 1.5 : 2}
                />
                {badgeCount > 0 && (
                  <TabBadge count={badgeCount} />
                )}
              </span>
              <span
                className={`text-[11px] leading-none transition-colors duration-150 ${
                  isActive
                    ? 'text-[var(--color-accent-rose)] font-medium'
                    : 'text-[var(--color-text-tertiary)]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

TabBar.displayName = 'TabBar'
