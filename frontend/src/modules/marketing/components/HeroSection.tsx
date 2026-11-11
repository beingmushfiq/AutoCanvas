import React from 'react'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import type { PublicCmsData } from '../../../lib/api/client'

interface HeroSectionProps {
  onGetStarted: () => void
  onExploreDemo: () => void
  cmsHero?: PublicCmsData['hero']
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onExploreDemo,
  cmsHero,
}) => {
  const badgeText = cmsHero?.badge || 'ENGINEERED BY DEVCENTERPOINT · SMART ORIGINAL CONTENT'
  const headline1 = cmsHero?.headline_line1 || 'One brand. Every channel.'
  const headline2 = cmsHero?.headline_line2 || 'Always in rhythm.'
  const subtitle =
    cmsHero?.subtitle ||
    'The complete brand publishing and social media operations platform. Discovers fresh industry news every hour, ensures your content is always original, and keeps every channel active.'
  const primaryCta = cmsHero?.primary_cta_text || 'Start Free 14-Day Trial'
  const secondaryCta = cmsHero?.secondary_cta_text || 'Explore Interactive Demo'
  return (
    <section id="hero" className="relative pt-20 pb-28 overflow-hidden">
      {/* Subtle Background Structural Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(to right, var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        {/* Eyebrow Badge with DevCenterPoint link */}
        <a
          href="https://devcenterpoint.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface hover:border-brand-accent/50 shadow-2xs mb-8 transition-all group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
          </span>
          <span className="text-xs font-mono font-medium text-foreground group-hover:text-brand-accent transition-colors">
            {badgeText}
          </span>
          <ExternalLink className="w-3 h-3 text-foreground-muted group-hover:text-brand-accent transition-colors" />
        </a>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
          {headline1}{' '}
          <span className="text-brand-accent block sm:inline">
            {headline2}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-sm font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md"
          >
            <span>{primaryCta}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-surface text-foreground text-sm font-semibold hover:bg-surface-raised transition-all active:scale-98"
          >
            <Zap className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            <span>{secondaryCta}</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
            Pixel-Perfect Brand Graphics
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
            Safe Publishing Queue
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
            Real Social Engagement Data
          </span>
        </div>

        {/* Product Visual Mockup */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-border bg-surface p-2 sm:p-4 shadow-xl">
          <div className="rounded-xl border border-border-subtle bg-background overflow-hidden text-left">
            {/* Window Top Controls */}
            <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-status-danger/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-status-warning/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-status-success/70" />
                <span className="ml-2 text-[11px] font-mono text-foreground-muted">
                  autocanvas.devcenterpoint.com/command-center
                </span>
              </div>
              <Badge variant="accent">LIVE ENGINE</Badge>
            </div>

            {/* Dashboard Inner Preview */}
            <div className="p-6 space-y-6">
              {/* Header inside preview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Acme Global • Autumn Campaign</h3>
                  <p className="text-xs text-foreground-secondary">
                    3 Channels Connected • 24 Scheduled Slots • Automated Cadence Active
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 rounded-lg bg-status-success-bg text-status-success border border-transparent font-medium">
                    DAEMON: RUNNING
                  </span>
                </div>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-surface">
                  <span className="text-[11px] text-foreground-secondary font-medium">Weekly Cadence</span>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">18 Posts Dispatched</div>
                  <span className="text-[10px] text-status-success flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3 h-3" /> +24% vs Last Week
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface">
                  <span className="text-[11px] text-foreground-secondary font-medium">Scheduled Queue</span>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">12 Slots Confirmed</div>
                  <span className="text-[10px] text-foreground-muted mt-1 block">Next: Tomorrow at 09:30 EST</span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface">
                  <span className="text-[11px] text-foreground-secondary font-medium">Brand Safety Check</span>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">100% Verified</div>
                  <span className="text-[10px] text-status-success flex items-center gap-1 mt-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Zero Compliance Drift
                  </span>
                </div>
              </div>

              {/* Feed Card in preview */}
              <div className="p-4 rounded-xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-accent-subtle text-foreground flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      Signal Detected: "Open-Source AI Orchestration in B2B SaaS"
                    </h4>
                    <p className="text-[11px] text-foreground-secondary mt-0.5 max-w-xl">
                      Confidence: 94% • High engagement opportunity across LinkedIn & Instagram.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-foreground-muted">Ready to publish</span>
                  <span className="px-2.5 py-1 rounded-lg bg-interactive-primary text-interactive-primary-fg text-xs font-semibold">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
