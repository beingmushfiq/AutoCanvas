import React from 'react'
import { DynamicCmsIcon } from './DynamicCmsIcon'

interface FeatureItem {
  title: string
  description: string
  pill?: string
  icon?: string
}

interface CmsFeaturesLivePreviewProps {
  data: {
    section_title?: string
    section_kicker?: string
    items?: FeatureItem[]
  }
}

export const CmsFeaturesLivePreview: React.FC<CmsFeaturesLivePreviewProps> = ({ data }) => {
  const kicker = data.section_kicker || 'ORIGINALITY OVER GENERIC CONTENT'
  const title = data.section_title || 'Built for High-Growth Brands and Agencies'
  const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : []

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-background space-y-6">
      {/* Editorial Header */}
      <div className="text-center max-w-lg mx-auto space-y-2">
        <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-accent px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20">
          {kicker}
        </span>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          Autonomous multi-channel publishing with continuous intelligence and studio-quality graphic design.
        </p>
      </div>

      {/* Feature Cards Grid (Compact & Container-Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        {items.map((item, idx) => (
          <div
            key={item.title || idx}
            className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between hover:border-brand-accent/50 transition-colors shadow-2xs group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-background-subtle border border-border flex items-center justify-center text-brand-accent group-hover:scale-105 transition-transform">
                  <DynamicCmsIcon name={item.icon} className="w-4.5 h-4.5" />
                </div>
                {item.pill && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                    {item.pill}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-foreground tracking-tight">
                {item.title}
              </h4>
              <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-2 text-[11px] text-foreground-muted font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <span>Verified Feature</span>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-2 text-center py-8 text-xs text-foreground-muted font-mono border border-dashed border-border rounded-xl">
            No feature items defined. Add items in the editor on the left.
          </div>
        )}
      </div>
    </div>
  )
}

