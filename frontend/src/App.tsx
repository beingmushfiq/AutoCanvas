import React, { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './modules/auth/AuthContext'
import { PreferencesProvider } from './lib/theme/PreferencesContext'
import { AppShell } from './app/AppShell'
import { LandingPage } from './modules/marketing/LandingPage'
import { AuthModal } from './modules/auth/AuthModal'
import { OnboardingWizard } from './modules/onboarding/OnboardingWizard'
import { MasterControlDashboard } from './modules/master-control/MasterControlDashboard'
import { ClientReviewView } from './modules/publishing/ClientReviewView'
import { usePwaManifest } from './components/pwa/usePwaManifest'
import { SmoothScrollProvider, useSmoothScroll } from './lib/scroll/SmoothScrollProvider'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from 'sonner'

// Review route wrapper to extract token from params
const ReviewRoute: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  if (!token) return <Navigate to="/" replace />
  return <ClientReviewView token={token} />
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const { start, stop } = useSmoothScroll()
  const location = useLocation()
  const navigate = useNavigate()

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Dynamic PWA Triple-Manifest Switcher (Landing, App Workspace, Sovereign Master Control)
  const pwaType = location.pathname.startsWith('/master-control')
    ? 'master'
    : location.pathname.startsWith('/workspace')
    ? 'app'
    : 'landing'
  usePwaManifest(pwaType)

  // Control Lenis smooth scrolling lifecycle based on active route
  useEffect(() => {
    if (location.pathname === '/' || location.pathname.startsWith('/review')) {
      start()
    } else {
      stop()
    }
  }, [location.pathname, start, stop])

  // Purge service worker cache on logout
  useEffect(() => {
    if (!isAuthenticated && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_SESSION_CACHE' })
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-foreground-muted">Loading AutoCanvas...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onRegisterSuccess={() => {
          setShowOnboarding(true)
        }}
      />

      {/* 13-Step Guided Onboarding Wizard */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false)
          navigate('/workspace/overview')
        }}
      />

      <Routes>
        {/* 1. Public Marketing Website */}
        <Route
          path="/"
          element={
            <LandingPage
              isAuthenticated={isAuthenticated}
              onOpenAuth={(mode) => {
                setAuthMode(mode)
                setAuthModalOpen(true)
              }}
              onEnterApp={() => navigate('/workspace/overview')}
            />
          }
        />

        {/* 2. Client Magic Review (No workspace auth required) */}
        <Route path="/review/:token" element={<ReviewRoute />} />

        {/* 3. Workspace Operations Platform */}
        <Route path="/workspace" element={<Navigate to="/workspace/overview" replace />} />
        <Route
          path="/workspace/:tab"
          element={
            <AppShell
              onNavigateToMarketing={() => navigate('/')}
              onLaunchOnboarding={() => setShowOnboarding(true)}
              onOpenMasterControl={() => navigate('/master-control/white-label')}
            />
          }
        />
        <Route
          path="/workspace/:tab/:subtab"
          element={
            <AppShell
              onNavigateToMarketing={() => navigate('/')}
              onLaunchOnboarding={() => setShowOnboarding(true)}
              onOpenMasterControl={() => navigate('/master-control/white-label')}
            />
          }
        />

        {/* 4. Sovereign Platform Admin (Master Control Center) */}
        <Route path="/master-control" element={<Navigate to="/master-control/white-label" replace />} />
        <Route
          path="/master-control/:tab"
          element={<MasterControlDashboard onExitToWorkspace={() => navigate('/workspace/overview')} />}
        />
        <Route
          path="/master-control/:tab/:subtab"
          element={<MasterControlDashboard onExitToWorkspace={() => navigate('/workspace/overview')} />}
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <SmoothScrollProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={150}>
              <AppContent />
              <Toaster position="bottom-right" richColors />
            </TooltipProvider>
          </AuthProvider>
        </SmoothScrollProvider>
      </PreferencesProvider>
    </BrowserRouter>
  )
}

export default App
