import React, { useState, useEffect } from 'react'
import {
  Layers,
  Sparkles,
  Plus,
  Palette,
  FileText,
  MessageSquare,
  BookOpen,
  Brain,
  Trash2,
  ChevronDown,
  Globe,
  Loader2,
} from 'lucide-react'
import { apiClient, type ApiResponse, type BrandSummary, type BrandDetail } from '../../lib/api/client'
import { BrandWizardModal } from './BrandWizardModal'
import { BrandDiscoveryModal } from './BrandDiscoveryModal'
import { ProfileTab } from './tabs/ProfileTab'
import { VisualTab } from './tabs/VisualTab'
import { VoiceTab } from './tabs/VoiceTab'
import { KnowledgeTab } from './tabs/KnowledgeTab'
import { MemoryTab } from './tabs/MemoryTab'

interface BrandStudioProps {
  initialTab?: 'profile' | 'visual' | 'voice' | 'knowledge' | 'memory'
}

export const BrandStudio: React.FC<BrandStudioProps> = ({ initialTab = 'profile' }) => {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [activeBrand, setActiveBrand] = useState<BrandDetail | null>(null)
  const [selectedTab, setSelectedTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [showWizard, setShowWizard] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)

  const fetchBrands = async (selectId?: string) => {
    try {
      setLoading(true)
      const res = await apiClient.get<ApiResponse<BrandSummary[]>>('/brands')
      const brandList = res.data || []
      setBrands(brandList)

      if (brandList.length > 0) {
        const nextId = selectId || (activeBrandId && brandList.some((b) => b.id === activeBrandId) ? activeBrandId : brandList[0].id)
        setActiveBrandId(nextId)
        await fetchBrandDetail(nextId)
      } else {
        setActiveBrandId(null)
        setActiveBrand(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrandDetail = async (brandId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<BrandDetail>>(`/brands/${brandId}`)
      if (res.data) {
        setActiveBrand(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch brand details:', err)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleBrandSelect = (id: string) => {
    setActiveBrandId(id)
    setShowBrandDropdown(false)
    fetchBrandDetail(id)
  }

  const handleDeleteBrand = async () => {
    if (!activeBrandId) return
    if (!confirm(`Are you sure you want to delete brand "${activeBrand?.name}"?`)) return

    try {
      await apiClient.delete(`/brands/${activeBrandId}`)
      await fetchBrands()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete brand')
    }
  }

  if (loading && brands.length === 0) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#6257E8]" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EAECF0] p-12 text-center max-w-lg mx-auto mt-8 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-[#6257E8]/10 text-[#6257E8] flex items-center justify-center mx-auto mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#101828]">No Brands Registered Yet</h3>
        <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
          Create your brand identity to configure autonomous content generation, visual guidelines, tone of voice, and knowledge bases.
        </p>
        <button
          onClick={() => setShowWizard(true)}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create First Brand</span>
        </button>

        <BrandWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onSuccess={(newId) => fetchBrands(newId)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <BrandWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={(newId) => fetchBrands(newId)}
      />

      {activeBrandId && (
        <BrandDiscoveryModal
          isOpen={showDiscovery}
          brandId={activeBrandId}
          onClose={() => setShowDiscovery(false)}
          onApplied={() => fetchBrandDetail(activeBrandId)}
        />
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Brand Header Bar */}
      <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Brand Visual Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 border border-black/10"
            style={{ backgroundColor: activeBrand?.visual_identity?.primary_color || '#101828' }}
          >
            {activeBrand?.name.charAt(0) || 'B'}
          </div>

          <div>
            <div className="relative inline-block">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 text-base font-bold text-[#101828] hover:text-[#6257E8] transition-colors"
              >
                <span>{activeBrand?.name || 'Loading...'}</span>
                <ChevronDown className="w-4 h-4 text-[#667085]" />
              </button>

              {/* Brand Switcher Dropdown */}
              {showBrandDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#EAECF0] rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                    Switch Brand
                  </div>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleBrandSelect(b.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                        b.id === activeBrandId ? 'bg-[#F2F4F7] font-semibold text-[#101828]' : 'text-[#344054] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: b.primary_color }}
                      />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-[#EAECF0]">
                    <button
                      onClick={() => {
                        setShowBrandDropdown(false)
                        setShowWizard(true)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#6257E8] hover:bg-[#6257E8]/10 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Brand</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-1 text-xs text-[#667085]">
              <span>{activeBrand?.industry || 'General Industry'}</span>
              <span>•</span>
              {activeBrand?.website_url && (
                <a
                  href={activeBrand.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#6257E8] hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </a>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                {activeBrand?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Brand Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDiscovery(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-700 hover:from-purple-100 hover:to-indigo-100 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Brand Discovery</span>
          </button>

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F2F4F7] text-[#344054] hover:bg-[#EAECF0] rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Brand</span>
          </button>

          <button
            onClick={handleDeleteBrand}
            title="Delete Brand"
            className="p-2 text-[#98A2B3] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#EAECF0] gap-6 text-xs font-semibold">
        <button
          onClick={() => setSelectedTab('profile')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            selectedTab === 'profile'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Profile & Positioning</span>
        </button>

        <button
          onClick={() => setSelectedTab('visual')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            selectedTab === 'visual'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Visual Identity</span>
        </button>

        <button
          onClick={() => setSelectedTab('voice')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            selectedTab === 'voice'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Voice & Tone</span>
        </button>

        <button
          onClick={() => setSelectedTab('knowledge')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            selectedTab === 'knowledge'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base</span>
          {activeBrand?.sources_count ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#F2F4F7] text-[#344054]">
              {activeBrand.sources_count}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSelectedTab('memory')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all ${
            selectedTab === 'memory'
              ? 'border-[#6257E8] text-[#6257E8]'
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Brand Memory</span>
          {activeBrand?.memory_entries_count ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#F2F4F7] text-[#344054]">
              {activeBrand.memory_entries_count}
            </span>
          ) : null}
        </button>
      </div>

      {/* Tab Panels */}
      {activeBrandId && activeBrand && (
        <div className="pt-2">
          {selectedTab === 'profile' && (
            <ProfileTab
              brandId={activeBrandId}
              initialProfile={activeBrand.profile}
              onUpdated={() => fetchBrandDetail(activeBrandId)}
            />
          )}

          {selectedTab === 'visual' && (
            <VisualTab
              brandId={activeBrandId}
              initialVisual={activeBrand.visual_identity}
              onUpdated={() => fetchBrandDetail(activeBrandId)}
            />
          )}

          {selectedTab === 'voice' && (
            <VoiceTab
              brandId={activeBrandId}
              initialVoice={activeBrand.voice_profile}
              onUpdated={() => fetchBrandDetail(activeBrandId)}
            />
          )}

          {selectedTab === 'knowledge' && (
            <KnowledgeTab brandId={activeBrandId} />
          )}

          {selectedTab === 'memory' && (
            <MemoryTab brandId={activeBrandId} />
          )}
        </div>
      )}
    </div>
  )
}
