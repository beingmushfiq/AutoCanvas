import React from 'react'
import {
  type CalendarDay,
  formatTime12h,
  PEAK_TIME_SLOTS,
} from '../../../lib/date/calendarUtils'
import type { CalendarPostItem } from './CalendarMonthView'
import { Plus, Flame, CheckCircle2, Clock, Image, Layers, FileText } from 'lucide-react'

interface CalendarWeekViewProps {
  days: CalendarDay[]
  posts: CalendarPostItem[]
  platformFilter: string
  onSelectPost: (post: CalendarPostItem) => void
  onScheduleForSlot: (dateStr: string, timeStr: string) => void
  showPeakTimes: boolean
}

// Hourly intervals from 8 AM to 8 PM
const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
]

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  days,
  posts,
  platformFilter,
  onSelectPost,
  onScheduleForSlot,
  showPeakTimes,
}) => {
  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'border-[#0a66c2]/40 bg-[#0a66c2]/10 text-[#0a66c2]'
      case 'instagram':
        return 'border-[#e1306c]/40 bg-[#e1306c]/10 text-[#e1306c]'
      case 'facebook':
        return 'border-[#1877f2]/40 bg-[#1877f2]/10 text-[#1877f2]'
      case 'twitter':
        return 'border-foreground/30 bg-foreground/10 text-foreground'
      default:
        return 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
    }
  }

  const getMediaTypeIcon = (type?: string) => {
    switch (type) {
      case 'carousel':
        return <Layers className="w-2.5 h-2.5 shrink-0" />
      case 'thread':
        return <FileText className="w-2.5 h-2.5 shrink-0" />
      default:
        return <Image className="w-2.5 h-2.5 shrink-0" />
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
      {/* 7-Day Header */}
      <div className="grid grid-cols-8 border-b border-border bg-background-subtle">
        <div className="p-3 text-center text-[10px] font-mono text-foreground-muted border-r border-border">
          TIME (UTC)
        </div>
        {days.map((day, i) => (
          <div
            key={day.dateString}
            className={`p-3 text-center border-r border-border last:border-r-0 ${
              day.isToday ? 'bg-brand-accent/10' : ''
            }`}
          >
            <div className="text-[10px] font-mono font-semibold uppercase text-foreground-secondary">
              {WEEKDAY_NAMES[i]}
            </div>
            <div
              className={`text-sm font-bold font-mono mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                day.isToday
                  ? 'bg-brand-accent text-black shadow-xs ring-2 ring-brand-accent/30'
                  : 'text-foreground'
              }`}
            >
              {day.dayNumber}
            </div>
          </div>
        ))}
      </div>

      {/* Hourly Grid Rows */}
      <div className="divide-y divide-border bg-background">
        {HOURS.map((hour) => {
          return (
            <div key={hour} className="grid grid-cols-8 divide-x divide-border min-h-[58px]">
              {/* Left Time Label */}
              <div className="p-2 text-right text-[10px] font-mono text-foreground-muted flex items-start justify-end pr-3">
                {formatTime12h(hour)}
              </div>

              {/* 7 Columns for the 7 Days */}
              {days.map((day) => {
                const hourPrefix = hour.slice(0, 2)
                const slotPosts = posts.filter(
                  (p) =>
                    p.scheduledAt === day.dateString &&
                    (p.scheduledTime || '12:00').startsWith(hourPrefix) &&
                    (platformFilter === 'all' || p.platform === platformFilter)
                )

                // Check if this slot matches a peak engagement hour
                const isPeakSlot =
                  showPeakTimes &&
                  PEAK_TIME_SLOTS.some(
                    (s) => s.dayOfWeek === day.dayOfWeek && s.time.startsWith(hourPrefix)
                  )

                return (
                  <div
                    key={day.dateString + hour}
                    className={`p-1.5 flex flex-col justify-between group transition-colors relative ${
                      day.isToday ? 'bg-brand-accent/5' : 'hover:bg-surface-raised/40'
                    } ${isPeakSlot && slotPosts.length === 0 ? 'bg-brand-accent/[0.03]' : ''}`}
                  >
                    {slotPosts.length > 0 ? (
                      <div className="space-y-1">
                        {slotPosts.map((post) => (
                          <button
                            key={post.id}
                            onClick={() => onSelectPost(post)}
                            className={`w-full text-left p-1.5 rounded-lg border text-xs transition-all shadow-2xs group/card ${getPlatformColors(
                              post.platform
                            )}`}
                          >
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className="font-mono font-bold uppercase">
                                {post.platform.slice(0, 2)}
                              </span>
                              <div className="flex items-center gap-1">
                                {getMediaTypeIcon(post.mediaType)}
                                {post.status === 'published' ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-status-success" />
                                ) : (
                                  <Clock className="w-2.5 h-2.5 opacity-60" />
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-foreground truncate">
                              {post.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : isPeakSlot ? (
                      <button
                        onClick={() => onScheduleForSlot(day.dateString, hour)}
                        className="w-full h-full min-h-[40px] rounded-lg border border-dashed border-brand-accent/30 hover:border-brand-accent hover:bg-brand-accent/10 p-1 flex items-center justify-center gap-1 text-[10px] text-brand-accent font-medium transition-all group/btn"
                      >
                        <Flame className="w-3 h-3 text-brand-accent" />
                        <span className="hidden sm:inline">Peak Time</span>
                        <Plus className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onScheduleForSlot(day.dateString, hour)}
                        className="w-full h-full min-h-[40px] rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-raised flex items-center justify-center text-foreground-muted hover:text-brand-accent transition-all"
                        title={`Schedule for ${day.dateString} at ${hour}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
