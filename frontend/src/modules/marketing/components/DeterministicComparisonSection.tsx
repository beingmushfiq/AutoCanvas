import React from 'react'
import { Check, X, ShieldAlert, Layers } from 'lucide-react'
import { useGsap, gsap } from '../../../lib/motion/useGsap'
import type { PublicCmsData } from '../../../lib/api/client'

interface DeterministicComparisonSectionProps {
  cmsComparison?: PublicCmsData['comparison']
}

const DEFAULT_ROWS = [
  {
    capability: 'Content Repetition',
    autocanvas: 'Guaranteed Duplicate Prevention (Phrase, Concept & Design Rotation)',
    generic_tools: 'Repeats the same generic tropes and questions every few days',
  },
  {
    capability: 'Creative Graphic Quality',
    autocanvas: 'Crisp brand typography, exact colors, and pixel-perfect graphic layouts',
    generic_tools: 'Garbled AI raster text and generic distorted visuals',
  },
  {
    capability: 'Source Intelligence',
    autocanvas: 'Hourly industry news monitoring, trending topic discovery, and verified facts',
    generic_tools: 'Zero live industry grounding; hallucinations',
  },
]

export const DeterministicComparisonSection: React.FC<DeterministicComparisonSectionProps> = ({
  cmsComparison,
}) => {
  const sectionRef = useGsap(() => {
    gsap.fromTo(
      '.comparison-card',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.comparison-grid',
          start: 'top 85%',
        },
      }
    )
  }, [cmsComparison])

  const title = cmsComparison?.section_title || 'AutoCanvas vs. Generic AI Tools'
  const rows =
    Array.isArray(cmsComparison?.rows) && cmsComparison.rows.length > 0
      ? cmsComparison.rows
      : DEFAULT_ROWS

  return (
    <section ref={sectionRef} id="comparison" className="py-24 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            PRECISION BRAND ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {title}
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            Generic AI tools garble text, warp official logos, and produce messy graphics.
            AutoCanvas creates layered, editable brand graphics that look like they were crafted by a senior art director.
          </p>
        </div>

        <div className="comparison-grid grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Flawed Generative Tool Card */}
          <div className="comparison-card p-8 rounded-2xl border border-status-danger/30 bg-surface/50 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-status-danger/50 shadow-2xs">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-status-danger/10 text-status-danger text-[11px] font-mono font-semibold rounded-bl-xl border-l border-b border-status-danger/20">
              TRADITIONAL AI GENERATORS
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-status-danger/10 text-status-danger flex items-center justify-center mb-6">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Raster Diffusion & Magic Pixels
              </h3>
              <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
                Prompt-to-image models attempt to render text as pixels, resulting in unreadable typography, distorted vector curves, and unfixable hallucinations.
              </p>

              {/* Visual defect simulation */}
              <div className="mt-6 p-6 rounded-xl border border-dashed border-status-danger/40 bg-background/50 text-center font-mono text-xs text-foreground-muted select-none group">
                <div className="text-sm line-through opacity-70 tracking-widest text-status-danger/80">"Aut0C@nvss - 0ne Br@nd Ev3ry Channl"</div>
                <div className="mt-3 text-[10px] text-status-danger flex items-center justify-center gap-1 font-semibold">
                  <X className="w-3.5 h-3.5" /> Warped Glyph Geometry & Hallucinated Letters
                </div>
              </div>
            </div>

            <ul className="mt-8 space-y-3 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              {rows.map((row, idx) => (
                <li key={row.capability || idx} className="flex items-start gap-2">
                  <X className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground mr-1.5">{row.capability}:</span>
                    <span>{row.generic_tools}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* AutoCanvas Deterministic Renderer Card */}
          <div className="comparison-card p-8 rounded-2xl border-2 border-brand-accent bg-surface flex flex-col justify-between relative shadow-xl hover:-translate-y-1.5 transition-all duration-300">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-accent text-interactive-primary-fg text-[11px] font-mono font-bold rounded-bl-xl shadow-xs">
              THE AUTOCANVAS ENGINE
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-accent-subtle text-brand-accent flex items-center justify-center mb-6 shadow-2xs">
                <Layers className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Pixel-Perfect Graphic Design Engine
              </h3>
              <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
                Smart writing paired with precision graphic templates. Your brand fonts, colors, and logos are rendered with flawless clarity every single time.
              </p>

              {/* Visual perfection simulation */}
              <div className="mt-6 p-6 rounded-xl border border-border bg-background text-center font-sans text-xs shadow-inner">
                <div className="text-sm font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-accent" />
                  <span>AutoCanvas • One brand. Every channel.</span>
                </div>
                <div className="mt-3 text-[10px] text-status-success flex items-center justify-center gap-1 font-mono font-semibold">
                  <Check className="w-3.5 h-3.5 text-status-success" /> 100% Crisp Typography & Official Brand Logo
                </div>
              </div>
            </div>

            <ul className="mt-8 space-y-3 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              {rows.map((row, idx) => (
                <li key={row.capability || idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground mr-1.5">{row.capability}:</span>
                    <span>{row.autocanvas}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
