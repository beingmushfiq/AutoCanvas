import React from 'react'
import { Compass, Palette, Calendar } from 'lucide-react'

export const PlatformPillarsSection: React.FC = () => {
  return (
    <section id="features" className="py-24 border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            ARCHITECTURE OF EXCELLENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            Engineered for precision. Built for scale.
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            AutoCanvas replaces disconnected browser tabs and brittle AI chatbots with a cohesive,
            multi-tenant operating system designed for modern marketing organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs hover:border-brand-accent/50 transition-colors group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-brand-accent mb-6 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Continuous Trend Intelligence
              </h3>
              <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                Live industry news, competitor insights, and market trends gathered automatically to give you fresh content ideas around the clock.
              </p>
            </div>
            <ul className="mt-8 space-y-2.5 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Industry News & Search Trend Monitoring
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Competitor Strategy & Activity Insights
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Smart Content Opportunity Scoring
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs hover:border-brand-accent/50 transition-colors group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-brand-accent mb-6 group-hover:scale-105 transition-transform">
                <Palette className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Studio-Quality Brand Graphics
              </h3>
              <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                Zero distorted text or warped logos. Clean, editable brand designs with high-contrast typography and precise corporate color consistency.
              </p>
            </div>
            <ul className="mt-8 space-y-2.5 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Interactive Visual Design Studio
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Bilingual Font Support (English & Bengali)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Preview for Every Social Channel
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs hover:border-brand-accent/50 transition-colors group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-brand-accent mb-6 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Smart Multi-Channel Publishing
              </h3>
              <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                Consistent publishing cadence that prevents accidental double posts, ensures dependable delivery, and gives you a 1-click safety pause.
              </p>
            </div>
            <ul className="mt-8 space-y-2.5 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Safe Publishing Queue & Double-Post Protection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                1-Click Safety Pause Button
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Complete Workspace Privacy & Isolation
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
