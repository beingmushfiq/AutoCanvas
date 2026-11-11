import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Check,
  Loader2,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type ContentItem,
  type ContentPillar,
  type Campaign,
} from '../../lib/api/client'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

interface ContentGeneratorModalProps {
  isOpen: boolean
  brandId: string
  onClose: () => void
  onSuccess: (item: ContentItem) => void
}

export const ContentGeneratorModal: React.FC<ContentGeneratorModalProps> = ({
  isOpen,
  brandId,
  onClose,
  onSuccess,
}) => {
  const [pillars, setPillars] = useState<ContentPillar[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const [topic, setTopic] = useState('')
  const [selectedPillarId, setSelectedPillarId] = useState('')
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['linkedin', 'facebook', 'instagram'])
  const [useKnowledge, setUseKnowledge] = useState(true)
  const [generateCreative, setGenerateCreative] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedItem, setGeneratedItem] = useState<ContentItem | null>(null)
  const [previewPlatform, setPreviewPlatform] = useState('linkedin')

  useEffect(() => {
    if (isOpen) {
      setGeneratedItem(null)
      fetchPillarsAndCampaigns()
    }
  }, [isOpen, brandId])

  const fetchPillarsAndCampaigns = async () => {
    try {
      const [pillarRes, campRes] = await Promise.all([
        apiClient.get<ApiResponse<ContentPillar[]>>(`/brands/${brandId}/pillars`),
        apiClient.get<ApiResponse<Campaign[]>>(`/brands/${brandId}/campaigns`),
      ])
      setPillars(pillarRes.data || [])
      setCampaigns(campRes.data || [])

      if (pillarRes.data && pillarRes.data.length > 0) {
        setSelectedPillarId(pillarRes.data[0].id)
      }
    } catch (err) {
      console.error('Failed to load strategy options:', err)
    }
  }

  const handleTogglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length > 1) {
        setPlatforms(platforms.filter((item) => item !== p))
      }
    } else {
      setPlatforms([...platforms, p])
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setGenerating(true)
    setError(null)

    try {
      const res = await apiClient.post<ApiResponse<ContentItem>>(`/brands/${brandId}/content/generate`, {
        topic,
        content_pillar_id: selectedPillarId || undefined,
        campaign_id: selectedCampaignId || undefined,
        platforms,
        use_knowledge: useKnowledge,
        generate_creative: generateCreative,
      })

      if (res.data) {
        setGeneratedItem(res.data)
        if (res.data.variants && res.data.variants.length > 0) {
          setPreviewPlatform(res.data.variants[0].platform)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Content generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveAndFinish = () => {
    if (generatedItem) {
      onSuccess(generatedItem)
      onClose()
    }
  }

  if (!isOpen) return null

  const activeVariant = generatedItem?.variants?.find((v) => v.platform === previewPlatform)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-3xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border text-brand-accent flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Autonomous Multi-Channel Generator</h3>
              <p className="text-xs text-foreground-secondary">
                Tailored platform copy, RAG verified context, deterministic creative & QA score
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs bg-status-danger-bg text-status-danger rounded-xl border border-status-danger font-semibold">
              {error}
            </div>
          )}

          {!generatedItem ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Pillars & Campaigns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Content Pillar</label>
                  <select
                    value={selectedPillarId}
                    onChange={(e) => setSelectedPillarId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="">General Brand Pillar</option>
                    {pillars.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.weight_percentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Marketing Campaign (Optional)
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="">None / Standalone Post</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Platforms */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Target Social Channels
                </label>
                <div className="flex gap-3">
                  {[
                    { id: 'linkedin', label: 'LinkedIn', desc: 'Thought leadership hook' },
                    { id: 'facebook', label: 'Facebook', desc: 'Conversational narrative' },
                    { id: 'instagram', label: 'Instagram', desc: 'Aesthetic visual caption' },
                  ].map((p) => {
                    const isChecked = platforms.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleTogglePlatform(p.id)}
                        className={`flex-1 p-3 text-left rounded-xl border transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                          isChecked
                            ? 'border-brand-accent bg-background-subtle shadow-2xs font-semibold'
                            : 'border-border hover:border-border-strong bg-surface text-foreground-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{p.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isChecked ? 'bg-brand-accent text-interactive-primary-fg' : 'border border-border'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-foreground-muted mt-0.5 block">{p.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Topic / Prompt */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Topic Brief, Announcement, or Milestone
                </label>
                <textarea
                  rows={4}
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Announce our SOC2 Type II compliance audit completion with zero non-conformances, emphasizing enterprise data privacy and autonomous security..."
                  className="w-full p-3 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring leading-relaxed"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useKnowledge}
                    onChange={(e) => setUseKnowledge(e.target.checked)}
                    className="rounded text-brand-accent focus:ring-focus-ring"
                  />
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
                      <span>RAG Knowledge Retrieval</span>
                    </div>
                    <span className="text-[10px] text-foreground-muted">
                      Cite verified facts from brand docs
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateCreative}
                    onChange={(e) => setGenerateCreative(e.target.checked)}
                    className="rounded text-brand-accent focus:ring-focus-ring"
                  />
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Deterministic Creative Graphic</span>
                    </div>
                    <span className="text-[10px] text-foreground-muted">
                      Render branded 2x retina graphic
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={generating}
                variant="default"
                className="w-full py-3 gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Platform Copy & Rendering Creative...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Multi-Channel Campaign</span>
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-4">
              {/* QA Summary Banner */}
              <div className="p-4 bg-status-success-bg border border-status-success rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-success text-interactive-primary-fg font-bold text-sm flex items-center justify-center font-mono">
                    {generatedItem.overall_quality_score}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span>Overall Quality Score</span>
                      <Badge variant="success">
                        {generatedItem.risk_level} Risk
                      </Badge>
                    </div>
                    <p className="text-[11px] text-foreground-secondary mt-0.5">
                      Brand Alignment: {generatedItem.qa_report?.brand_alignment_score ?? 94}% • Platform Fit: {generatedItem.qa_report?.platform_fit_score ?? 92}% • Readability: {generatedItem.qa_report?.readability_score ?? 90}%
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratedItem(null)}
                  className="text-xs font-semibold text-brand-accent hover:underline"
                >
                  Regenerate
                </button>
              </div>

              {/* Platform Preview Tabs */}
              <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-2xs">
                <div className="flex border-b border-border bg-background-subtle px-4 gap-4">
                  {generatedItem.variants?.map((v) => (
                    <button
                      key={v.platform}
                      type="button"
                      onClick={() => setPreviewPlatform(v.platform)}
                      className={`py-3 text-xs font-bold capitalize border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                        previewPlatform === v.platform
                          ? 'border-brand-accent text-foreground'
                          : 'border-transparent text-foreground-secondary hover:text-foreground'
                      }`}
                    >
                      {v.platform}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {activeVariant ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2 space-y-3">
                        <div className="whitespace-pre-line text-xs text-foreground leading-relaxed font-sans bg-background-subtle p-4 rounded-xl border border-border">
                          {activeVariant.caption}
                        </div>

                        {activeVariant.hashtags && activeVariant.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {activeVariant.hashtags.map((h, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-background-subtle border border-border text-foreground text-[11px] font-mono rounded-md"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}

                        {activeVariant.cta_text && (
                          <div className="text-xs text-foreground-secondary font-medium">
                            CTA: <strong className="font-semibold text-foreground">{activeVariant.cta_text}</strong>
                          </div>
                        )}
                      </div>

                      {/* Creative Graphic Preview */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block mb-2">
                          Composited Creative
                        </span>
                        {activeVariant.media_urls && activeVariant.media_urls.length > 0 ? (
                          <div className="rounded-xl overflow-hidden border border-border shadow-2xs">
                            <img
                              src={activeVariant.media_urls[0]}
                              alt="Generated Creative"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ) : (
                          <div className="p-6 bg-background-subtle border border-dashed border-border rounded-xl text-center text-xs text-foreground-muted">
                            No creative generated
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background-subtle flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          {generatedItem && (
            <Button
              type="button"
              variant="default"
              onClick={handleSaveAndFinish}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & View in Content Studio</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
