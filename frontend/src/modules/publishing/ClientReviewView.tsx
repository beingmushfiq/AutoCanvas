import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, MessageSquare, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

interface ClientReviewData {
  token: string
  client_name: string
  status: 'active' | 'approved' | 'changes_requested' | 'expired'
  expires_at: string
  brand: {
    name: string
    logo_url?: string
  }
  post: {
    topic: string
    concept?: string
    scheduled_for?: string
    variants: Array<{
      id: string
      channel: string
      platform?: string
      caption: string
      hashtags?: string[]
      media_urls?: string[]
    }>
  }
  existing_feedback?: string
}

export const ClientReviewView: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<ClientReviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    fetchReviewData()
  }, [token])

  const fetchReviewData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/review/${token}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json.data)
      } else {
        setError(json.error?.message || 'Failed to load review link.')
      }
    } catch {
      setError('Network connection error. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/review/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Post successfully approved! Scheduled for publication.')
        setData((prev) => prev ? { ...prev, status: 'approved' } : null)
      } else {
        toast.error(json.error?.message || 'Failed to approve post.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback notes.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/review/${token}/changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Feedback submitted to the creative team.')
        setData((prev) => prev ? { ...prev, status: 'changes_requested', existing_feedback: feedback } : null)
        setShowFeedbackModal(false)
      } else {
        toast.error(json.error?.message || 'Failed to submit feedback.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4">
        <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-mono text-foreground-muted">Loading Brand Publication Review...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
        <div className="max-w-md w-full bg-surface-elevated border border-border-subtle rounded-2xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Review Link Unavailable</h2>
          <p className="text-sm text-foreground-muted mb-6">{error || 'This review link is invalid or has expired.'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Visit AutoCanvas Home <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  const currentVariant = data.post.variants[activeTab] || data.post.variants[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Brand & Security Header */}
      <header className="border-b border-border-subtle bg-surface-elevated/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.brand.logo_url ? (
              <img src={data.brand.logo_url} alt={data.brand.name} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-accent/20 text-brand-accent font-bold flex items-center justify-center text-sm">
                {data.brand.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-sm font-bold block">{data.brand.name}</span>
              <span className="text-xs text-foreground-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Agency Magic Review
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-foreground-muted hidden sm:inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Expires: {new Date(data.expires_at).toLocaleDateString()}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              data.status === 'approved'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : data.status === 'changes_requested'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
            }`}>
              {data.status === 'approved' ? '✓ Approved' : data.status === 'changes_requested' ? 'Changes Requested' : 'Pending Review'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Review Cockpit */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Welcome greeting banner */}
        <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-6 mb-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Hello, {data.client_name}
          </h1>
          <p className="text-sm text-foreground-muted">
            The creative team has prepared this scheduled publication for your brand. Please review the copy, media, and channel adaptations below.
          </p>
          {data.existing_feedback && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <span className="font-bold block mb-1">Your Submitted Feedback:</span>
              {data.existing_feedback}
            </div>
          )}
        </div>

        {/* Channel Platform Tabs */}
        {data.post.variants.length > 1 && (
          <div className="flex gap-2 border-b border-border-subtle mb-6">
            {data.post.variants.map((v, idx) => (
              <button
                key={v.id || idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                  activeTab === idx
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                {v.channel || v.platform || `Channel ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Content Preview Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Post Copy and Metadata (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-6">
              <span className="text-xs font-mono uppercase tracking-wider text-brand-accent block mb-2 font-bold">
                Editorial Caption
              </span>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-sans">
                {currentVariant?.caption || 'No copy provided.'}
              </p>

              {currentVariant?.hashtags && currentVariant.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border-subtle">
                  {currentVariant.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-brand-accent font-medium">
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface-elevated/50 border border-border-subtle rounded-2xl p-5 text-xs text-foreground-muted space-y-2">
              <div className="flex justify-between">
                <span>Publication Target:</span>
                <span className="font-bold text-foreground capitalize">{currentVariant?.channel || 'LinkedIn'}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled Time:</span>
                <span className="font-mono text-foreground">
                  {data.post.scheduled_for ? new Date(data.post.scheduled_for).toLocaleString() : 'Optimal Engagement Slot'}
                </span>
              </div>
            </div>
          </div>

          {/* Graphic Artwork or Carousel Preview (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xs font-mono uppercase tracking-wider text-foreground-muted self-start mb-3 font-semibold">
                Creative Asset
              </span>
              <div className="w-full aspect-square rounded-xl bg-background flex items-center justify-center border border-border-subtle overflow-hidden relative group">
                {currentVariant?.media_urls && currentVariant.media_urls.length > 0 ? (
                  <img
                    src={currentVariant.media_urls[0]}
                    alt="Creative asset"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-foreground-muted">
                    <div className="w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                      {data.brand.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold block text-foreground mb-1">Deterministic SVG Asset</span>
                    <span className="text-[11px] block">High-Resolution Studio Template</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Decision Cockpit Action Deck */}
        <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="text-sm font-bold block">Ready to Publish?</span>
            <span className="text-xs text-foreground-muted">
              Approving schedules this content into the automated dispatch queue.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFeedbackModal(true)}
              disabled={isSubmitting || data.status === 'approved'}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border-subtle text-foreground text-xs font-bold hover:bg-background transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4 text-amber-500" />
              Request Changes
            </button>

            <button
              onClick={handleApprove}
              disabled={isSubmitting || data.status === 'approved'}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {data.status === 'approved' ? 'Approved & Scheduled' : 'Approve & Schedule'}
            </button>
          </div>
        </div>
      </main>

      {/* Editorial Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Request Editorial Changes</h3>
            <p className="text-xs text-foreground-muted mb-4">
              Enter your notes, corrections, or adjustments for the agency team.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Please update slide 2 to highlight our Q3 compliance certificate instead of general ROI..."
              rows={5}
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-brand-accent resize-none mb-4 font-sans"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-foreground text-xs font-bold hover:opacity-90"
              >
                {isSubmitting ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Footer */}
      <footer className="border-t border-border-subtle py-6 text-center text-xs text-foreground-muted">
        Powered by <a href="https://devcenterpoint.com" target="_blank" rel="noreferrer" className="text-brand-accent font-semibold hover:underline">DevCenterPoint</a> · Autonomous Brand Infrastructure
      </footer>
    </div>
  )
}
export default ClientReviewView
