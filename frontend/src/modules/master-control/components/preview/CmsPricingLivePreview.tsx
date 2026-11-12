import React, { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'

interface PricingTier {
  id: string
  name: string
  monthly_price_usd: number
  annual_price_usd: number
  description: string
  features: string[]
  highlighted?: boolean
  contact_sales?: boolean
}

interface CmsPricingLivePreviewProps {
  data: {
    section_title?: string
    currency_bdt_rate?: number
    tiers?: PricingTier[]
  }
}

export const CmsPricingLivePreview: React.FC<CmsPricingLivePreviewProps> = ({ data }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD')

  const title = data.section_title || 'Transparent, Simple Subscriptions'
  const exchangeRate = Math.max(1, Number(data.currency_bdt_rate) || 120)
  const tiers = Array.isArray(data.tiers) && data.tiers.length > 0 ? data.tiers : []
  const isFourTiers = tiers.length === 4

  const formatPrice = (usdPrice: number) => {
    if (usdPrice === 0) return 'Custom'
    if (currency === 'BDT') {
      const bdtAmount = Math.round(usdPrice * exchangeRate)
      return `৳${bdtAmount.toLocaleString('en-US')}`
    }
    return `$${usdPrice}`
  }

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-background space-y-6">
      {/* Editorial Header */}
      <div className="text-center max-w-lg mx-auto space-y-2">
        <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-accent px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20">
          TRANSPARENT SUBSCRIPTIONS
        </span>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          Predictable multi-brand pricing with local bKash/Nagad billing support.
        </p>
      </div>

      {/* Dual Interactive Controls: Billing Cycle + Currency */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl border border-border bg-surface text-xs font-medium">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-interactive-primary text-interactive-primary-fg font-semibold shadow-2xs'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-interactive-primary text-interactive-primary-fg font-semibold shadow-2xs'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-brand-accent/20 text-brand-accent">
              -20%
            </span>
          </button>
        </div>

        {/* Currency Switcher Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl border border-border bg-surface text-xs font-mono">
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-interactive-primary text-interactive-primary-fg font-bold shadow-2xs'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            USD ($)
          </button>
          <button
            type="button"
            onClick={() => setCurrency('BDT')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              currency === 'BDT'
                ? 'bg-interactive-primary text-interactive-primary-fg font-bold shadow-2xs'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            BDT (৳)
          </button>
        </div>
      </div>

      {/* Tiers Grid */}
      <div
        className={`grid ${
          isFourTiers
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
        } pt-2`}
      >
        {tiers.map((tier) => {
          const basePrice = billingCycle === 'annual' ? tier.annual_price_usd : tier.monthly_price_usd
          const isHighlighted = !!tier.highlighted
          const hasContactSales = !!tier.contact_sales

          return (
            <div
              key={tier.id || tier.name}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-2xs relative ${
                isHighlighted
                  ? 'border-brand-accent bg-surface ring-1 ring-brand-accent/30'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-brand-accent text-interactive-primary-fg text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" /> Most Popular
                </div>
              )}

              <div>
                <div className="text-xs font-mono font-bold uppercase text-foreground-muted">
                  {tier.name}
                </div>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="text-[11px] text-foreground-secondary">
                    / mo
                  </span>
                </div>
                <p className="text-[11px] text-foreground-secondary mt-1.5 leading-relaxed">
                  {tier.description}
                </p>

                <ul className="mt-4 space-y-1.5 border-t border-border-subtle pt-3.5 text-xs text-foreground-secondary">
                  {(tier.features || []).map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 space-y-1.5">
                <button
                  type="button"
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isHighlighted
                      ? 'bg-interactive-primary text-interactive-primary-fg hover:opacity-90'
                      : 'border border-border bg-background hover:bg-surface-raised text-foreground'
                  }`}
                >
                  Choose {tier.name}
                </button>

                {hasContactSales && (
                  <div className="text-center text-[10px] font-mono text-brand-accent">
                    + Contact Sales & Invoicing
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
