import { Routes, Route, Navigate } from 'react-router-dom'
import { TabLayout } from '../components/layout/TabLayout'
import { DiscoverChinaPage } from '../features/discover-china/pages/DiscoverChinaPage'
import { ArticleListPage } from '../features/discover-china/pages/ArticleListPage'
import { ArticleDetailPage } from '../features/discover-china/pages/ArticleDetailPage'
import { MyFavoritesPage } from '../features/discover-china/pages/MyFavoritesPage'
import { CoursesPage } from '../pages/CoursesPage'
import { GamesPage } from '../pages/GamesPage'
import { ProfilePage } from '../pages/ProfilePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<TabLayout />}>
        <Route index element={<Navigate to="/discover" replace />} />
        <Route path="discover" element={<DiscoverChinaPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="discover/category/:categoryId" element={<ArticleListPage />} />
      <Route path="discover/article/:articleId" element={<ArticleDetailPage />} />
      <Route path="profile/favorites" element={<MyFavoritesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
