import { Routes, Route } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* 后续模块路由在此扩展 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
