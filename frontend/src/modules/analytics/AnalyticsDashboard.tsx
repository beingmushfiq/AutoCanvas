import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Clock,
  Eye,
  Users,
  Activity,
  MousePointer,
  RefreshCw,
  Award,
  Sparkles,
} from 'lucide-react'
import {
  apiClient,
  type BrandSummary,
  type AnalyticsOverviewReport,
  type AnalyticsTimeSeriesPoint,
  type PillarRoiItem,
  type BestPostingTimesReport,
  type TopPostAnalyticsItem,
} from '../../lib/api/client'
import { EmptyState } from '../../components/ui/empty-state'
import { useAuth } from '../auth/AuthContext'

const DEMO_OVERVIEW: AnalyticsOverviewReport = {
  period: {
    start_date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    duration_days: 30,
  },
  kpis: {
    impressions: { value: 1284500, delta_percent: 18.4 },
    reach: { value: 894200, delta_percent: 14.2 },
    engagements: { value: 64200, delta_percent: 22.8 },
    clicks: { value: 12400, delta_percent: 9.5 },
    follower_growth: { value: 3420, delta_percent: 12.1 },
    engagement_rate: { value: 4.8, delta_percent: 1.2 },
  },
}

const DEMO_TIMESERIES: AnalyticsTimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  const dayStr = d.toISOString().split('T')[0]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayName = dayNames[d.getDay()]
  const baseImpressions = 25000 + Math.sin(i / 3) * 8000 + i * 800
  const baseEngagements = Math.round(baseImpressions * 0.052)
  return {
    date: dayStr,
    day_name: dayName,
    impressions: Math.round(baseImpressions),
    reach: Math.round(baseImpressions * 0.72),
    engagements: baseEngagements,
    clicks: Math.round(baseEngagements * 0.18),
    engagement_rate: 5.2,
  }
})

const DEMO_PILLARS: PillarRoiItem[] = [
  {
    pillar_id: 'pillar-1',
    pillar_name: 'Thought Leadership',
    color_tag: 'var(--brand-accent)',
    target_percentage: 40,
    post_count: 14,
    total_impressions: 512000,
    total_engagements: 28400,
    avg_engagement_rate: 5.5,
    roi_score: 94,
  },
  {
    pillar_id: 'pillar-2',
    pillar_name: 'Product Engineering',
    color_tag: 'var(--brand-primary)',
    target_percentage: 30,
    post_count: 10,
    total_impressions: 348000,
    total_engagements: 18200,
    avg_engagement_rate: 5.2,
    roi_score: 88,
  },
  {
    pillar_id: 'pillar-3',
    pillar_name: 'Brand Culture',
    color_tag: 'var(--status-info)',
    target_percentage: 20,
    post_count: 8,
    total_impressions: 242000,
    total_engagements: 11400,
    avg_engagement_rate: 4.7,
    roi_score: 82,
  },
  {
    pillar_id: 'pillar-4',
    pillar_name: 'Educational Carousels',
    color_tag: 'var(--status-success)',
    target_percentage: 10,
    post_count: 6,
    total_impressions: 182500,
    total_engagements: 6200,
    avg_engagement_rate: 3.4,
    roi_score: 74,
  },
]

const DEMO_BEST_TIMES: BestPostingTimesReport = {
  matrix: [],
  recommended_slots: [
    { day_name: 'Tuesday', day_index: 2, hour: 9, hour_formatted: '09:00 AM', engagements: 342, post_count: 8, score: 96 },
    { day_name: 'Thursday', day_index: 4, hour: 14, hour_formatted: '02:00 PM', engagements: 298, post_count: 6, score: 92 },
    { day_name: 'Wednesday', day_index: 3, hour: 11, hour_formatted: '11:00 AM', engagements: 264, post_count: 5, score: 88 },
  ],
}

