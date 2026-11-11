import React, { useState } from 'react'
import {
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Share2,
  RefreshCw,
  Layers,
} from 'lucide-react'
import { apiClient, type ApiResponse, type ContentOpportunity } from '../../lib/api/client'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'

interface OpportunitiesRadarProps {
  brandId: string
  opportunities: ContentOpportunity[]
  onRefresh: () => void
  onNavigateToContent?: () => void
}

export const OpportunitiesRadar: React.FC<OpportunitiesRadarProps> = ({
  brandId,
  opportunities,
  onRefresh,
  onNavigateToContent,
}) => {
  const [scanning, setScanning] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'high_urgency'>('all')

  const handleScan = async () => {
    try {
      setScanning(true)
      setError(null)
      await apiClient.post<ApiResponse<ContentOpportunity[]>>(`/brands/${brandId}/opportunities/detect`, {
        limit: 4,
      })
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for opportunities')
    } finally {
      setScanning(false)
    }
  }

  const handleConvert = async (opp: ContentOpportunity) => {
    try {
      setConvertingId(opp.id)
      setError(null)
      await apiClient.post<ApiResponse<{ opportunity: ContentOpportunity; content_item: unknown }>>(
        `/research/opportunities/${opp.id}/convert`,
        { generate_creative: true }
      )
      setSuccessMessage(`Opportunity converted! Draft post created in Content Studio.`)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert opportunity')
    } finally {
      setConvertingId(null)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await apiClient.post(`/research/opportunities/${id}/dismiss`)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss opportunity')
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (opp.status !== 'new') return false
    if (filter === 'high_urgency') return opp.urgency_score >= 80
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Trend Opportunities Radar</h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            AI-detected content angles cross-referenced with your brand pillars and fresh industry signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-background-subtle border border-border p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                filter === 'all' ? 'bg-surface text-foreground shadow-2xs font-semibold' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              All Signals ({opportunities.filter((o) => o.status === 'new').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('high_urgency')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                filter === 'high_urgency' ? 'bg-surface text-status-danger shadow-2xs font-semibold' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-status-danger" />
              <span>High Urgency</span>
            </button>
          </div>

          <Button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            variant="default"
            className="gap-2"
          >
            {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{scanning ? 'Scanning Radar...' : 'Scan for Opportunities'}</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-status-success-bg border border-status-success flex items-center justify-between text-xs text-status-success font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          {onNavigateToContent && (
            <button
              type="button"
              onClick={onNavigateToContent}
              className="font-semibold underline hover:opacity-80 flex items-center gap-1"
            >
              View in Content Studio <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-status-danger-bg border border-status-danger text-xs text-status-danger flex items-center gap-2 font-semibold">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-8">
          <EmptyState
            icon={Sparkles}
            title="No active opportunities on the radar"
            description="Click 'Scan for Opportunities' to analyze recent industry feeds, news sources, and competitor publications."
            action={{
              label: 'Scan Radar Now',
              onClick: handleScan,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between hover:border-brand-accent/40 transition-all"
            >
              <div>
                {/* Meta Badge Bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {opp.pillar ? (
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white flex items-center gap-1"
                        style={{ backgroundColor: opp.pillar.color_tag }}
                      >
                        <Layers className="w-3 h-3" />
                        {opp.pillar.name}
                      </span>
                    ) : (
                      <Badge variant="secondary">General Strategy</Badge>
                    )}

                    <Badge variant={opp.urgency_score >= 80 ? 'danger' : 'warning'} className="gap-1">
                      <Flame className="w-3 h-3" />
                      <span>Urgency: {opp.urgency_score}%</span>
                    </Badge>

                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Freshness: {opp.freshness_score}%</span>
                    </Badge>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-background-subtle text-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-border">
                    {opp.overall_opportunity_score}
                  </div>
                </div>

                {/* Title & Angle */}
                <h4 className="text-sm font-bold text-foreground leading-snug">{opp.title}</h4>
                <p className="text-xs text-foreground-secondary mt-2 leading-relaxed bg-background-subtle p-3 rounded-xl border border-border">
                  <strong className="text-foreground">Angle:</strong> {opp.angle}
                </p>

                {/* Why it matters */}
                <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
                  <strong className="text-foreground">Why it matters:</strong> {opp.why_it_matters}
                </p>

                {/* Source Article Link (if available) */}
                {opp.article && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-accent">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <a
                      href={opp.article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium truncate max-w-xs hover:opacity-80"
                    >
                      Source: {opp.article.title}
                    </a>
                  </div>
                )}

                {/* Recommended Channels */}
                <div className="mt-3.5 flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-foreground-muted">Channels:</span>
                  {opp.recommended_channels.map((ch) => (
                    <span
                      key={ch}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-background-subtle border border-border text-foreground-secondary tracking-wide"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDismiss(opp.id)}
                  className="text-xs text-foreground-muted hover:text-foreground font-medium transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring rounded-lg px-2 py-1"
                >
                  Dismiss
                </button>

                <Button
                  type="button"
                  onClick={() => handleConvert(opp)}
                  disabled={convertingId === opp.id}
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                >
                  {convertingId === opp.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-status-success" />
                  )}
                  <span>{convertingId === opp.id ? 'Generating Drafts...' : 'Convert to Draft Post'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
