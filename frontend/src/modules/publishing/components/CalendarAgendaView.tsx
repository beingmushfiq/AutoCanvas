import React from 'react'
import type { CalendarPostItem } from './CalendarMonthView'
import { formatTime12h, parseYMD } from '../../../lib/date/calendarUtils'
import {
  Clock,
  CheckCircle2,
  Send,
  Trash2,
  CalendarCheck,
} from 'lucide-react'

interface CalendarAgendaViewProps {
  posts: CalendarPostItem[]
  onSelectPost: (post: CalendarPostItem) => void
  onPublishNow: (post: CalendarPostItem) => void
  onDeletePost: (id: string) => void
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  posts,
  onSelectPost,
  onPublishNow,
  onDeletePost,
}) => {
  // Sort posts chronologically
  const sorted = [...posts].sort((a, b) => {
    const da = `${a.scheduledAt}T${a.scheduledTime || '00:00'}`
    const db = `${b.scheduledAt}T${b.scheduledTime || '00:00'}`
    return da.localeCompare(db)
  })

  // Group by date
  const groups: Record<string, CalendarPostItem[]> = {}
  for (const post of sorted) {
    if (!groups[post.scheduledAt]) {
      groups[post.scheduledAt] = []
    }
    groups[post.scheduledAt].push(post)
  }

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'bg-[#0a66c2]/15 text-[#0a66c2] border-[#0a66c2]/30'
      case 'instagram':
        return 'bg-[#e1306c]/15 text-[#e1306c] border-[#e1306c]/30'
      case 'facebook':
        return 'bg-[#1877f2]/15 text-[#1877f2] border-[#1877f2]/30'
      case 'twitter':
        return 'bg-foreground/15 text-foreground border-foreground/30'
      default:
        return 'bg-brand-accent/15 text-brand-accent border-brand-accent/30'
    }
  }

  const formatDateHeader = (dateStr: string) => {
    const date = parseYMD(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today · ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (diffDays === 1) return 'Tomorrow · ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (diffDays === -1) return 'Yesterday · ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <CalendarCheck className="w-10 h-10 text-brand-accent mx-auto mb-3 opacity-80" />
        <h3 className="text-sm font-bold text-foreground">No Scheduled Posts</h3>
        <p className="text-xs text-foreground-secondary mt-1 max-w-sm mx-auto">
          Your publishing queue is currently clear. Click "Schedule Post" or select an empty day cell to start planning.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([dateStr, dayPosts]) => (
        <div key={dateStr} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-accent">
              {formatDateHeader(dateStr)}
            </span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-mono text-foreground-muted">
              {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          <div className="grid gap-3">
            {dayPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-raised transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div
                  onClick={() => onSelectPost(post)}
                  className="flex items-start gap-3 flex-1 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl border border-border bg-background flex flex-col items-center justify-center shrink-0 w-16">
                    <span className="text-xs font-bold font-mono text-foreground">
                      {formatTime12h(post.scheduledTime || '12:00').split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-foreground-muted">
                      {formatTime12h(post.scheduledTime || '12:00').split(' ')[1]}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getPlatformBadge(
                          post.platform
                        )}`}
                      >
                        {post.platform}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {post.title}
                      </span>
                      {post.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-success">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-accent">
                          <Clock className="w-3 h-3" />
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-secondary line-clamp-2 max-w-2xl leading-relaxed">
                      {post.caption}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {post.status !== 'published' && (
                    <button
                      onClick={() => onPublishNow(post)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent text-xs font-semibold transition-all"
                      title="Publish to platform immediately"
                    >
                      <Send className="w-3 h-3" />
                      <span>Publish Now</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="p-2 rounded-lg text-foreground-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors"
                    title="Remove from calendar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
