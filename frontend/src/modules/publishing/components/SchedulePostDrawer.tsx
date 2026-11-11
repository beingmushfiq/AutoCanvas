import React, { useState, useEffect } from 'react'
import type { CalendarPostItem } from './CalendarMonthView'
import { X, Send, Calendar, Layers, Image, FileText, AlertCircle } from 'lucide-react'

interface SchedulePostDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<CalendarPostItem, 'id'>, publishNow?: boolean) => void
  initialDate?: string
  initialTime?: string
  initialIdea?: string
}

const PLATFORMS: Array<{
  id: CalendarPostItem['platform']
  name: string
  charLimit: number
  color: string
}> = [
  { id: 'linkedin', name: 'LinkedIn', charLimit: 3000, color: '#0a66c2' },
  { id: 'instagram', name: 'Instagram', charLimit: 2200, color: '#e1306c' },
  { id: 'facebook', name: 'Facebook', charLimit: 5000, color: '#1877f2' },
  { id: 'twitter', name: 'X / Twitter', charLimit: 280, color: '#f59e0b' },
]

export const SchedulePostDrawer: React.FC<SchedulePostDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialTime,
  initialIdea,
}) => {
  const [platform, setPlatform] = useState<CalendarPostItem['platform']>('linkedin')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(initialTime || '10:00')
  const [mediaType, setMediaType] = useState<CalendarPostItem['mediaType']>('image')
  const [brandName] = useState('AutoCanvas Global')

  useEffect(() => {
    if (initialDate) setDate(initialDate)
    if (initialTime) setTime(initialTime)
    if (initialIdea) {
      setTitle(initialIdea.slice(0, 50))
      setCaption(initialIdea)
    }
  }, [initialDate, initialTime, initialIdea])

  if (!isOpen) return null

  const activePlatformConfig = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0]
  const charsLeft = activePlatformConfig.charLimit - caption.length
  const isOverLimit = charsLeft < 0

  const handleSubmit = (publishNow = false) => {
    if (!title.trim() && !caption.trim()) return

    onSave(
      {
        title: title.trim() || caption.slice(0, 40) + '...',
        caption: caption.trim(),
        platform,
        status: publishNow ? 'published' : 'scheduled',
        scheduledAt: date,
        scheduledTime: time,
        brandName,
        mediaType,
      },
      publishNow
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" data-lenis-prevent>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Card */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Schedule Content</h3>
                <p className="text-xs text-foreground-secondary">
                  Publish to your brand's official social channels
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {/* Target Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Target Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => {
                  const isSelected = platform === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-accent bg-brand-accent/10 text-foreground ring-1 ring-brand-accent'
                          : 'border-border bg-background text-foreground-secondary hover:text-foreground hover:border-border-strong'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Post Title */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Post Title / Hook
              </label>
              <input
                type="text"
                placeholder="e.g. 5 Ways Leading Brands Stand Out on Social"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
              />
            </div>

            {/* Post Caption / Copy */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Post Copy & Captions
                </label>
                <span
                  className={`text-[11px] font-mono font-medium ${
                    isOverLimit ? 'text-status-danger font-bold' : 'text-foreground-muted'
                  }`}
                >
                  {charsLeft} chars remaining
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="Write your insightful, high-value post copy..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={`w-full p-3.5 rounded-xl border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden leading-relaxed ${
                  isOverLimit ? 'border-status-danger' : 'border-border'
                }`}
              />
              {isOverLimit && (
                <div className="flex items-center gap-1.5 text-[11px] text-status-danger mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Exceeds {activePlatformConfig.name} character limit by {Math.abs(charsLeft)} characters.</span>
                </div>
              )}
            </div>

            {/* Date and Time Picker */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Time Slot (UTC)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Media Format Picker */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Visual Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image', label: 'Graphic Post', icon: Image },
                  { id: 'carousel', label: 'Carousel', icon: Layers },
                  { id: 'thread', label: 'Text Series', icon: FileText },
                ].map((f) => {
                  const Icon = f.icon
                  const isSelected = mediaType === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMediaType(f.id as CalendarPostItem['mediaType'])}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-brand-accent bg-brand-accent/10 text-foreground ring-1 ring-brand-accent'
                          : 'border-border bg-background text-foreground-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-brand-accent" />
                      <span className="text-[11px]">{f.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-background-subtle flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5 text-brand-accent" />
              <span>Publish Now</span>
            </button>

            <button
              type="button"
              disabled={isOverLimit || (!title.trim() && !caption.trim())}
              onClick={() => handleSubmit(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md disabled:opacity-50"
            >
              Schedule for {date}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
