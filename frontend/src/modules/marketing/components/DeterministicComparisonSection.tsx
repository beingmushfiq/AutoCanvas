import React from 'react'
import { Check, X, ShieldAlert, Layers } from 'lucide-react'
import { useGsap, gsap } from '../../../lib/motion/useGsap'

export const DeterministicComparisonSection: React.FC = () => {
  const sectionRef = useGsap(() => {
    gsap.fromTo(
      '.comparison-card',
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.comparison-grid',
          start: 'top 85%',
        },
      }
    )
  })

  return (
    <section ref={sectionRef} id="comparison" className="py-24 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            PRECISION BRAND ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            Why generic AI generators fail real brands.
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            Generic AI tools garble text, warp official logos, and produce messy graphics.
            AutoCanvas creates layered, editable brand graphics that look like they were crafted by a senior art director.
          </p>
        </div>

        <div className="comparison-grid grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Flawed Generative Tool Card */}
          <div className="comparison-card opacity-0 p-8 rounded-2xl border border-status-danger/30 bg-surface/50 flex flex-col justify-between relative overflow-hidden">
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
              <div className="mt-6 p-6 rounded-xl border border-dashed border-status-danger/40 bg-background/50 text-center font-mono text-xs text-foreground-muted select-none">
                <div className="text-sm line-through opacity-70">"Aut0C@nvss - 0ne Br@nd Ev3ry Channl"</div>
                <div className="mt-3 text-[10px] text-status-danger flex items-center justify-center gap-1">
                  <X className="w-3.5 h-3.5" /> Warped Glyph Geometry & Hallucinated Letters
                </div>
              </div>
            </div>

            <ul className="mt-8 space-y-3 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                <span>Text cannot be edited, translated, or checked for typos after generation.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                <span>Logos are distorted, violating official corporate brand guidelines.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                <span>Inaccessible to screen readers (pure flat raster pixels with zero DOM semantics).</span>
              </li>
            </ul>
          </div>

          {/* AutoCanvas Deterministic Renderer Card */}
          <div className="comparison-card opacity-0 p-8 rounded-2xl border border-brand-accent/40 bg-surface flex flex-col justify-between relative shadow-md">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-accent text-interactive-primary-fg text-[11px] font-mono font-bold rounded-bl-xl shadow-xs">
              THE AUTOCANVAS ENGINE
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-accent-subtle text-brand-accent flex items-center justify-center mb-6">
                <Layers className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Pixel-Perfect Graphic Design Engine
              </h3>
              <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
                Smart writing paired with precision graphic templates. Your brand fonts, colors, and logos are rendered with flawless clarity every single time.
              </p>

              {/* Visual perfection simulation */}
              <div className="mt-6 p-6 rounded-xl border border-border bg-background text-center font-sans text-xs">
                <div className="text-sm font-bold tracking-tight text-foreground">
                  AutoCanvas • One brand. Every channel.
                </div>
                <div className="mt-3 text-[10px] text-status-success flex items-center justify-center gap-1 font-mono font-medium">
                  <Check className="w-3.5 h-3.5 text-status-success" /> 100% Crisp Typography & Official Brand Logo
                </div>
              </div>
            </div>

            <ul className="mt-8 space-y-3 pt-6 border-t border-border-subtle text-xs text-foreground-secondary">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <span>Full layer scene graph: edit headlines, swap imagery, or tweak colors in 1 click.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <span>Unaltered vector SVG brand marks; guaranteed contrast and color fidelity.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <span>Fully accessible DOM layer tree with non-drag keyboard editing controls.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
