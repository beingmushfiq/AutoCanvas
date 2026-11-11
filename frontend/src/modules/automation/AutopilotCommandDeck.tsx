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

interface AutopilotCommandDeckProps {
  currentBrandId?: string
}

export const AutopilotCommandDeck: React.FC<AutopilotCommandDeckProps> = ({ currentBrandId }) => {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>(currentBrandId || '')
  const [radar, setRadar] = useState<AutopilotRadarData | null>(null)
  const [cadence, setCadence] = useState<BrandCadenceSettingData | null>(null)
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredSourceItem[]>([])
  const [fingerprints, setFingerprints] = useState<ContentFingerprintItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [triggering, setTriggering] = useState<boolean>(false)
  const [savingCadence, setSavingCadence] = useState<boolean>(false)
  const [lastReport, setLastReport] = useState<AutopilotCycleReport | null>(null)
  const [activeTab, setActiveTab] = useState<'radar' | 'novelty' | 'cadence'>('radar')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('')

  // Load brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await apiClient.getBrands()
        if (res.data && res.data.length > 0) {
          setBrands(res.data)
          if (!selectedBrandId) {
            setSelectedBrandId(res.data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      }
    }
    fetchBrands()
  }, [selectedBrandId])

  // Load radar & cadence data for active brand
  const loadAutopilotData = useCallback(async () => {
    if (!selectedBrandId) return
    setLoading(true)
    try {
      const [radarRes, cadenceRes, sourcesRes, fpsRes] = await Promise.all([
        apiClient.getAutopilotRadar(selectedBrandId),
        apiClient.getAutopilotCadence(selectedBrandId),
        apiClient.getDiscoveredSources(selectedBrandId),
        apiClient.getContentFingerprints(selectedBrandId),
      ])

      if (radarRes.data) setRadar(radarRes.data)
      if (cadenceRes.data) setCadence(cadenceRes.data)
      if (sourcesRes.data?.data) setDiscoveredSources(sourcesRes.data.data)
      if (fpsRes.data?.data) setFingerprints(fpsRes.data.data)
    } catch (err) {
      console.error('Failed to load autopilot radar data:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedBrandId])

  useEffect(() => {
    loadAutopilotData()
  }, [loadAutopilotData])

  // Trigger manual on-demand cycle
  const handleTriggerCycle = async () => {
    if (!selectedBrandId || triggering) return
    setTriggering(true)
    setLastReport(null)
    try {
      const res = await apiClient.triggerAutopilotCycle(selectedBrandId)
      if (res.data) {
        setLastReport(res.data)
        await loadAutopilotData()
      }
    } catch (err) {
      console.error('Failed to trigger autonomous cycle:', err)
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
        setTimeout(() => setSaveSuccessMsg(''), 4000)
      }
    } catch (err) {
      console.error('Failed to update cadence:', err)
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
  const handleSlotChange = (index: number, field: keyof BrandCadenceSlot, value: string) => {
    if (!cadence) return
    const updated = [...cadence.weekly_schedule]
    updated[index] = { ...updated[index], [field]: value }
    setCadence({
      ...cadence,
      weekly_schedule: updated,
    })
  }

  const activeBrand = brands.find((b) => b.id === selectedBrandId)

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 font-sans">
      {/* --- Top Operational Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] ring-1 ring-[var(--brand-accent)]/30">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Live News & Content Radar
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
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
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
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
            disabled={triggering || loading}
            aria-label="Run Autonomous Cycle on Demand"
            className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--surface-primary)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50 shadow-sm"
          >
            {triggering ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span>{triggering ? 'Gathering News & Ideas...' : 'Scan for News & Ideas Now'}</span>
          </button>
        </div>
      </div>

      {/* --- Cycle Report Banner (if triggered) --- */}
      {lastReport && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                News & Idea Scan Complete for {lastReport.brand}
              </h4>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Scanned <span className="font-semibold text-[var(--text-primary)]">{lastReport.sources_discovered}</span> sources | Found <span className="font-semibold text-[var(--text-primary)]">{lastReport.opportunities_found}</span> trends | Drafted <span className="font-semibold text-[var(--text-primary)]">{lastReport.posts_minted}</span> fresh posts | Filtered <span className="font-semibold text-[var(--text-primary)]">{lastReport.duplicates_rejected_and_mutated}</span> duplicates.
              </p>
            </div>
            <button
              onClick={() => setLastReport(null)}
              aria-label="Close report banner"
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- KPI Pulse Metric Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>Active News Sources</span>
            <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {radar?.pulse.active_sources ?? 0}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              / {radar?.pulse.total_sources ?? 0} active
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Google News, Reddit, and RSS</p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>Trending Story Topics</span>
            <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {radar?.emerging_clusters.length ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Verified by multiple sources</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Trending discussion score</p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>Duplicate Prevention History</span>
            <ShieldCheck className="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {radar?.pulse.fingerprints_registered ?? 0}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">Exact Match & Semantic Memory</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">180-day brand memory horizon</p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>Publishing Mode</span>
            <Zap className="h-4 w-4 text-[var(--brand-accent)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--brand-accent)]">
              {radar?.pulse.autopilot_mode.replace('_', ' ') ?? 'REVIEW FIRST'}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Last cycle: {radar?.pulse.last_scoured_at ? new Date(radar.pulse.last_scoured_at).toLocaleTimeString() : 'Pending'}
          </p>
        </div>
      </div>

      {/* --- Navigation Tabs --- */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] ${
            activeTab === 'radar'
              ? 'border-[var(--brand-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Trending News & Topics</span>
        </button>

        <button
          onClick={() => setActiveTab('novelty')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] ${
            activeTab === 'novelty'
              ? 'border-[var(--brand-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Duplicate Prevention Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('cadence')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] ${
            activeTab === 'cadence'
              ? 'border-[var(--brand-primary)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Weekly Schedule & Automation</span>
        </button>
      </div>

      {/* --- TAB 1: Live Scouring Radar & Clusters --- */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Emerging Story Clusters */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Trending Stories Right Now
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Breaking news topics gathered across your industry in the past hour.
                </p>
              </div>
              <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                {radar?.emerging_clusters.length ?? 0} Active Topics
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">Loading news stream...</div>
            ) : radar?.emerging_clusters.length === 0 ? (
              <EmptyState
                icon={Radio}
                title="No active topics detected"
                description="Scan for news and ideas to discover trending articles and discussions."
              />
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {radar?.emerging_clusters.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 transition hover:border-[var(--border-bold)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-[var(--brand-accent)]/15 px-2 py-0.5 text-xs font-bold text-[var(--brand-accent)]">
                          {c.primary_entity}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                          <span>{c.article_count} articles</span>
                          {c.has_consensus && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="mt-2 text-xs sm:text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                        {c.cluster_title}
                      </h4>
                      {c.summary && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
                          {c.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <div className="flex items-center gap-2">
                        <span>Trending Score:</span>
                        <div className="h-1.5 w-16 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--brand-accent)]"
                            style={{ width: `${Math.min(100, c.momentum_score)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{c.momentum_score}</span>
                      </div>
                      <span>{(c.source_domains || []).slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discovered Related Sources Table */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Monitored Industry Sources
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  News feeds, verified publishers, and community channels monitored for {activeBrand?.name}.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
                    <th className="pb-2.5">Source Name</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Relevance</th>
                    <th className="pb-2.5">Authority</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {discoveredSources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--text-tertiary)]">
                        No sources discovered yet. Trigger an hourly cycle to run seed discovery.
                      </td>
                    </tr>
                  ) : (
                    discoveredSources.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--surface-secondary)]/50">
                        <td className="py-2.5 font-medium text-[var(--text-primary)]">
                          <div className="flex items-center gap-1.5">
                            <span>{s.source_name}</span>
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-2.5 text-[var(--text-secondary)] uppercase text-[10px] font-semibold">
                          {s.source_type}
                        </td>
                        <td className="py-2.5 font-semibold text-emerald-600">{s.relevance_score}%</td>
                        <td className="py-2.5 font-semibold text-[var(--brand-accent)]">{s.authority_score}%</td>
                        <td className="py-2.5">
                          <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 capitalize">
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
          <div className="rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--surface-secondary)] p-4 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--brand-accent)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  3-Tier Duplicate Prevention System
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Every proposed post idea and visual graphic is verified against {activeBrand?.name}&apos;s 180-day publishing history before scheduling:
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
                    <span className="font-bold text-[var(--text-primary)]">Tier 1: Exact Phrase Matching</span>
                    <p className="mt-1 text-[var(--text-secondary)] text-[11px]">
                      Catches and replaces identical or closely repeated headlines and opening hooks.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
                    <span className="font-bold text-[var(--text-primary)]">Tier 2: Idea Repetition Filter</span>
                    <p className="mt-1 text-[var(--text-secondary)] text-[11px]">
                      Detects if the core concept or insight was already shared recently, ensuring fresh angles.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
                    <span className="font-bold text-[var(--text-primary)]">Tier 3: Design Variety Rotation</span>
                    <p className="mt-1 text-[var(--text-secondary)] text-[11px]">
                      Automatically rotates layouts and color palettes to keep your social feed looking varied and fresh.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fingerprint Registry Table */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Idea & Post History Memory
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Secure history of published topics, hooks, and visual formats to ensure originality.
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--text-tertiary)]">
                {fingerprints.length} Registered Records
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
                    <th className="pb-2.5">Channel</th>
                    <th className="pb-2.5">Memory ID</th>
                    <th className="pb-2.5">Hook & Concept</th>
                    <th className="pb-2.5">Design Template</th>
                    <th className="pb-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {fingerprints.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--text-tertiary)]">
                        No content fingerprints registered yet. Content generated will appear here.
                      </td>
                    </tr>
                  ) : (
                    fingerprints.map((fp) => (
                      <tr key={fp.id} className="hover:bg-[var(--surface-secondary)]/50">
                        <td className="py-2.5 font-bold uppercase text-[10px] text-[var(--brand-accent)]">
                          {fp.channel}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-[var(--text-tertiary)]">
                          {fp.simhash_64}
                        </td>
                        <td className="py-2.5 text-[var(--text-primary)] max-w-xs truncate">
                          <span className="font-semibold">{fp.hook_text}</span>
                          <span className="block text-[10px] text-[var(--text-secondary)] truncate">
                            {fp.concept_summary}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-[var(--text-secondary)]">
                          {fp.creative_template_id}
                        </td>
                        <td className="py-2.5 text-[var(--text-tertiary)]">
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
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600">
              ✓ {saveSuccessMsg}
            </div>
          )}

          {/* Autopilot Operational Mode Cards */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              Automation & Review Settings
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
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
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    cadence?.autopilot_mode === mode.id
                      ? 'border-[var(--brand-primary)] bg-[var(--surface-secondary)] ring-1 ring-[var(--brand-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-primary)] hover:border-[var(--border-bold)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{mode.title}</span>
                    {cadence?.autopilot_mode === mode.id && (
                      <CheckCircle2 className="h-4 w-4 text-[var(--brand-accent)]" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Posting Rhythm Slots Matrix */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Weekly Publishing Schedule
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  AutoCanvas plans ahead and prepares fresh content for these time slots automatically.
                </p>
              </div>
              <button
                onClick={handleAddSlot}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {cadence?.weekly_schedule.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                  No weekly cadence slots scheduled. Add target slots to activate the autopilot loop.
                </div>
              ) : (
                cadence?.weekly_schedule.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                      <select
                        aria-label="Select Target Day"
                        value={slot.day}
                        onChange={(e) => handleSlotChange(index, 'day', e.target.value)}
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)]"
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
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)]"
                    />

                    <select
                      aria-label="Select Target Channel"
                      value={slot.channel}
                      onChange={(e) => handleSlotChange(index, 'channel', e.target.value)}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)]"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter / X</option>
                    </select>

                    <button
                      onClick={() => handleRemoveSlot(index)}
                      aria-label="Delete slot"
                      className="ml-auto text-[var(--text-tertiary)] hover:text-red-500 transition p-1"
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
                className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2 text-xs sm:text-sm font-semibold text-[var(--surface-primary)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50 shadow-sm"
              >
                {savingCadence && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>{savingCadence ? 'Saving Settings...' : 'Save Cadence Configuration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
