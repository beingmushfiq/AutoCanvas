import React, { useState, useEffect, useCallback } from 'react'
import {
  Radio,
  Zap,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  ShieldCheck,
  Play
} from 'lucide-react'
import {
  apiClient,
  type AutopilotRadarData,
  type BrandSummary,
  type BrandCadenceSettingData,
  type BrandCadenceSlot,
  type DiscoveredSourceItem,
  type ContentFingerprintItem,
  type AutopilotCycleReport,
} from '../../lib/api/client'
import { EmptyState } from '../../components/ui/empty-state'
import { appToast } from '../../lib/toast'
import { useAuth } from '../auth/AuthContext'

interface AutopilotCommandDeckProps {
  currentBrandId?: string
}

// Fallback preview data for unauthenticated or newly initialized brands
const DEMO_CADENCE: BrandCadenceSettingData = {
  brand_id: 'demo-brand-1',
  autopilot_mode: 'copilot_manual',
  weekly_schedule: [
    { day: 'mon', time: '09:30', channel: 'linkedin' },
    { day: 'wed', time: '14:00', channel: 'twitter' },
    { day: 'fri', time: '11:15', channel: 'instagram' },
  ],
  novelty_threshold_cosine: 0.85,
  max_daily_posts_per_channel: 2,
  require_consensus_for_breaking_news: true,
  is_active: true,
  last_cycle_run_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
}

const DEMO_SOURCES: DiscoveredSourceItem[] = [
  {
    id: 'src-1',
    source_name: 'TechCrunch SaaS & Cloud Wire',
    source_url: 'https://techcrunch.com/category/enterprise',
    feed_url: 'https://techcrunch.com/feed',
    source_type: 'rss',
    relevance_score: 96,
    authority_score: 92,
    last_scoured_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'active',
  },
  {
    id: 'src-2',
    source_name: 'Google News - Enterprise AI Operations',
    source_url: 'https://news.google.com',
    feed_url: 'https://news.google.com/rss/search?q=enterprise+ai',
    source_type: 'google_news',
    relevance_score: 91,
    authority_score: 88,
    last_scoured_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'active',
  },
  {
    id: 'src-3',
    source_name: 'Reddit - r/SaaS Discussion Radar',
    source_url: 'https://reddit.com/r/SaaS',
    feed_url: 'https://www.reddit.com/r/SaaS/.rss',
    source_type: 'community',
    relevance_score: 85,
    authority_score: 78,
    last_scoured_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'active',
  },
]

