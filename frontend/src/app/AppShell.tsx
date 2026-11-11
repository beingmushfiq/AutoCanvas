import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Layers,
  Share2,
  PenSquare,
  Palette,
  Calendar,
  Inbox,
  Radio,
  BarChart3,
  Sparkles,
  Bot,
  BookOpen,
  LayoutTemplate,
  Users,
  CreditCard,
  Settings,
  AlertOctagon,
  Building2,
  ChevronDown,
  LogOut,
  Check,
  Compass,
  Search,
  Sun,
  Moon,
  Minimize2,
  Maximize2,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  HelpCircle,
  Crown,
} from 'lucide-react'
import { apiClient, type HealthCheckData } from '../lib/api/client'
import { useAuth } from '../modules/auth/AuthContext'
import { usePreferences } from '../lib/theme/PreferencesContext'
import { AuthModal } from '../modules/auth/AuthModal'
import { CommandPalette } from '../components/CommandPalette'
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal'
import { Logo } from '../components/brand/Logo'
import { StatusIndicator } from '../components/ui/status-indicator'
import { EmptyState } from '../components/ui/empty-state'
import { NavItem } from './NavItem'
import { TeamSettings } from '../modules/settings/TeamSettings'
import { BillingSettings } from '../modules/settings/BillingSettings'
import { AuditLogView } from '../modules/settings/AuditLogView'
import { BrandStudio } from '../modules/brands/BrandStudio'
import { ContentStudio } from '../modules/content/ContentStudio'
import { ResearchStudio } from '../modules/research/ResearchStudio'
import { SocialAccountsManager } from '../modules/social/SocialAccountsManager'
import { InteractiveCanvasStudio } from '../modules/creative/InteractiveCanvasStudio'
import { PublishingCalendar } from '../modules/publishing/PublishingCalendar'
import { CommandCenterOverview } from '../modules/overview/CommandCenterOverview'
import { SocialInboxStream } from '../modules/community/SocialInboxStream'
import { AnalyticsDashboard } from '../modules/analytics/AnalyticsDashboard'
import { AutopilotCommandDeck } from '../modules/automation/AutopilotCommandDeck'

interface NavItemConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  badge?: string
  tier?: 'core' | 'pro'
}

const navItems: NavItemConfig[] = [
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard, tier: 'core' },
  { id: 'autopilot', label: 'News & Trend Radar', icon: Radio, tier: 'core' },
  { id: 'brands', label: 'Brands', icon: Layers, tier: 'core' },
  { id: 'research', label: 'Research & Trends', icon: Compass, tier: 'pro' },
  { id: 'content', label: 'Content Studio', icon: PenSquare, tier: 'core' },
  { id: 'creative', label: 'Creative Studio', icon: Palette, tier: 'core' },
  { id: 'calendar', label: 'Publishing Calendar', icon: Calendar, tier: 'core' },
  { id: 'accounts', label: 'Social Accounts', icon: Share2, tier: 'pro' },
  { id: 'inbox', label: 'Unified Inbox', icon: Inbox, tier: 'pro' },
  { id: 'listening', label: 'Social Listening', icon: Radio, tier: 'pro' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, tier: 'pro' },
  { id: 'strategist', label: 'AI Strategist', icon: Sparkles, tier: 'pro' },
  { id: 'automations', label: 'Automations', icon: Bot, tier: 'pro' },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, tier: 'core' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, tier: 'pro' },
  { id: 'team', label: 'Team & Access', icon: Users, tier: 'pro' },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard, tier: 'core' },
  { id: 'audit', label: 'Activity & Audit Log', icon: Settings, tier: 'pro' },
]

interface AppShellProps {
  onNavigateToMarketing?: () => void
  onLaunchOnboarding?: () => void
  onOpenMasterControl?: () => void
}

