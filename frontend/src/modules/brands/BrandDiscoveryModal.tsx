import React, { useState } from 'react'
import { X, Sparkles, Wand2, Check, Loader2, ArrowRight } from 'lucide-react'
import { apiClient, type ApiResponse, type BrandDiscoverySuggestion } from '../../lib/api/client'
import { Button } from '../../components/ui/button'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border text-brand-accent flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">AI Brand Discovery Assistant</h3>
              <p className="text-xs text-foreground-secondary">Synthesize identity, mission, colors, and tone from raw materials</p>
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
            <div className="p-3 text-xs bg-status-danger-bg text-status-danger rounded-lg border border-status-danger font-semibold">
              {error}
            </div>
          )}

          {!suggestion ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-foreground">
                Brand Reference Material or Notes
              </label>
              <p className="text-xs text-foreground-secondary">
                Paste your company overview, pitch deck notes, website 'About Us' copy, or brand guidelines. If left blank, the AI will synthesize from existing knowledge sources.
              </p>
              <textarea
                rows={7}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="Paste brand guidelines, mission notes, or about us text here..."
                className="w-full p-3 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
              />

              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                variant="default"
                className="w-full gap-2 py-2.5"
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
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-status-success-bg border border-status-success text-status-success rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>AI Discovery Completed Successfully</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="text-xs underline hover:opacity-80"
                >
                  Analyze different text
                </button>
              </div>

              {/* Synthesized Output Display */}
              <div className="space-y-3 border border-border rounded-xl p-4 bg-background-subtle">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Synthesized Positioning
                  </span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{suggestion.positioning}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Mission</span>
                    <p className="text-xs text-foreground-secondary mt-0.5">{suggestion.mission}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Vision</span>
                    <p className="text-xs text-foreground-secondary mt-0.5">{suggestion.vision}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Tone & Voice
                  </span>
                  <p className="text-xs text-foreground-secondary mt-0.5">{suggestion.tone}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {suggestion.personality_traits?.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[11px] font-medium bg-surface border border-border text-foreground rounded-md"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-foreground-muted">Primary:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: suggestion.primary_color }}
                      />
                      <span className="text-xs font-mono text-foreground">{suggestion.primary_color}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-foreground-muted">Secondary:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: suggestion.secondary_color }}
                      />
                      <span className="text-xs font-mono text-foreground">{suggestion.secondary_color}</span>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-foreground-secondary">
                    Font: <strong className="font-semibold text-foreground">{suggestion.primary_font}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestion && (
          <div className="p-4 border-t border-border bg-background-subtle flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={applying}
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleApply}
              disabled={applying}
              className="gap-2"
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>Apply to Brand Profile</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
