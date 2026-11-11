import React, { useState, useEffect, lazy, Suspense } from 'react'
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
import { AuthModal } from './modules/auth/AuthModal'
import { OnboardingWizard } from './modules/onboarding/OnboardingWizard'
import { usePwaManifest } from './components/pwa/usePwaManifest'
import { SmoothScrollProvider, useSmoothScroll } from './lib/scroll/SmoothScrollProvider'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Alert02Icon,
  InformationCircleIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query/queryClient'
import { OfflineIndicator } from './lib/state/OfflineIndicator'
import { DashboardSkeleton, MasterControlSkeleton } from './components/ui/skeleton'
import { MasterControlGuard } from './modules/master-control/MasterControlGuard'
import { MasterControlLoginPage } from './modules/master-control/MasterControlLoginPage'

// Route-level code-splitting & lazy evaluation
const LandingPage = lazy(() =>
  import('./modules/marketing/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const MasterControlDashboard = lazy(() =>
  import('./modules/master-control/MasterControlDashboard').then((m) => ({
    default: m.MasterControlDashboard,
  }))
)
const ClientReviewView = lazy(() =>
  import('./modules/publishing/ClientReviewView').then((m) => ({ default: m.ClientReviewView }))
)

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

      {/* Network Connectivity & Offline Cached State Banner */}
      <OfflineIndicator />

      <Routes>
        {/* 1. Public Marketing Website */}
        <Route
          path="/"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LandingPage
                isAuthenticated={isAuthenticated}
                onOpenAuth={(mode) => {
                  setAuthMode(mode)
                  setAuthModalOpen(true)
                }}
                onEnterApp={() => navigate('/workspace/overview')}
              />
            </Suspense>
          }
        />

        {/* 2. Client Magic Review (No workspace auth required) */}
        <Route
          path="/review/:token"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <ReviewRoute />
            </Suspense>
          }
        />

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
        <Route path="/master-control/login" element={<MasterControlLoginPage />} />
        <Route path="/master-control" element={<Navigate to="/master-control/white-label" replace />} />
        <Route
          path="/master-control/:tab"
          element={
            <MasterControlGuard>
              <Suspense fallback={<MasterControlSkeleton />}>
                <MasterControlDashboard onExitToWorkspace={() => navigate('/workspace/overview')} />
              </Suspense>
            </MasterControlGuard>
          }
        />
        <Route
          path="/master-control/:tab/:subtab"
          element={
            <MasterControlGuard>
              <Suspense fallback={<MasterControlSkeleton />}>
                <MasterControlDashboard onExitToWorkspace={() => navigate('/workspace/overview')} />
              </Suspense>
            </MasterControlGuard>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PreferencesProvider>
          <SmoothScrollProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={150}>
                <AppContent />
                <Toaster
                  position="bottom-right"
                  expand={false}
                  visibleToasts={5}
                  closeButton
                  icons={{
                    success: (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={18}
                        className="text-status-success shrink-0"
                        aria-hidden="true"
                      />
                    ),
                    error: (
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        size={18}
                        className="text-status-danger shrink-0"
                        aria-hidden="true"
                      />
                    ),
                    warning: (
                      <HugeiconsIcon
                        icon={Alert02Icon}
                        size={18}
                        className="text-status-warning shrink-0"
                        aria-hidden="true"
                      />
                    ),
                    info: (
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={18}
                        className="text-status-info shrink-0"
                        aria-hidden="true"
                      />
                    ),
                    loading: (
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        size={18}
                        className="text-brand-accent animate-spin shrink-0"
                        aria-hidden="true"
                      />
                    ),
                  }}
                  toastOptions={{
                    classNames: {
                      toast:
                        'group toast rounded-2xl border border-border bg-surface-raised text-foreground shadow-2xl p-4 font-sans backdrop-blur-md',
                      title: 'text-xs sm:text-sm font-semibold text-foreground tracking-tight',
                      description: 'text-xs text-foreground-secondary mt-1 font-normal leading-relaxed',
                      actionButton:
                        'rounded-xl bg-interactive-primary text-interactive-primary-fg hover:opacity-90 px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all',
                      cancelButton:
                        'rounded-xl bg-background-subtle border border-border text-foreground hover:bg-surface-raised px-3 py-1.5 text-xs font-medium transition-all',
                      closeButton:
                        'border border-border bg-surface text-foreground-muted hover:text-foreground rounded-lg transition-colors',
                    },
                  }}
                />
              </TooltipProvider>
            </AuthProvider>
          </SmoothScrollProvider>
        </PreferencesProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
