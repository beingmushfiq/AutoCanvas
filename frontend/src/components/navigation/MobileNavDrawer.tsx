import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { drawerLeftVariants, modalBackdropVariants } from '../../lib/motion/variants'
import {
  X,
  Search,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Crown,
  Sparkles,
} from 'lucide-react'
import { Logo } from '../brand/Logo'
import { NavItem } from '../../app/NavItem'
import { StatusIndicator } from '../ui/status-indicator'
import { useAuth } from '../../modules/auth/AuthContext'
import { usePreferences } from '../../lib/theme/PreferencesContext'
import type { HealthCheckData } from '../../lib/api/client'

interface NavItemConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  badge?: string
  tier?: 'core' | 'pro'
}

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItemConfig[]
  activeTab: string
  onSelectTab: (tabId: string) => void
  onOpenCmd: () => void
  onOpenMasterControl?: () => void
  onLaunchOnboarding?: () => void
  health: HealthCheckData | null
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  navItems,
  activeTab,
  onSelectTab,
  onOpenCmd,
  onOpenMasterControl,
  onLaunchOnboarding,
  health,
}) => {
  const { user, activeOrg, activeWorkspace, workspaces, isAuthenticated, logout, switchWorkspace } = useAuth()
  const { theme, toggleTheme, persona } = usePreferences()
  const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false)

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const visibleNavItems = navItems.filter((item) => {
    if (persona === 'business_owner') {
      return item.tier === 'core'
    }
    return true
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Drawer Surface */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            variants={drawerLeftVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-80 max-w-[85vw] bg-nav-bg border-r border-nav-border flex flex-col justify-between h-full shadow-2xl z-10"
            data-lenis-prevent
          >
            <div className="overflow-y-auto flex-1">
          {/* Header with Logo and Close Button */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onSelectTab('overview')
                onClose()
              }}
              title="Go to Command Center"
              aria-label="AutoCanvas Home - Command Center"
              className="text-left rounded-xl transition-opacity hover:opacity-85 outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring cursor-pointer"
            >
              <Logo size="md" />
            </button>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Quick Search Button */}
          <div className="p-3 border-b border-border">
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenCmd()
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-foreground-secondary bg-background-subtle border border-border rounded-xl hover:border-brand-accent transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                <span>Search studios & tools...</span>
              </div>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Workspace Selector */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={showWorkspaceMenu}
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground bg-background-subtle rounded-xl border border-border hover:bg-surface-raised transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-brand-accent shrink-0" aria-hidden="true" />
                  <span className="truncate font-semibold">
                    {activeOrg ? `${activeOrg.name} (${activeWorkspace?.name || 'Default'})` : 'Workspace'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
              </button>

              {showWorkspaceMenu && (
                <div
                  role="menu"
                  className="mt-1.5 bg-surface-overlay border border-border rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Workspaces
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      role="menuitem"
                      onClick={() => {
                        switchWorkspace(ws.id)
                        setShowWorkspaceMenu(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg hover:bg-background-subtle text-foreground-secondary hover:text-foreground transition-colors min-h-[40px]"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace?.id && (
                        <Check className="w-4 h-4 text-brand-accent shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Mobile Workspace Navigation" className="p-3 space-y-1">
            {visibleNavItems.map((item) => (
              <NavItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                isActive={activeTab === item.id}
                badge={item.badge}
                onClick={() => {
                  onSelectTab(item.id)
                  onClose()
                }}
              />
            ))}
          </nav>
        </div>

        {/* Drawer Footer: User Profile, Actions & Health */}
        <div className="p-4 border-t border-border bg-background-subtle space-y-3">
          {/* Superadmin Master Control Button */}
          {user?.is_platform_admin && onOpenMasterControl && (
            <button
              onClick={() => {
                onClose()
                onOpenMasterControl()
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-semibold shadow-2xs transition-all min-h-[44px]"
            >
              <Crown className="w-4 h-4" aria-hidden="true" />
              <span>Platform Admin Center</span>
            </button>
          )}

          {/* Guided Onboarding Trigger */}
          {onLaunchOnboarding && (
            <button
              onClick={() => {
                onClose()
                onLaunchOnboarding()
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground-secondary hover:bg-surface-raised hover:text-foreground transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-brand-accent" aria-hidden="true" />
              <span>Run Guided Onboarding</span>
            </button>
          )}

          {/* Theme Switcher & User Row */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => toggleTheme(e)}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
                className="p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                )}
              </button>

              {health?.status === 'ok' ? (
                <StatusIndicator status="success" label="Core Online" />
              ) : (
                <StatusIndicator status="warning" label="Connecting" pulse />
              )}
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  onClose()
                  logout()
                }}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-2 rounded-xl text-foreground-muted hover:text-status-danger hover:bg-status-danger-bg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  )
}

