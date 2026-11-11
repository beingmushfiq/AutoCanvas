import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Rss,
  Users2,
  RefreshCw,
  Building2,
  ChevronDown,
  Layers,
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type BrandSummary,
  type ContentOpportunity,
} from '../../lib/api/client'
import { OpportunitiesRadar } from './OpportunitiesRadar'
import { FeedsManager } from './FeedsManager'
import { CompetitorManager } from './CompetitorManager'
import { EmptyState } from '../../components/ui/empty-state'

interface ResearchStudioProps {
  onNavigateToContent?: () => void
}

export const ResearchStudio: React.FC<ResearchStudioProps> = ({ onNavigateToContent }) => {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'feeds' | 'competitors'>('opportunities')
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showBrandMenu, setShowBrandMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<ApiResponse<BrandSummary[]>>('/brands')
      const brandList = res.data || []
      setBrands(brandList)

      if (brandList.length > 0) {
        const id = activeBrandId && brandList.some((b) => b.id === activeBrandId) ? activeBrandId : brandList[0].id
        setActiveBrandId(id)
        await fetchOpportunities(id)
      } else {
        setActiveBrandId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const fetchOpportunities = async (brandId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<ContentOpportunity[]>>(`/brands/${brandId}/opportunities?status=new`)
      setOpportunities(res.data || [])
    } catch (err) {
      console.error('Failed to load opportunities:', err)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleBrandChange = (brandId: string) => {
    setActiveBrandId(brandId)
    setShowBrandMenu(false)
    fetchOpportunities(brandId)
  }

  const activeBrand = brands.find((b) => b.id === activeBrandId)

  if (loading && brands.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-accent" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <EmptyState
          icon={Layers}
          title="No Brands Registered"
          description="Create your first brand profile in Brand Studio before launching the Research & Trend Discovery Engine."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Brand Switcher */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-background-subtle text-brand-accent border border-border">
              MOD-04 & MOD-05
            </span>
            <span className="text-xs text-foreground-secondary">Research & Trend Discovery</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">Intelligence & Opportunity Radar</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBrandMenu(!showBrandMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-raised shadow-2xs transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Building2 className="w-4 h-4 text-brand-accent" />
              <span className="max-w-[140px] truncate">{activeBrand?.name || 'Select Brand'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
            </button>

            {showBrandMenu && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-surface-overlay border border-border shadow-lg py-1.5 z-30">
                <div className="px-3 py-1.5 text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                  Select Active Brand
                </div>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBrandChange(b.id)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      b.id === activeBrandId
                        ? 'bg-background-subtle text-foreground font-semibold'
                        : 'text-foreground-secondary hover:bg-background-subtle hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-border/40"
                      style={{ backgroundColor: b.primary_color || 'var(--brand-primary)' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => activeBrandId && fetchOpportunities(activeBrandId)}
            className="p-2 rounded-xl border border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            title="Refresh Intelligence"
            aria-label="Refresh Intelligence"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-status-danger-bg border border-status-danger text-xs text-status-danger font-semibold">
          {error}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-border gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('opportunities')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            activeTab === 'opportunities'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Opportunities Radar</span>
          {opportunities.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-interactive-primary text-interactive-primary-fg font-bold">
              {opportunities.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feeds')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            activeTab === 'feeds'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Rss className="w-4 h-4" />
          <span>News Feeds & Articles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('competitors')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            activeTab === 'competitors'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Competitor Watch</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeBrandId && (
        <div>
          {activeTab === 'opportunities' && (
            <OpportunitiesRadar
              brandId={activeBrandId}
              opportunities={opportunities}
              onRefresh={() => fetchOpportunities(activeBrandId)}
              onNavigateToContent={onNavigateToContent}
            />
          )}

          {activeTab === 'feeds' && <FeedsManager brandId={activeBrandId} />}

          {activeTab === 'competitors' && <CompetitorManager brandId={activeBrandId} />}
        </div>
      )}
    </div>
  )
}
