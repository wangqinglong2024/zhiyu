/**
 * 路由配置：React Router v6
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import AnalyzePage from './pages/AnalyzePage'
import PayingPage from './pages/PayingPage'
import GeneratingPage from './pages/GeneratingPage'
import ReportPage from './pages/ReportPage'
import ProfilePage from './pages/ProfilePage'
import InvitePage from './pages/InvitePage'
import WithdrawPage from './pages/WithdrawPage'

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:code" element={<InvitePage />} />

          {/* 需要登录（由各页面 useAuth Hook 守卫） */}
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze/:category" element={<AnalyzePage />} />
          <Route path="/paying/:orderId" element={<PayingPage />} />
          <Route path="/generating/:orderId" element={<GeneratingPage />} />
          <Route path="/report/:orderId" element={<ReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />

          {/* 兜底 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
