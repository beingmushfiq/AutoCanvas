import React from 'react'
import { Logo } from '../../../components/brand/Logo'
import { usePreferences } from '../../../lib/theme/PreferencesContext'
import { Sun, Moon, ArrowRight, ExternalLink } from 'lucide-react'

interface MarketingNavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onEnterApp?: () => void
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
  isAuthenticated = false,
  announcement,
}) => {
  const { theme, toggleTheme } = usePreferences()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors">
      {/* Dynamic Announcement Ticker Banner */}
      {announcement?.enabled && announcement?.text && (
        <aside aria-label="Announcement" className="bg-brand-accent/10 border-b border-brand-accent/25 px-4 py-2 text-center text-xs text-brand-accent font-medium">
          <a
            href={announcement.link || 'https://devcenterpoint.com'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <span>{announcement.text}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </aside>
      )}

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Creator Attribution */}
        <div className="flex items-center gap-3">
          <a href="#hero" className="flex items-center gap-2 group">
            <Logo size="md" />
          </a>
          <span className="hidden sm:inline-block w-px h-4 bg-border" />
          <a
            href="https://devcenterpoint.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-foreground-muted hover:text-brand-accent transition-colors"
          >
            <span>by DevCenterPoint</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-foreground-secondary" aria-label="Marketing Navigation">
          <a href="#features" className="hover:text-foreground transition-colors">
            Platform Pillars
          </a>
          <a href="#comparison" className="hover:text-foreground transition-colors">
            Deterministic Engine
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            Architecture FAQ
          </a>
        </nav>

        {/* Right CTA & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => toggleTheme(e)}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            className="p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            )}
          </button>

          {isAuthenticated ? (
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 transition-all shadow-2xs"
            >
              <span>Go to Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('login')}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-2xs"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

