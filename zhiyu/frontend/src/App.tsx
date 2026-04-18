import { MeshGradientBackground } from './components/shared/MeshGradientBackground'
import { ParticleBackground } from './components/shared/ParticleBackground'
import { LoginWallProvider } from './features/auth/contexts/LoginWallContext'
import { AuthModal } from './features/auth/components/AuthModal'
import { useLoginWallContext } from './features/auth/contexts/LoginWallContext'
import { OfflineBanner } from './core/components/states/OfflineBanner'
import { ErrorBoundary } from './core/components/states/ErrorBoundary'
import { InstallBanner } from './features/pwa/components/InstallBanner'
import { UpdateBanner } from './features/pwa/components/UpdateBanner'
import { ToastProvider } from './core/components/ui/ToastProvider'
import { AppRouter } from './router'

const AppContent = () => {
  const { isAuthModalOpen, closeAuthModal, handleAuthSuccess } = useLoginWallContext()

  return (
    <>
      <MeshGradientBackground />
      <ParticleBackground />
      <OfflineBanner />
      <UpdateBanner />
      <AppRouter />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={handleAuthSuccess}
      />
      <InstallBanner />
    </>
  )
}

export const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LoginWallProvider>
          <AppContent />
        </LoginWallProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

App.displayName = 'App'
