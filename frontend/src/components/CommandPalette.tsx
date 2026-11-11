import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { modalBackdropVariants, commandPaletteVariants } from '../lib/motion/variants'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  Layers,
  Compass,
  PenSquare,
  Palette,
  Calendar,
  Share2,
  Inbox,
  BarChart3,
  Bot,
  Users,
  CreditCard,
  Settings,
  Sun,
  Moon,
  Minimize2,
  Maximize2,
  Globe,
  SlidersHorizontal,
  PlusCircle,
  Play,
  Pause,
  ArrowRight,
  Keyboard,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { usePreferences } from '../lib/theme/PreferencesContext'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tabId: string) => void
  onToggleEmergencyPause?: () => void
  isEmergencyPaused?: boolean
  onOpenShortcuts?: () => void
  onLaunchOnboarding?: () => void
  onNavigateToMarketing?: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onNavigate,
  onToggleEmergencyPause,
  isEmergencyPaused,
  onOpenShortcuts,
  onLaunchOnboarding,
  onNavigateToMarketing,
}) => {
  const { theme, toggleTheme, density, toggleDensity, language, setLanguage, persona, togglePersona } =
    usePreferences()

  // Global keyboard listener for Cmd+K and Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const handleSelect = (action: () => void) => {
    action()
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
          {/* Backdrop Overlay */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Global Command Palette"
            variants={commandPaletteVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-xl rounded-2xl bg-surface-overlay border border-border text-foreground shadow-2xl overflow-hidden font-sans z-10"
          >
            <Command label="Global Command Palette" className="w-full">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-border bg-surface">
            <Compass className="w-4 h-4 text-brand-accent mr-3 shrink-0" aria-hidden="true" />
            <Command.Input
              autoFocus
              placeholder="Type a command, jump to a studio, or search actions..."
              className="w-full py-4 bg-transparent text-xs text-foreground placeholder:text-foreground-muted outline-hidden"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-foreground-muted bg-background-subtle rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* List Results */}
          <Command.List className="max-h-[380px] overflow-y-auto p-2 space-y-2">
            <Command.Empty className="py-8 text-center text-xs text-foreground-muted">
              No matching commands or actions found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group
              heading="Quick Operational Actions"
              className="text-[10px] font-mono font-semibold text-brand-accent uppercase tracking-wider px-2 py-1"
            >
              <Command.Item
                onSelect={() => handleSelect(() => onNavigate('content'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-status-success" aria-hidden="true" />
                  <span>Draft New Post & Run AI Generation</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(() => onNavigate('creative'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                  <span>Launch Creative Canvas Studio (React Konva)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(() => onNavigate('research'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-status-info" aria-hidden="true" />
                  <span>Scan Emerging Trends & Competitor Feeds</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
              </Command.Item>

              {onLaunchOnboarding && (
                <Command.Item
                  onSelect={() => handleSelect(onLaunchOnboarding)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                    <span>Run 13-Step Guided Onboarding Setup</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Wizard</kbd>
                </Command.Item>
              )}

              {onOpenShortcuts && (
                <Command.Item
                  onSelect={() => handleSelect(onOpenShortcuts)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
                >
                  <div className="flex items-center gap-2.5">
                    <Keyboard className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
                    <span>View Keyboard Shortcuts Cheat Sheet</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">?</kbd>
                </Command.Item>
              )}

              {onNavigateToMarketing && (
                <Command.Item
                  onSelect={() => handleSelect(onNavigateToMarketing)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
                    <span>View Public Marketing Website</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Site</kbd>
                </Command.Item>
              )}

              {onToggleEmergencyPause && (
                <Command.Item
                  onSelect={() => handleSelect(onToggleEmergencyPause)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-status-danger aria-selected:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    {isEmergencyPaused ? (
                      <>
                        <Play className="w-4 h-4 text-status-success" aria-hidden="true" />
                        <span>Resume All Social Automations</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-status-danger" aria-hidden="true" />
                        <span>Emergency Pause All Publishing Jobs</span>
                      </>
                    )}
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Killswitch</kbd>
                </Command.Item>
              )}
            </Command.Group>

            {/* Navigation Studios */}
            <Command.Group
              heading="Studios & Navigation"
              className="text-[10px] font-mono font-semibold text-foreground-muted uppercase tracking-wider px-2 py-1 pt-3"
            >
              {[
                { id: 'overview', label: 'Command Center & Telemetry', icon: LayoutDashboard },
                { id: 'brands', label: 'Brand Intelligence Studio', icon: Layers },
                { id: 'research', label: 'Research & Trend Radar', icon: Compass },
                { id: 'content', label: 'Content Studio & Copy Engine', icon: PenSquare },
                { id: 'creative', label: 'Creative Studio Canvas', icon: Palette },
                { id: 'calendar', label: 'Publishing Calendar (FullCalendar)', icon: Calendar },
                { id: 'accounts', label: 'Connected Social Accounts', icon: Share2 },
                { id: 'inbox', label: 'Unified Community Inbox', icon: Inbox },
                { id: 'analytics', label: 'Analytics & Reporting', icon: BarChart3 },
                { id: 'automations', label: 'Automation Orchestrator', icon: Bot },
                { id: 'team', label: 'Team & RBAC Policies', icon: Users },
                { id: 'billing', label: 'Billing & Entitlements', icon: CreditCard },
                { id: 'audit', label: 'Audit Trail & Compliance', icon: Settings },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.id}
                    onSelect={() => handleSelect(() => onNavigate(item.id))}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  </Command.Item>
                )
              })}
            </Command.Group>

            {/* Preferences & Experience Controls */}
            <Command.Group
              heading="Experience & Preferences"
              className="text-[10px] font-mono font-semibold text-foreground-muted uppercase tracking-wider px-2 py-1 pt-3"
            >
              <Command.Item
                onSelect={() => handleSelect(toggleTheme)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-accent" aria-hidden="true" /> : <Moon className="w-4 h-4 text-brand-primary" aria-hidden="true" />}
                  <span>Toggle Theme (Current: {theme === 'dark' ? 'Obsidian Dark' : 'Clean Light'})</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Theme</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(toggleDensity)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  {density === 'comfortable' ? <Minimize2 className="w-4 h-4 text-status-info" aria-hidden="true" /> : <Maximize2 className="w-4 h-4 text-status-info" aria-hidden="true" />}
                  <span>Toggle Density (Current: {density})</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Density</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(togglePersona)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                  <span>
                    Switch Complexity Mode (Current: {persona === 'agency_pro' ? 'Agency Pro (Full Suite)' : 'Business Owner (Streamlined)'})
                  </span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Mode</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => handleSelect(() => setLanguage(language === 'en' ? 'bn' : 'en'))}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-subtle cursor-pointer transition-colors aria-selected:bg-interactive-primary aria-selected:text-interactive-primary-fg"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-status-success" aria-hidden="true" />
                  <span>Language / ভাষা: {language === 'en' ? 'English (Switch to বাংলা)' : 'বাংলা (Switch to English)'}</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground-muted">Lang</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Navigation Bar */}
          <div className="px-4 py-2.5 border-t border-border bg-surface flex items-center justify-between text-[11px] text-foreground-muted">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-background-subtle border border-border text-foreground-secondary font-mono text-[9px]">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-background-subtle border border-border text-foreground-secondary font-mono text-[9px]">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-background-subtle border border-border text-foreground-secondary font-mono text-[9px]">esc</kbd> Dismiss
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span>AutoCanvas Operations</span>
            </div>
          </div>
        </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
