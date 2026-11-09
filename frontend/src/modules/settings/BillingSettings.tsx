import React, { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api/client'
import { Check, Building2, Users, Layers, Share2 } from 'lucide-react'

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
        setPlans(plansRes.data)
        setSubData(subRes.data)
      } catch (e) {
        console.error('Failed to load billing:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#667085]">Loading subscription details...</div>
  }

  const currentSlug = subData?.summary.plan.slug || 'starter'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-[#101828]">Subscription & Entitlements</h3>
        <p className="text-xs text-[#667085]">Review your plan limits, operational usage, and available tiers</p>
      </div>

      {/* Usage Overview Grid */}
      {subData && (
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-5 border-b border-[#EAECF0]">
            <div>
              <span className="text-xs font-medium text-[#667085]">Active Subscription</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-[#101828]">{subData.summary.plan.name} Tier</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {subData.subscription?.status.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#667085]">Billing Rate</span>
              <div className="text-lg font-bold text-[#101828]">${subData.summary.plan.price_monthly}/mo</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5 mt-6">
            <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
              <div className="flex items-center justify-between text-xs text-[#667085]">
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Workspaces</span>
                <span>{subData.summary.usage.workspaces.current} / {subData.summary.usage.workspaces.max}</span>
              </div>
              <div className="mt-2 w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#6257E8] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (subData.summary.usage.workspaces.current / subData.summary.usage.workspaces.max) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
              <div className="flex items-center justify-between text-xs text-[#667085]">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Team Members</span>
                <span>{subData.summary.usage.members.current} / {subData.summary.usage.members.max}</span>
              </div>
              <div className="mt-2 w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#6257E8] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (subData.summary.usage.members.current / subData.summary.usage.members.max) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
              <div className="flex items-center justify-between text-xs text-[#667085]">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Brands</span>
                <span>{subData.summary.usage.brands.current} / {subData.summary.usage.brands.max}</span>
              </div>
              <div className="mt-2 w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#6257E8] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (subData.summary.usage.brands.current / subData.summary.usage.brands.max) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
              <div className="flex items-center justify-between text-xs text-[#667085]">
                <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Social Accounts</span>
                <span>{subData.summary.usage.social_accounts.current} / {subData.summary.usage.social_accounts.max}</span>
              </div>
              <div className="mt-2 w-full bg-[#EAECF0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#6257E8] h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (subData.summary.usage.social_accounts.current / subData.summary.usage.social_accounts.max) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans Comparison */}
      <div className="grid grid-cols-4 gap-5">
        {plans.map((p) => {
          const isCurrent = p.slug === currentSlug
          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-white border-[#6257E8] shadow-md ring-1 ring-[#6257E8]'
                  : 'bg-white border-[#EAECF0] shadow-xs hover:border-[#D0D5DD]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#101828]">{p.name}</h4>
                {isCurrent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6257E8] text-white">
                    CURRENT
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#101828]">${p.price_monthly}</span>
                <span className="text-xs text-[#667085]">/ month</span>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-[#344054]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{p.features.max_brands} Managed Brand(s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{p.features.max_workspaces} Workspace(s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{p.features.max_social_accounts} Connected Channels</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{p.features.max_members} Team Member(s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{(p.features.monthly_ai_tokens / 1000).toLocaleString()}k AI Tokens / mo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{p.features.monthly_renders.toLocaleString()} Image Renders / mo</span>
                </li>
              </ul>

              <button
                disabled={isCurrent}
                className={`mt-6 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-[#F2F4F7] text-[#98A2B3] cursor-default'
                    : 'bg-[#6257E8] text-white hover:bg-[#5246D6]'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
