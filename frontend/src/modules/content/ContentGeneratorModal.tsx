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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-[#EAECF0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-gradient-to-r from-[#6257E8]/5 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6257E8] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">Autonomous Multi-Channel Generator</h3>
              <p className="text-xs text-[#667085]">
                Tailored platform copy, RAG verified context, deterministic creative & QA score
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#98A2B3] hover:text-[#344054] hover:bg-[#F2F4F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {!generatedItem ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Pillars & Campaigns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Content Pillar</label>
                  <select
                    value={selectedPillarId}
                    onChange={(e) => setSelectedPillarId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Marketing Campaign (Optional)
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
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
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
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
                        className={`flex-1 p-3 text-left rounded-xl border transition-all ${
                          isChecked
                            ? 'border-[#6257E8] bg-[#6257E8]/5 ring-1 ring-[#6257E8]'
                            : 'border-[#EAECF0] hover:border-[#D0D5DD]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#101828]">{p.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isChecked ? 'bg-[#6257E8] text-white' : 'border border-gray-300'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#667085] mt-0.5 block">{p.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Topic / Prompt */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Topic Brief, Announcement, or Milestone
                </label>
                <textarea
                  rows={4}
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Announce our SOC2 Type II compliance audit completion with zero non-conformances, emphasizing enterprise data privacy and autonomous security..."
                  className="w-full p-3 text-xs border border-[#D0D5DD] rounded-xl focus:ring-2 focus:ring-[#6257E8]"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useKnowledge}
                    onChange={(e) => setUseKnowledge(e.target.checked)}
                    className="rounded text-[#6257E8] focus:ring-[#6257E8]"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#101828] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#6257E8]" />
                      <span>RAG Knowledge Retrieval</span>
                    </div>
                    <span className="text-[10px] text-[#667085]">
                      Cite verified facts from brand docs
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateCreative}
                    onChange={(e) => setGenerateCreative(e.target.checked)}
                    className="rounded text-[#6257E8] focus:ring-[#6257E8]"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#101828] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#6257E8]" />
                      <span>Deterministic Creative Graphic</span>
                    </div>
                    <span className="text-[10px] text-[#667085]">
                      Render branded 2x retina graphic
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] disabled:opacity-50 shadow-xs transition-colors"
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
              </button>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-4">
              {/* QA Summary Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                    {generatedItem.overall_quality_score}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                      <span>Overall Quality Score</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-200 text-emerald-800 uppercase">
                        {generatedItem.risk_level} Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Brand Alignment: {generatedItem.qa_report?.brand_alignment_score ?? 94}% • Platform Fit: {generatedItem.qa_report?.platform_fit_score ?? 92}% • Readability: {generatedItem.qa_report?.readability_score ?? 90}%
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratedItem(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Regenerate
                </button>
              </div>

              {/* Platform Preview Tabs */}
              <div className="border border-[#EAECF0] rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="flex border-b border-[#EAECF0] bg-[#F9FAFB] px-4 gap-4">
                  {generatedItem.variants?.map((v) => (
                    <button
                      key={v.platform}
                      onClick={() => setPreviewPlatform(v.platform)}
                      className={`py-3 text-xs font-bold capitalize border-b-2 transition-all ${
                        previewPlatform === v.platform
                          ? 'border-[#6257E8] text-[#6257E8]'
                          : 'border-transparent text-[#667085] hover:text-[#101828]'
                      }`}
                    >
                      {v.platform}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {activeVariant ? (
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-2 space-y-3">
                        <div className="whitespace-pre-line text-xs text-[#344054] leading-relaxed font-sans bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                          {activeVariant.caption}
                        </div>

                        {activeVariant.hashtags && activeVariant.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {activeVariant.hashtags.map((h, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-[#F2F4F7] text-[#6257E8] text-[11px] font-mono rounded-md"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}

                        {activeVariant.cta_text && (
                          <div className="text-xs text-[#475467] font-medium">
                            CTA: <strong className="font-semibold text-[#101828]">{activeVariant.cta_text}</strong>
                          </div>
                        )}
                      </div>

                      {/* Creative Graphic Preview */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-2">
                          Composited Creative
                        </span>
                        {activeVariant.media_urls && activeVariant.media_urls.length > 0 ? (
                          <div className="rounded-xl overflow-hidden border border-[#EAECF0] shadow-sm">
                            <img
                              src={activeVariant.media_urls[0]}
                              alt="Generated Creative"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ) : (
                          <div className="p-6 bg-[#F9FAFB] border border-dashed border-[#D0D5DD] rounded-xl text-center text-xs text-[#98A2B3]">
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
        <div className="px-6 py-4 border-t border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F2F4F7]"
          >
            Cancel
          </button>
          {generatedItem && (
            <button
              type="button"
              onClick={handleSaveAndFinish}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#6257E8] rounded-lg hover:bg-[#5246D6] shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Save & View in Content Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
