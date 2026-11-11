import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  ExternalLink,
  HelpCircle,
  Crown,
  PanelLeftClose,
  PanelLeft,
  Menu,
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
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { NavItem } from './NavItem'
import { BreadcrumbBar } from '../components/navigation/BreadcrumbBar'
import { MobileBottomDock } from '../components/navigation/MobileBottomDock'
import { MobileNavDrawer } from '../components/navigation/MobileNavDrawer'
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
  slug: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  badge?: string
  tier?: 'core' | 'pro'
}

const navItems: NavItemConfig[] = [
  { id: 'overview', slug: 'overview', label: 'Command Center', icon: LayoutDashboard, tier: 'core' },
  { id: 'autopilot', slug: 'radar', label: 'News & Trend Radar', icon: Radio, tier: 'core' },
  { id: 'brands', slug: 'brands', label: 'Brands', icon: Layers, tier: 'core' },
  { id: 'research', slug: 'research', label: 'Research & Trends', icon: Compass, tier: 'pro' },
  { id: 'content', slug: 'content', label: 'Content Studio', icon: PenSquare, tier: 'core' },
  { id: 'creative', slug: 'creative', label: 'Creative Studio', icon: Palette, tier: 'core' },
  { id: 'calendar', slug: 'calendar', label: 'Publishing Calendar', icon: Calendar, tier: 'core' },
  { id: 'accounts', slug: 'accounts', label: 'Social Accounts', icon: Share2, tier: 'pro' },
  { id: 'inbox', slug: 'inbox', label: 'Unified Inbox', icon: Inbox, tier: 'pro' },
  { id: 'listening', slug: 'listening', label: 'Social Listening', icon: Radio, tier: 'pro' },
  { id: 'analytics', slug: 'analytics', label: 'Analytics', icon: BarChart3, tier: 'pro' },
  { id: 'strategist', slug: 'strategist', label: 'AI Strategist', icon: Sparkles, tier: 'pro' },
  { id: 'automations', slug: 'automations', label: 'Automations', icon: Bot, tier: 'pro' },
  { id: 'knowledge', slug: 'knowledge', label: 'Knowledge Base', icon: BookOpen, tier: 'core' },
  { id: 'templates', slug: 'templates', label: 'Templates', icon: LayoutTemplate, tier: 'pro' },
  { id: 'team', slug: 'team', label: 'Team & Access', icon: Users, tier: 'pro' },
  { id: 'billing', slug: 'billing', label: 'Billing & Plans', icon: CreditCard, tier: 'core' },
  { id: 'audit', slug: 'audit', label: 'Activity & Audit Log', icon: Settings, tier: 'pro' },
]

const SLUG_TO_TAB: Record<string, string> = {
  overview: 'overview',
  radar: 'autopilot',
  autopilot: 'autopilot',
  brands: 'brands',
  research: 'research',
  content: 'content',
  creative: 'creative',
  calendar: 'calendar',
  accounts: 'accounts',
  inbox: 'inbox',
  listening: 'listening',
  analytics: 'analytics',
  strategist: 'strategist',
  automations: 'automations',
  knowledge: 'knowledge',
  templates: 'templates',
  team: 'team',
  billing: 'billing',
  audit: 'audit',
}

