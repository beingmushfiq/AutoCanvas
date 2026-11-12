import React from 'react'
import { useGsap, gsap } from '../../../lib/motion/useGsap'
import { DynamicCmsIcon } from '../../master-control/components/preview/DynamicCmsIcon'
import type { PublicCmsData } from '../../../lib/api/client'

interface PlatformPillarsSectionProps {
  cmsFeatures?: PublicCmsData['features']
}

const DEFAULT_PILLARS = [
  {
    icon: 'Compass',
    pill: 'Trend Radar',
    title: 'Continuous Trend Intelligence',
    description:
      'Live industry news, competitor insights, and market trends gathered automatically to give you fresh content ideas around the clock.',
    bullets: [
      'Industry News & Search Trend Monitoring',
      'Competitor Strategy & Activity Insights',
      'Smart Content Opportunity Scoring',
    ],
  },
  {
    icon: 'Palette',
    pill: 'Studio Canvas',
    title: 'Studio-Quality Brand Graphics',
    description:
      'Zero distorted text or warped logos. Clean, editable brand designs with high-contrast typography and precise corporate color consistency.',
    bullets: [
      'Interactive Visual Design Studio',
      'Bilingual Font Support (English & Bengali)',
      'Preview for Every Social Channel',
    ],
  },
  {
    icon: 'Calendar',
    pill: 'Autonomous Queue',
    title: 'Smart Multi-Channel Publishing',
    description:
      'Consistent publishing cadence that prevents accidental double posts, ensures dependable delivery, and gives you a 1-click safety pause.',
    bullets: [
      'Safe Publishing Queue & Double-Post Protection',
      '1-Click Safety Pause Button',
      'Complete Workspace Privacy & Isolation',
    ],
  },
]

export const PlatformPillarsSection: React.FC<PlatformPillarsSectionProps> = ({ cmsFeatures }) => {
  const sectionRef = useGsap(() => {
    gsap.fromTo(
      '.pillar-card',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.pillar-grid',
          start: 'top 85%',
        },
      }
    )
  })

  const kicker = cmsFeatures?.section_kicker || 'ARCHITECTURE OF EXCELLENCE'
  const title = cmsFeatures?.section_title || 'Engineered for precision. Built for scale.'
  const hasCustomItems = Array.isArray(cmsFeatures?.items) && cmsFeatures.items.length > 0

  return (
    <section ref={sectionRef} id="features" className="py-24 border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            {kicker}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {title}
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            AutoCanvas replaces disconnected browser tabs and brittle AI chatbots with a cohesive,
            multi-tenant operating system designed for modern marketing organizations.
          </p>
        </div>

        <div className="pillar-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hasCustomItems
            ? cmsFeatures.items.map((item, idx) => (
                <div
                  key={item.title || idx}
                  className="pillar-card opacity-0 p-8 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs hover:border-brand-accent/50 transition-colors group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-brand-accent group-hover:scale-105 transition-transform">
                        <DynamicCmsIcon name={item.icon} className="w-6 h-6" aria-hidden="true" />
                      </div>
                      {item.pill && (
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                          {item.pill}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border-subtle flex items-center gap-2 text-xs text-foreground-secondary font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                    <span>Verified Autonomous Capability</span>
                  </div>
                </div>
              ))
            : DEFAULT_PILLARS.map((pillar, idx) => (
                <div
                  key={pillar.title || idx}
                  className="pillar-card opacity-0 p-8 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs hover:border-brand-accent/50 transition-colors group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-brand-accent group-hover:scale-105 transition-transform">
                        <DynamicCmsIcon name={pillar.icon} className="w-6 h-6" aria-hidden="true" />
                      </div>
                      {pillar.pill && (
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                          {pillar.pill}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                  <ul className="mt-8 space-y-2.5 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
                    {pillar.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
