import { type FC } from 'react'
import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export const TabLayout: FC = () => {
  return (
    <div className="relative min-h-screen pb-20">
      <main className="animate-fade-in">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}

TabLayout.displayName = 'TabLayout'
