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
    pill: 'Automated',
    title: 'Real-Time News Discovery',
    description:
      'Discovers related Google News feeds, Reddit discussions, and industry publication sitemaps every 60 minutes.',
    bullets: [
      'Hourly Source Ingestion',
      'Topic & Sentiment Analysis',
      'Smart Content Opportunity Scoring',
    ],
  },
  {
    icon: 'ShieldCheck',
    pill: 'Guaranteed',
    title: 'Guaranteed Duplicate Prevention',
    description:
      'Multi-tier checks catch repeated phrases and identical ideas, keeping every post fresh across 180 days of history.',
    bullets: [
      'Phrase & Concept Novelty Gate',
      'Historical Cadence Safeguard',
      '100% Repetition Rejection',
    ],
  },
  {
    icon: 'Palette',
    pill: 'Studio Quality',
    title: 'Studio Visual Brand Designer',
    description:
      'No garbled text or distorted images. AutoCanvas generates crisp, high-resolution graphics with your exact brand fonts and colors.',
    bullets: [
      'Deterministic SVG/HTML Layouts',
      'Pixel-Perfect Typography & Logos',
      'Preview for Every Social Channel',
    ],
  },
  {
    icon: 'Share2',
    pill: 'Channel Native',
    title: 'Multi-Channel Native Adaptation',
    description:
      'Tailored hooks, hashtags, and formatting for LinkedIn, Instagram, Facebook, and Twitter without lazy cross-posting.',
    bullets: [
      'Safe Publishing Queue & Locks',
      '1-Click Instant Safety Pause',
      'Isolated Multi-Tenant Security',
    ],
  },
]

export const PlatformPillarsSection: React.FC<PlatformPillarsSectionProps> = ({ cmsFeatures }) => {
  const sectionRef = useGsap(() => {
    gsap.fromTo(
      '.pillar-card',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.pillar-grid',
          start: 'top 85%',
        },
      }
    )
  }, [cmsFeatures])

  const kicker = cmsFeatures?.section_kicker || 'ORIGINALITY OVER GENERIC CONTENT'
  const title = cmsFeatures?.section_title || 'Built for High-Growth Brands and Agencies'
  const hasCustomItems = Array.isArray(cmsFeatures?.items) && cmsFeatures.items.length > 0
  const items = hasCustomItems ? cmsFeatures.items : DEFAULT_PILLARS
  const isFourColumns = items.length === 4

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

        <div
          className={`pillar-grid grid ${
            isFourColumns
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
          }`}
        >
          {items.map((item, idx) => {
            const bullets = 'bullets' in item ? (item as any).bullets : null

            return (
              <div
                key={item.title || idx}
                className="pillar-card p-6 sm:p-7 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs hover:border-brand-accent/50 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-b from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-brand-accent group-hover:scale-110 group-hover:border-brand-accent/40 group-hover:bg-brand-accent/10 transition-all duration-300">
                      <DynamicCmsIcon name={item.icon} className="w-5 h-5" aria-hidden="true" />
                    </div>
                    {item.pill && (
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                        {item.pill}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight group-hover:text-brand-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {bullets ? (
                  <ul className="relative z-10 mt-6 space-y-2 pt-5 border-t border-border-subtle text-xs text-foreground-secondary">
                    {bullets.map((bullet: string, bIdx: number) => (
                      <li key={bIdx} className="flex items-center gap-2 group-hover:translate-x-0.5 transition-transform duration-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" />
                        <span className="truncate">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="relative z-10 mt-6 pt-5 border-t border-border-subtle flex items-center gap-2 text-xs text-foreground-secondary font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse shrink-0" />
                    <span>Verified Autonomous Capability</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
