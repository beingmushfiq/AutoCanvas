import React from 'react'
import { Check } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  return (
    <section id="pricing" className="py-24 border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-accent">
            TRANSPARENT SUBSCRIPTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            Predictable pricing. Uncompromising power.
          </h2>
          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
            Every plan includes our safe publishing queue, multi-channel calendar, and studio-grade graphic design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Starter Plan */}
          <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-xs font-mono font-semibold uppercase text-foreground-muted">STARTER</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tracking-tight text-foreground">$49</span>
                <span className="text-xs text-foreground-secondary">/ month</span>
              </div>
              <p className="text-xs text-foreground-secondary mt-2">
                Ideal for solo founders and single-brand businesses.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground-secondary border-t border-border-subtle pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  1 Brand Workspace
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  3 Social Accounts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  30 Scheduled Posts / mo
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Core Publishing Calendar
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('starter')}
              className="mt-8 w-full py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold hover:bg-surface-raised transition-colors"
            >
              Start Free Trial
            </button>
          </div>

          {/* Growth Plan (Highlighted) */}
          <div className="p-6 rounded-2xl border-2 border-brand-accent bg-surface flex flex-col justify-between shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="accent">MOST POPULAR</Badge>
            </div>

            <div>
              <div className="text-xs font-mono font-semibold uppercase text-brand-accent">GROWTH</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tracking-tight text-foreground">$129</span>
                <span className="text-xs text-foreground-secondary">/ month</span>
              </div>
              <p className="text-xs text-foreground-secondary mt-2">
                For expanding brands that require continuous rhythm.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground-secondary border-t border-border-subtle pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-accent shrink-0" />
                  3 Brand Workspaces
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-accent shrink-0" />
                  9 Social Accounts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-accent shrink-0" />
                  Unlimited Scheduled Posts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-accent shrink-0" />
                  Real-Time News & Trend Radar
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-accent shrink-0" />
                  Studio Visual Brand Editor
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('growth')}
              className="mt-8 w-full py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs"
            >
              Start 14-Day Trial
            </button>
          </div>

          {/* Agency Plan */}
          <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-xs font-mono font-semibold uppercase text-foreground-muted">AGENCY</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tracking-tight text-foreground">$299</span>
                <span className="text-xs text-foreground-secondary">/ month</span>
              </div>
              <p className="text-xs text-foreground-secondary mt-2">
                For marketing teams managing multiple client organizations.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground-secondary border-t border-border-subtle pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  15 Brand Workspaces
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Unlimited Social Accounts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Brand Voice & Style Memory
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Unified Social Inbox & Engagement
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Unlimited Team Seats
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('agency')}
              className="mt-8 w-full py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold hover:bg-surface-raised transition-colors"
            >
              Start Free Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-xs font-mono font-semibold uppercase text-foreground-muted">ENTERPRISE</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tracking-tight text-foreground">Custom</span>
              </div>
              <p className="text-xs text-foreground-secondary mt-2">
                Dedicated infrastructure and customized AI model options.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground-secondary border-t border-border-subtle pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Unlimited Workspaces
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Dedicated Image & Media Rendering
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  Custom AI Model Integrations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  99.9% Publishing SLA
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" />
                  SSO & Audit Logs
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('enterprise')}
              className="mt-8 w-full py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold hover:bg-surface-raised transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