const DEMO_TOP_POSTS: TopPostAnalyticsItem[] = [
  {
    id: 'top-1',
    platform: 'linkedin',
    platform_post_id: 'li-post-1',
    likes_count: 2450,
    comments_count: 380,
    shares_count: 590,
    clicks_count: 1240,
    impressions_count: 48500,
    reach_count: 36200,
    engagement_rate: 7.05,
    published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    content_item: {
      id: 'ci-1',
      title: '5 Ways Modern Brands Stay Ahead on Social',
      concept: 'Why executive marketing teams are moving away from manual last-minute posting toward unified weekly publishing rhythms.',
    },
  },
  {
    id: 'top-2',
    platform: 'instagram',
    platform_post_id: 'ig-post-2',
    likes_count: 1980,
    comments_count: 240,
    shares_count: 490,
    clicks_count: 890,
    impressions_count: 39200,
    reach_count: 29800,
    engagement_rate: 6.91,
    published_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    content_item: {
      id: 'ci-2',
      title: 'Behind the Scenes: Our New Creative Studio Process',
      concept: 'Clean visuals, crisp brand typography, and consistent brand colors across every platform reel.',
    },
  },
  {
    id: 'top-3',
    platform: 'linkedin',
    platform_post_id: 'li-post-3',
    likes_count: 1420,
    comments_count: 190,
    shares_count: 370,
    clicks_count: 720,
    impressions_count: 31800,
    reach_count: 24100,
    engagement_rate: 6.22,
    published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    content_item: {
      id: 'ci-3',
      title: 'Industry Insights: What Audiences Value This Quarter',
      concept: 'Analyzing why authentic educational breakdowns generate 3x more meaningful comments than promotional posts.',
    },
  },
  {
    id: 'top-4',
    platform: 'facebook',
    platform_post_id: 'fb-post-4',
    likes_count: 980,
    comments_count: 110,
    shares_count: 260,
    clicks_count: 510,
    impressions_count: 22400,
    reach_count: 18200,
    engagement_rate: 6.03,
    published_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    content_item: {
      id: 'ci-4',
      title: 'Scaling Brand Consistency Across Channels',
      concept: 'How automated scheduling cuts marketing team overhead by 50%.',
    },
  },
  {
    id: 'top-5',
    platform: 'twitter',
    platform_post_id: 'tw-post-5',
    likes_count: 840,
    comments_count: 95,
    shares_count: 185,
    clicks_count: 420,
    impressions_count: 18900,
    reach_count: 15400,
    engagement_rate: 5.92,
    published_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    content_item: {
      id: 'ci-5',
      title: 'The 3-Second Hook Rule in Editorial Copywriting',
      concept: 'If your opening sentence does not create curiosity, 80% will keep scrolling.',
    },
  },
]

