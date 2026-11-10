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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-[#EAECF0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6257E8]/10 text-[#6257E8] flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">Creative Studio — Deterministic Renderer</h3>
              <p className="text-xs text-[#667085]">
                Chromium pixel-perfect brand rendering with verified typography & colors
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

        {/* Studio Workspace */}
        <div className="grid grid-cols-2 divide-x divide-[#EAECF0] flex-1 overflow-hidden">
          {/* Controls Column */}
          <div className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                {error}
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-[#6257E8]" />
                <span>Layout Template</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-[#6257E8] bg-[#6257E8]/5 ring-1 ring-[#6257E8]'
                        : 'border-[#EAECF0] hover:border-[#D0D5DD]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#101828]">{tpl.name}</div>
                    <div className="text-[10px] text-[#667085] mt-0.5">{tpl.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">Aspect Ratio</label>
              <div className="flex gap-2">
                {[
                  { id: '1:1', label: 'Square (1:1 Feed)' },
                  { id: '4:5', label: 'Portrait (4:5 IG/FB)' },
                  { id: '16:9', label: 'Landscape (16:9 LI)' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      aspectRatio === ratio.id
                        ? 'bg-[#101828] text-white border-[#101828]'
                        : 'bg-white text-[#344054] border-[#D0D5DD] hover:bg-[#F2F4F7]'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Inputs */}
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Headline Text</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Bold attention-grabbing headline..."
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Supporting Text / Takeaway</label>
              <textarea
                rows={2}
                value={supportingText}
                onChange={(e) => setSupportingText(e.target.value)}
                placeholder="Secondary insight or description..."
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Call to Action Tag</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Read the Report"
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>

            <button
              type="button"
              onClick={handleRender}
              disabled={rendering}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] disabled:opacity-50 shadow-xs transition-colors"
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
            </button>
          </div>

          {/* Live Preview Column */}
          <div className="p-6 bg-[#F9FAFB] flex flex-col items-center justify-center overflow-hidden">
            {renderResult ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="relative max-h-[380px] rounded-xl overflow-hidden shadow-lg border border-black/10 bg-white">
                  <img
                    src={renderResult.file_url}
                    alt="Creative Preview"
                    className="max-h-[380px] w-auto object-contain"
                  />
                </div>

                <div className="flex items-center justify-between w-full px-2 text-xs text-[#667085]">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Engine: {renderResult.renderer}</span>
                  </span>
                  <span>
                    {renderResult.width}x{renderResult.height} ({renderResult.format.toUpperCase()})
                  </span>
                  <a
                    href={renderResult.file_url}
                    download="creative.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#6257E8] hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-[#98A2B3]">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Click "Render Creative Preview" to composite image.</p>
                <p className="text-[11px] text-[#98A2B3] mt-1">
                  Renderer uses brand colors, fonts, and clean SVG/HTML templates.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EAECF0] bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F2F4F7]"
          >
            Close
          </button>
          {renderResult && (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#6257E8] rounded-lg hover:bg-[#5246D6] shadow-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

