import { Routes, Route, Navigate } from 'react-router-dom'
import { TabLayout } from '../components/layout/TabLayout'
import { DiscoverPage } from '../pages/DiscoverPage'
import { CoursesPage } from '../pages/CoursesPage'
import { GamesPage } from '../pages/GamesPage'
import { ProfilePage } from '../pages/ProfilePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<TabLayout />}>
        <Route index element={<Navigate to="/discover" replace />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
