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
  AlertTriangle,
} from 'lucide-react'
import {
  apiClient,
  type ContentItem,
  type ContentVariant,
} from '../../lib/api/client'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  x: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
}

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

  const charLimit = PLATFORM_LIMITS[selectedPlatform.toLowerCase()] || 3000
  const charCount = caption.length
  const isOverLimit = charCount > charLimit
  const isNearLimit = charCount > charLimit * 0.9 && !isOverLimit

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border text-brand-accent flex items-center justify-center font-bold text-xs shadow-2xs">
              QA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground truncate max-w-md">{item.title}</h3>
                <Badge
                  variant={
                    item.status === 'approved'
                      ? 'success'
                      : item.status === 'review'
                      ? 'warning'
                      : item.status === 'rejected'
                      ? 'danger'
                      : 'secondary'
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                {item.pillar?.name ? `Pillar: ${item.pillar.name} • ` : ''}Quality Score: {item.overall_quality_score}/100
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs bg-status-danger-bg text-status-danger rounded-xl border border-status-danger font-semibold">
              {error}
            </div>
          )}

          {/* Rejection Notice Banner if applicable */}
          {item.status === 'rejected' && item.review_feedback && (
            <div className="p-3.5 bg-status-danger-bg border border-status-danger text-status-danger rounded-xl flex items-start gap-3">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-semibold">Reviewer Revision Feedback:</strong>
                <p className="mt-0.5">{item.review_feedback}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Platform Copy Editor */}
            <div className="md:col-span-2 space-y-4">
              {/* Channel Selector */}
              <div className="flex border-b border-border gap-4">
                {item.variants?.map((v) => (
                  <button
                    key={v.platform}
                    type="button"
                    onClick={() => handleSelectPlatform(v.platform)}
                    className={`py-2 text-xs font-bold capitalize border-b-2 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                      selectedPlatform === v.platform
                        ? 'border-brand-accent text-foreground'
                        : 'border-transparent text-foreground-secondary hover:text-foreground'
                    }`}
                  >
                    {v.platform}
                  </button>
                ))}
              </div>

              {/* Caption Editor with Live Character Limit Warning */}
              {editingVariant && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        Platform Native Caption ({selectedPlatform})
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span
                          className={`font-semibold ${
                            isOverLimit
                              ? 'text-status-danger'
                              : isNearLimit
                              ? 'text-status-warning'
                              : 'text-foreground-secondary'
                          }`}
                        >
                          {charCount} / {charLimit}
                        </span>
                        {isOverLimit && (
                          <span className="flex items-center gap-0.5 text-status-danger font-semibold text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Exceeds limit
                          </span>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={8}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className={`w-full p-3 text-xs bg-surface border rounded-xl leading-relaxed text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 ${
                        isOverLimit
                          ? 'border-status-danger focus:ring-status-danger'
                          : 'border-border focus:ring-focus-ring'
                      }`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {editingVariant.hashtags?.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-background-subtle border border-border text-foreground text-[11px] font-mono rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveVariant}
                      disabled={savingVariant}
                      className="gap-1.5"
                    >
                      {savingVariant ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Copy</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Creative & QA Report */}
            <div className="space-y-4">
              {/* Creative Graphic */}
              <div className="bg-background-subtle p-3.5 rounded-2xl border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Creative Visual
                  </span>
                  {editingVariant && (
                    <button
                      type="button"
                      onClick={() => onOpenCreativeEditor(editingVariant.id, item.title)}
                      className="text-[11px] font-semibold text-brand-accent hover:underline flex items-center gap-1"
                    >
                      <Palette className="w-3 h-3" />
                      <span>Edit Graphic</span>
                    </button>
                  )}
                </div>

                {editingVariant?.media_urls && editingVariant.media_urls.length > 0 ? (
                  <div className="rounded-xl overflow-hidden border border-border shadow-2xs">
                    <img
                      src={editingVariant.media_urls[0]}
                      alt="Creative Graphic"
                      className="w-full h-auto object-cover max-h-48"
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-surface border border-dashed border-border rounded-xl text-center text-xs text-foreground-muted">
                    No creative attached
                  </div>
                )}
              </div>

              {/* QA & Policy Meter */}
              <div className="bg-background-subtle p-3.5 rounded-2xl border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                  Automated QA Breakdown
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Brand Alignment:</span>
                    <span className="font-semibold text-foreground">
                      {item.qa_report?.brand_alignment_score ?? 90}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Platform Fit:</span>
                    <span className="font-semibold text-foreground">
                      {item.qa_report?.platform_fit_score ?? 90}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Readability:</span>
                    <span className="font-semibold text-foreground">
                      {item.qa_report?.readability_score ?? 88}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-1.5 text-[11px]">
                  {item.risk_level === 'low' ? (
                    <div className="flex items-center gap-1 text-status-success font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Low Risk / Safe to Publish</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-status-warning font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Risk: {item.risk_level.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Prompt Form */}
          {showRejectBox && (
            <div className="p-4 bg-status-danger-bg border border-status-danger rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-status-danger">
                Reason for Rejection / Revision Notes:
              </label>
              <textarea
                rows={2}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Specify what needs to be changed before approval..."
                className="w-full p-2.5 text-xs border border-status-danger/40 rounded-xl bg-surface text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-status-danger"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectBox(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectFeedback.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between">
          <div className="text-xs text-foreground-muted font-mono">
            Created {new Date(item.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-3">
            {item.status === 'draft' && (
              <Button
                type="button"
                variant="default"
                onClick={handleSubmitReview}
                disabled={actionLoading}
                className="gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit for Approval</span>
              </Button>
            )}

            {item.status === 'review' && !showRejectBox && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRejectBox(true)}
                  disabled={actionLoading}
                  className="gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject with Feedback</span>
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="gap-1.5 bg-status-success text-interactive-primary-fg hover:opacity-90"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Approve Post</span>
                </Button>
              </>
            )}

            {item.status === 'approved' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-status-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready for Publishing (Idempotent Redis Lock)</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
