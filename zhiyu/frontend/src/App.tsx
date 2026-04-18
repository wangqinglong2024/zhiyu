import { Routes, Route } from 'react-router-dom'
import { MeshGradientBackground } from './components/shared/MeshGradientBackground'
import { ParticleBackground } from './components/shared/ParticleBackground'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export const App = () => {
  return (
    <>
      <MeshGradientBackground />
      <ParticleBackground />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

App.displayName = 'App'
