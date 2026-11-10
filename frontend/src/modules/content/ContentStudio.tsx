import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Filter,
  PieChart,
  Palette,
  CheckCircle2,
  FileText,
  ChevronDown,
  Layers,
  Loader2,
  Trash2,
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type BrandSummary,
  type ContentItem,
} from '../../lib/api/client'
import { ContentGeneratorModal } from './ContentGeneratorModal'
import { PillarsManagerModal } from './PillarsManagerModal'
import { PostDetailModal } from './PostDetailModal'
import { CreativeEditorModal } from '../creative/CreativeEditorModal'

interface ContentStudioProps {
  initialView?: 'posts' | 'creative'
}

export const ContentStudio: React.FC<ContentStudioProps> = ({ initialView = 'posts' }) => {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [posts, setPosts] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review' | 'approved' | 'rejected'>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  // Modals
  const [showGenerator, setShowGenerator] = useState(false)
  const [showPillars, setShowPillars] = useState(false)
  const [showCreative, setShowCreative] = useState(initialView === 'creative')
  const [creativeVariantId, setCreativeVariantId] = useState<string | null>(null)
  const [creativeHeadline, setCreativeHeadline] = useState('')
  const [selectedPost, setSelectedPost] = useState<ContentItem | null>(null)
  const [showBrandMenu, setShowBrandMenu] = useState(false)

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<ApiResponse<BrandSummary[]>>('/brands')
      const brandList = res.data || []
      setBrands(brandList)

      if (brandList.length > 0) {
        const id = brandList[0].id
        setActiveBrandId(id)
        await fetchPosts(id)
      } else {
        setActiveBrandId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async (brandId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<ContentItem[]>>(`/brands/${brandId}/content`)
      setPosts(res.data || [])
    } catch (err) {
      console.error('Failed to load posts:', err)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleBrandChange = (id: string) => {
    setActiveBrandId(id)
    setShowBrandMenu(false)
    fetchPosts(id)
  }

  const handleDeletePost = async (id: string, title: string) => {
    if (!activeBrandId) return
    if (!confirm(`Delete post "${title}"?`)) return

    try {
      await apiClient.delete(`/brands/${activeBrandId}/content/${id}`)
      setPosts(posts.filter((p) => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const activeBrand = brands.find((b) => b.id === activeBrandId)

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (platformFilter !== 'all') {
      const hasPlatform = p.variants?.some((v) => v.platform === platformFilter)
      if (!hasPlatform) return false
    }
    return true
  })

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
        <h3 className="text-base font-bold text-[#101828]">No Brands Registered</h3>
        <p className="text-xs text-[#667085] mt-1.5">
          Please register a brand in the Brand Studio before creating content.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      {activeBrandId && (
        <>
          <ContentGeneratorModal
            isOpen={showGenerator}
            brandId={activeBrandId}
            onClose={() => setShowGenerator(false)}
            onSuccess={() => fetchPosts(activeBrandId)}
          />

          <PillarsManagerModal
            isOpen={showPillars}
            brandId={activeBrandId}
            onClose={() => setShowPillars(false)}
            onUpdated={() => fetchPosts(activeBrandId)}
          />

          <CreativeEditorModal
            isOpen={showCreative}
            brandId={activeBrandId}
            variantId={creativeVariantId}
            initialHeadline={creativeHeadline}
            onClose={() => {
              setShowCreative(false)
              setCreativeVariantId(null)
            }}
            onSuccess={() => fetchPosts(activeBrandId)}
          />

          <PostDetailModal
            isOpen={Boolean(selectedPost)}
            brandId={activeBrandId}
            item={selectedPost}
            onClose={() => setSelectedPost(null)}
            onUpdated={() => fetchPosts(activeBrandId)}
            onOpenCreativeEditor={(variantId, headline) => {
              setCreativeVariantId(variantId)
              setCreativeHeadline(headline)
              setShowCreative(true)
            }}
          />
        </>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
            style={{ backgroundColor: activeBrand?.primary_color || '#101828' }}
          >
            {activeBrand?.name.charAt(0) || 'B'}
          </div>

          <div>
            <div className="relative inline-block">
              <button
                onClick={() => setShowBrandMenu(!showBrandMenu)}
                className="flex items-center gap-2 text-base font-bold text-[#101828] hover:text-[#6257E8] transition-colors"
              >
                <span>{activeBrand?.name}</span>
                <ChevronDown className="w-4 h-4 text-[#667085]" />
              </button>

              {showBrandMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#EAECF0] rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                    Switch Brand
                  </div>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleBrandChange(b.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-left hover:bg-[#F2F4F7] transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.primary_color }} />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Omnichannel Content Generation & Production Pipeline
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPillars(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D0D5DD] hover:bg-[#F2F4F7] text-[#344054] rounded-xl text-xs font-semibold transition-colors"
          >
            <PieChart className="w-3.5 h-3.5 text-[#6257E8]" />
            <span>Content Pillars</span>
          </button>

          <button
            onClick={() => setShowCreative(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D0D5DD] hover:bg-[#F2F4F7] text-[#344054] rounded-xl text-xs font-semibold transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-[#6257E8]" />
            <span>Creative Studio</span>
          </button>

          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#6257E8] text-white hover:bg-[#5246D6] rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multi-Channel Generator</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Platform Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAECF0] pb-3">
        {/* Status Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Content' },
            { id: 'draft', label: 'Drafts' },
            { id: 'review', label: 'In Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Revisions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#101828] text-white'
                  : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-[#F2F4F7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#667085] mr-1" />
          {['all', 'linkedin', 'facebook', 'instagram'].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded-full transition-colors ${
                platformFilter === plat
                  ? 'bg-[#6257E8] text-white'
                  : 'bg-[#F2F4F7] text-[#667085] hover:bg-[#EAECF0]'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAECF0] p-12 text-center shadow-xs">
          <FileText className="w-10 h-10 text-[#98A2B3] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#101828]">No posts found</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            No content matches the selected filters. Use the AI Multi-Channel Generator to create your next social post.
          </p>
          <button
            onClick={() => setShowGenerator(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Post</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {filteredPosts.map((post) => {
            const firstVariant = post.variants?.[0]
            const creativeUrl = firstVariant?.media_urls?.[0]

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-[#EAECF0] p-5 shadow-xs hover:border-[#D0D5DD] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Pillar & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {post.pillar && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: post.pillar.color_tag }}
                        >
                          {post.pillar.name}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          post.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : post.status === 'review'
                            ? 'bg-amber-100 text-amber-800'
                            : post.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{post.overall_quality_score}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Concept */}
                  <div>
                    <h4 className="text-sm font-bold text-[#101828] leading-snug">{post.title}</h4>
                    <p className="text-xs text-[#667085] mt-1 line-clamp-2">{post.concept}</p>
                  </div>

                  {/* Variant & Creative Snippet */}
                  <div className="flex gap-3 pt-1">
                    {creativeUrl && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#EAECF0] shrink-0 bg-black/5">
                        <img
                          src={creativeUrl}
                          alt="Creative thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex gap-1 mb-1.5">
                        {post.variants?.map((v) => (
                          <span
                            key={v.platform}
                            className="text-[10px] uppercase font-bold text-[#6257E8] bg-[#6257E8]/10 px-1.5 py-0.2 rounded"
                          >
                            {v.platform}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[#475467] line-clamp-2 italic">
                        "{firstVariant?.caption}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-between">
                  <span className="text-[11px] text-[#98A2B3]">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#6257E8] hover:bg-[#6257E8]/10 rounded-lg transition-colors"
                    >
                      Inspect & Review
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.title)}
                      className="p-1.5 text-[#98A2B3] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
