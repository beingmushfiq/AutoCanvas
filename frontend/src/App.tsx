import React, { useState, useEffect } from 'react'
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
import { Toaster } from 'sonner'

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const { start, stop } = useSmoothScroll()
  const [view, setView] = useState<'marketing' | 'app' | 'master-control' | 'review'>('marketing')
  const [reviewToken, setReviewToken] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Dynamic PWA Triple-Manifest Switcher (Landing, App Workspace, Sovereign Master Control)
  usePwaManifest(view === 'master-control' ? 'master' : view === 'app' ? 'app' : 'landing')

  // Control Lenis smooth scrolling lifecycle based on active view
  useEffect(() => {
    if (view === 'marketing' || view === 'review') {
      start()
    } else {
      stop()
    }
  }, [view, start, stop])

  // Check URL path and query parameters on load (W3C Scope Partitioning)
  useEffect(() => {
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    const urlView = params.get('view')

    // 1. Magic Review Link Route (/review/:token)
    if (path.startsWith('/review/')) {
      const token = path.replace('/review/', '').split('/')[0]
      if (token) {
        setReviewToken(token)
        setView('review')
        return
      }
    }

    // 2. Master Control Route (/master-control)
    if (path.startsWith('/master-control') || urlView === 'master-control') {
      setView('master-control')
      return
    }

    // 3. Workspace Command App Route (/workspace)
    if (path.startsWith('/workspace') || (urlView === 'workspace' && isAuthenticated)) {
      setView('app')
    }
  }, [isAuthenticated])

  // Automatically transition authenticated users to the Command Center if not on special views
  useEffect(() => {
    if (isAuthenticated && view === 'marketing') {
      setView('app')
    }
  }, [isAuthenticated, view])

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
          setView('app')
        }}
      />

      {view === 'review' && reviewToken ? (
        <ClientReviewView token={reviewToken} />
      ) : view === 'master-control' ? (
        <MasterControlDashboard onExitToWorkspace={() => setView('app')} />
      ) : view === 'marketing' ? (
        <LandingPage
          isAuthenticated={isAuthenticated}
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setAuthModalOpen(true)
          }}
          onEnterApp={() => setView('app')}
        />
      ) : (
        <AppShell
          onNavigateToMarketing={() => setView('marketing')}
          onLaunchOnboarding={() => setShowOnboarding(true)}
          onOpenMasterControl={() => setView('master-control')}
        />
      )}
    </>
  )
}

export const App: React.FC = () => {
  return (
    <PreferencesProvider>
      <SmoothScrollProvider>
        <AuthProvider>
          <AppContent />
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </SmoothScrollProvider>
    </PreferencesProvider>
  )
}

export default App
