import React, { useState } from 'react'
import {
  X,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Palette,
  Save,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import {
  apiClient,
  type ContentItem,
  type ContentVariant,
} from '../../lib/api/client'

interface PostDetailModalProps {
  isOpen: boolean
  brandId: string
  item: ContentItem | null
  onClose: () => void
  onUpdated: () => void
  onOpenCreativeEditor: (variantId: string, initialHeadline: string) => void
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  isOpen,
  brandId,
  item,
  onClose,
  onUpdated,
  onOpenCreativeEditor,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin')
  const [editingVariant, setEditingVariant] = useState<ContentVariant | null>(null)
  const [caption, setCaption] = useState('')
  const [savingVariant, setSavingVariant] = useState(false)

  // Actions
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (item && item.variants && item.variants.length > 0) {
      const initial = item.variants[0]
      setSelectedPlatform(initial.platform)
      setEditingVariant(initial)
      setCaption(initial.caption)
    }
  }, [item])

  const handleSelectPlatform = (platform: string) => {
    setSelectedPlatform(platform)
    const variant = item?.variants?.find((v) => v.platform === platform)
    if (variant) {
      setEditingVariant(variant)
      setCaption(variant.caption)
    }
  }

  const handleSaveVariant = async () => {
    if (!editingVariant) return
    setSavingVariant(true)
    setError(null)

    try {
      await apiClient.put(`/content/variants/${editingVariant.id}`, {
        caption,
      })
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant')
    } finally {
      setSavingVariant(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!item) return
    setActionLoading(true)
    try {
      await apiClient.post(`/brands/${brandId}/content/${item.id}/submit-review`)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!item) return
    setActionLoading(true)
    try {
      await apiClient.post(`/brands/${brandId}/content/${item.id}/approve`)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve post')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!item || !rejectFeedback.trim()) return
    setActionLoading(true)
    try {
      await apiClient.post(`/brands/${brandId}/content/${item.id}/reject`, {
        feedback: rejectFeedback,
      })
      setShowRejectBox(false)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject post')
    } finally {
      setActionLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-[#EAECF0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-[#F9FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6257E8]/10 text-[#6257E8] flex items-center justify-center font-bold text-xs">
              QA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#101828] truncate max-w-md">{item.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'review'
                      ? 'bg-amber-100 text-amber-800'
                      : item.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                {item.pillar?.name ? `Pillar: ${item.pillar.name} • ` : ''}Quality Score: {item.overall_quality_score}/100
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Rejection Notice Banner if applicable */}
          {item.status === 'rejected' && item.review_feedback && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <strong className="font-semibold">Reviewer Revision Feedback:</strong>
                <p className="mt-0.5 text-rose-800">{item.review_feedback}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            {/* Left 2 Cols: Platform Copy Editor */}
            <div className="col-span-2 space-y-4">
              {/* Channel Selector */}
              <div className="flex border-b border-[#EAECF0] gap-4">
                {item.variants?.map((v) => (
                  <button
                    key={v.platform}
                    onClick={() => handleSelectPlatform(v.platform)}
                    className={`py-2 text-xs font-bold capitalize border-b-2 transition-all ${
                      selectedPlatform === v.platform
                        ? 'border-[#6257E8] text-[#6257E8]'
                        : 'border-transparent text-[#667085] hover:text-[#101828]'
                    }`}
                  >
                    {v.platform}
                  </button>
                ))}
              </div>

              {/* Caption Editor */}
              {editingVariant && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#344054]">
                        Platform Native Caption ({selectedPlatform})
                      </label>
                      <span className="text-[11px] text-[#667085]">
                        {caption.length} characters
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full p-3 text-xs border border-[#D0D5DD] rounded-xl focus:ring-2 focus:ring-[#6257E8] leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {editingVariant.hashtags?.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#F2F4F7] text-[#6257E8] text-[11px] font-mono rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={handleSaveVariant}
                      disabled={savingVariant}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#344054] bg-[#F2F4F7] hover:bg-[#EAECF0] rounded-lg transition-colors"
                    >
                      {savingVariant ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Creative & QA Report */}
            <div className="space-y-4">
              {/* Creative Graphic */}
              <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#EAECF0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                    Creative Visual
                  </span>
                  {editingVariant && (
                    <button
                      onClick={() => onOpenCreativeEditor(editingVariant.id, item.title)}
                      className="text-[11px] font-semibold text-[#6257E8] hover:underline flex items-center gap-1"
                    >
                      <Palette className="w-3 h-3" />
                      <span>Edit Graphic</span>
                    </button>
                  )}
                </div>

                {editingVariant?.media_urls && editingVariant.media_urls.length > 0 ? (
                  <div className="rounded-lg overflow-hidden border border-[#EAECF0] shadow-xs">
                    <img
                      src={editingVariant.media_urls[0]}
                      alt="Creative Graphic"
                      className="w-full h-auto object-cover max-h-48"
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-white border border-dashed border-[#D0D5DD] rounded-lg text-center text-xs text-[#98A2B3]">
                    No creative attached
                  </div>
                )}
              </div>

              {/* QA & Policy Meter */}
              <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-[#EAECF0] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                  Automated QA Breakdown
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Brand Alignment:</span>
                    <span className="font-semibold text-[#101828]">
                      {item.qa_report?.brand_alignment_score ?? 90}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Platform Fit:</span>
                    <span className="font-semibold text-[#101828]">
                      {item.qa_report?.platform_fit_score ?? 90}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Readability:</span>
                    <span className="font-semibold text-[#101828]">
                      {item.qa_report?.readability_score ?? 88}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EAECF0] flex items-center gap-1.5 text-[11px] text-[#344054]">
                  {item.risk_level === 'low' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Low Risk / Safe to Publish</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-700 font-semibold">Risk: {item.risk_level.toUpperCase()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Prompt Form */}
          {showRejectBox && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-rose-900">
                Reason for Rejection / Revision Notes:
              </label>
              <textarea
                rows={2}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Specify what needs to be changed before approval..."
                className="w-full p-2.5 text-xs border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectFeedback.trim()}
                  className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#EAECF0] bg-white flex items-center justify-between">
          <div className="text-xs text-[#667085]">
            Created {new Date(item.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-3">
            {item.status === 'draft' && (
              <button
                onClick={handleSubmitReview}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6257E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit for Approval</span>
              </button>
            )}

            {item.status === 'review' && !showRejectBox && (
              <>
                <button
                  onClick={() => setShowRejectBox(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject with Feedback</span>
                </button>

                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Approve Post</span>
                </button>
              </>
            )}

            {item.status === 'approved' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready for Publishing (Phase 5)</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
