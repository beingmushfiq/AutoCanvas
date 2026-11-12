import React, { useState } from 'react'
import { Logo } from '../../../components/brand/Logo'
import { usePreferences } from '../../../lib/theme/PreferencesContext'
import { Sun, Moon, ArrowRight, ExternalLink, Menu, X } from 'lucide-react'

interface MarketingNavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onEnterApp?: () => void
  onLogout?: () => void
  isAuthenticated?: boolean
  announcement?: {
    enabled?: boolean
    text?: string
    link?: string
  } | null
}

export const MarketingNavbar: React.FC<MarketingNavbarProps> = ({
  onOpenAuth,
  onEnterApp,
  onLogout,
  isAuthenticated = false,
  announcement,
}) => {
  const { theme, toggleTheme } = usePreferences()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Platform Pillars', href: '#features' },
    { label: 'Deterministic Engine', href: '#comparison' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Architecture FAQ', href: '#faq' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors">
      {/* Dynamic Announcement Ticker Banner */}
      {announcement?.enabled && announcement?.text && (
        <aside aria-label="Announcement" className="bg-brand-accent/10 border-b border-brand-accent/25 px-4 py-2 text-center text-xs text-brand-accent font-medium">
          <a
            href={announcement.link || 'https://devcenterpoint.com'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span>{announcement.text}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </aside>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Creator Attribution */}
        <div className="flex items-center gap-3">
          <a href="#hero" className="flex items-center gap-2 group cursor-pointer">
            <Logo size="md" />
          </a>
          <span className="hidden sm:inline-block w-px h-4 bg-border" />
          <a
            href="https://devcenterpoint.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-foreground-muted hover:text-brand-accent transition-colors cursor-pointer"
          >
            <span>by DevCenterPoint</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-foreground-secondary" aria-label="Marketing Navigation">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground transition-colors cursor-pointer">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={(e) => toggleTheme(e)}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            className="p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-all cursor-pointer shadow-2xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onLogout}
                className="cursor-pointer px-3 py-2 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors hover:-translate-y-0.5 duration-150"
              >
                Sign Out
              </button>
              <button
                onClick={onEnterApp}
                className="cursor-pointer inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-98 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('login')}
                className="cursor-pointer hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors hover:-translate-y-0.5 duration-150"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md active:scale-98 transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground transition-colors min-h-10 min-w-10 flex items-center justify-center cursor-pointer shadow-2xs"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-background-subtle rounded-lg transition-colors min-h-11 flex items-center cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onEnterApp?.()
                }}
                className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold bg-interactive-primary text-interactive-primary-fg rounded-xl hover:opacity-90 transition-colors shadow-xs min-h-11 flex items-center justify-center gap-2"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout?.()
                }}
                className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-foreground-secondary border border-border rounded-xl hover:bg-background-subtle transition-colors min-h-11"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenAuth('login')
                }}
                className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-foreground-secondary border border-border rounded-xl hover:bg-background-subtle transition-colors min-h-11"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenAuth('register')
                }}
                className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold bg-interactive-primary text-interactive-primary-fg rounded-xl hover:opacity-90 transition-colors shadow-xs min-h-11"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
