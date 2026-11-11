import React, { useState, useEffect } from 'react'
import {
  X,
  Palette,
  Loader2,
  CheckCircle2,
  Layout,
  RefreshCw,
  Sparkles,
  Download,
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type CreativeTemplateInfo,
  type CreativeRenderResult,
} from '../../lib/api/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface CreativeEditorModalProps {
  isOpen: boolean
  brandId: string
  variantId?: string | null
  initialHeadline?: string
  initialSupportingText?: string
  initialCta?: string
  onClose: () => void
  onSuccess?: (renderedUrl: string) => void
}

export const CreativeEditorModal: React.FC<CreativeEditorModalProps> = ({
  isOpen,
  brandId,
  variantId,
  initialHeadline = '',
  initialSupportingText = '',
  initialCta = '',
  onClose,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState<CreativeTemplateInfo[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('minimal_corporate_v1')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1')

  const [headline, setHeadline] = useState(initialHeadline)
  const [supportingText, setSupportingText] = useState(initialSupportingText)
  const [cta, setCta] = useState(initialCta)

  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renderResult, setRenderResult] = useState<CreativeRenderResult | null>(null)

  useEffect(() => {
    if (isOpen) {
      setHeadline(initialHeadline)
      setSupportingText(initialSupportingText)
      setCta(initialCta)
      fetchTemplates()
    }
  }, [isOpen, initialHeadline, initialSupportingText, initialCta])

  const fetchTemplates = async () => {
    try {
      const res = await apiClient.get<ApiResponse<CreativeTemplateInfo[]>>('/creative/templates')
      setTemplates(res.data || [])
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const getDimensions = () => {
    switch (aspectRatio) {
      case '4:5':
        return { width: 1080, height: 1350 }
      case '16:9':
        return { width: 1200, height: 675 }
      case '1:1':
      default:
        return { width: 1080, height: 1080 }
    }
  }

  const handleRender = async () => {
    setRendering(true)
    setError(null)
    const { width, height } = getDimensions()

    try {
      if (variantId) {
        const res = await apiClient.post<ApiResponse<{ rendered_asset: CreativeRenderResult }>>(
          `/content/variants/${variantId}/render-creative`,
          {
            headline: headline || 'Your Brand Headline',
            supporting_text: supportingText || undefined,
            call_to_action: cta || undefined,
            template_id: selectedTemplate,
            width,
            height,
          }
        )
        if (res.data?.rendered_asset) {
          setRenderResult(res.data.rendered_asset)
          if (onSuccess) onSuccess(res.data.rendered_asset.file_url)
        }
      } else {
        const res = await apiClient.post<ApiResponse<CreativeRenderResult>>('/creative/render', {
          brand_id: brandId,
          headline: headline || 'Your Brand Headline',
          supporting_text: supportingText || undefined,
          call_to_action: cta || undefined,
          template_id: selectedTemplate,
          width,
          height,
        })
        if (res.data) {
          setRenderResult(res.data)
          if (onSuccess) onSuccess(res.data.file_url)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed')
    } finally {
      setRendering(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border text-brand-accent flex items-center justify-center shadow-2xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Creative Studio — Deterministic Renderer</h3>
              <p className="text-xs text-foreground-secondary">
                Chromium pixel-perfect brand rendering with verified typography & colors
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

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border flex-1 overflow-hidden">
          {/* Controls Column */}
          <div className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 text-xs bg-status-danger-bg text-status-danger rounded-xl border border-status-danger font-semibold">
                {error}
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-brand-accent" />
                <span>Layout Template</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 text-left rounded-xl border transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                      selectedTemplate === tpl.id
                        ? 'border-brand-accent bg-background-subtle font-semibold shadow-2xs'
                        : 'border-border hover:border-border-strong bg-surface text-foreground-secondary'
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">{tpl.name}</div>
                    <div className="text-[10px] text-foreground-muted mt-0.5">{tpl.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Aspect Ratio</label>
              <div className="flex gap-2">
                {[
                  { id: '1:1', label: 'Square (1:1)' },
                  { id: '4:5', label: 'Portrait (4:5)' },
                  { id: '16:9', label: 'Landscape (16:9)' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                      aspectRatio === ratio.id
                        ? 'bg-interactive-primary text-interactive-primary-fg border-border shadow-2xs'
                        : 'bg-surface text-foreground-secondary border-border hover:bg-surface-raised hover:text-foreground'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Inputs */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Headline Text</label>
              <Input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Bold attention-grabbing headline..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Supporting Text / Takeaway</label>
              <textarea
                rows={2}
                value={supportingText}
                onChange={(e) => setSupportingText(e.target.value)}
                placeholder="Secondary insight or description..."
                className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Call to Action Tag</label>
              <Input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Read the Report"
              />
            </div>

            <Button
              type="button"
              onClick={handleRender}
              disabled={rendering}
              variant="default"
              className="w-full py-2.5 gap-2"
            >
              {rendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Composing & Rendering via Playwright...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Render Creative Preview</span>
                </>
              )}
            </Button>
          </div>

          {/* Live Preview Column */}
          <div className="p-6 bg-background-subtle flex flex-col items-center justify-center overflow-hidden">
            {renderResult ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="relative max-h-[380px] rounded-xl overflow-hidden shadow-lg border border-border bg-surface">
                  <img
                    src={renderResult.file_url}
                    alt="Creative Preview"
                    className="max-h-[380px] w-auto object-contain"
                  />
                </div>

                <div className="flex items-center justify-between w-full px-2 text-xs text-foreground-secondary">
                  <div className="flex items-center gap-1 font-semibold text-status-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Engine: {renderResult.renderer}</span>
                  </div>
                  <span className="font-mono">
                    {renderResult.width}x{renderResult.height} ({renderResult.format.toUpperCase()})
                  </span>
                  <a
                    href={renderResult.file_url}
                    download="creative.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-accent hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-foreground-muted">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50 text-brand-accent" />
                <p className="text-xs font-medium text-foreground">Click "Render Creative Preview" to composite image.</p>
                <p className="text-[11px] text-foreground-muted mt-1">
                  Renderer uses brand colors, fonts, and clean SVG/HTML templates.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {renderResult && (
            <Button
              type="button"
              variant="default"
              onClick={onClose}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
