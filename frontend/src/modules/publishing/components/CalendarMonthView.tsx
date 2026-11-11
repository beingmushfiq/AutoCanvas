import React from 'react'
import {
  type CalendarDay,
  formatTime12h,
  PEAK_TIME_SLOTS,
} from '../../../lib/date/calendarUtils'
import { Plus, Flame, Image, Layers, FileText, CheckCircle2, Clock } from 'lucide-react'

export interface CalendarPostItem {
  id: string
  title: string
  platform: 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'tiktok'
  status: 'published' | 'scheduled' | 'draft' | 'failed'
  scheduledAt: string // YYYY-MM-DD
  scheduledTime?: string // HH:mm
  caption: string
  brandName: string
  mediaType?: 'image' | 'carousel' | 'thread' | 'text'
  idempotencyKey?: string
  timezone?: string
}

interface CalendarMonthViewProps {
  days: CalendarDay[]
  posts: CalendarPostItem[]
  platformFilter: string
  onSelectPost: (post: CalendarPostItem) => void
  onScheduleForDate: (dateStr: string, time?: string) => void
  onFillWithIdea: (dateStr: string, time?: string) => void
  showPeakTimes: boolean
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  days,
  posts,
  platformFilter,
  onSelectPost,
  onScheduleForDate,
  onFillWithIdea,
  showPeakTimes,
}) => {
  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'border-[#0a66c2]/40 bg-[#0a66c2]/10 text-[#0a66c2] hover:bg-[#0a66c2]/20'
      case 'instagram':
        return 'border-[#e1306c]/40 bg-[#e1306c]/10 text-[#e1306c] hover:bg-[#e1306c]/20'
      case 'facebook':
        return 'border-[#1877f2]/40 bg-[#1877f2]/10 text-[#1877f2] hover:bg-[#1877f2]/20'
      case 'twitter':
        return 'border-foreground/30 bg-foreground/10 text-foreground hover:bg-foreground/15'
      default:
        return 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
    }
  }

  const getMediaTypeIcon = (type?: string) => {
    switch (type) {
      case 'carousel':
        return <Layers className="w-2.5 h-2.5 shrink-0" aria-label="Carousel" />
      case 'thread':
        return <FileText className="w-2.5 h-2.5 shrink-0" aria-label="Thread" />
      default:
        return <Image className="w-2.5 h-2.5 shrink-0" aria-label="Graphic Post" />
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-background-subtle">
        {WEEKDAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`py-2.5 text-center text-xs font-mono font-semibold uppercase tracking-wider ${
              i >= 5 ? 'text-foreground-muted' : 'text-foreground-secondary'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 35 or 42 Day Calendar Matrix */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border bg-background">
        {days.map((day) => {
          // Filter posts for this specific day
          const dayPosts = posts.filter(
            (p) =>
              p.scheduledAt === day.dateString &&
              (platformFilter === 'all' || p.platform === platformFilter)
          )

          // Peak slot recommendation for this day of week
          const peakSlot = PEAK_TIME_SLOTS.find((s) => s.dayOfWeek === day.dayOfWeek)
          const hasPostAtPeak = dayPosts.some((p) => p.scheduledTime === peakSlot?.time)

          return (
            <div
              key={day.dateString}
              className={`min-h-[125px] p-2 flex flex-col justify-between transition-colors group relative ${
                !day.isCurrentMonth
                  ? 'bg-background/40 opacity-40'
                  : day.isToday
                  ? 'bg-brand-accent/5'
                  : 'bg-surface hover:bg-surface-raised/40'
              }`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`inline-flex items-center justify-center text-xs font-mono font-bold w-6 h-6 rounded-full transition-all ${
                    day.isToday
                      ? 'bg-brand-accent text-black shadow-xs ring-2 ring-brand-accent/30'
                      : day.isCurrentMonth
                      ? 'text-foreground'
                      : 'text-foreground-muted'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Quick Add Button on Hover */}
                {day.isCurrentMonth && (
                  <button
                    onClick={() => onScheduleForDate(day.dateString)}
                    title={`Schedule post for ${day.dateString}`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-foreground-muted hover:text-brand-accent hover:bg-surface-raised transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Post Items in this Day */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] scrollbar-none">
                {dayPosts.map((post) => {
                  const platformClasses = getPlatformColors(post.platform)
                  return (
                    <button
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className={`w-full text-left p-1.5 rounded-lg border text-xs transition-all shadow-2xs group/card ${platformClasses}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] font-bold uppercase">
                            {post.platform.slice(0, 2)}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {formatTime12h(post.scheduledTime || '12:00')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          {getMediaTypeIcon(post.mediaType)}
                          {post.status === 'published' ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-status-success shrink-0" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-foreground truncate line-clamp-1 group-hover/card:text-foreground">
                        {post.title}
                      </div>
                    </button>
                  )
                })}

                {/* Peak Time Suggestion Chip (Option A) */}
                {showPeakTimes && day.isCurrentMonth && peakSlot && !hasPostAtPeak && dayPosts.length < 2 && (
                  <div className="p-1.5 rounded-lg border border-dashed border-brand-accent/40 bg-brand-accent/5 text-[10px] text-foreground-secondary flex items-center justify-between gap-1 group/peak">
                    <div className="flex items-center gap-1 text-brand-accent font-medium truncate">
                      <Flame className="w-2.5 h-2.5 shrink-0" />
                      <span>{formatTime12h(peakSlot.time)} Peak</span>
                    </div>
                    <button
                      onClick={() => onFillWithIdea(day.dateString, peakSlot.time)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-accent/15 text-brand-accent hover:bg-brand-accent hover:text-black transition-all"
                      title="Fill this peak slot with a fresh idea from your trend radar"
                    >
                      + Idea
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
