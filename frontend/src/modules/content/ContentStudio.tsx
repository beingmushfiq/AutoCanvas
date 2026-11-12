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
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { appToast } from '../../lib/toast'
import { EmptyState } from '../../components/ui/empty-state'
import { useAuth } from '../auth/AuthContext'

const DEMO_BRANDS_LIST: BrandSummary[] = [
  {
    id: 'demo-brand-1',
    name: 'AutoCanvas Global',
    slug: 'autocanvas-global',
    industry: 'Enterprise SaaS & Marketing Tech',
    status: 'active',
    primary_color: '#0f172a',
    secondary_color: '#f59e0b',
    primary_logo_url: null,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
]

const DEMO_POSTS: ContentItem[] = [
  {
    id: 'demo-post-1',
    brand_id: 'demo-brand-1',
    content_pillar_id: 'pillar-1',
    campaign_id: null,
    title: '5 Ways Modern Brands Stay Ahead on Social',
    concept: 'Educational breakdown on why modern marketing leaders prefer structured weekly publishing rhythms over chaotic last-minute posting.',
    status: 'approved',
    risk_level: 'low',
    overall_quality_score: 96,
    qa_report: {
      brand_alignment_score: 98,
      platform_fit_score: 95,
      readability_score: 94,
      overall_quality_score: 96,
      risk_level: 'low',
      safety_checks: {
        contains_prohibited_terms: false,
        unsubstantiated_claims: false,
        competitor_mentions: false,
      },
      suggestions: ['Add a custom hashtag for enhanced discoverability'],
    },
    review_feedback: 'Approved for automated multi-channel dispatch.',
    reviewed_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    pillar: {
      id: 'pillar-1',
      brand_id: 'demo-brand-1',
      name: 'Thought Leadership',
      description: 'High-value executive insights and industry benchmarks',
      target_percentage: 40,
      color: 'var(--brand-accent)',
    } as any,
    variants: [
      {
        id: 'var-li-1',
        content_item_id: 'demo-post-1',
        platform: 'linkedin',
        caption: 'Why executive marketing teams are moving away from manual last-minute posting toward unified weekly publishing rhythms. Maintaining brand consistency across 40+ posts per month requires deterministic workflows, not frantic Slack pings.',
        hashtags: ['#MarketingLeadership', '#BrandOps', '#ProductGrowth'],
        cta_text: 'Read the full framework',
        cta_url: 'https://autocanvas.io/blog/publishing-rhythms',
        character_count: 242,
        media_urls: [],
        creative_document: null,
        quality_score: 98,
        platform_options: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'var-tw-1',
        content_item_id: 'demo-post-1',
        platform: 'twitter',
        caption: '5 ways high-growth brands maintain social consistency:\n\n1. Lock design tokens before copy\n2. Establish weekly rhythms\n3. Protect brand safety\n4. Automate queue retry\n5. Measure pillar ROI',
        hashtags: ['#MarketingOps', '#Growth'],
        cta_text: null,
        cta_url: null,
        character_count: 178,
        media_urls: [],
        creative_document: null,
        quality_score: 94,
        platform_options: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'demo-post-2',
    brand_id: 'demo-brand-1',
    content_pillar_id: 'pillar-2',
    campaign_id: null,
    title: 'Deterministic Creative Rendering: The Death of Hallucinated Typography',
    concept: 'Explaining why raster AI models blur fonts and how AutoCanvas uses Chromium SVG engines for crisp, vector-grade typography.',
    status: 'draft',
    risk_level: 'low',
    overall_quality_score: 92,
    qa_report: {
      brand_alignment_score: 94,
      platform_fit_score: 90,
      readability_score: 92,
      overall_quality_score: 92,
      risk_level: 'low',
      safety_checks: {
        contains_prohibited_terms: false,
        unsubstantiated_claims: false,
        competitor_mentions: false,
      },
      suggestions: ['Consider adding a call-to-action button'],
    },
    review_feedback: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    pillar: {
      id: 'pillar-2',
      brand_id: 'demo-brand-1',
      name: 'Product Engineering',
      description: 'Deep dives into deterministic design and technology',
      target_percentage: 30,
      color: 'var(--brand-primary)',
    } as any,
    variants: [
      {
        id: 'var-li-2',
        content_item_id: 'demo-post-2',
        platform: 'linkedin',
        caption: 'Raster AI generation is great for moodboards, but unacceptable for brand guidelines. When enterprise brands publish, letterforms must render at exact kerning and corporate hex values. Here is how deterministic layout engines solve this.',
        hashtags: ['#DesignOps', '#BrandTech', '#Engineering'],
        cta_text: 'Explore the architecture',
        cta_url: 'https://autocanvas.io/docs/deterministic-rendering',
        character_count: 265,
        media_urls: [],
        creative_document: null,
        quality_score: 95,
        platform_options: null,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
  },
]

interface ContentStudioProps {
  initialView?: 'posts' | 'creative'
}

export const ContentStudio: React.FC<ContentStudioProps> = ({ initialView = 'posts' }) => {
  const { isAuthenticated } = useAuth()
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
    if (!isAuthenticated) {
      setBrands(DEMO_BRANDS_LIST)
      setActiveBrandId('demo-brand-1')
      setPosts(DEMO_POSTS)
      setLoading(false)
      return
    }

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
        setPosts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async (brandId: string) => {
    if (!isAuthenticated) {
      setPosts(DEMO_POSTS)
      return
    }
    try {
      const res = await apiClient.get<ApiResponse<ContentItem[]>>(`/brands/${brandId}/content`)
      setPosts(res.data || [])
    } catch (err) {
      console.error('Failed to load posts:', err)
      setPosts([])
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [isAuthenticated])

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
      appToast.success('Post removed from queue.')
    } catch (err) {
      appToast.error('Failed to delete post', {
        description: err instanceof Error ? err.message : 'Unknown server error',
      })
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
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <EmptyState
          icon={Layers}
          title="No Brands Registered"
          description="Please register a brand in the Brand Studio before creating content."
        />
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
        <div className="p-3 bg-status-danger-bg border border-status-danger text-status-danger rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-interactive-primary-fg font-bold text-base shadow-sm shrink-0 border border-border/30"
            style={{ backgroundColor: activeBrand?.primary_color || 'var(--brand-primary)' }}
          >
            {activeBrand?.name.charAt(0) || 'B'}
          </div>

          <div>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowBrandMenu(!showBrandMenu)}
                className="flex items-center gap-2 text-base font-bold text-foreground hover:text-brand-accent transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring rounded-lg px-1 -ml-1"
              >
                <span>{activeBrand?.name}</span>
                <ChevronDown className="w-4 h-4 text-foreground-muted" />
              </button>

              {showBrandMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-surface-overlay border border-border rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Switch Brand
                  </div>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBrandChange(b.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-left hover:bg-background-subtle text-foreground-secondary hover:text-foreground transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full border border-border/30" style={{ backgroundColor: b.primary_color }} />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-foreground-secondary">
                Omnichannel Content Generation & Production Pipeline
              </p>
              {!isAuthenticated && (
                <Badge variant="outline" className="border-brand-accent/40 bg-brand-accent/10 text-brand-accent text-[10px] font-mono font-bold">
                  DEMO PREVIEW
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPillars(true)}
            className="gap-1.5"
          >
            <PieChart className="w-3.5 h-3.5 text-brand-accent" />
            <span>Content Pillars</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreative(true)}
            className="gap-1.5"
          >
            <Palette className="w-3.5 h-3.5 text-brand-accent" />
            <span>Creative Studio</span>
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={() => setShowGenerator(true)}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multi-Channel Generator</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Platform Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
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
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                statusFilter === tab.id
                  ? 'bg-interactive-primary text-interactive-primary-fg shadow-2xs'
                  : 'bg-surface border border-border text-foreground-secondary hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-foreground-muted mr-1" />
          {['all', 'linkedin', 'facebook', 'instagram'].map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setPlatformFilter(plat)}
              className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded-full transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                platformFilter === plat
                  ? 'bg-brand-accent text-interactive-primary-fg font-bold'
                  : 'bg-background-subtle text-foreground-secondary hover:text-foreground'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center shadow-2xs">
          <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">No posts found</h3>
          <p className="text-xs text-foreground-secondary mt-1 max-w-sm mx-auto">
            No content matches the selected filters. Use the AI Multi-Channel Generator to create your next social post.
          </p>
          <Button
            type="button"
            variant="default"
            onClick={() => setShowGenerator(true)}
            className="mt-4 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Post</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.map((post) => {
            const firstVariant = post.variants?.[0]
            const creativeUrl = firstVariant?.media_urls?.[0]

            return (
              <div
                key={post.id}
                className="bg-surface rounded-2xl border border-border p-5 shadow-2xs hover:border-brand-accent/40 transition-all flex flex-col justify-between space-y-4"
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
                      <Badge
                        variant={
                          post.status === 'approved'
                            ? 'success'
                            : post.status === 'review'
                            ? 'warning'
                            : post.status === 'rejected'
                            ? 'danger'
                            : 'secondary'
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-status-success-bg text-status-success rounded-md text-[11px] font-bold font-mono">
                        <CheckCircle2 className="w-3 h-3 text-status-success" />
                        <span>{post.overall_quality_score}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Concept */}
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{post.title}</h4>
                    <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">{post.concept}</p>
                  </div>

                  {/* Variant & Creative Snippet */}
                  <div className="flex gap-3 pt-1">
                    {creativeUrl && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0 bg-background-subtle">
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
                          <Badge
                            key={v.platform}
                            variant="accent"
                            className="uppercase"
                          >
                            {v.platform}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-foreground-secondary line-clamp-2 italic">
                        "{firstVariant?.caption}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-foreground-muted font-mono">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPost(post)}
                      className="text-brand-accent hover:text-brand-accent hover:bg-brand-accent/10"
                    >
                      Inspect & Review
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id, post.title)}
                      title="Delete post"
                      aria-label="Delete post"
                      className="p-1.5 text-foreground-muted hover:text-status-danger hover:bg-status-danger-bg rounded-lg transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
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