const DEMO_FINGERPRINTS: ContentFingerprintItem[] = [
  {
    id: 'fp-1',
    channel: 'linkedin',
    simhash_64: 1223456789012345,
    hook_text: 'Why generic AI text kills B2B brand trust (and what to do instead)',
    concept_summary: 'Deterministic visual typography and brand voice consistency analysis',
    creative_template_id: 'tpl_editorial_grid_v2',
    published_or_scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'fp-2',
    channel: 'twitter',
    simhash_64: 9876543210987654,
    hook_text: 'Stop generating raster text with AI. Here is the vector SVG math.',
    concept_summary: 'Sharable technical breakdown of Chromium rendering vs blurry diffusion pixels',
    creative_template_id: 'tpl_code_snippet_dark',
    published_or_scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
]

const DEMO_RADAR: AutopilotRadarData = {
  brand: {
    id: 'demo-brand-1',
    name: 'Acme Global',
    industry: 'B2B SaaS',
  },
  cadence: DEMO_CADENCE,
  pulse: {
    active_sources: 12,
    total_sources: 16,
    fingerprints_registered: 48,
    autopilot_mode: 'copilot_manual',
    last_scoured_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    is_active: true,
  },
  emerging_clusters: [
    {
      id: 'cluster-1',
      cluster_title: 'Autonomous Multi-Agent AI Frameworks Surge Across Enterprise SaaS',
      summary: 'Widespread enterprise adoption of coordinated agent swarms across marketing operations and autonomous content distribution pipelines.',
      primary_entity: 'AI & Automation',
      momentum_score: 94,
      article_count: 8,
      has_consensus: true,
      source_domains: ['techcrunch.com', 'venturebeat.com', 'github.com'],
    },
    {
      id: 'cluster-2',
      cluster_title: 'B2B Social Content Shifts Towards Founder-Led Video & Editorial Carousels',
      summary: 'Data-backed analysis showing 3.2x higher engagement on deterministic vector graphics compared to AI-generated raster text overlays.',
      primary_entity: 'Content Strategy',
      momentum_score: 87,
      article_count: 6,
      has_consensus: true,
      source_domains: ['socialmediatoday.com', 'linkedin.com'],
    },
    {
      id: 'cluster-3',
      cluster_title: 'Zero-Click Search Impact on Organic Brand Visibility in 2026',
      summary: 'Search engine AI overviews push brands to build owned audiences through scheduled cadence and original thought leadership.',
      primary_entity: 'Search & Social',
      momentum_score: 79,
      article_count: 5,
      has_consensus: false,
      source_domains: ['searchengineland.com', 'marketingbrew.com'],
    },
  ],
  recent_fingerprints: DEMO_FINGERPRINTS,
}

const DEMO_BRAND: BrandSummary = {
  id: 'demo-brand-1',
  name: 'Acme Global',
  slug: 'acme-global',
  industry: 'B2B SaaS',
  status: 'active',
  primary_color: 'var(--brand-primary)',
  secondary_color: 'var(--brand-accent)',
  primary_logo_url: null,
  created_at: new Date().toISOString(),
}

export const AutopilotCommandDeck: React.FC<AutopilotCommandDeckProps> = ({ currentBrandId }) => {
  const { isAuthenticated } = useAuth()
  const [brands, setBrands] = useState<BrandSummary[]>(!isAuthenticated ? [DEMO_BRAND] : [])
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    currentBrandId || (!isAuthenticated ? 'demo-brand-1' : '')
  )
  const [radar, setRadar] = useState<AutopilotRadarData | null>(!isAuthenticated ? DEMO_RADAR : null)
  const [cadence, setCadence] = useState<BrandCadenceSettingData | null>(!isAuthenticated ? DEMO_CADENCE : null)
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredSourceItem[]>(!isAuthenticated ? DEMO_SOURCES : [])
  const [fingerprints, setFingerprints] = useState<ContentFingerprintItem[]>(!isAuthenticated ? DEMO_FINGERPRINTS : [])
  const [loading, setLoading] = useState<boolean>(false)
  const [triggering, setTriggering] = useState<boolean>(false)
  const [savingCadence, setSavingCadence] = useState<boolean>(false)
  const [lastReport, setLastReport] = useState<AutopilotCycleReport | null>(null)
  const [activeTab, setActiveTab] = useState<'radar' | 'novelty' | 'cadence'>('radar')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('')

  // Load brands on mount with fallback for guest / initial state
  useEffect(() => {
    let isMounted = true
    const fetchBrands = async () => {
      try {
        const res = await apiClient.getBrands()
        if (isMounted) {
          if (res.data && res.data.length > 0) {
            setBrands(res.data)
            if (!selectedBrandId || selectedBrandId === 'demo-brand-1') {
              setSelectedBrandId(res.data[0].id)
            }
          } else if (!isAuthenticated) {
            setBrands([DEMO_BRAND])
            setSelectedBrandId('demo-brand-1')
          } else {
            setBrands([])
            setSelectedBrandId('')
          }
        }
      } catch {
        if (isMounted) {
          if (!isAuthenticated) {
            setBrands([DEMO_BRAND])
            setSelectedBrandId('demo-brand-1')
          } else {
            setBrands([])
            setSelectedBrandId('')
          }
        }
      }
    }
    fetchBrands()
    return () => {
      isMounted = false
    }
  }, [selectedBrandId, isAuthenticated])

  // Load radar & cadence data for active brand
  const loadAutopilotData = useCallback(async () => {
    if (!selectedBrandId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (selectedBrandId === 'demo-brand-1' || !isAuthenticated) {
        setRadar(DEMO_RADAR)
        setCadence(DEMO_CADENCE)
        setDiscoveredSources(DEMO_SOURCES)
        setFingerprints(DEMO_FINGERPRINTS)
        return
      }

      const [radarRes, cadenceRes, sourcesRes, fpsRes] = await Promise.all([
        apiClient.getAutopilotRadar(selectedBrandId).catch(() => ({ data: null })),
        apiClient.getAutopilotCadence(selectedBrandId).catch(() => ({ data: null })),
        apiClient.getDiscoveredSources(selectedBrandId).catch(() => ({ data: { data: [] } })),
        apiClient.getContentFingerprints(selectedBrandId).catch(() => ({ data: { data: [] } })),
      ])

      setRadar(radarRes.data || null)
      setCadence(cadenceRes.data || null)
      setDiscoveredSources(sourcesRes.data?.data || [])
      setFingerprints(fpsRes.data?.data || [])
    } catch {
      setRadar(null)
      setCadence(null)
      setDiscoveredSources([])
      setFingerprints([])
    } finally {
      setLoading(false)
    }
  }, [selectedBrandId, isAuthenticated])

  useEffect(() => {
    loadAutopilotData()
  }, [loadAutopilotData])

  // Trigger manual on-demand cycle
  const handleTriggerCycle = async () => {
    if (!selectedBrandId || triggering) return
    setTriggering(true)
    setLastReport(null)
    try {
      if (selectedBrandId === 'demo-brand-1') {
        // Simulated instant demo response
        await new Promise((resolve) => setTimeout(resolve, 800))
        setLastReport({
          status: 'completed',
          brand: 'Acme Global',
          autopilot_mode: 'copilot_manual',
          sources_discovered: 12,
          opportunities_found: 3,
          empty_slots_found: 1,
          posts_minted: 3,
          duplicates_rejected_and_mutated: 1,
          cycle_timestamp: new Date().toISOString(),
        })
        appToast.success('Autonomous discovery cycle completed!', {
          description: 'Discovered 12 sources, evaluated 3 trending stories.',
        })
        return
      }

      const res = await apiClient.triggerAutopilotCycle(selectedBrandId)
      if (res.data) {
        setLastReport(res.data)
        await loadAutopilotData()
        appToast.success('Autonomous discovery cycle completed!', {
          description: `Discovered ${res.data.sources_discovered} sources, minted ${res.data.posts_minted} posts.`,
        })
      }
    } catch (err) {
      console.error('Failed to trigger autonomous cycle:', err)
      appToast.error('Failed to trigger autonomous cycle', {
        description: err instanceof Error ? err.message : 'Operational error',
      })
    } finally {
      setTriggering(false)
    }
  }

  // Save Cadence Settings
  const handleSaveCadence = async () => {
    if (!selectedBrandId || !cadence || savingCadence) return
    setSavingCadence(true)
    setSaveSuccessMsg('')
    try {
      if (selectedBrandId === 'demo-brand-1') {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setSaveSuccessMsg('Demo cadence settings saved successfully!')
        appToast.success('Demo cadence settings saved successfully!')
        setTimeout(() => setSaveSuccessMsg(''), 4000)
        return
      }

      const res = await apiClient.updateAutopilotCadence(selectedBrandId, {
        autopilot_mode: cadence.autopilot_mode,
        weekly_schedule: cadence.weekly_schedule,
        novelty_threshold_cosine: cadence.novelty_threshold_cosine,
        max_daily_posts_per_channel: cadence.max_daily_posts_per_channel,
        require_consensus_for_breaking_news: cadence.require_consensus_for_breaking_news,
        is_active: cadence.is_active,
      })
      if (res.data) {
        setCadence(res.data)
        setSaveSuccessMsg('Cadence settings saved successfully!')
        appToast.success('Cadence settings saved successfully!')
        setTimeout(() => setSaveSuccessMsg(''), 4000)
      }
    } catch (err) {
      console.error('Failed to update cadence:', err)
      appToast.error('Failed to update cadence', {
        description: err instanceof Error ? err.message : 'Operational error',
      })
    } finally {
      setSavingCadence(false)
    }
  }

  // Add a slot to weekly schedule
  const handleAddSlot = () => {
    if (!cadence) return
    const newSlot: BrandCadenceSlot = {
      day: 'mon',
      time: '12:00',
      channel: 'linkedin',
    }
    setCadence({
      ...cadence,
      weekly_schedule: [...cadence.weekly_schedule, newSlot],
    })
  }

  // Remove slot from weekly schedule
  const handleRemoveSlot = (index: number) => {
    if (!cadence) return
    const updated = cadence.weekly_schedule.filter((_, i) => i !== index)
    setCadence({
      ...cadence,
      weekly_schedule: updated,
    })
  }

  // Update specific slot field
  const handleSlotChange = (
    index: number,
    field: keyof BrandCadenceSlot,
    value: string
  ) => {
    if (!cadence) return
    const updated = [...cadence.weekly_schedule]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setCadence({
      ...cadence,
      weekly_schedule: updated,
    })
  }

  const activeBrand = brands.find((b) => b.id === selectedBrandId)

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 font-sans">
      {/* --- Top Operational Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/30">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Live News & Content Radar
              </h1>
              <p className="text-xs sm:text-sm text-foreground-secondary">
                Continuous hourly news discovery, trending story detection, and guaranteed duplicate prevention.
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Brand Selector & Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          {brands.length > 0 && (
            <select
              aria-label="Select Target Brand"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.industry || 'General'})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleTriggerCycle}
            disabled={triggering}
            aria-label="Run Autonomous Cycle on Demand"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
          >
            {triggering ? (
              <RefreshCw className="h-4 w-4 animate-spin text-brand-accent" />
            ) : (
              <Play className="h-4 w-4 fill-brand-accent text-brand-accent" />
            )}
            <span>{triggering ? 'Gathering News & Ideas...' : 'Scan for News & Ideas Now'}</span>
          </button>
        </div>
      </div>

      {/* --- Cycle Report Banner (if triggered) --- */}
      {lastReport && (
        <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-status-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">
                News & Idea Scan Complete for {lastReport.brand}
              </h4>
              <p className="mt-1 text-xs text-foreground-secondary">
                Scanned <span className="font-semibold text-foreground">{lastReport.sources_discovered}</span> sources | Found <span className="font-semibold text-foreground">{lastReport.opportunities_found}</span> trends | Drafted <span className="font-semibold text-foreground">{lastReport.posts_minted}</span> fresh posts | Filtered <span className="font-semibold text-foreground">{lastReport.duplicates_rejected_and_mutated}</span> duplicates.
              </p>
            </div>
            <button
              onClick={() => setLastReport(null)}
              aria-label="Close report banner"
              className="text-xs text-foreground-muted hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- KPI Pulse Metric Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-foreground-secondary font-medium">
            <span>Active News Sources</span>
            <Search className="h-4 w-4 text-foreground-muted" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {radar?.pulse.active_sources ?? 12}
            </span>
            <span className="text-xs text-foreground-muted">
              / {radar?.pulse.total_sources ?? 16} active
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">Google News, Reddit, and RSS</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-foreground-secondary font-medium">
            <span>Trending Story Topics</span>
            <Sparkles className="h-4 w-4 text-brand-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {radar?.emerging_clusters.length ?? 3}
            </span>
            <span className="text-xs text-status-success font-medium">Verified by multiple sources</span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">Trending discussion score</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-foreground-secondary font-medium">
            <span>Duplicate Prevention History</span>
            <ShieldCheck className="h-4 w-4 text-foreground-muted" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {radar?.pulse.fingerprints_registered ?? (!isAuthenticated ? 48 : fingerprints.length)}
            </span>
            <span className="text-xs text-foreground-muted">Exact Match & Semantic Memory</span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">180-day brand memory horizon</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-foreground-secondary font-medium">
            <span>Publishing Mode</span>
            <Zap className="h-4 w-4 text-brand-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent font-mono px-2 py-0.5 rounded-full bg-brand-accent-subtle">
              {radar?.pulse.autopilot_mode.replace('_', ' ') ?? 'REVIEW FIRST'}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            Last cycle: {radar?.pulse.last_scoured_at ? new Date(radar.pulse.last_scoured_at).toLocaleTimeString() : 'Pending'}
          </p>
        </div>
      </div>

      {/* --- Navigation Tabs --- */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            activeTab === 'radar'
              ? 'border-brand-primary text-foreground font-semibold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Radio className="h-4 w-4 text-brand-accent" />
          <span>Trending News & Topics</span>
        </button>

        <button
          onClick={() => setActiveTab('novelty')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            activeTab === 'novelty'
              ? 'border-brand-primary text-foreground font-semibold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-brand-accent" />
          <span>Duplicate Prevention Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('cadence')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
            activeTab === 'cadence'
              ? 'border-brand-primary text-foreground font-semibold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4 text-brand-accent" />
          <span>Weekly Schedule & Automation</span>
        </button>
      </div>

      {/* --- TAB 1: Live Scouring Radar & Clusters --- */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Emerging Story Clusters */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Trending Stories Right Now
                </h3>
                <p className="text-xs text-foreground-secondary">
                  Breaking news topics gathered across your industry in the past hour.
                </p>
              </div>
              <span className="rounded-full bg-background-subtle border border-border px-2.5 py-1 text-xs font-mono font-medium text-foreground-secondary">
                {radar?.emerging_clusters.length ?? 0} Active Topics
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-accent" />
                <span className="text-xs font-mono text-foreground-muted">Loading live news stream...</span>
              </div>
            ) : (!radar || radar.emerging_clusters.length === 0) ? (
              <EmptyState
                icon={Radio}
                title="No active topics detected"
                description="Scan for news and ideas to discover trending articles and discussions."
                action={{
                  label: 'Scan for News & Ideas Now',
                  onClick: handleTriggerCycle,
                }}
              />
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {radar.emerging_clusters.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-surface-raised p-4 transition hover:border-brand-accent/50 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-brand-accent-subtle px-2 py-0.5 text-xs font-bold text-foreground">
                          {c.primary_entity}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                          <span className="font-mono">{c.article_count} articles</span>
                          {c.has_consensus && (
                            <span className="inline-flex items-center rounded-full bg-status-success-bg px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="mt-2 text-xs sm:text-sm font-semibold text-foreground line-clamp-2">
                        {c.cluster_title}
                      </h4>
                      {c.summary && (
                        <p className="mt-1 text-xs text-foreground-secondary line-clamp-2 leading-relaxed">
                          {c.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-foreground-muted font-mono">
                      <div className="flex items-center gap-2">
                        <span>Score:</span>
                        <div className="h-1.5 w-16 rounded-full bg-background-sunken overflow-hidden">
                          <div
                            className="h-full bg-brand-accent rounded-full"
                            style={{ width: `${Math.min(100, c.momentum_score)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground">{c.momentum_score}</span>
                      </div>
                      <span className="truncate max-w-30">{(c.source_domains || []).slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discovered Related Sources Table */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Monitored Industry Sources
                </h3>
                <p className="text-xs text-foreground-secondary">
                  News feeds, verified publishers, and community channels monitored for {activeBrand?.name}.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-foreground-muted uppercase font-mono font-semibold tracking-wider text-[10px]">
                    <th className="pb-2.5">Source Name</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Relevance</th>
                    <th className="pb-2.5">Authority</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {discoveredSources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-foreground-muted">
                        No sources discovered yet. Trigger an hourly cycle to run seed discovery.
                      </td>
                    </tr>
                  ) : (
                    discoveredSources.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-raised transition-colors">
                        <td className="py-2.5 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{s.source_name}</span>
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground-muted hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-2.5 text-foreground-secondary uppercase font-mono text-[10px] font-semibold">
                          {s.source_type}
                        </td>
                        <td className="py-2.5 font-semibold text-status-success font-mono">{s.relevance_score}%</td>
                        <td className="py-2.5 font-semibold text-brand-accent font-mono">{s.authority_score}%</td>
                        <td className="py-2.5">
                          <span className="inline-flex rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-medium text-status-success capitalize">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: Novelty & Anti-Duplication Inspector --- */}
      {activeTab === 'novelty' && (
        <div className="space-y-6">
          {/* Theoretical Gate Architecture Card */}
          <div className="rounded-2xl border border-brand-accent/30 bg-surface-raised p-4 sm:p-6 shadow-2xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  3-Tier Duplicate Prevention System
                </h3>
                <p className="mt-1 text-xs text-foreground-secondary leading-relaxed">
                  Every proposed post idea and visual graphic is verified against {activeBrand?.name}&apos;s 180-day publishing history before scheduling:
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
                    <span className="font-bold text-foreground">Tier 1: Exact Phrase Matching</span>
                    <p className="mt-1 text-foreground-secondary text-[11px] leading-relaxed">
                      Catches and replaces identical or closely repeated headlines and opening hooks.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
                    <span className="font-bold text-foreground">Tier 2: Idea Repetition Filter</span>
                    <p className="mt-1 text-foreground-secondary text-[11px] leading-relaxed">
                      Detects if the core concept or insight was already shared recently, ensuring fresh angles.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
                    <span className="font-bold text-foreground">Tier 3: Design Variety Rotation</span>
                    <p className="mt-1 text-foreground-secondary text-[11px] leading-relaxed">
                      Automatically rotates layouts and color palettes to keep your social feed looking varied and fresh.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fingerprint Registry Table */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Idea & Post History Memory
                </h3>
                <p className="text-xs text-foreground-secondary">
                  Secure history of published topics, hooks, and visual formats to ensure originality.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-foreground-muted">
                {fingerprints.length} Registered Records
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-foreground-muted uppercase font-mono font-semibold tracking-wider text-[10px]">
                    <th className="pb-2.5">Channel</th>
                    <th className="pb-2.5">Memory ID</th>
                    <th className="pb-2.5">Hook & Concept</th>
                    <th className="pb-2.5">Design Template</th>
                    <th className="pb-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fingerprints.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-foreground-muted">
                        No content fingerprints registered yet. Content generated will appear here.
                      </td>
                    </tr>
                  ) : (
                    fingerprints.map((fp) => (
                      <tr key={fp.id} className="hover:bg-surface-raised transition-colors">
                        <td className="py-2.5 font-bold uppercase font-mono text-[10px] text-brand-accent">
                          {fp.channel}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-foreground-muted">
                          {fp.simhash_64}
                        </td>
                        <td className="py-2.5 text-foreground max-w-xs truncate">
                          <span className="font-semibold">{fp.hook_text}</span>
                          <span className="block text-[10px] text-foreground-secondary truncate">
                            {fp.concept_summary}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-foreground-secondary">
                          {fp.creative_template_id}
                        </td>
                        <td className="py-2.5 text-foreground-muted font-mono">
                          {new Date(fp.published_or_scheduled_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: Cadence & Autopilot Blueprint --- */}
      {activeTab === 'cadence' && (
        <div className="space-y-6">
          {saveSuccessMsg && (
            <div className="rounded-xl border border-status-success/30 bg-status-success-bg p-3 text-xs font-semibold text-status-success">
              ✓ {saveSuccessMsg}
            </div>
          )}

          {/* Autopilot Operational Mode Cards */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Automation & Review Settings
            </h3>
            <p className="text-xs text-foreground-secondary">
              Choose how much autonomy AutoCanvas has when preparing posts for {activeBrand?.name}.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'copilot_manual',
                  title: 'Review First (Recommended)',
                  desc: 'AutoCanvas prepares fresh ideas and graphics for your approval. Nothing publishes without your 1-click confirmation.',
                },
                {
                  id: 'assisted_autopilot',
                  title: 'Assisted Scheduling',
                  desc: 'Automatically queues verified industry updates, while holding key announcements for your review.',
                },
                {
                  id: 'full_autonomous',
                  title: 'Full Autopilot',
                  desc: 'Hands-off operation. Automatically keeps your calendar full with fresh, original posts.',
                },
              ].map((mode) => (
                <div
                  key={mode.id}
                  onClick={() =>
                    cadence &&
                    setCadence({
                      ...cadence,
                      autopilot_mode: mode.id as BrandCadenceSettingData['autopilot_mode'],
                    })
                  }
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    cadence?.autopilot_mode === mode.id
                      ? 'border-brand-primary bg-surface-raised ring-1 ring-brand-primary shadow-xs'
                      : 'border-border bg-surface hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{mode.title}</span>
                    {cadence?.autopilot_mode === mode.id && (
                      <CheckCircle2 className="h-4 w-4 text-brand-accent" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-foreground-secondary leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Posting Rhythm Slots Matrix */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Weekly Publishing Schedule
                </h3>
                <p className="text-xs text-foreground-secondary">
                  AutoCanvas plans ahead and prepares fresh content for these time slots automatically.
                </p>
              </div>
              <button
                onClick={handleAddSlot}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background-subtle focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 text-brand-accent" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {cadence?.weekly_schedule.length === 0 ? (
                <div className="py-6 text-center text-xs text-foreground-muted">
                  No weekly cadence slots scheduled. Add target slots to activate the autopilot loop.
                </div>
              ) : (
                cadence?.weekly_schedule.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-foreground-muted" />
                      <select
                        aria-label="Select Target Day"
                        value={slot.day}
                        onChange={(e) => handleSlotChange(index, 'day', e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-focus-ring"
                      >
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => (
                          <option key={d} value={d}>
                            {d.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="time"
                      aria-label="Select Target Slot Time"
                      value={slot.time}
                      onChange={(e) => handleSlotChange(index, 'time', e.target.value)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-focus-ring"
                    >
                    </input>

                    <select
                      aria-label="Select Target Channel"
                      value={slot.channel}
                      onChange={(e) => handleSlotChange(index, 'channel', e.target.value)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-focus-ring"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter / X</option>
                    </select>

                    <button
                      onClick={() => handleRemoveSlot(index)}
                      aria-label="Delete slot"
                      className="ml-auto text-foreground-muted hover:text-status-danger transition p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveCadence}
                disabled={savingCadence}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
              >
                {savingCadence && <RefreshCw className="h-4 w-4 animate-spin text-brand-accent" />}
                <span>{savingCadence ? 'Saving Settings...' : 'Save Cadence Configuration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
