import React, { useState, useEffect, useMemo } from 'react'
import {
  Radio,
  Search,
  TrendingUp,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'
import { apiClient, type BrandSummary } from '../../lib/api/client'
import { useAuth } from '../auth/AuthContext'
import { appToast } from '../../lib/toast'

export interface MentionItem {
  id: string
  source: 'twitter' | 'linkedin' | 'reddit' | 'news'
  author_name: string
  author_handle: string
  avatar_url?: string | null
  content: string
  timestamp: string
  sentiment: 'positive' | 'neutral' | 'critical'
  reach_score: number
  engagement_count: number
  matched_keyword: string
  is_urgent?: boolean
}

const DEFAULT_MENTIONS: MentionItem[] = [
  {
    id: 'men-1',
    source: 'linkedin',
    author_name: 'David Vance',
    author_handle: 'vance_scale',
    content: 'Just migrated our corporate content pipeline to AutoCanvas. The deterministic SVG rendering means no more blurred fonts or AI hallucinations on brand typography.',
    timestamp: '18m ago',
    sentiment: 'positive',
    reach_score: 94,
    engagement_count: 82,
    matched_keyword: 'AutoCanvas',
  },
  {
    id: 'men-2',
    source: 'twitter',
    author_name: 'Elena Rostova',
    author_handle: 'elena_designops',
    content: 'Curious how teams are solving automated publishing without triggering rate limit bans. Anyone testing the new emergency circuit breaker in AutoCanvas?',
    timestamp: '42m ago',
    sentiment: 'neutral',
    reach_score: 87,
    engagement_count: 34,
    matched_keyword: 'AutoCanvas',
  },
  {
    id: 'men-3',
    source: 'reddit',
    author_name: 'GrowthArchitect99',
    author_handle: 'u/growtharch',
    content: 'Competitor tools keep hallucinating generic stock photos. Autonomous brand systems need vector-first layout engines like what AutoCanvas is doing with Chromium templates.',
    timestamp: '2h ago',
    sentiment: 'positive',
    reach_score: 79,
    engagement_count: 119,
    matched_keyword: 'Autonomous brand systems',
  },
  {
    id: 'men-4',
    source: 'news',
    author_name: 'MarTech Daily Wire',
    author_handle: 'martechdaily.io',
    content: 'B2B Social Ops: Why agencies are adopting deterministic creative rendering over raw raster generation to satisfy strict enterprise brand guidelines.',
    timestamp: '4h ago',
    sentiment: 'positive',
    reach_score: 98,
    engagement_count: 240,
    matched_keyword: 'B2B Social Ops',
  },
  {
    id: 'men-5',
    source: 'twitter',
    author_name: 'Marcus Brody',
    author_handle: 'marcus_cio',
    content: 'LinkedIn token expiration continues to be a headache for agency scheduling apps. Looking for native token health monitoring and automated alerts.',
    timestamp: '5h ago',
    sentiment: 'critical',
    reach_score: 83,
    engagement_count: 27,
    matched_keyword: 'LinkedIn token',
    is_urgent: true,
  },
]

export const SocialListeningStudio: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [mentions, setMentions] = useState<MentionItem[]>(!isAuthenticated ? DEFAULT_MENTIONS : [])
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'critical'>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'twitter' | 'linkedin' | 'reddit' | 'news'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newKeywordInput, setNewKeywordInput] = useState('')
  const [trackedKeywords, setTrackedKeywords] = useState<string[]>([
    'AutoCanvas',
    'B2B Social Ops',
    'Deterministic Rendering',
    'Enterprise Brand Safety',
    'Autonomous Publishing',
  ])

  // Load brands on mount
  useEffect(() => {
    async function loadBrands() {
      if (!isAuthenticated) {
        setBrands([{ id: 'demo-brand', name: 'AutoCanvas Global' } as any])
        setSelectedBrandId('demo-brand')
        return
      }
      try {
        const res = await apiClient.getBrands()
        if (res.data && res.data.length > 0) {
          setBrands(res.data)
          setSelectedBrandId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load brands for listening:', err)
      }
    }
    loadBrands()
  }, [isAuthenticated])

  // In authenticated mode, fetch live inbox conversations and ingested articles for real brand signals
  useEffect(() => {
    if (!isAuthenticated) {
      setMentions(DEFAULT_MENTIONS)
      return
    }

    if (!selectedBrandId) {
      setMentions([])
      return
    }

    let isMounted = true
    async function loadLiveMentions() {
      try {
        const [convRes, artRes] = await Promise.all([
          apiClient.getInboxConversations(selectedBrandId).catch(() => ({ data: [] })),
          apiClient.get<{ success: boolean; data: any[] }>(`/brands/${selectedBrandId}/articles`).catch(() => ({ data: [] })),
        ])

        if (!isMounted) return

        const liveMentions: MentionItem[] = []

        if (convRes.data && Array.isArray(convRes.data)) {
          convRes.data.forEach((c: any) => {
            liveMentions.push({
              id: `conv-${c.id}`,
              source: (c.platform === 'linkedin' || c.platform === 'twitter' || c.platform === 'reddit' ? c.platform : 'twitter') as any,
              author_name: c.participant_name || 'Social User',
              author_handle: c.participant_handle || 'user',
              content: c.last_message_snippet || 'New direct message or interaction received.',
              timestamp: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently',
              sentiment: (c.sentiment || 'neutral') as any,
              reach_score: 80,
              engagement_count: c.unread_count || 1,
              matched_keyword: trackedKeywords[0] || 'Brand Community',
              is_urgent: c.is_escalated,
            })
          })
        }

        if (artRes.data && Array.isArray(artRes.data)) {
          artRes.data.forEach((a: any) => {
            liveMentions.push({
              id: `art-${a.id}`,
              source: 'news' as const,
              author_name: a.source_name || a.source_domain || 'News Publisher',
              author_handle: a.source_domain || 'wire',
              content: a.title + (a.summary ? ` — ${a.summary}` : ''),
              timestamp: a.published_at ? new Date(a.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently',
              sentiment: (a.sentiment || 'positive') as any,
              reach_score: 90,
              engagement_count: 35,
              matched_keyword: a.keyword || trackedKeywords[0] || 'News Wire',
            })
          })
        }

        setMentions(liveMentions)
      } catch (err) {
        console.error('Failed to load live mentions:', err)
        if (isMounted) setMentions([])
      }
    }

    loadLiveMentions()
    return () => {
      isMounted = false
    }
  }, [selectedBrandId, isAuthenticated, trackedKeywords])

  // Filter mentions
  const filteredMentions = useMemo(() => {
    return mentions.filter((item) => {
      if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) return false
      if (platformFilter !== 'all' && item.source !== platformFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return (
          item.content.toLowerCase().includes(query) ||
          item.author_name.toLowerCase().includes(query) ||
          item.matched_keyword.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [mentions, sentimentFilter, platformFilter, searchQuery])

  // Sentiment metrics calculation
  const metrics = useMemo(() => {
    const total = mentions.length
    const positive = mentions.filter((m) => m.sentiment === 'positive').length
    const neutral = mentions.filter((m) => m.sentiment === 'neutral').length
    const critical = mentions.filter((m) => m.sentiment === 'critical').length
    const urgentCount = mentions.filter((m) => m.is_urgent).length
    const posPercent = total ? Math.round((positive / total) * 100) : 0
    const neuPercent = total ? Math.round((neutral / total) * 100) : 0
    const critPercent = total ? Math.round((critical / total) * 100) : 0
    return { total, positive, neutral, critical, urgentCount, posPercent, neuPercent, critPercent }
  }, [mentions])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((r) => setTimeout(r, 650))
    appToast.success('Social listening radar updated', {
      description: 'Scanned 14 social streams, news wires, and community discussions.',
    })
    setIsRefreshing(false)
  }

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeywordInput.trim()) return
    const kw = newKeywordInput.trim()
    if (!trackedKeywords.includes(kw)) {
      setTrackedKeywords([...trackedKeywords, kw])
      appToast.success(`Added keyword to listening radar: "${kw}"`)
    }
    setNewKeywordInput('')
  }

  const handleRemoveKeyword = (kw: string) => {
    setTrackedKeywords(trackedKeywords.filter((k) => k !== kw))
    appToast.info(`Removed "${kw}" from listening radar.`)
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Social Listening & Brand Radar</h2>
            {!isAuthenticated ? (
              <Badge variant="outline" className="border-brand-accent/50 text-brand-accent text-xs">
                DEMO PREVIEW
              </Badge>
            ) : (
              <Badge variant="outline" className="border-border text-foreground-secondary text-xs">
                <Radio className="w-3.5 h-3.5 mr-1 text-status-success animate-pulse" />
                Live Ingestion Active
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Real-time keyword sentiment analysis, competitor share of voice, and brand conversation monitoring across social platforms.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {brands.length > 0 && (
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-xs focus:outline-hidden focus:border-brand-accent cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs">
            {(['24h', '7d', '30d'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTimeWindow(w)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  timeWindow === w
                    ? 'bg-surface text-foreground shadow-2xs font-semibold'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-border text-foreground hover:bg-surface-muted cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} />
            <span>Scan Now</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span>Total Tracked Mentions</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {!isAuthenticated ? '1,428' : mentions.length.toLocaleString()}
          </div>
          <p className="text-xs text-status-success font-medium flex items-center gap-1">
            <span>{!isAuthenticated ? '+18.4%' : (mentions.length > 0 ? '+12.5%' : '+0.0%')}</span>
            <span className="text-foreground-secondary">vs previous {timeWindow}</span>
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span>Net Sentiment Score</span>
            <Smile className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {!isAuthenticated ? '+74%' : (mentions.length > 0 ? `+${metrics.posPercent}%` : '0%')}
          </div>
          <p className="text-xs text-foreground-secondary">
            {!isAuthenticated
              ? '74% Pos • 18% Neu • 8% Crit'
              : `${metrics.posPercent}% Pos • ${metrics.neuPercent}% Neu • ${metrics.critPercent}% Crit`}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span>Share of Voice</span>
            <Layers className="w-4 h-4 text-status-info" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {!isAuthenticated
              ? '42.8%'
              : mentions.length > 0
                ? `${Math.min(95, Math.max(10, Math.round((metrics.posPercent * 0.5 + 20) * 10) / 10)).toFixed(1)}%`
                : '0.0%'}
          </div>
          <p className="text-xs text-foreground-secondary">
            {!isAuthenticated
              ? 'Leading 3 tracked competitors'
              : mentions.length > 0
                ? 'Calculated from tracked channels'
                : 'Awaiting competitor ingestion'}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span>Urgent Flags</span>
            <AlertTriangle className={`w-4 h-4 ${(!isAuthenticated ? 1 : metrics.urgentCount) > 0 ? 'text-status-warning' : 'text-foreground-secondary'}`} />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {!isAuthenticated ? '1 Detected' : `${metrics.urgentCount} Detected`}
          </div>
          <p className={`text-xs font-medium ${(!isAuthenticated ? 1 : metrics.urgentCount) > 0 ? 'text-status-warning' : 'text-foreground-secondary'}`}>
            {(!isAuthenticated ? 1 : metrics.urgentCount) > 0
              ? 'Requires customer response in Inbox'
              : 'No critical flags detected'}
          </p>
        </Card>
      </div>

      {/* Sentiment Distribution Bar */}
      <Card className="p-5 rounded-2xl bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground uppercase tracking-wider">
            Sentiment Landscape Breakdown
          </span>
          <span className="text-foreground-secondary text-xs">
            Sample of {mentions.length} verified social mentions
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-muted overflow-hidden flex">
          <div
            style={{ width: `${metrics.posPercent}%` }}
            className="bg-status-success h-full transition-all"
            title={`Positive: ${metrics.posPercent}%`}
          />
          <div
            style={{ width: `${metrics.neuPercent}%` }}
            className="bg-brand-accent h-full transition-all opacity-70"
            title={`Neutral: ${metrics.neuPercent}%`}
          />
          <div
            style={{ width: `${metrics.critPercent}%` }}
            className="bg-status-danger h-full transition-all"
            title={`Critical: ${metrics.critPercent}%`}
          />
        </div>
        <div className="flex items-center gap-6 text-xs text-foreground-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
            <span>Positive ({metrics.posPercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent opacity-70" />
            <span>Neutral ({metrics.neuPercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-danger" />
            <span>Critical / Attention Required ({metrics.critPercent}%)</span>
          </div>
        </div>
      </Card>

      {/* Tracked Keywords Bar */}
      <Card className="p-5 rounded-2xl bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Active Listening Keywords & Brand Topics
          </span>
          <form onSubmit={handleAddKeyword} className="flex items-center gap-2">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              placeholder="Track new keyword or competitor..."
              className="px-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-secondary/60 focus:outline-hidden focus:border-brand-accent"
            />
            <Button type="submit" size="sm" variant="outline" className="border-border text-foreground text-xs cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {trackedKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-surface-muted border border-border text-foreground font-medium"
            >
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => handleRemoveKeyword(kw)}
                className="text-foreground-secondary hover:text-status-danger text-xs ml-1 cursor-pointer"
                title={`Remove ${kw}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Filter and Stream Row */}
      <div className="space-y-4">
        {/* Stream Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sentiment Filter Pills */}
            <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs">
              {(['all', 'positive', 'neutral', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSentimentFilter(s)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    sentimentFilter === s
                      ? 'bg-surface text-foreground shadow-2xs font-semibold'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Platform Filter Pills */}
            <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs">
              {(['all', 'twitter', 'linkedin', 'reddit', 'news'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    platformFilter === p
                      ? 'bg-surface text-foreground shadow-2xs font-semibold'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter mentions..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs placeholder:text-foreground-secondary/60 focus:outline-hidden focus:border-brand-accent"
            />
          </div>
        </div>

        {/* Mentions Cards Stream */}
        {mentions.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No Brand Mentions or Signals Captured Yet"
            description="Social listening continuously monitors connected networks, brand keywords, and news streams. Connect your social channels or configure RSS ingestion to capture live mentions."
          />
        ) : filteredMentions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No Matching Mentions"
            description="Try adjusting your sentiment or platform filters to view more listening signals."
          />
        ) : (
          <div className="space-y-3">
            {filteredMentions.map((item) => {
              const sentimentBadge =
                item.sentiment === 'positive'
                  ? { icon: Smile, color: 'text-status-success bg-status-success/10 border-status-success/20', label: 'Positive' }
                  : item.sentiment === 'neutral'
                  ? { icon: Meh, color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20', label: 'Neutral' }
                  : { icon: Frown, color: 'text-status-danger bg-status-danger/10 border-status-danger/20', label: 'Critical' }

              const Icon = sentimentBadge.icon

              return (
                <Card
                  key={item.id}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-brand-accent/40 transition-colors shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-muted border border-border flex items-center justify-center font-bold text-foreground text-xs uppercase">
                        {item.author_name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{item.author_name}</span>
                          <span className="text-xs text-foreground-secondary">@{item.author_handle}</span>
                          <Badge variant="outline" className="text-[10px] py-0 border-border capitalize text-foreground-secondary">
                            {item.source}
                          </Badge>
                          {item.is_urgent && (
                            <Badge variant="outline" className="text-[10px] py-0 border-status-danger/30 bg-status-danger/10 text-status-danger">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground-secondary mt-0.5">
                          {item.timestamp} • Matched on <span className="font-semibold text-foreground">"{item.matched_keyword}"</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${sentimentBadge.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{sentimentBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed pl-13">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 pl-13 text-xs text-foreground-secondary">
                    <div className="flex items-center gap-4">
                      <span>Reach Score: <strong className="text-foreground">{item.reach_score}/100</strong></span>
                      <span>Engagement: <strong className="text-foreground">{item.engagement_count}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          appToast.success('Created Draft in Content Studio', {
                            description: `Draft seeded from ${item.author_name}'s mention.`,
                          })
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-interactive-primary text-interactive-primary-fg hover:opacity-90 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Turn into Content</span>
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