const TAB_TO_SLUG: Record<string, string> = {
  overview: 'overview',
  autopilot: 'radar',
  brands: 'brands',
  research: 'research',
  content: 'content',
  creative: 'creative',
  calendar: 'calendar',
  accounts: 'accounts',
  inbox: 'inbox',
  listening: 'listening',
  analytics: 'analytics',
  strategist: 'strategist',
  automations: 'automations',
  knowledge: 'knowledge',
  templates: 'templates',
  team: 'team',
  billing: 'billing',
  audit: 'audit',
}

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
  const { tab: routeTab, subtab: routeSubtab } = useParams<{ tab?: string; subtab?: string }>()
  const navigate = useNavigate()

  const { user, activeOrg, activeWorkspace, workspaces, isAuthenticated, logout, switchWorkspace } =
    useAuth()
  const { theme, toggleTheme, persona, togglePersona } = usePreferences()

  // 1-Click Expandable & Collapsible Sidebar State with LocalStorage Persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('autocanvas_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Mobile Drawer & Overlay State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Derive active tab from route parameter, falling back to 'overview'
  const activeTab = (routeTab && SLUG_TO_TAB[routeTab]) || 'overview'

  const [health, setHealth] = useState<HealthCheckData | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('autocanvas_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Keyboard shortcut listener for '[' or 'Ctrl+B' to toggle sidebar, and '?' for shortcuts
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
      } else if (!isInput) {
        if (e.key === '[' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          toggleSidebar()
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault()
          toggleSidebar()
        }
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

  const handleSelectTab = (tabId: string) => {
    const slug = TAB_TO_SLUG[tabId] || tabId
    navigate(`/workspace/${slug}`)
  }

  // Progressive complexity filtering: Business Owner sees essentials, Agency Pro sees the complete suite
  const visibleNavItems = navItems.filter((item) => {
    if (persona === 'business_owner') {
      return item.tier === 'core'
    }
    return true
  })

  // Get active item title for breadcrumbs and header
  const activeNavItem = navItems.find((item) => item.id === activeTab)
  const activeTitle = activeNavItem ? activeNavItem.label : 'Operations'

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
        onNavigate={handleSelectTab}
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

      {/* Mobile Slide-Out Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navItems={navItems}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCmd={() => setCmdOpen(true)}
        onOpenMasterControl={onOpenMasterControl}
        onLaunchOnboarding={onLaunchOnboarding}
        health={health}
      />

      {/* Desktop / Tablet Expandable & Collapsible Sidebar */}
      <aside
        role="navigation"
        aria-label="Main Navigation"
        className={`hidden lg:flex flex-col justify-between border-r border-nav-border bg-nav-bg transition-[width] duration-200 ease-in-out shrink-0 select-none ${
          isSidebarCollapsed ? 'w-18' : 'w-64'
        }`}
        data-lenis-prevent
      >
        <div>
          {/* Logo & Platform Info Header */}
          <div className={`p-4 border-b border-border ${isSidebarCollapsed ? 'px-2 flex flex-col items-center' : ''}`}>
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Expand Sidebar ([)"
                  aria-label="Expand Sidebar"
                  className="p-2 rounded-xl text-brand-accent hover:bg-background-subtle transition-colors"
                >
                  <Logo size="sm" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Logo size="md" />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Collapse Sidebar ([)"
                  aria-label="Collapse Sidebar"
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Interactive Workspace Selector */}
            {!isSidebarCollapsed ? (
              <div className="relative mt-4">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={showWorkspaceMenu}
                  onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground bg-background-subtle rounded-xl border border-border hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-brand-accent shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {activeOrg ? `${activeOrg.name} (${activeWorkspace?.name || 'Default'})` : 'No Workspace'}
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
            ) : (
              <div className="mt-3 flex justify-center">
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                      aria-label="Switch Workspace"
                      className="w-10 h-10 rounded-xl bg-background-subtle border border-border hover:border-brand-accent flex items-center justify-center text-brand-accent transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <Building2 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span>{activeOrg ? `${activeOrg.name} (${activeWorkspace?.name || 'Default'})` : 'Workspace'}</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Workspace Sections"
            className={`p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-270px)] ${isSidebarCollapsed ? 'px-1' : 'p-3'}`}
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
                isCollapsed={isSidebarCollapsed}
                onClick={() => handleSelectTab(item.id)}
              />
            ))}
          </nav>
        </div>

        {/* User Session & System Health Footer */}
        <div className={`border-t border-border bg-background-subtle ${isSidebarCollapsed ? 'p-2 flex flex-col items-center space-y-3' : 'p-4 space-y-3'}`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              {isAuthenticated ? (
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={logout}
                      title="Sign Out"
                      aria-label="Sign Out"
                      className="p-2 rounded-xl text-foreground-muted hover:text-status-danger hover:bg-status-danger-bg transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span>Sign Out ({user?.name})</span>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setShowAuthModal(true)
                  }}
                  className="p-2 rounded-xl text-foreground-muted hover:text-foreground transition-colors"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              {/* Expand Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                title="Expand Sidebar ([)"
                aria-label="Expand Sidebar"
                className="p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <PanelLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main role="main" className="flex-1 flex flex-col overflow-hidden">
        {/* Top Operational Bar */}
        <header
          role="banner"
          className="h-16 border-b border-border bg-surface px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Hamburger Drawer Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              className="lg:hidden p-2 rounded-xl border border-border bg-background-subtle text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Desktop 1-Click Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expand Sidebar ([)' : 'Collapse Sidebar ([)'}
              aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden lg:flex p-2 rounded-xl border border-border bg-background-subtle text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-4 h-4 text-brand-accent" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Breadcrumb Trail */}
            <div>
              <BreadcrumbBar
                items={[
                  { label: 'Workspace', onClick: () => navigate('/workspace/overview') },
                  { label: activeTitle, current: !routeSubtab },
                  ...(routeSubtab ? [{ label: routeSubtab.charAt(0).toUpperCase() + routeSubtab.slice(1), current: true }] : []),
                ]}
              />
              <p className="text-[11px] text-foreground-secondary hidden sm:block mt-0.5">
                {activeOrg ? `${activeOrg.name} • Plan: ${activeOrg.plan}` : 'Organization operations'}
              </p>
            </div>

            {/* Quick Command Palette Button */}
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Open Command Palette"
              className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 text-xs text-foreground-secondary bg-background-subtle border border-border rounded-xl hover:border-brand-accent transition-colors ml-2"
            >
              <Search className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
              <span>Search studios & tools...</span>
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
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
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
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
                <span className="hidden xl:inline">Guided Setup</span>
              </button>
            )}

            {/* Persona Complexity Switcher */}
            <button
              onClick={togglePersona}
              title={`Switch mode: Current is ${persona === 'agency_pro' ? 'Agency Pro' : 'Business Owner'}`}
              aria-label="Toggle Interface Mode"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background-subtle text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              <span className="text-[11px] font-mono">
                {persona === 'agency_pro' ? 'Pro' : 'Simple'}
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={(e) => toggleTheme(e)}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
              className="p-2 rounded-lg border border-border bg-background-subtle text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
              )}
            </button>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard Shortcuts (?)"
              aria-label="View Keyboard Shortcuts"
              className="hidden sm:flex p-2 rounded-lg border border-border bg-background-subtle text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {/* Sovereign Master Control Plane Launcher (Superadmin Only) */}
            {user?.is_platform_admin && onOpenMasterControl && (
              <button
                onClick={onOpenMasterControl}
                title="Launch Platform Admin Center"
                aria-label="Launch Platform Admin Center"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-semibold shadow-2xs transition-all active:scale-98"
              >
                <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Admin Center</span>
              </button>
            )}

            {/* Emergency Pause Control */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-pressed={isPaused}
              aria-label={isPaused ? 'Resume All Publishing' : 'Pause All Publishing'}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                isPaused
                  ? 'bg-status-warning text-interactive-primary-fg hover:opacity-90'
                  : 'bg-surface border border-status-danger text-status-danger hover:bg-status-danger-bg'
              }`}
            >
              <AlertOctagon className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{isPaused ? 'Resume Publishing' : 'Pause Publishing'}</span>
            </button>
          </div>
        </header>

        {/* Content Body with Responsive Padding (Padded for Bottom Dock on Mobile) */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-8 space-y-6 outline-hidden"
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

          {/* Conditional View Rendering based on activeTab and route parameters */}
          {activeTab === 'overview' && (
            <CommandCenterOverview onNavigate={handleSelectTab} isEmergencyPaused={isPaused} />
          )}
          {activeTab === 'creative' && <InteractiveCanvasStudio />}
          {activeTab === 'calendar' && (
            <PublishingCalendar
              initialView={(routeSubtab as any) || 'month'}
              onViewChange={(v) => navigate(`/workspace/calendar/${v}`)}
              onNavigateToContent={() => navigate('/workspace/content')}
            />
          )}
          {activeTab === 'team' && <TeamSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'audit' && <AuditLogView />}
          {activeTab === 'brands' && (
            <BrandStudio
              initialTab={(routeSubtab as any) || 'profile'}
              onTabChange={(t) => navigate(`/workspace/brands/${t}`)}
            />
          )}
          {activeTab === 'knowledge' && (
            <BrandStudio
              initialTab="knowledge"
              onTabChange={(t) => navigate(`/workspace/brands/${t}`)}
            />
          )}
          {activeTab === 'research' && (
            <ResearchStudio onNavigateToContent={() => navigate('/workspace/content')} />
          )}
          {activeTab === 'content' && (
            <ContentStudio initialView={(routeSubtab as any) || 'posts'} />
          )}
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
                onClick: () => handleSelectTab('overview'),
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Dock (Thumb-friendly Navigation for Mobiles & Tablets) */}
      <MobileBottomDock
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />
    </div>
  )
}
