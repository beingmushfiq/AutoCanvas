import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { useGsap, gsap } from '../../../lib/motion/useGsap'
import type { PublicCmsData } from '../../../lib/api/client'

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void
  cmsPricing?: PublicCmsData['pricing']
}

const DEFAULT_TIERS = [
  {
    id: 'starter',
    name: 'STARTER',
    monthly_price_usd: 49,
    annual_price_usd: 39,
    description: 'Ideal for solo founders and single-brand businesses.',
    highlighted: false,
    features: [
      '1 Brand Workspace',
      '3 Social Accounts',
      '30 Scheduled Posts / mo',
      'Core Publishing Calendar',
    ],
  },
  {
    id: 'growth',
    name: 'GROWTH',
    monthly_price_usd: 129,
    annual_price_usd: 99,
    description: 'For expanding brands that require continuous rhythm.',
    highlighted: true,
    features: [
      '3 Brand Workspaces',
      '9 Social Accounts',
      'Unlimited Scheduled Posts',
      'Real-Time News & Trend Radar',
      'Studio Visual Brand Editor',
    ],
  },
  {
    id: 'agency',
    name: 'AGENCY',
    monthly_price_usd: 299,
    annual_price_usd: 239,
    description: 'For marketing teams managing multiple client organizations.',
    highlighted: false,
    features: [
      '15 Brand Workspaces',
      'Unlimited Social Accounts',
      'Brand Voice & Style Memory',
      'Unified Social Inbox & Engagement',
      'Unlimited Team Seats',
    ],
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    monthly_price_usd: 0,
    annual_price_usd: 0,
    description: 'Dedicated infrastructure and customized AI model options.',
    highlighted: false,
    features: [
      'Unlimited Workspaces',
      'Dedicated Image & Media Rendering',
      'Custom AI Model Integrations',
      '99.9% Publishing SLA',
      'SSO & Audit Logs',
    ],
  },
]

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, cmsPricing }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD')

  const sectionRef = useGsap(() => {
    gsap.fromTo(
      '.pricing-card',
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.pricing-grid',
          start: 'top 85%',
        },
      }
    )
  })

  const title = cmsPricing?.section_title || 'Predictable pricing. Uncompromising power.'
  const exchangeRate = Math.max(1, Number(cmsPricing?.currency_bdt_rate) || 120)
  const tiers =
    Array.isArray(cmsPricing?.tiers) && cmsPricing.tiers.length > 0
      ? cmsPricing.tiers
      : DEFAULT_TIERS

  const formatPrice = (usdPrice: number) => {
    if (usdPrice === 0) return 'Custom'
    if (currency === 'BDT') {
      const bdtAmount = Math.round(usdPrice * exchangeRate)
      return `৳${bdtAmount.toLocaleString('en-US')}`
    }
    return `$${usdPrice}`
  }

  return (
    <section ref={sectionRef} id="pricing" className="py-24 border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            TRANSPARENT SUBSCRIPTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {title}
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            Every plan includes our safe publishing queue, multi-channel calendar, and studio-grade graphic design.
          </p>
        </div>

        {/* Interactive Controls: Billing Cycle + Currency */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {/* Billing Cycle */}
          <div className="inline-flex items-center p-1 rounded-xl border border-border bg-surface text-xs font-medium">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-interactive-primary text-interactive-primary-fg font-semibold shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-interactive-primary text-interactive-primary-fg font-semibold shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-brand-accent/20 text-brand-accent">
                -20%
              </span>
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl border border-border bg-surface text-xs font-mono font-medium">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-interactive-primary text-interactive-primary-fg font-bold shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('BDT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currency === 'BDT'
                  ? 'bg-interactive-primary text-interactive-primary-fg font-bold shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              BDT (৳)
            </button>
          </div>
        </div>

        <div className="pricing-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {tiers.map((tier) => {
            const isCustom = tier.monthly_price_usd === 0
            const activePriceUsd =
              billingCycle === 'monthly'
                ? tier.monthly_price_usd
                : tier.annual_price_usd || tier.monthly_price_usd
            const isHighlighted = !!tier.highlighted

            return (
              <div
                key={tier.id || tier.name}
                className={`pricing-card opacity-0 p-6 rounded-2xl flex flex-col justify-between transition-all ${
                  isHighlighted
                    ? 'border-2 border-brand-accent bg-surface shadow-lg relative'
                    : 'border border-border bg-surface shadow-2xs'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="accent">MOST POPULAR</Badge>
                  </div>
                )}

                <div>
                  <div
                    className={`text-xs font-mono font-semibold uppercase ${
                      isHighlighted ? 'text-brand-accent' : 'text-foreground-muted'
                    }`}
                  >
                    {tier.name}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                      {formatPrice(activePriceUsd)}
                    </span>
                    {!isCustom && (
                      <span className="text-xs text-foreground-secondary">
                        / month{billingCycle === 'annual' && ' (billed annually)'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary mt-2">
                    {tier.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-foreground-secondary border-t border-border-subtle pt-6">
                    {(tier.features || []).map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check
                          className={`w-4 h-4 shrink-0 ${
                            isHighlighted ? 'text-brand-accent' : 'text-status-success'
                          }`}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectPlan(tier.id)}
                  className={`mt-8 w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isHighlighted
                      ? 'bg-interactive-primary text-interactive-primary-fg hover:opacity-90 active:scale-98 shadow-xs'
                      : 'border border-border bg-surface text-foreground hover:bg-surface-raised active:scale-98'
                  }`}
                >
                  {isCustom
                    ? 'Contact Sales'
                    : isHighlighted
                    ? 'Start 14-Day Trial'
                    : 'Start Free Trial'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
