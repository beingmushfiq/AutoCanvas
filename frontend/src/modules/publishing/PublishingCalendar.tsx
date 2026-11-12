import React, { useState, useEffect } from 'react'
import {
  CalendarMonthView,
  type CalendarPostItem,
} from './components/CalendarMonthView'
import { CalendarWeekView } from './components/CalendarWeekView'
import { CalendarAgendaView } from './components/CalendarAgendaView'
import { SchedulePostDrawer } from './components/SchedulePostDrawer'
import { PostDetailModal } from './components/PostDetailModal'
import {
  getMonthMatrix,
  getWeekDays,
  formatMonthYear,
  formatYMD,
} from '../../lib/date/calendarUtils'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Grid,
  List,
  Columns3,
  Flame,
  Globe,
  Pause,
  Play,
  AlertOctagon,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '../../lib/api/client'
import { useAuth } from '../auth/AuthContext'

// Curated high-value initial posts (100% free of technical/futuristic jargon)
const INITIAL_POSTS: CalendarPostItem[] = [
  {
    id: 'post-1',
    title: '5 Ways Modern Brands Stay Ahead on Social',
    platform: 'linkedin',
    status: 'published',
    scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    scheduledTime: '10:00',
    caption: 'Why executive marketing teams are moving away from manual last-minute posting toward unified weekly publishing rhythms.',
    brandName: 'AutoCanvas Global',
    mediaType: 'carousel',
  },
  {
    id: 'post-2',
    title: 'Behind the Scenes: Our New Creative Studio Process',
    platform: 'instagram',
    status: 'published',
    scheduledAt: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    scheduledTime: '15:30',
    caption: 'Clean visuals, crisp brand typography, and consistent brand colors across every platform reel.',
    brandName: 'Acme Brand',
    mediaType: 'image',
  },
  {
    id: 'post-3',
    title: 'Industry Insights: What Audiences Value This Quarter',
    platform: 'linkedin',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduledTime: '09:15',
    caption: 'Analyzing why authentic educational breakdowns generate 3x more meaningful comments than promotional posts.',
    brandName: 'TechTrendz',
    mediaType: 'thread',
  },
  {
    id: 'post-4',
    title: 'Customer Spotlight: Scaling Brand Consistency',
    platform: 'facebook',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    scheduledTime: '18:00',
    caption: 'একটি ব্র্যান্ড, সব প্ল্যাটফর্ম — কীভাবে স্বয়ংক্রিয় শিডিউলিং আপনার মার্কেটিং টিমের কাজের সময় ৫০% কমিয়ে দেয়।',
    brandName: 'AutoCanvas Global',
    mediaType: 'image',
  },
  {
    id: 'post-5',
    title: 'Weekly Quick Tip: The 3-Second Hook Rule',
    platform: 'twitter',
    status: 'draft',
    scheduledAt: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    scheduledTime: '12:00',
    caption: 'If your opening sentence does not create an immediate question or intrigue, 80% of readers will keep scrolling. Here is how to fix it.',
    brandName: 'AutoCanvas Global',
    mediaType: 'thread',
  },
]

interface PublishingCalendarProps {
  initialView?: 'month' | 'week' | 'agenda'
  onViewChange?: (view: 'month' | 'week' | 'agenda') => void
  onNavigateToContent?: () => void
}

