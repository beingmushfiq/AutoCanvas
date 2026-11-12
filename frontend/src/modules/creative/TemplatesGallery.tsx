import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutTemplate,
  Palette,
  Search,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'
import { apiClient, type BrandSummary, type ApiResponse } from '../../lib/api/client'
import { appToast } from '../../lib/toast'

interface TemplatesGalleryProps {
  onSelectTemplate?: (templateId: string) => void
  onGenerateContent?: (templateId: string) => void
}

export interface CreativeTemplateItem {
  id: string
  name: string
  category: string
  description: string
  aspect_ratios: string[]
  preview_kicker: string
  preview_headline: string
  preview_cta: string
}

const DEFAULT_TEMPLATES: CreativeTemplateItem[] = [
  {
    id: 'minimal_corporate_v1',
    name: 'Minimal Corporate',
    category: 'B2B & Enterprise',
    description: 'Clean structured background with bold brand-accented headline, kicker subtitle, and footer CTA.',
    aspect_ratios: ['1:1', '4:5', '16:9'],
    preview_kicker: 'AUTONOMOUS BRAND OPS',
    preview_headline: 'Zero Hex Drift. Real Deterministic Design Systems.',
    preview_cta: 'Explore Framework →',
  },
  {
    id: 'bold_editorial_v1',
    name: 'Bold Editorial',
    category: 'Thought Leadership',
    description: 'Oversized display typography with dual-accent highlight and editorial quotation structure.',
    aspect_ratios: ['1:1', '4:5'],
    preview_kicker: 'INDUSTRY PERSPECTIVE',
    preview_headline: 'AI text without vector rendering destroys enterprise credibility.',
    preview_cta: 'Read the Whitepaper',
  },
  {
    id: 'tech_stats_v1',
    name: 'Metric & Stat Highlight',
    category: 'Data & Performance',
    description: 'Prominent oversized metric callout with supporting context and quantifiable performance proof.',
    aspect_ratios: ['1:1', '16:9'],
    preview_kicker: 'PERFORMANCE BENCHMARK',
    preview_headline: '99.8% Dispatch Precision Across 14 Social Feeds',
    preview_cta: 'View Telemetry',
  },
  {
    id: 'announcement_v1',
    name: 'Product Announcement',
    category: 'Product News',
    description: 'Badge tag header with central feature spotlight card and dual-button interactive footer.',
    aspect_ratios: ['1:1', '4:5', '16:9'],
    preview_kicker: 'NOW LIVE IN AUTOCANVAS',
    preview_headline: 'Direct Page Access Token Binding & Verification Engine',
    preview_cta: 'Connect Channels',
  },
  {
    id: 'carousel_grid_v1',
    name: 'Step-by-Step Carousel',
    category: 'Carousels',
    description: 'Sequenced numbered slide layout optimized for high swipe-through retention on LinkedIn and Instagram.',
    aspect_ratios: ['4:5', '1:1'],
    preview_kicker: 'SWIPE TO LEARN',
    preview_headline: '5 Steps to Build an Idempotent Multi-Channel Publishing Pipeline',
    preview_cta: 'Save for Later',
  },
  {
    id: 'comparison_matrix_v1',
    name: 'Side-by-Side Comparison',
    category: 'B2B & Enterprise',
    description: 'Two-column architectural matrix contrasting legacy manual publishing with autonomous brand operations.',
    aspect_ratios: ['1:1', '16:9'],
    preview_kicker: 'MODERN BRAND STACK',
    preview_headline: 'Manual Agency Friction vs. Autonomous Brand Ops',
    preview_cta: 'Compare Capabilities',
  },
]

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  onSelectTemplate,
  onGenerateContent,
}) => {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [templates, setTemplates] = useState<CreativeTemplateItem[]>(DEFAULT_TEMPLATES)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [ratioFilter, setRatioFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRatioPerTemplate, setSelectedRatioPerTemplate] = useState<Record<string, string>>({})

  // Load brands on mount
  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await apiClient.getBrands()
        if (res.data && res.data.length > 0) {
          setBrands(res.data)
          setSelectedBrandId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load brands for templates:', err)
      }
    }
    loadBrands()
  }, [])

  // Load server-side Chromium creative templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await apiClient.get<ApiResponse<any[]>>('/creative/templates')
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiTemplates: CreativeTemplateItem[] = res.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category || 'General',
            description: t.description || 'Deterministic SVG template.',
            aspect_ratios: t.aspect_ratios || ['1:1', '4:5', '16:9'],
            preview_kicker: t.preview_kicker || 'AUTOCANVAS DESIGN',
            preview_headline: t.preview_headline || t.name,
            preview_cta: t.preview_cta || 'Learn More',
          }))
          setTemplates(apiTemplates)
        }
      } catch (err) {
        console.error('Failed to load server templates:', err)
      }
    }
    loadTemplates()
  }, [])

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    templates.forEach((t) => set.add(t.category))
    return ['all', ...Array.from(set)]
  }, [templates])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (categoryFilter !== 'all' && tpl.category !== categoryFilter) return false
      if (ratioFilter !== 'all' && !tpl.aspect_ratios.includes(ratioFilter)) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          tpl.name.toLowerCase().includes(q) ||
          tpl.description.toLowerCase().includes(q) ||
          tpl.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [templates, categoryFilter, ratioFilter, searchQuery])

  const handleRatioToggle = (templateId: string, ratio: string) => {
    setSelectedRatioPerTemplate((prev) => ({
      ...prev,
      [templateId]: ratio,
    }))
  }

  const handleUseTemplate = (template: CreativeTemplateItem) => {
    if (onSelectTemplate) {
      onSelectTemplate(template.id)
    } else {
      appToast.success(`Loaded "${template.name}" in Creative Studio`)
    }
  }

  const handleCreateContent = (template: CreativeTemplateItem) => {
    if (onGenerateContent) {
      onGenerateContent(template.id)
    } else {
      appToast.success(`Drafting post with "${template.name}" template`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Creative Templates Gallery</h2>
            <Badge variant="outline" className="border-border text-foreground-secondary text-xs">
              <Palette className="w-3.5 h-3.5 mr-1 text-brand-accent" />
              100% Deterministic SVG/HTML
            </Badge>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Production-ready multi-format layouts. Styled automatically with your active brand colors, fonts, and assets.
          </p>
        </div>

        {brands.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-foreground-secondary">Brand Styling:</span>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-xs focus:outline-hidden focus:border-brand-accent cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-surface text-foreground shadow-2xs font-semibold'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Filter */}
          <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs">
            {['all', '1:1', '4:5', '16:9'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatioFilter(r)}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  ratioFilter === r
                    ? 'bg-surface text-foreground shadow-2xs font-semibold'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                {r === 'all' ? 'All Ratios' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs placeholder:text-foreground-secondary/60 focus:outline-hidden focus:border-brand-accent"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No Templates Found"
          description="Try broadening your category or aspect ratio filter to see more layouts."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const activeRatio = selectedRatioPerTemplate[template.id] || template.aspect_ratios[0]

            return (
              <Card
                key={template.id}
                className="rounded-2xl bg-surface border border-border overflow-hidden flex flex-col justify-between hover:border-brand-accent/50 transition-all shadow-2xs group"
              >
                {/* Visual Live Preview Box */}
                <div className="p-4 bg-surface-muted/40 border-b border-border flex flex-col items-center justify-center">
                  <div
                    className={`w-full rounded-xl border border-border bg-background p-4 flex flex-col justify-between shadow-xs transition-all ${
                      activeRatio === '16:9'
                        ? 'aspect-video'
                        : activeRatio === '4:5'
                        ? 'aspect-[4/5] max-h-72'
                        : 'aspect-square max-h-64'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-brand-accent uppercase">
                        {template.preview_kicker}
                      </span>
                      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-3">
                        {template.preview_headline}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
                      <span className="font-semibold text-foreground-secondary">
                        {brands.find((b) => b.id === selectedBrandId)?.name || 'AutoCanvas'}
                      </span>
                      <span className="text-brand-accent font-medium">{template.preview_cta}</span>
                    </div>
                  </div>

                  {/* Aspect Ratio Switcher Pills */}
                  <div className="flex items-center gap-1.5 pt-3">
                    <span className="text-[10px] text-foreground-secondary mr-1">Aspect Ratio:</span>
                    {template.aspect_ratios.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRatioToggle(template.id, r)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-all cursor-pointer ${
                          activeRatio === r
                            ? 'bg-brand-accent text-brand-accent-fg font-bold'
                            : 'bg-surface text-foreground-secondary hover:text-foreground border border-border'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Info & Actions */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground">{template.name}</h3>
                      <Badge variant="outline" className="text-[10px] py-0 border-border text-foreground-secondary">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-secondary leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateContent(template)}
                      className="text-xs border-border text-foreground hover:bg-surface-muted flex items-center gap-1.5 cursor-pointer flex-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Generate Post</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="text-xs bg-interactive-primary text-interactive-primary-fg hover:opacity-90 flex items-center gap-1.5 cursor-pointer flex-1"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Edit in Studio</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
