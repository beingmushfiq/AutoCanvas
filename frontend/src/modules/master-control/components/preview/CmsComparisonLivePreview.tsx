import React from 'react'
import { Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface ComparisonRow {
  capability: string
  autocanvas: string
  generic_tools: string
}

interface CmsComparisonLivePreviewProps {
  data: {
    section_title?: string
    rows?: ComparisonRow[]
  }
}

export const CmsComparisonLivePreview: React.FC<CmsComparisonLivePreviewProps> = ({ data }) => {
  const title = data.section_title || 'AutoCanvas vs. Generic AI Tools'
  const rows = Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : []

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-background space-y-6">
      {/* Editorial Header */}
      <div className="text-center max-w-lg mx-auto space-y-2">
        <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-accent px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20">
          PRECISION BRAND ARCHITECTURE
        </span>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          Why prompt-to-pixel models fail commercial brand standards and how AutoCanvas guarantees deterministic fidelity.
        </p>
      </div>

      {/* Comparison Grid (Side-by-Side Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Card 1: AutoCanvas (Positive Advantage) */}
        <div className="p-5 rounded-xl border border-brand-accent/40 bg-surface flex flex-col justify-between shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-brand-accent/15 text-brand-accent text-[10px] font-mono font-bold rounded-bl-lg border-l border-b border-brand-accent/20 uppercase tracking-wider">
            AutoCanvas Studio
          </div>

          <div>
            <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Deterministic Layered Engine
            </h4>
            <p className="text-[11px] text-foreground-secondary mt-1 leading-relaxed">
              Real vector paths, high-contrast typography, and official logo compliance.
            </p>

            <ul className="mt-4 space-y-3 pt-4 border-t border-border-subtle text-xs">
              {rows.map((row, idx) => (
                <li key={row.capability || idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-foreground">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span>{row.capability}</span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary pl-5 leading-normal">
                    {row.autocanvas}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 2: Generic AI Generators (Flawed Model) */}
        <div className="p-5 rounded-xl border border-status-danger/30 bg-surface/60 flex flex-col justify-between shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-status-danger/10 text-status-danger text-[10px] font-mono font-bold rounded-bl-lg border-l border-b border-status-danger/20 uppercase tracking-wider">
            Generic AI Tools
          </div>

          <div>
            <div className="w-8 h-8 rounded-lg bg-status-danger/10 text-status-danger flex items-center justify-center mb-3">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Uncontrollable Raster Pixels
            </h4>
            <p className="text-[11px] text-foreground-secondary mt-1 leading-relaxed">
              Hallucinated letters, unreadable font glyphs, and warped logos baked into pixels.
            </p>

            {/* Simulated Defect Badge */}
            <div className="mt-3 p-2.5 rounded-lg border border-dashed border-status-danger/40 bg-background/50 text-center font-mono text-[10px] text-foreground-muted select-none">
              <span className="line-through opacity-70">"Aut0C@nvss - 0ne Br@nd"</span>
              <div className="text-[9px] text-status-danger mt-1 flex items-center justify-center gap-1">
                <X className="w-3 h-3" /> Warped Glyph Geometry
              </div>
            </div>

            <ul className="mt-4 space-y-3 pt-4 border-t border-border-subtle text-xs">
              {rows.map((row, idx) => (
                <li key={row.capability || idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-foreground-muted">
                    <X className="w-3.5 h-3.5 text-status-danger shrink-0" />
                    <span>{row.capability}</span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary pl-5 leading-normal">
                    {row.generic_tools}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