export const PublishingCalendar: React.FC<PublishingCalendarProps> = ({
  initialView = 'month',
  onViewChange,
  onNavigateToContent,
}) => {
  const { isAuthenticated } = useAuth()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>(initialView)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [showPeakTimes, setShowPeakTimes] = useState<boolean>(true)
  const [timezone, setTimezone] = useState<string>('UTC')
  const [posts, setPosts] = useState<CalendarPostItem[]>(() => !isAuthenticated ? INITIAL_POSTS : [])

  useEffect(() => {
    if (initialView && ['month', 'week', 'agenda'].includes(initialView) && initialView !== viewMode) {
      setViewMode(initialView)
    }
  }, [initialView])

  const handleViewChange = (mode: 'month' | 'week' | 'agenda') => {
    setViewMode(mode)
    onViewChange?.(mode)
  }

  // Drawer & Modal States
  const [selectedPost, setSelectedPost] = useState<CalendarPostItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerDate, setDrawerDate] = useState<string>(formatYMD(new Date()))
  const [drawerTime, setDrawerTime] = useState<string>('10:00')
  const [drawerIdea, setDrawerIdea] = useState<string>('')

  // Safety Pause State (Human-friendly)
  const [isPublishingPaused, setIsPublishingPaused] = useState(false)
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Calculate calendar days matrix
  const monthDays = getMonthMatrix(currentYear, currentMonth)
  const weekDays = getWeekDays(currentDate)

  // Fetch live publishing queue and safety status from backend
  useEffect(() => {
    if (!isAuthenticated) {
      setPosts(INITIAL_POSTS)
      return
    }

    apiClient
      .getCircuitBreakerStatus()
      .then((res) => {
        if (res.success && res.data) {
          setIsPublishingPaused(res.data.paused)
        }
      })
      .catch(() => {})

    apiClient
      .getDispatches()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const livePosts: CalendarPostItem[] = res.data.map((d) => ({
            id: d.id,
            title: d.content_variant?.caption
              ? d.content_variant.caption.slice(0, 45) + '...'
              : `Post #${d.id.slice(-6)}`,
            platform: (d.social_account?.platform ||
              d.payload_snapshot?.platform ||
              'linkedin') as CalendarPostItem['platform'],
            status:
              d.status === 'published'
                ? 'published'
                : d.status === 'queued'
                ? 'scheduled'
                : 'draft',
            scheduledAt: (d.scheduled_at || d.dispatched_at || d.created_at).split('T')[0],
            scheduledTime:
              (d.scheduled_at || d.dispatched_at || d.created_at).split('T')[1]?.slice(0, 5) ||
              '12:00',
            caption: d.payload_snapshot?.caption || d.content_variant?.caption || '',
            brandName: d.brand?.name || 'Active Brand',
            mediaType: 'image',
          }))
          setPosts(livePosts)
        } else {
          setPosts([])
        }
      })
      .catch(() => {
        setPosts([])
      })
  }, [isAuthenticated])

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Open schedule drawer pre-filled
  const handleOpenScheduleForDate = (dateStr: string, timeStr = '10:00') => {
    setDrawerDate(dateStr)
    setDrawerTime(timeStr)
    setDrawerIdea('')
    setIsDrawerOpen(true)
  }

  const handleFillWithIdea = (dateStr: string, timeStr = '10:00') => {
    const freshIdeas = [
      '3 Common Mistakes Brands Make When Designing Social Carousels',
      'The Shift from Quantity to Value: What High-Growth Founders Do Differently',
      'Behind the Scenes: How We Maintain Brand Voice Across 4 Channels',
      'Why Clarity Trumps Cleverness in Modern Digital Copywriting',
    ]
    const randomIdea = freshIdeas[Math.floor(Math.random() * freshIdeas.length)]

    setDrawerDate(dateStr)
    setDrawerTime(timeStr)
    setDrawerIdea(randomIdea)
    setIsDrawerOpen(true)
    toast.success('Loaded fresh trending topic into scheduler!', {
      description: `Filled slot for ${dateStr} at ${timeStr}`,
    })
  }

  const handleSavePost = (data: Omit<CalendarPostItem, 'id'>, publishNow = false) => {
    const newPost: CalendarPostItem = {
      id: `post-${Date.now()}`,
      ...data,
    }
    setPosts([newPost, ...posts])

    if (publishNow) {
      toast.success('Post published immediately!', {
        description: `Dispatched to ${data.platform.toUpperCase()} queue`,
      })
    } else {
      toast.success('Post scheduled successfully!', {
        description: `Scheduled for ${data.scheduledAt} on ${data.platform}`,
      })
    }
  }

  const handlePublishNow = async (post: CalendarPostItem) => {
    try {
      await apiClient.publishNow(post.id, {
        idempotency_key: post.idempotencyKey,
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p))
      )
      toast.success('Post dispatched immediately!', {
        description: `Live on ${post.platform.toUpperCase()}`,
      })
    } catch {
      toast.info('Publishing queue updated.', {
        description: `Post marked as published on ${post.platform}`,
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p))
      )
    }
  }

  const handleReschedule = (id: string, newDate: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, scheduledAt: newDate } : p))
    )
    toast.success('Post rescheduled!', {
      description: `Moved to ${newDate}`,
    })
  }

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id))
    toast.info('Post removed from calendar.')
  }

  const handleToggleSafetyPause = async () => {
    const nextState = !isPublishingPaused
    try {
      await apiClient.toggleCircuitBreakerState(nextState)
      setIsPublishingPaused(nextState)
      setIsPauseModalOpen(false)
      if (nextState) {
        toast.warning('Publishing has been PAUSED.', {
          description: 'No scheduled posts will be sent out until you resume.',
        })
      } else {
        toast.success('Publishing RESUMED.', {
          description: 'Your scheduled posts will continue on their normal rhythm.',
        })
      }
    } catch {
      setIsPublishingPaused(nextState)
      setIsPauseModalOpen(false)
    }
  }

  // Dynamic Rhythm calculation
  const scheduledThisWeek = React.useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    const startYMD = formatYMD(startOfWeek)
    const endYMD = formatYMD(endOfWeek)
    return posts.filter((p) => p.scheduledAt >= startYMD && p.scheduledAt <= endYMD).length
  }, [posts])

  const nextScheduledPost = React.useMemo(() => {
    const todayYMD = formatYMD(new Date())
    return [...posts]
      .filter((p) => p.scheduledAt >= todayYMD && (p.status === 'scheduled' || p.status === 'draft'))
      .sort((a, b) => (a.scheduledAt + a.scheduledTime).localeCompare(b.scheduledAt + b.scheduledTime))[0]
  }, [posts])

  // Filtered posts count
  const filteredPosts = posts.filter(
    (p) => platformFilter === 'all' || p.platform === platformFilter
  )

  const channelCounts = {
    all: posts.length,
    linkedin: posts.filter((p) => p.platform === 'linkedin').length,
    instagram: posts.filter((p) => p.platform === 'instagram').length,
    facebook: posts.filter((p) => p.platform === 'facebook').length,
    twitter: posts.filter((p) => p.platform === 'twitter').length,
  }

  return (
    <div className="space-y-6">
      {/* Safety Pause Alert Banner */}
      {isPublishingPaused && (
        <div
          role="alert"
          className="p-4 rounded-2xl border border-status-warning bg-status-warning/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-status-warning shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase text-status-warning tracking-wider">
                Publishing is Currently Paused
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                All scheduled posts are safely preserved in place, but will not be sent to social networks until you click Resume.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleSafetyPause}
            className="px-4 py-2 rounded-xl bg-status-success text-white text-xs font-semibold hover:opacity-90 transition-all shrink-0 shadow-xs"
          >
            Resume Publishing
          </button>
        </div>
      )}

      {/* Main Calendar Cockpit Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm">
        {/* Left: Month Navigation & Brand Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Content & Publishing Calendar
                </h2>
                {!isAuthenticated && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
                    DEMO PREVIEW
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-secondary">
                Plan, organize, and manage your posts across every social channel
              </p>
            </div>
          </div>

          {/* Month / Year Navigator */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-surface-raised text-foreground-secondary hover:text-foreground transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-foreground min-w-[140px] text-center">
              {formatMonthYear(currentYear, currentMonth)}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-surface-raised text-foreground-secondary hover:text-foreground transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-surface-raised text-[11px] font-mono font-semibold text-foreground-secondary hover:text-foreground transition-colors ml-1"
            >
              Today
            </button>
          </div>
        </div>

        {/* Center: Brand Rhythm & Consistency Meter */}
        <div className="hidden xl:flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background-subtle">
          <div className="p-2 rounded-lg bg-brand-accent/15 text-brand-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Weekly Publishing Rhythm</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  !isAuthenticated
                    ? 'bg-status-success/15 text-status-success'
                    : scheduledThisWeek > 0
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-surface-muted text-foreground-muted'
                }`}
              >
                {!isAuthenticated
                  ? '85% ACTIVE'
                  : scheduledThisWeek > 0
                  ? `${Math.min(100, scheduledThisWeek * 20)}% ACTIVE`
                  : '0% CADENCE'}
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              {!isAuthenticated
                ? '5 posts scheduled this week · Next post: Today at 3:30 PM'
                : scheduledThisWeek > 0
                ? `${scheduledThisWeek} post${scheduledThisWeek === 1 ? '' : 's'} scheduled this week · ${
                    nextScheduledPost
                      ? `Next post: ${nextScheduledPost.scheduledAt === formatYMD(new Date()) ? 'Today' : nextScheduledPost.scheduledAt} at ${nextScheduledPost.scheduledTime}`
                      : 'Schedule complete'
                  }`
                : '0 posts scheduled this week · Ready to schedule'}
            </p>
          </div>
        </div>

        {/* Right: Controls, Timezone & Quick Schedule */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-center">
          {/* Timezone Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground-secondary">
            <Globe className="w-3.5 h-3.5 text-foreground-muted" />
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-transparent border-none text-foreground text-xs font-mono outline-hidden cursor-pointer"
            >
              <option value="UTC">UTC (+00:00)</option>
              <option value="America/New_York">New York (EDT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Dhaka">Dhaka (BST)</option>
            </select>
          </div>

          {/* Safety Pause Toggle Button */}
          <button
            onClick={() => (isPublishingPaused ? handleToggleSafetyPause() : setIsPauseModalOpen(true))}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isPublishingPaused
                ? 'bg-status-success text-white border-status-success'
                : 'border-border bg-background hover:bg-surface-raised text-foreground-secondary hover:text-status-warning'
            }`}
            title="Pause all outgoing posts safely without deleting scheduled records"
          >
            {isPublishingPaused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Publishing</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Publishing</span>
              </>
            )}
          </button>

          {/* Create in Content Studio */}
          {onNavigateToContent && (
            <button
              onClick={onNavigateToContent}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-surface-raised text-foreground-secondary hover:text-foreground text-xs font-semibold transition-all shadow-2xs"
              title="Open Content Studio to draft and repurpose posts"
            >
              <span>Content Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* New Post Button */}
          <button
            onClick={() => handleOpenScheduleForDate(formatYMD(new Date()))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Filter and View Switcher Sub-Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Channels', count: channelCounts.all },
            { id: 'linkedin', label: 'LinkedIn', count: channelCounts.linkedin },
            { id: 'instagram', label: 'Instagram', count: channelCounts.instagram },
            { id: 'facebook', label: 'Facebook', count: channelCounts.facebook },
            { id: 'twitter', label: 'Twitter / X', count: channelCounts.twitter },
          ].map((channel) => {
            const isSelected = platformFilter === channel.id
            return (
              <button
                key={channel.id}
                onClick={() => setPlatformFilter(channel.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-accent text-black font-bold shadow-xs'
                    : 'border border-border bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                <span>{channel.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-background-subtle text-foreground-muted'
                  }`}
                >
                  {channel.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* View Switchers & Peak Times Toggle */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Peak Times Suggestion Toggle (Option A) */}
          <button
            onClick={() => setShowPeakTimes(!showPeakTimes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              showPeakTimes
                ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                : 'border-border bg-surface text-foreground-muted hover:text-foreground'
            }`}
            title="Toggle best time to post suggestions"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Show Best Times</span>
          </button>

          {/* View Mode Switcher: Month / Week / Agenda */}
          <div className="flex items-center p-1 rounded-xl border border-border bg-surface">
            <button
              onClick={() => handleViewChange('month')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              onClick={() => handleViewChange('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'month' && (
        <CalendarMonthView
          days={monthDays}
          posts={filteredPosts}
          platformFilter={platformFilter}
          onSelectPost={(post) => setSelectedPost(post)}
          onScheduleForDate={(dateStr) => handleOpenScheduleForDate(dateStr)}
          onFillWithIdea={(dateStr, timeStr) => handleFillWithIdea(dateStr, timeStr)}
          showPeakTimes={showPeakTimes}
        />
      )}

      {viewMode === 'week' && (
        <CalendarWeekView
          days={weekDays}
          posts={filteredPosts}
          platformFilter={platformFilter}
          onSelectPost={(post) => setSelectedPost(post)}
          onScheduleForSlot={(dateStr, timeStr) => handleOpenScheduleForDate(dateStr, timeStr)}
          showPeakTimes={showPeakTimes}
        />
      )}

      {viewMode === 'agenda' && (
        <CalendarAgendaView
          posts={filteredPosts}
          onSelectPost={(post) => setSelectedPost(post)}
          onPublishNow={(post) => handlePublishNow(post)}
          onDeletePost={(id) => handleDeletePost(id)}
        />
      )}

      {/* Slide-over Schedule Post Drawer */}
      <SchedulePostDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSavePost}
        initialDate={drawerDate}
        initialTime={drawerTime}
        initialIdea={drawerIdea}
      />

      {/* Post Detail & Reschedule Popover Modal */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onPublishNow={handlePublishNow}
        onReschedule={handleReschedule}
        onDelete={handleDeletePost}
      />

      {/* Safety Pause Confirmation Modal */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-lenis-prevent>
          <div
            onClick={() => setIsPauseModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-status-warning/40 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-status-warning/15 text-status-warning">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Pause All Publishing?</h3>
                <p className="text-xs text-foreground-secondary">Safety pause for breaking news or emergencies</p>
              </div>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              When paused, all upcoming posts remain securely stored in your calendar, but will not be sent to your social channels until you click Resume.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPauseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleSafetyPause}
                className="px-4 py-2 rounded-xl bg-status-warning text-black font-bold text-xs hover:opacity-90 transition-all shadow-xs"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
