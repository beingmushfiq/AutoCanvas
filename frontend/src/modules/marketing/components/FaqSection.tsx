import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import type { PublicCmsData } from '../../../lib/api/client'

interface FaqItem {
  question: string
  answer: string
}

interface FaqSectionProps {
  cmsFaq?: PublicCmsData['faq']
}

const FAQS: FaqItem[] = [
  {
    question: 'How does AutoCanvas prevent duplicate social posts?',
    answer:
      'Every post is automatically checked against your recent history and queue before sending. Our safety queue guarantees that even during connection hiccups or automated schedules, no post will ever publish twice.',
  },
  {
    question: 'Why does AutoCanvas deliver cleaner graphics than typical AI image generators?',
    answer:
      'Commercial brands cannot tolerate distorted logos, blurry lettering, or incorrect brand colors. AutoCanvas uses AI for creative copywriting and layout guidance, then composites crisp, high-resolution graphics matching your exact fonts and brand colors.',
  },
  {
    question: 'How does the 1-Click Publishing Pause work?',
    answer:
      'Any workspace owner can pause publishing in two clicks from the header or Command Palette (⌘K). This instantly puts outgoing posts on hold while keeping all your scheduled calendar posts and drafts completely safe.',
  },
  {
    question: 'Is my brand content and data kept completely private?',
    answer:
      'Yes. AutoCanvas uses strict workspace isolation. Your drafts, social accounts, scheduled campaigns, and brand voice guidelines are kept strictly private to your team and can never be seen by other organizations.',
  },
  {
    question: 'Which social channels are currently supported?',
    answer:
      'AutoCanvas natively supports Facebook Pages, Instagram Professional Accounts, and LinkedIn Company Pages via official, verified partnerships. Support for X, TikTok, and YouTube is actively rolling out.',
  },
]

export const FaqSection: React.FC<FaqSectionProps> = ({ cmsFaq }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const items = cmsFaq?.items && cmsFaq.items.length > 0 ? cmsFaq.items : FAQS
  const title = cmsFaq?.section_title || 'Clear answers for busy teams.'

  return (
    <section id="faq" className="py-24 border-t border-border bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {title}
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            Everything you need to know about AutoCanvas publishing quality, safety, and privacy.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-border bg-surface transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-surface-raised"
                >
                  <span className="text-sm font-bold text-foreground tracking-tight pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-foreground-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-accent' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-xs text-foreground-secondary leading-relaxed border-t border-border-subtle pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

