import React, { useState } from 'react'
import { MessageSquare, Link2, Sparkles, X, Check } from 'lucide-react'
import { toast } from 'sonner'

interface FirstCommentConfigModalProps {
  isOpen: boolean
  onClose: () => void
  dispatchId: string
  initialComment?: string
  onSaved: (comment: string) => void
}

export const FirstCommentConfigModal: React.FC<FirstCommentConfigModalProps> = ({
  isOpen,
  onClose,
  dispatchId,
  initialComment = '',
  onSaved,
}) => {
  const [commentText, setCommentText] = useState(initialComment)
  const [targetUrl, setTargetUrl] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('social_lead')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleAppendUtmLink = () => {
    if (!targetUrl.trim()) {
      toast.error('Please enter a destination URL.')
      return
    }

    try {
      const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`)
      url.searchParams.set('utm_source', 'autocanvas')
      url.searchParams.set('utm_medium', 'first_comment')
      url.searchParams.set('utm_campaign', utmCampaign || 'brand_rhythm')

      const linkSnippet = `\n\n📌 Full Case Study & Resources: ${url.toString()}`
      setCommentText((prev) => `${prev.trim()}${linkSnippet}`)
      toast.success('UTM link appended to first comment!')
    } catch {
      toast.error('Invalid URL format.')
    }
  }

  const handleSave = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter first comment text.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/publishing/dispatches/${dispatchId}/first-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({ comment_text: commentText }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Auto-first-comment scheduled (+60s after main post).')
        onSaved(commentText)
        onClose()
      } else {
        toast.error(json.error?.message || 'Failed to configure first comment.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Auto-First-Comment</h3>
            <span className="text-xs text-foreground-muted">
              Published 60 seconds after post to maximize algorithm reach
            </span>
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="mb-4">
          <label className="text-xs font-mono uppercase tracking-wider text-foreground-muted block mb-1.5 font-semibold">
            Comment Body
          </label>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="e.g. Read the complete technical breakdown and download the architecture diagram here: [link]"
            rows={4}
            className="w-full bg-background border border-border-subtle rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-brand-accent resize-none font-sans"
          />
        </div>

        {/* UTM Helper Accordion */}
        <div className="p-3.5 rounded-xl bg-background border border-border-subtle mb-6 space-y-3">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-brand-accent" />
            Append Tracked UTM Resource Link
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="https://example.com/post"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="bg-surface-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-accent"
            />
            <input
              type="text"
              placeholder="Campaign (e.g. q3_growth)"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className="bg-surface-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-accent"
            />
          </div>
          <button
            type="button"
            onClick={handleAppendUtmLink}
            className="w-full py-1.5 rounded-lg bg-surface-elevated border border-border-subtle hover:border-brand-accent text-xs font-semibold text-brand-accent transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Insert Formatted UTM Link
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-brand-primary text-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            {isSubmitting ? 'Saving...' : 'Save First Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}

