import React, { useState } from 'react'
import { X, Sparkles, Wand2, Check, Loader2, ArrowRight } from 'lucide-react'
import { apiClient, type ApiResponse, type BrandDiscoverySuggestion } from '../../lib/api/client'

interface BrandDiscoveryModalProps {
  isOpen: boolean
  brandId: string
  onClose: () => void
  onApplied: () => void
}

export const BrandDiscoveryModal: React.FC<BrandDiscoveryModalProps> = ({
  isOpen,
  brandId,
  onClose,
  onApplied,
}) => {
  const [referenceText, setReferenceText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<BrandDiscoverySuggestion | null>(null)

  if (!isOpen) return null

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      const res = await apiClient.post<ApiResponse<BrandDiscoverySuggestion>>(
        `/brands/${brandId}/discovery`,
        { text: referenceText || undefined }
      )

      if (res.data) {
        setSuggestion(res.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery synthesis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApply = async () => {
    if (!suggestion) return
    setApplying(true)
    setError(null)

    try {
      // 1. Update Profile
      await apiClient.put(`/brands/${brandId}/profile`, {
        mission: suggestion.mission,
        vision: suggestion.vision,
        positioning: suggestion.positioning,
      })

      // 2. Update Visual Identity
      await apiClient.put(`/brands/${brandId}/visual`, {
        primary_color: suggestion.primary_color,
        secondary_color: suggestion.secondary_color,
        primary_font: suggestion.primary_font,
      })

      // 3. Update Voice Profile
      await apiClient.put(`/brands/${brandId}/voice`, {
        tone: suggestion.tone,
        personality_traits: suggestion.personality_traits,
      })

      onApplied()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply synthesized profile')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-[#EAECF0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-gradient-to-r from-[#6257E8]/5 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6257E8] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">AI Brand Discovery Assistant</h3>
              <p className="text-xs text-[#667085]">Synthesize identity, mission, colors, and tone from raw materials</p>
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

          {!suggestion ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#344054]">
                Brand Reference Material or Notes
              </label>
              <p className="text-xs text-[#667085]">
                Paste your company overview, pitch deck notes, website 'About Us' copy, or brand guidelines. If left blank, the AI will synthesize from existing knowledge sources.
              </p>
              <textarea
                rows={7}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="Paste brand guidelines, mission notes, or about us text here..."
                className="w-full p-3 text-xs border border-[#D0D5DD] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#6257E8]"
              />

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] disabled:opacity-50 shadow-xs transition-colors"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Synthesizing Brand DNA...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Run AI Discovery Analysis</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>AI Discovery Completed Successfully</span>
                </div>
                <button
                  onClick={() => setSuggestion(null)}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Analyze different text
                </button>
              </div>

              {/* Synthesized Output Display */}
              <div className="space-y-3 border border-[#EAECF0] rounded-xl p-4 bg-[#F9FAFB]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                    Synthesized Positioning
                  </span>
                  <p className="text-xs font-medium text-[#101828] mt-0.5">{suggestion.positioning}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAECF0]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Mission</span>
                    <p className="text-xs text-[#344054] mt-0.5">{suggestion.mission}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Vision</span>
                    <p className="text-xs text-[#344054] mt-0.5">{suggestion.vision}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EAECF0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                    Tone & Voice
                  </span>
                  <p className="text-xs text-[#344054] mt-0.5">{suggestion.tone}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {suggestion.personality_traits?.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[11px] font-medium bg-white border border-[#D0D5DD] text-[#344054] rounded-md"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EAECF0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#667085]">Primary:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: suggestion.primary_color }}
                      />
                      <span className="text-xs font-mono">{suggestion.primary_color}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#667085]">Secondary:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: suggestion.secondary_color }}
                      />
                      <span className="text-xs font-mono">{suggestion.secondary_color}</span>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-[#344054]">
                    Font: <strong className="font-semibold">{suggestion.primary_font}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestion && (
          <div className="p-4 border-t border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={applying}
              className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F2F4F7]"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#6257E8] rounded-lg hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>Apply to Brand Profile</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
