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
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'

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
        const nextId =
          selectId ||
          (activeBrandId && brandList.some((b) => b.id === activeBrandId)
            ? activeBrandId
            : brandList[0].id)
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
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <EmptyState
          icon={Layers}
          title="No Brands Registered Yet"
          description="Create your brand identity to configure autonomous content generation, visual guidelines, tone of voice, and verified knowledge bases."
          action={{
            label: 'Create First Brand',
            onClick: () => setShowWizard(true),
          }}
        />

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
        <div className="p-3 bg-status-danger-bg border border-status-danger text-status-danger rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Brand Header Bar */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Brand Visual Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-interactive-primary-fg font-bold text-lg shadow-sm shrink-0 border border-border/30"
            style={{ backgroundColor: activeBrand?.visual_identity?.primary_color || 'var(--brand-primary)' }}
          >
            {activeBrand?.name.charAt(0) || 'B'}
          </div>

          <div>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 text-base font-bold text-foreground hover:text-brand-accent transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring rounded-lg px-1 -ml-1"
              >
                <span>{activeBrand?.name || 'Loading...'}</span>
                <ChevronDown className="w-4 h-4 text-foreground-muted" />
              </button>

              {/* Brand Switcher Dropdown */}
              {showBrandDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-surface-overlay border border-border rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Switch Brand
                  </div>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBrandSelect(b.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                        b.id === activeBrandId
                          ? 'bg-background-subtle font-semibold text-foreground'
                          : 'text-foreground-secondary hover:bg-background-subtle hover:text-foreground'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-border/40"
                        style={{ backgroundColor: b.primary_color }}
                      />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                  <div className="pt-1.5 mt-1 border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBrandDropdown(false)
                        setShowWizard(true)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Brand</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-1 text-xs text-foreground-secondary">
              <span>{activeBrand?.industry || 'General Industry'}</span>
              <span>•</span>
              {activeBrand?.website_url && (
                <a
                  href={activeBrand.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-brand-accent hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </a>
              )}
              <Badge variant={activeBrand?.status === 'active' ? 'success' : 'secondary'}>
                {activeBrand?.status || 'Active'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Brand Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDiscovery(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-background-subtle border border-border hover:border-brand-accent text-foreground hover:text-brand-accent rounded-xl text-xs font-semibold transition-all shadow-2xs outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span>AI Brand Discovery</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface border border-border text-foreground hover:bg-surface-raised rounded-xl text-xs font-semibold transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Brand</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteBrand}
            title="Delete Brand"
            aria-label="Delete Brand"
            className="p-2 text-foreground-muted hover:text-status-danger hover:bg-status-danger-bg rounded-xl transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSelectedTab('profile')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            selectedTab === 'profile'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Profile & Positioning</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('visual')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            selectedTab === 'visual'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Visual Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('voice')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            selectedTab === 'voice'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Voice & Tone</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('knowledge')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            selectedTab === 'knowledge'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base</span>
          {activeBrand?.sources_count ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-background-subtle border border-border text-foreground-secondary">
              {activeBrand.sources_count}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('memory')}
          className={`flex items-center gap-2 py-3 border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            selectedTab === 'memory'
              ? 'border-brand-accent text-foreground'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Brand Memory</span>
          {activeBrand?.memory_entries_count ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-background-subtle border border-border text-foreground-secondary">
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
