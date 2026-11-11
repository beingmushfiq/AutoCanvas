import React from 'react'
import type { CalendarPostItem } from './CalendarMonthView'
import { formatTime12h, parseYMD, formatYMD } from '../../../lib/date/calendarUtils'
import {
  X,
  Send,
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

interface PostDetailModalProps {
  post: CalendarPostItem | null
  onClose: () => void
  onPublishNow: (post: CalendarPostItem) => void
  onReschedule: (id: string, newDate: string) => void
  onDelete: (id: string) => void
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onPublishNow,
  onReschedule,
  onDelete,
}) => {
  if (!post) return null

  const handleMoveTomorrow = () => {
    const current = parseYMD(post.scheduledAt)
    current.setDate(current.getDate() + 1)
    onReschedule(post.id, formatYMD(current))
    onClose()
  }

  const handleMoveNextWeek = () => {
    const current = parseYMD(post.scheduledAt)
    current.setDate(current.getDate() + 7)
    onReschedule(post.id, formatYMD(current))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-lenis-prevent>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
              {post.platform}
            </span>
            <span className="text-xs text-foreground-secondary">
              {post.brandName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground leading-snug">
            {post.title}
          </h3>

          <div className="flex items-center gap-4 text-xs font-mono text-foreground-secondary py-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-accent" />
              {post.scheduledAt}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-accent" />
              {formatTime12h(post.scheduledTime || '12:00')}
            </span>
            {post.status === 'published' ? (
              <span className="flex items-center gap-1 text-status-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Published
              </span>
            ) : (
              <span className="flex items-center gap-1 text-brand-accent">
                <Clock className="w-3.5 h-3.5" />
                Scheduled
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border bg-background text-xs text-foreground-secondary leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
            {post.caption}
          </div>
        </div>

        {/* Quick Reschedule Pill Actions */}
        {post.status !== 'published' && (
          <div className="pt-2">
            <div className="text-[11px] font-mono text-foreground-muted mb-2">
              QUICK RESCHEDULE ACTIONS
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMoveTomorrow}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-surface-raised text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all"
              >
                <span>Move to Tomorrow</span>
                <ArrowRight className="w-3 h-3 text-brand-accent" />
              </button>
              <button
                onClick={handleMoveNextWeek}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-surface-raised text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all"
              >
                <span>Move to Next Week</span>
                <ArrowRight className="w-3 h-3 text-brand-accent" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onDelete(post.id)
              onClose()
            }}
            className="p-2.5 rounded-xl text-foreground-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-foreground transition-all"
            >
              Close
            </button>
            {post.status !== 'published' && (
              <button
                onClick={() => {
                  onPublishNow(post)
                  onClose()
                }}
                className="px-4 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Immediately</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
