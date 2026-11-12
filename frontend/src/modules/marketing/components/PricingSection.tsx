import React, { useState } from 'react'
import { Check, Mail, Building2, X } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { useGsap, gsap } from '../../../lib/motion/useGsap'
import type { PublicCmsData } from '../../../lib/api/client'

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void
  cmsPricing?: PublicCmsData['pricing']
}

interface PricingTierItem {
  id: string
  name: string
  monthly_price_usd: number
  annual_price_usd: number
  description: string
  features: string[]
  highlighted?: boolean
  contact_sales?: boolean
}

const DEFAULT_TIERS: PricingTierItem[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly_price_usd: 29,
    annual_price_usd: 24,
    description: 'Essential brand publishing for solo founders and single businesses.',
    highlighted: false,
    features: [
      '1 Managed Brand',
      '1 Workspace',
      '3 Connected Channels',
      '2 Team Members',
      '500k AI Tokens / mo',
      '50 Renders / mo',
      'Core Publishing Calendar',
      'Duplicate Post Prevention',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly_price_usd: 79,
    annual_price_usd: 65,
    description: 'Continuous rhythm and news intelligence for expanding brands.',
    highlighted: true,
    features: [
      '5 Managed Brands',
      '3 Workspaces',
      '10 Connected Channels',
      '8 Team Members',
      '2.5M AI Tokens / mo',
      '300 Renders / mo',
      'Real-Time News & Trend Radar',
      'Studio Brand Graphic Designer',
      'Safe Double-Post Protection',
    ],
  },
  {
    id: 'agency',
    name: 'Agency Pro',
    monthly_price_usd: 199,
    annual_price_usd: 165,
    description: 'High-velocity multi-brand operating system for marketing agencies.',
    highlighted: false,
    features: [
      '25 Managed Brands',
      '10 Workspaces',
      '50 Connected Channels',
      '30 Team Members',
      '10M AI Tokens / mo',
      '2,000 Renders / mo',
      'Brand Voice & Style Memory',
      'Unified Social Inbox & Engagement',
      'Priority Queue Worker Dispatches',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly_price_usd: 499,
    annual_price_usd: 415,
    description: 'Custom limits, dedicated infrastructure, and local payment invoicing.',
    highlighted: false,
    contact_sales: true,
    features: [
      '100 Managed Brands',
      '50 Workspaces',
      '250 Connected Channels',
      '100 Team Members',
      '50M AI Tokens / mo',
      '10,000 Renders / mo',
      'Full Platform Admin Center Access',
      'Dedicated IP & Webhook Relays',
      'Local Invoicing (bKash/Nagad/Bank)',
      'Direct Engineering SLA by DevCenterPoint',
    ],
  },
]

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, cmsPricing }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD')
  const [salesModalOpen, setSalesModalOpen] = useState(false)
  const [salesFormSubmitted, setSalesFormSubmitted] = useState(false)
  const [salesForm, setSalesForm] = useState({
    name: '',
    email: '',
    company: '',
    paymentMethod: 'International Card / Wire Transfer',
    message: '',
  })

  const sectionRef = useGsap(() => {
    gsap.fromTo(
      '.pricing-card',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.pricing-grid',
          start: 'top 85%',
        },
      }
    )
  }, [cmsPricing])

  const title = cmsPricing?.section_title || 'Predictable pricing. Uncompromising power.'
  const exchangeRate = Math.max(1, Number(cmsPricing?.currency_bdt_rate) || 120)
  const tiers: PricingTierItem[] =
    Array.isArray(cmsPricing?.tiers) && cmsPricing.tiers.length > 0
      ? (cmsPricing.tiers as PricingTierItem[])
      : DEFAULT_TIERS

  const formatPrice = (usdPrice: number) => {
    if (usdPrice === 0) return 'Custom'
    if (currency === 'BDT') {
      const bdtAmount = Math.round(usdPrice * exchangeRate)
      return `৳${bdtAmount.toLocaleString('en-US')}`
    }
    return `$${usdPrice}`
  }

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSalesFormSubmitted(true)
    setTimeout(() => {
      // Keep state open with confirmation
    }, 500)
  }

  return (
    <section ref={sectionRef} id="pricing" className="py-24 border-t border-border bg-surface/50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            TRANSPARENT SUBSCRIPTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {title}
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            Every plan includes our safe publishing queue, multi-channel calendar, studio-grade graphic design, and duplicate prevention.
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
                Save 20%
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

        {/* 4-Tier Responsive Grid */}
        <div className="pricing-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {tiers.map((tier) => {
            const isCustom = tier.monthly_price_usd === 0
            const activePriceUsd =
              billingCycle === 'monthly'
                ? tier.monthly_price_usd
                : tier.annual_price_usd || tier.monthly_price_usd
            const isHighlighted = !!tier.highlighted
            const hasContactSales = !!tier.contact_sales

            return (
              <div
                key={tier.id || tier.name}
                className={`pricing-card p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 ease-out ${
                  isHighlighted
                    ? 'border-2 border-brand-accent bg-surface shadow-xl relative hover:-translate-y-2.5 hover:shadow-2xl ring-1 ring-brand-accent/20'
                    : 'border border-border bg-surface shadow-2xs hover:-translate-y-1.5 hover:shadow-xl'
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
                        / month{billingCycle === 'annual' && ' (annual)'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
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

                <div className="mt-8 space-y-2">
                  <button
                    onClick={() => onSelectPlan(tier.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isHighlighted
                        ? 'bg-interactive-primary text-interactive-primary-fg hover:opacity-90 active:scale-98 shadow-xs'
                        : 'border border-border bg-surface text-foreground hover:bg-surface-raised active:scale-98'
                    }`}
                  >
                    {isCustom
                      ? 'Contact Sales'
                      : isHighlighted
                      ? 'Start 14-Day Free Trial'
                      : 'Select Plan'}
                  </button>

                  {hasContactSales && (
                    <button
                      type="button"
                      onClick={() => {
                        setSalesFormSubmitted(false)
                        setSalesModalOpen(true)
                      }}
                      className="w-full py-1.5 text-[11px] font-mono text-brand-accent hover:underline text-center cursor-pointer transition-colors"
                    >
                      Enterprise Invoicing & Contact Sales →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Enterprise Contact Sales & Invoicing Modal */}
      {salesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setSalesModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-foreground-secondary hover:text-foreground rounded-lg hover:bg-surface-raised cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {salesFormSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Inquiry Received
                </h3>
                <p className="text-xs text-foreground-secondary max-w-md mx-auto leading-relaxed">
                  Thank you! Our enterprise solutions team at DevCenterPoint will contact you within 2 hours with custom limits, local payment invoicing details, and dedicated onboarding assistance.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSalesModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 cursor-pointer transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Enterprise Scale & Local Invoicing
                    </h3>
                    <p className="text-xs text-foreground-secondary">
                      Dedicated infrastructure, custom SLAs, and Bangladeshi local payment methods.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSalesSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={salesForm.name}
                      onChange={(e) => setSalesForm({ ...salesForm, name: e.target.value })}
                      placeholder="e.g. Aayan Rahman"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Work Email *
                      </label>
                      <input
                        required
                        type="email"
                        value={salesForm.email}
                        onChange={(e) => setSalesForm({ ...salesForm, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Company / Agency *
                      </label>
                      <input
                        required
                        type="text"
                        value={salesForm.company}
                        onChange={(e) => setSalesForm({ ...salesForm, company: e.target.value })}
                        placeholder="Acme Studio Ltd."
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Payment & Invoicing Preference
                    </label>
                    <select
                      value={salesForm.paymentMethod}
                      onChange={(e) => setSalesForm({ ...salesForm, paymentMethod: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    >
                      <option value="International Card / Wire Transfer">International Card / Wire Transfer (USD)</option>
                      <option value="bKash Merchant (Bangladesh)">bKash Merchant Invoicing (BDT)</option>
                      <option value="Nagad Enterprise (Bangladesh)">Nagad Enterprise Invoicing (BDT)</option>
                      <option value="Bank Direct Wire (City Bank / BRAC Bank)">Bank Direct Wire Transfer (BDT / USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Requirements & Custom Workspaces
                    </label>
                    <textarea
                      rows={2}
                      value={salesForm.message}
                      onChange={(e) => setSalesForm({ ...salesForm, message: e.target.value })}
                      placeholder="Specify needed brands, team seats, or dedicated IP / on-premise SLA..."
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <a
                      href="mailto:enterprise@devcenterpoint.com?subject=AutoCanvas%20Enterprise%20Inquiry"
                      className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand-accent transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>enterprise@devcenterpoint.com</span>
                    </a>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 cursor-pointer shadow-xs transition-all active:scale-98"
                    >
                      Submit Enterprise Inquiry
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
