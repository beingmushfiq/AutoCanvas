import React from 'react'
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Hero3DCanvas } from './Hero3DCanvas'
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
  const secondaryCta = cmsHero?.secondary_cta_text || 'Try Live Demo'
  return (
    <section id="hero" className="relative pt-20 pb-28 overflow-hidden">
      {/* Subtle Background Structural Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-4"
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

        {/* Interactive 3D Brand Core & Multi-Channel Orbital System */}
        <Hero3DCanvas onExplore={onExploreDemo} />
      </div>
    </section>
  )
}
