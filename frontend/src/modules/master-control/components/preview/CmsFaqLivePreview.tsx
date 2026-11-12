import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
}

interface CmsFaqLivePreviewProps {
  data: {
    section_title?: string
    items?: FaqItem[]
  }
}

export const CmsFaqLivePreview: React.FC<CmsFaqLivePreviewProps> = ({ data }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const title = data.section_title || 'Frequently Answered Inquiries'
  const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : []

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx))
  }

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-background space-y-6">
      {/* Editorial Header */}
      <div className="text-center max-w-lg mx-auto space-y-2">
        <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-accent px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20">
          FREQUENTLY ASKED QUESTIONS
        </span>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          Interactive client accordion preview. Click any question below to test expand and collapse states.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5 pt-1">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx

          return (
            <div
              key={item.question || idx}
              className={`rounded-xl border transition-all overflow-hidden ${
                isOpen ? 'border-brand-accent/40 bg-surface' : 'border-border bg-surface/60 hover:border-border-strong'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-brand-accent shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    {item.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-foreground-secondary shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-brand-accent' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-foreground-secondary leading-relaxed border-t border-border-subtle bg-background/50">
                  <p className="pl-6">{item.answer}</p>
                </div>
              )}
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-xs text-foreground-muted font-mono border border-dashed border-border rounded-xl">
            No FAQ items defined. Add questions in the editor on the left.
          </div>
        )}
      </div>
    </div>
  )
}

