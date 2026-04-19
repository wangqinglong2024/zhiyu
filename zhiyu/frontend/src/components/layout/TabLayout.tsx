import { type FC, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'
import { useLoginWallContext } from '../../features/auth/contexts/LoginWallContext'

export const TabLayout: FC = () => {
  const { isAuthenticated, openAuthModal } = useLoginWallContext()

  const handleLoginRequired = useCallback((targetTab: string) => {
    openAuthModal({ type: 'navigate_tab', payload: { targetTab } })
  }, [openAuthModal])

  return (
    <div className="relative min-h-screen pb-20">
      <main className="animate-fade-in">
        <Outlet />
      </main>
      <TabBar
        isAuthenticated={isAuthenticated}
        onLoginRequired={handleLoginRequired}
      />
    </div>
  )
}

TabLayout.displayName = 'TabLayout'
