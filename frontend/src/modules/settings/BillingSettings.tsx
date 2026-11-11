import React, { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api/client'
import { Check, Building2, Users, Layers, Share2, CreditCard, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'

interface Plan {
  id: string
  name: string
  slug: string
  price_monthly: string
  price_yearly: string
  features: {
    max_workspaces: number
    max_brands: number
    max_social_accounts: number
    max_members: number
    monthly_ai_tokens: number
    monthly_renders: number
    auto_publish_allowed: boolean
    community_inbox_enabled: boolean
  }
}

interface SubscriptionData {
  subscription: {
    id: string
    status: string
    current_period_end: string
  } | null
  summary: {
    plan: {
      name: string
      slug: string
      price_monthly: string
    }
    usage: {
      workspaces: { current: number; max: number }
      members: { current: number; max: number }
      brands: { current: number; max: number }
      social_accounts: { current: number; max: number }
    }
    features: {
      auto_publish_allowed: boolean
      community_inbox_enabled: boolean
    }
  }
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    slug: 'starter',
    price_monthly: '29',
    price_yearly: '290',
    features: {
      max_workspaces: 1,
      max_brands: 1,
      max_social_accounts: 3,
      max_members: 2,
      monthly_ai_tokens: 500000,
      monthly_renders: 50,
      auto_publish_allowed: true,
      community_inbox_enabled: false,
    },
  },
  {
    id: 'plan-growth',
    name: 'Growth',
    slug: 'growth',
    price_monthly: '79',
    price_yearly: '790',
    features: {
      max_workspaces: 3,
      max_brands: 5,
      max_social_accounts: 10,
      max_members: 8,
      monthly_ai_tokens: 2500000,
      monthly_renders: 300,
      auto_publish_allowed: true,
      community_inbox_enabled: true,
    },
  },
  {
    id: 'plan-agency',
    name: 'Agency Pro',
    slug: 'agency',
    price_monthly: '199',
    price_yearly: '1990',
    features: {
      max_workspaces: 10,
      max_brands: 25,
      max_social_accounts: 50,
      max_members: 30,
      monthly_ai_tokens: 10000000,
      monthly_renders: 2000,
      auto_publish_allowed: true,
      community_inbox_enabled: true,
    },
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price_monthly: '499',
    price_yearly: '4990',
    features: {
      max_workspaces: 50,
      max_brands: 100,
      max_social_accounts: 250,
      max_members: 100,
      monthly_ai_tokens: 50000000,
      monthly_renders: 10000,
      auto_publish_allowed: true,
      community_inbox_enabled: true,
    },
  },
]

const DEFAULT_SUB_DATA: SubscriptionData = {
  subscription: {
    id: 'sub_live_09941a',
    status: 'active',
    current_period_end: new Date(Date.now() + 86400000 * 24).toISOString(),
  },
  summary: {
    plan: {
      name: 'Growth',
      slug: 'growth',
      price_monthly: '79',
    },
    usage: {
      workspaces: { current: 1, max: 3 },
      members: { current: 3, max: 8 },
      brands: { current: 2, max: 5 },
      social_accounts: { current: 4, max: 10 },
    },
    features: {
      auto_publish_allowed: true,
      community_inbox_enabled: true,
    },
  },
}

export const BillingSettings: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subData, setSubData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: Plan[] }>('/billing/plans'),
          apiClient.get<{ success: boolean; data: SubscriptionData }>('/billing/subscription'),
        ])
        setPlans(plansRes.data && plansRes.data.length > 0 ? plansRes.data : DEFAULT_PLANS)
        setSubData(subRes.data || DEFAULT_SUB_DATA)
      } catch (e) {
        console.error('Failed to load billing:', e)
        setPlans(DEFAULT_PLANS)
        setSubData(DEFAULT_SUB_DATA)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-foreground-secondary">
        Loading subscription details...
      </div>
    )
  }

  const currentSlug = subData?.summary.plan.slug || 'growth'

  return (
    <div className="space-y-6">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-accent" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">Subscription & Entitlements</h2>
          </div>
          <p className="text-xs text-foreground-secondary mt-1">
            Review your tenant limits, operational quotas, and upgrade or scale plans.
          </p>
        </div>

        <Badge variant="accent" className="gap-1 font-mono uppercase">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          <span>Multi-Tenant Quota Active</span>
        </Badge>
      </Card>

      {/* Usage Overview Grid */}
      {subData && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border">
            <div>
              <span className="text-xs font-medium text-foreground-secondary">
                Active Organization Subscription
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                <span className="text-xl font-bold text-foreground">
                  {subData.summary.plan.name} Tier
                </span>
                <Badge variant="success" className="font-mono uppercase">
                  {subData.subscription?.status || 'ACTIVE'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-foreground-secondary">Billing Rate</span>
              <div className="text-lg font-bold text-foreground font-mono">
                ${subData.summary.plan.price_monthly}
                <span className="text-xs font-normal text-foreground-secondary"> / month</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-surface-raised border border-border">
              <div className="flex items-center justify-between text-xs text-foreground-secondary">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building2 className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
                  <span>Workspaces</span>
                </span>
                <span className="font-mono">
                  {subData.summary.usage.workspaces.current} / {subData.summary.usage.workspaces.max}
                </span>
              </div>
              <div className="mt-2.5 w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-accent h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subData.summary.usage.workspaces.current / subData.summary.usage.workspaces.max) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised border border-border">
              <div className="flex items-center justify-between text-xs text-foreground-secondary">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Users className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
                  <span>Team Members</span>
                </span>
                <span className="font-mono">
                  {subData.summary.usage.members.current} / {subData.summary.usage.members.max}
                </span>
              </div>
              <div className="mt-2.5 w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-accent h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subData.summary.usage.members.current / subData.summary.usage.members.max) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised border border-border">
              <div className="flex items-center justify-between text-xs text-foreground-secondary">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Layers className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
                  <span>Brands</span>
                </span>
                <span className="font-mono">
                  {subData.summary.usage.brands.current} / {subData.summary.usage.brands.max}
                </span>
              </div>
              <div className="mt-2.5 w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-accent h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subData.summary.usage.brands.current / subData.summary.usage.brands.max) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised border border-border">
              <div className="flex items-center justify-between text-xs text-foreground-secondary">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Share2 className="w-3.5 h-3.5 text-brand-accent" aria-hidden="true" />
                  <span>Channels</span>
                </span>
                <span className="font-mono">
                  {subData.summary.usage.social_accounts.current} / {subData.summary.usage.social_accounts.max}
                </span>
              </div>
              <div className="mt-2.5 w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-accent h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (subData.summary.usage.social_accounts.current / subData.summary.usage.social_accounts.max) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((p) => {
          const isCurrent = p.slug === currentSlug
          return (
            <Card
              key={p.id}
              className={`p-5 flex flex-col justify-between transition-all ${
                isCurrent ? 'border-brand-accent ring-1 ring-brand-accent shadow-sm' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">{p.name}</h4>
                  {isCurrent && (
                    <Badge variant="accent" className="font-mono uppercase">
                      Current
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-foreground font-mono">
                    ${p.price_monthly}
                  </span>
                  <span className="text-xs text-foreground-secondary">/ month</span>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-foreground-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
                    <span>{p.features.max_brands} Managed Brand(s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
                    <span>{p.features.max_workspaces} Workspace(s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
                    <span>{p.features.max_social_accounts} Connected Channels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
                    <span>{p.features.max_members} Team Member(s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
                    <span className="font-mono">
                      {(p.features.monthly_ai_tokens / 1000).toLocaleString()}k Tokens / mo
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
                    <span className="font-mono">
                      {p.features.monthly_renders.toLocaleString()} Renders / mo
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  variant={isCurrent ? 'outline' : 'default'}
                  size="sm"
                  disabled={isCurrent}
                  className="w-full"
                >
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