export const AnalyticsDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const [overview, setOverview] = useState<AnalyticsOverviewReport | null>(null)
  const [timeseries, setTimeseries] = useState<AnalyticsTimeSeriesPoint[]>([])
  const [pillars, setPillars] = useState<PillarRoiItem[]>([])
  const [bestTimes, setBestTimes] = useState<BestPostingTimesReport | null>(null)
  const [topPosts, setTopPosts] = useState<TopPostAnalyticsItem[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch available brands on mount (or supply demo brand in guest mode)
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
        console.error('Failed to load brands:', err)
      }
    }
    loadBrands()
  }, [isAuthenticated])

  // 2. Calculate date parameters from timeRange
  const getDateRange = useCallback(() => {
    const end = new Date()
    const start = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
    start.setDate(end.getDate() - (days - 1))

    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }
  }, [timeRange])

  // 3. Load all analytics metrics (live telemetry or interactive demo)
  const loadAnalytics = useCallback(async () => {
    if (!isAuthenticated) {
      setOverview(DEMO_OVERVIEW)
      setTimeseries(DEMO_TIMESERIES)
      setPillars(DEMO_PILLARS)
      setBestTimes(DEMO_BEST_TIMES)
      setTopPosts(DEMO_TOP_POSTS)
      return
    }

    if (!selectedBrandId) return
    setIsLoading(true)
    setError(null)
    const { start_date, end_date } = getDateRange()

    try {
      const [overviewRes, timeseriesRes, pillarsRes, bestTimesRes, topPostsRes] = await Promise.all([
        apiClient.getAnalyticsOverview(selectedBrandId, { start_date, end_date }).catch(() => ({ data: null })),
        apiClient.getAnalyticsTimeSeries(selectedBrandId, { start_date, end_date }).catch(() => ({ data: [] })),
        apiClient.getAnalyticsPillars(selectedBrandId, { start_date, end_date }).catch(() => ({ data: [] })),
        apiClient.getAnalyticsBestTimes(selectedBrandId).catch(() => ({ data: null })),
        apiClient.getAnalyticsTopPosts(selectedBrandId, 5).catch(() => ({ data: [] })),
      ])

      if (overviewRes.data) setOverview(overviewRes.data)
      if (timeseriesRes.data) setTimeseries(timeseriesRes.data)
      if (pillarsRes.data) setPillars(pillarsRes.data)
      if (bestTimesRes.data) setBestTimes(bestTimesRes.data)
      if (topPostsRes.data) setTopPosts(topPostsRes.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, selectedBrandId, getDateRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Chart SVG calculations
  const chartHeight = 180
  const chartWidth = 600
  const maxImpressions = Math.max(1, ...timeseries.map((t) => t.impressions))
  const maxEngagements = Math.max(1, ...timeseries.map((t) => t.engagements))

  const getPoints = (values: number[], maxVal: number) => {
    if (values.length === 0) return ''
    const step = chartWidth / Math.max(1, values.length - 1)
    return values
      .map((val, idx) => {
        const x = idx * step
        const y = chartHeight - (val / maxVal) * (chartHeight - 20)
        return `${x},${y}`
      })
      .join(' ')
  }

  const impressionsPoints = getPoints(
    timeseries.map((t) => t.impressions),
    maxImpressions
  )
  const engagementsPoints = getPoints(
    timeseries.map((t) => t.engagements),
    maxEngagements
  )

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cross-Platform Performance & Analytics
            </h1>
            {!isAuthenticated ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-accent/15 text-brand-accent border border-brand-accent/30 font-mono">
                DEMO PREVIEW
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-primary text-foreground-inverse">
                Phase 10
              </span>
            )}
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Deterministic attribution, content pillar ROI efficiency, and historical audience activity heatmaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Brand Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-brand-select" className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
              Brand:
            </label>
            <select
              id="analytics-brand-select"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm font-medium focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center p-1 rounded-xl border border-border bg-surface" role="group" aria-label="Time range selector">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                  timeRange === range
                    ? 'bg-foreground text-foreground-inverse'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadAnalytics()}
            disabled={isLoading}
            aria-label="Refresh analytics data"
            className="p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl border border-status-danger bg-status-danger-bg text-status-danger text-xs font-medium">
          {error}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Impressions */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-foreground-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Impressions</span>
            <Eye className="w-4 h-4 text-brand-primary" aria-hidden="true" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-numeric text-foreground">
              {overview?.kpis.impressions.value.toLocaleString() ?? '0'}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                (overview?.kpis.impressions.delta_percent ?? 0) >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}
            >
              {(overview?.kpis.impressions.delta_percent ?? 0) >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {Math.abs(overview?.kpis.impressions.delta_percent ?? 0)}%
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">vs. previous period</p>
        </div>

        {/* Total Reach */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-foreground-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Unique Reach</span>
            <Users className="w-4 h-4 text-brand-accent" aria-hidden="true" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-numeric text-foreground">
              {overview?.kpis.reach.value.toLocaleString() ?? '0'}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                (overview?.kpis.reach.delta_percent ?? 0) >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}
            >
              {(overview?.kpis.reach.delta_percent ?? 0) >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {Math.abs(overview?.kpis.reach.delta_percent ?? 0)}%
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">vs. previous period</p>
        </div>

        {/* Avg Engagement Rate */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-foreground-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Engagement Rate</span>
            <Activity className="w-4 h-4 text-status-success" aria-hidden="true" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-numeric text-foreground">
              {overview?.kpis.engagement_rate.value.toFixed(2) ?? '0.00'}%
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                (overview?.kpis.engagement_rate.delta_percent ?? 0) >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}
            >
              {(overview?.kpis.engagement_rate.delta_percent ?? 0) >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {Math.abs(overview?.kpis.engagement_rate.delta_percent ?? 0)}%
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">Total interactions / impressions</p>
        </div>

        {/* Net Follower Growth */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-foreground-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Growth</span>
            <MousePointer className="w-4 h-4 text-status-warning" aria-hidden="true" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono-numeric text-foreground">
              +{overview?.kpis.follower_growth.value.toLocaleString() ?? '0'}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                (overview?.kpis.follower_growth.delta_percent ?? 0) >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}
            >
              {(overview?.kpis.follower_growth.delta_percent ?? 0) >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {Math.abs(overview?.kpis.follower_growth.delta_percent ?? 0)}%
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">Net new cross-platform followers</p>
        </div>
      </div>

      {/* Performance Time-Series Area Chart */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">Cross-Platform Activity Trends</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Continuous daily breakdown of impressions and audience interactions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-primary" aria-hidden="true" />
              <span className="text-foreground-secondary">Impressions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-accent" aria-hidden="true" />
              <span className="text-foreground-secondary">Engagements</span>
            </div>
          </div>
        </div>

        {timeseries.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Calendar}
              title="No time-series data yet"
              description="Analytics snapshots will populate daily as posts receive interactions."
            />
          </div>
        ) : (
          <div className="relative pt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 overflow-visible"
              aria-label="Performance trends chart"
            >
              {/* Grid Lines */}
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="currentColor" className="text-border" strokeWidth="1" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="currentColor" className="text-border" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="currentColor" className="text-border" strokeDasharray="4 4" strokeWidth="1" />

              {/* Impressions Area & Line */}
              {impressionsPoints && (
                <>
                  <polygon
                    points={`0,${chartHeight} ${impressionsPoints} ${chartWidth},${chartHeight}`}
                    className="fill-brand-primary/10"
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-brand-primary"
                    points={impressionsPoints}
                  />
                </>
              )}

              {/* Engagements Area & Line */}
              {engagementsPoints && (
                <>
                  <polygon
                    points={`0,${chartHeight} ${engagementsPoints} ${chartWidth},${chartHeight}`}
                    className="fill-brand-accent/15"
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-brand-accent"
                    points={engagementsPoints}
                  />
                </>
              )}
            </svg>

            {/* X-Axis Date Indicators */}
            <div className="flex justify-between items-center text-[10px] text-foreground-muted font-mono-numeric mt-2">
              <span>{timeseries[0]?.date}</span>
              <span>{timeseries[Math.floor(timeseries.length / 2)]?.date}</span>
              <span>{timeseries[timeseries.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Middle Section: Pillar ROI & Optimal Times */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Content Pillar ROI Ranking (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-border bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                <h2 className="text-sm font-bold text-foreground">Content Pillar ROI Ranking</h2>
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Multi-factor score measuring engagement rate, reach efficiency, and output balance.
              </p>
            </div>
            <Award className="w-5 h-5 text-brand-accent shrink-0" aria-hidden="true" />
          </div>

          {pillars.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={Layers}
                title="No pillar performance logged"
                description="Publish content assigned to strategic pillars to compute ROI rankings."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pillars.map((pillar, idx) => (
                <div key={pillar.pillar_id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-background-subtle border border-border flex items-center justify-center text-xs font-bold font-mono-numeric text-foreground-secondary shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {pillar.pillar_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-primary/10 text-brand-primary">
                          ROI: {pillar.roi_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-foreground-muted mt-0.5">
                        <span>{pillar.post_count} posts</span>
                        <span>•</span>
                        <span>{pillar.total_impressions.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-status-success font-mono-numeric">
                      {pillar.avg_engagement_rate}%
                    </span>
                    <p className="text-[10px] text-foreground-muted">avg. engagement</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Best Posting Times Heatmap (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-border bg-surface shadow-2xs space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-accent" aria-hidden="true" />
              <h2 className="text-sm font-bold text-foreground">Optimal Posting Windows</h2>
            </div>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Historical audience engagement density by day and hour.
            </p>
          </div>

          {/* Top Recommendations */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider">
              AI Recommended Publishing Slots:
            </span>
            <div className="space-y-1.5">
              {bestTimes?.recommended_slots && bestTimes.recommended_slots.length > 0 ? (
                bestTimes.recommended_slots.map((slot, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl border border-border bg-background-subtle flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-accent shrink-0" aria-hidden="true" />
                      <strong className="text-foreground">
                        {slot.day_name} at {slot.hour_formatted}
                      </strong>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-status-success-bg text-status-success">
                      Peak {(slot.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-foreground-muted py-2">
                  Insufficient historical engagement data to generate recommendations.
                </div>
              )}
            </div>
          </div>

          {/* Mini Heatmap Visualization (7 Days) */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block mb-2">
              Day-of-Week Engagement Heat:
            </span>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((d, dIdx) => {
                const dayScores = bestTimes?.matrix[dIdx]?.map((s) => s.score) ?? [0]
                const maxDayScore = Math.max(0.05, ...dayScores)
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full h-8 rounded-lg border border-border transition-all flex items-center justify-center"
                      style={{
                        backgroundColor: `rgba(var(--brand-primary-rgb, 16, 24, 40), ${Math.max(0.1, maxDayScore)})`,
                      }}
                      title={`${d}: Max engagement score ${Math.round(maxDayScore * 100)}%`}
                    >
                      <span className="text-[9px] font-bold text-foreground">
                        {Math.round(maxDayScore * 100)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-foreground-muted font-medium">{d}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Posts Table */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Top Performing Content</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Posts ranked by validated cross-platform engagement rate.
            </p>
          </div>
        </div>

        {topPosts.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Activity}
              title="No top posts logged yet"
              description="Posts will appear here as their engagement signals are ingested."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-foreground-secondary uppercase tracking-wider text-[10px]">
                <tr>
                  <th scope="col" className="pb-3 font-semibold">Post Title & Concept</th>
                  <th scope="col" className="pb-3 font-semibold">Platform</th>
                  <th scope="col" className="pb-3 font-semibold">Pillar</th>
                  <th scope="col" className="pb-3 font-semibold text-right">Impressions</th>
                  <th scope="col" className="pb-3 font-semibold text-right">Likes</th>
                  <th scope="col" className="pb-3 font-semibold text-right">Comments</th>
                  <th scope="col" className="pb-3 font-semibold text-right">Engagement Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-raised transition-colors">
                    <td className="py-3 font-medium text-foreground max-w-xs truncate">
                      {post.content_item?.title || post.content_variant?.caption || post.platform_post_id}
                    </td>
                    <td className="py-3 uppercase text-[10px] font-mono-numeric text-foreground-muted">
                      {post.platform}
                    </td>
                    <td className="py-3 text-foreground-secondary">
                      {post.content_pillar?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 font-mono-numeric text-right text-foreground">
                      {post.impressions_count.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono-numeric text-right text-foreground-secondary">
                      {post.likes_count}
                    </td>
                    <td className="py-3 font-mono-numeric text-right text-foreground-secondary">
                      {post.comments_count}
                    </td>
                    <td className="py-3 font-mono-numeric text-right font-bold text-status-success">
                      {post.engagement_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

