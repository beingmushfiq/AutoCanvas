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
        <RefreshCw className="w-6 h-6 animate-spin text-[#6257E8]" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#EAECF0] p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-xl bg-[#F4F3FF] text-[#6257E8] flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#101828]">No Brands Registered</h3>
        <p className="text-xs text-[#667085] mt-1 mb-4">
          Create your first brand profile in Brand Studio before launching the Research & Trend Discovery Engine.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Brand Switcher */}
      <div className="bg-white rounded-xl border border-[#EAECF0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#6257E8] border border-purple-200/60">
              MOD-04 & MOD-05
            </span>
            <span className="text-xs text-[#667085]">Research & Trend Discovery</span>
          </div>
          <h2 className="text-xl font-bold text-[#101828] mt-1">Intelligence & Opportunity Radar</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBrandMenu(!showBrandMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-gray-50 shadow-xs transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#6257E8]" />
              <span className="max-w-[140px] truncate">{activeBrand?.name || 'Select Brand'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
            </button>

            {showBrandMenu && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-[#EAECF0] shadow-lg py-1.5 z-30">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                  Select Active Brand
                </div>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleBrandChange(b.id)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      b.id === activeBrandId
                        ? 'bg-[#F4F3FF] text-[#6257E8] font-semibold'
                        : 'text-[#344054] hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.primary_color || '#6257E8' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => activeBrandId && fetchOpportunities(activeBrandId)}
            className="p-2 rounded-lg border border-[#D0D5DD] hover:bg-gray-50 text-[#344054] transition-colors"
            title="Refresh Intelligence"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-[#EAECF0] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'opportunities'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Opportunities Radar</span>
          {opportunities.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#6257E8] text-white font-bold">
              {opportunities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('feeds')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'feeds'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <Rss className="w-4 h-4" />
          <span>News Feeds & Articles</span>
        </button>

        <button
          onClick={() => setActiveTab('competitors')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'competitors'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
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
