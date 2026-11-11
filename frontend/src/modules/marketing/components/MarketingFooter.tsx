import React from 'react'
import { Logo } from '../../../components/brand/Logo'
import { StatusIndicator } from '../../../components/ui/status-indicator'

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface text-foreground transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-xs text-foreground-secondary max-w-sm leading-relaxed">
              AutoCanvas is an autonomous brand communication and social media operating system.
              Precision typography, studio-quality brand design, and multi-channel synchronization.
            </p>
            <div className="pt-2">
              <StatusIndicator status="success" label="All Systems Operational" />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground-muted mb-4">
              PRODUCT
            </h4>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              <li><a href="#features" className="hover:text-foreground transition-colors">News Radar</a></li>
              <li><a href="#comparison" className="hover:text-foreground transition-colors">Brand Studio</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Publishing Calendar</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Plans & Pricing</a></li>
            </ul>
          </div>

          {/* Security & Architecture */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground-muted mb-4">
              GOVERNANCE
            </h4>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              <li><span className="text-foreground-secondary">Dedicated Workspace Privacy</span></li>
              <li><span className="text-foreground-secondary">Double-Post Protection</span></li>
              <li><span className="text-foreground-secondary">1-Click Safety Pause</span></li>
              <li><span className="text-foreground-secondary">WCAG 2.2 Level AA</span></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground-muted mb-4">
              PLATFORMS
            </h4>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              <li><span className="text-foreground-secondary">LinkedIn Company Pages</span></li>
              <li><span className="text-foreground-secondary">Instagram Professional</span></li>
              <li><span className="text-foreground-secondary">Facebook Pages</span></li>
              <li><span className="text-foreground-muted">X, TikTok, YouTube (Upcoming)</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <div>
            © {new Date().getFullYear()} AutoCanvas. Engineered with pride by{' '}
            <a
              href="https://devcenterpoint.com"
              target="_blank"
              rel="noreferrer"
              className="text-foreground font-semibold hover:text-brand-accent transition-colors underline decoration-brand-accent/40"
            >
              DevCenterPoint
            </a>
            . All rights reserved.
          </div>
          <div className="font-mono text-[11px] text-foreground-muted flex items-center gap-2">
            <span>Studio Editorial Design System</span>
            <span>·</span>
            <a
              href="https://devcenterpoint.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-accent transition-colors"
            >
              devcenterpoint.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