export const AppShell: React.FC<AppShellProps> = ({
  onNavigateToMarketing,
  onLaunchOnboarding,
  onOpenMasterControl,
}) => {
  const { user, activeOrg, activeWorkspace, workspaces, isAuthenticated, logout, switchWorkspace } =
    useAuth()
  const { theme, toggleTheme, density, toggleDensity, language, setLanguage, persona, togglePersona } =
    usePreferences()

  const [activeTab, setActiveTab] = useState('overview')
  const [health, setHealth] = useState<HealthCheckData | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Global listener for '?' key to open keyboard shortcuts modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await apiClient.checkHealth()
        setHealth(data)
      } catch (e) {
        console.error('Failed to connect to core API:', e)
      }
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  // Progressive complexity filtering: Business Owner sees essentials, Agency Pro sees the complete suite
  const visibleNavItems = navItems.filter((item) => {
    if (persona === 'business_owner') {
      return item.tier === 'core'
    }
    return true
  })

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden" data-lenis-prevent>
      {/* Skip to Main Content Link for WCAG Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-accent focus:text-interactive-primary-fg focus:rounded-xl focus:shadow-lg focus:outline-hidden font-semibold text-xs"
      >
        Skip to main content
      </a>

      {/* Global Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onNavigate={setActiveTab}
        onToggleEmergencyPause={() => setIsPaused(!isPaused)}
        isEmergencyPaused={isPaused}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onLaunchOnboarding={onLaunchOnboarding}
        onNavigateToMarketing={onNavigateToMarketing}
      />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Sidebar Navigation */}
      <aside
        role="navigation"
        aria-label="Main Navigation"
        className="w-64 border-r border-nav-border bg-nav-bg flex flex-col justify-between shrink-0 transition-colors"
        data-lenis-prevent
      >
        <div>
          {/* Logo & Platform Info */}
          <div className="p-5 border-b border-border">
            <Logo size="md" />

            {/* Interactive Workspace Selector */}
            <div className="relative mt-4">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={showWorkspaceMenu}
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground bg-background-subtle rounded-xl border border-border hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-foreground-muted shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {activeOrg ? `${activeOrg.name} (${activeWorkspace?.name || 'Default'})` : 'No Workspace Selected'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-foreground-muted shrink-0" aria-hidden="true" />
              </button>

              {/* Workspace Dropdown Menu */}
              {showWorkspaceMenu && (
                <div
                  role="menu"
                  className="absolute top-full left-0 right-0 mt-1.5 bg-surface-overlay border border-border rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Switch Workspace
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      role="menuitem"
                      onClick={() => {
                        switchWorkspace(ws.id)
                        setShowWorkspaceMenu(false)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-background-subtle text-foreground-secondary hover:text-foreground transition-colors"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace?.id && (
                        <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Workspace Sections"
            className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-270px)]"
            data-lenis-prevent
          >
            {visibleNavItems.map((item) => (
              <NavItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                isActive={activeTab === item.id}
                badge={item.badge}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>
        </div>

        {/* User Session & System Health Footer */}
        <div className="p-4 border-t border-border bg-background-subtle space-y-3">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="truncate">
                <div className="text-xs font-semibold text-foreground truncate">
                  {user?.name}
                </div>
                <div className="text-[10px] font-mono text-foreground-muted truncate">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 rounded-lg text-foreground-muted hover:text-status-danger hover:bg-status-danger-bg transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthMode('login')
                  setShowAuthModal(true)
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register')
                  setShowAuthModal(true)
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 transition-all shadow-2xs"
              >
                Register
              </button>
            </div>
          )}

          <div
            className="pt-2 border-t border-border flex items-center justify-between text-xs"
            role="status"
            aria-live="polite"
          >
            <span className="text-foreground-muted font-medium">Core API</span>
            <div className="flex items-center gap-1.5 font-medium">
              {health?.status === 'ok' ? (
                <StatusIndicator status="success" label="Healthy (v1.0.0)" />
              ) : (
                <StatusIndicator status="warning" label="Connecting..." pulse />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main role="main" className="flex-1 flex flex-col overflow-hidden">
        {/* Top Operational Bar */}
        <header
          role="banner"
          className="h-16 border-b border-border bg-surface px-8 flex items-center justify-between shrink-0 transition-colors"
        >
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {activeTab === 'team' && 'Team & Access Control'}
                {activeTab === 'billing' && 'Billing & Subscription Tiers'}
                {activeTab === 'audit' && 'Activity & Audit Log'}
                {activeTab === 'overview' && 'AutoCanvas Command Center'}
                {activeTab === 'brands' && 'Brand Intelligence Studio'}
                {activeTab === 'knowledge' && 'Brand Knowledge Base & Citations'}
                {activeTab === 'content' && 'Content Studio & Copy Engine'}
                {activeTab === 'creative' && 'Creative Studio & Brand Designer'}
                {activeTab === 'calendar' && 'Publishing Calendar & Schedule'}
                {activeTab === 'research' && 'Research & Topic Discovery'}
                {!['team', 'billing', 'audit', 'overview', 'brands', 'knowledge', 'content', 'creative', 'calendar', 'research'].includes(activeTab) && 'AutoCanvas Operations'}
              </h2>
              <p className="text-xs text-foreground-secondary">
                {activeOrg ? `${activeOrg.name} • Plan: ${activeOrg.plan}` : 'Organization operations & brand governance'}
              </p>
            </div>

            {/* Quick Command Palette Button */}
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Open Command Palette"
              className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground-secondary bg-background-subtle border border-border rounded-xl hover:border-brand-accent transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
              <span>Search commands, studios & actions...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Public Site Link */}
            {onNavigateToMarketing && (
              <button
                onClick={onNavigateToMarketing}
                title="View Public Marketing Website"
                aria-label="View Public Marketing Website"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                <span className="hidden xl:inline">Public Site</span>
              </button>
            )}

            {/* Guided Setup Trigger */}
            {onLaunchOnboarding && (
              <button
                onClick={onLaunchOnboarding}
                title="Run 13-Step Guided Onboarding"
                aria-label="Run 13-Step Guided Onboarding"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
                <span className="hidden xl:inline">Guided Setup</span>
              </button>
            )}

            {/* Persona Complexity Switcher */}
            <button
              onClick={togglePersona}
              title={`Switch mode: Current is ${persona === 'agency_pro' ? 'Agency Pro' : 'Business Owner'}`}
              aria-label={`Current complexity mode: ${persona === 'agency_pro' ? 'Agency Pro' : 'Business Owner'}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
              <span className="hidden sm:inline">
                {persona === 'agency_pro' ? 'Agency Pro' : 'Business Owner'}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              title={`Switch language: Current is ${language === 'en' ? 'English' : 'বাংলা'}`}
              aria-label={`Language switcher. Current: ${language === 'en' ? 'English' : 'বাংলা'}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
              <span className="font-mono-numeric">{language === 'en' ? 'EN' : 'বাংলা'}</span>
            </button>

            {/* Density Switcher */}
            <button
              onClick={toggleDensity}
              title={`Switch density: Current is ${density}`}
              aria-label={`Toggle density mode. Current: ${density}`}
              className="p-2 rounded-lg border border-border bg-background-subtle text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              {density === 'comfortable' ? (
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>

            {/* Theme Switcher with Circular Ripple Transition */}
            <button
              onClick={(e) => toggleTheme(e)}
              title={`Switch theme: Current is ${theme}`}
              aria-label={`Toggle color theme. Current: ${theme}`}
              className="p-2 rounded-lg border border-border bg-background-subtle text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
              )}
            </button>

            {/* Keyboard Shortcuts Cheat Sheet Trigger */}
            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard Shortcuts (?)"
              aria-label="View Keyboard Shortcuts"
              className="p-2 rounded-lg border border-border bg-background-subtle text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {/* Sovereign Master Control Plane Launcher (Superadmin Only) */}
            {user?.is_platform_admin && onOpenMasterControl && (
              <button
                onClick={onOpenMasterControl}
                title="Launch Sovereign Master Control Plane"
                aria-label="Launch Sovereign Master Control Plane"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-semibold shadow-2xs transition-all active:scale-98"
              >
                <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Master Control</span>
              </button>
            )}

            {/* Emergency Pause Control */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-pressed={isPaused}
              aria-label={isPaused ? 'Resume All Publishing' : 'Pause All Publishing'}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                isPaused
                  ? 'bg-status-warning text-interactive-primary-fg hover:opacity-90'
                  : 'bg-surface border border-status-danger text-status-danger hover:bg-status-danger-bg'
              }`}
            >
              <AlertOctagon className="w-4 h-4" aria-hidden="true" />
              <span>{isPaused ? 'Resume Publishing' : 'Pause Publishing'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-8 space-y-6 outline-hidden"
          data-lenis-prevent
        >
          {/* Status Alert if Paused */}
          {isPaused && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-status-warning bg-status-warning-bg flex items-center gap-3 text-status-warning text-sm"
            >
              <AlertOctagon className="w-5 h-5 text-status-warning shrink-0" aria-hidden="true" />
              <div>
                <strong className="font-semibold">All autonomous planning and publishing is currently PAUSED.</strong>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Scheduled slots are safely preserved. No new jobs will be dispatched to social network APIs until resumed.
                </p>
              </div>
            </div>
          )}

          {/* Conditional View Rendering based on activeTab */}
          {activeTab === 'overview' && (
            <CommandCenterOverview onNavigate={setActiveTab} isEmergencyPaused={isPaused} />
          )}
          {activeTab === 'creative' && <InteractiveCanvasStudio />}
          {activeTab === 'calendar' && (
            <PublishingCalendar onNavigateToContent={() => setActiveTab('content')} />
          )}
          {activeTab === 'team' && <TeamSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'audit' && <AuditLogView />}
          {activeTab === 'brands' && <BrandStudio initialTab="profile" />}
          {activeTab === 'knowledge' && <BrandStudio initialTab="knowledge" />}
          {activeTab === 'research' && <ResearchStudio onNavigateToContent={() => setActiveTab('content')} />}
          {activeTab === 'content' && <ContentStudio initialView="posts" />}
          {activeTab === 'accounts' && <SocialAccountsManager />}
          {activeTab === 'inbox' && <SocialInboxStream />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'autopilot' && <AutopilotCommandDeck />}

          {!['overview', 'creative', 'calendar', 'team', 'billing', 'audit', 'brands', 'knowledge', 'content', 'research', 'accounts', 'inbox', 'analytics', 'autopilot'].includes(activeTab) && (
            <EmptyState
              icon={Sparkles}
              title="Operational Workspace Ready"
              description="Connected to background ingestion and social API connectors. Switch tabs or use the Command Palette (⌘K) to explore."
              action={{
                label: 'Return to Command Center',
                onClick: () => setActiveTab('overview'),
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
