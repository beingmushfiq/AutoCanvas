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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#101828]">Trend Opportunities Radar</h3>
          <p className="text-xs text-[#667085] mt-0.5">
            AI-detected content angles cross-referenced with your brand pillars and fresh industry signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-[#F2F4F7] p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === 'all' ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085]'
              }`}
            >
              All Signals ({opportunities.filter((o) => o.status === 'new').length})
            </button>
            <button
              onClick={() => setFilter('high_urgency')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                filter === 'high_urgency' ? 'bg-white text-rose-600 shadow-xs' : 'text-[#667085]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              High Urgency
            </button>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] transition-all shadow-xs disabled:opacity-50"
          >
            {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{scanning ? 'Scanning Radar...' : 'Scan for Opportunities'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          {onNavigateToContent && (
            <button
              onClick={onNavigateToContent}
              className="font-semibold underline hover:text-emerald-900 flex items-center gap-1"
            >
              View in Content Studio <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[#EAECF0] bg-white">
          <div className="w-12 h-12 rounded-xl bg-[#F4F3FF] text-[#6257E8] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-[#101828]">No active opportunities on the radar</h4>
          <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1 mb-4">
            Click &quot;Scan for Opportunities&quot; to analyze recent industry feeds and competitor posts.
          </p>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] transition-all"
          >
            Scan Radar Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-xl border border-[#EAECF0] p-5 shadow-xs flex flex-col justify-between hover:border-[#6257E8]/40 transition-all"
            >
              <div>
                {/* Meta Badge Bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {opp.pillar ? (
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white flex items-center gap-1"
                        style={{ backgroundColor: opp.pillar.color_tag }}
                      >
                        <Layers className="w-3 h-3" />
                        {opp.pillar.name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F2F4F7] text-[#344054]">
                        General Strategy
                      </span>
                    )}

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200/60">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>Urgency: {opp.urgency_score}%</span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200/60">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>Freshness: {opp.freshness_score}%</span>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#F4F3FF] text-[#6257E8] font-bold text-xs flex items-center justify-center shrink-0 border border-[#6257E8]/20">
                    {opp.overall_opportunity_score}
                  </div>
                </div>

                {/* Title & Angle */}
                <h4 className="text-sm font-bold text-[#101828] leading-snug">{opp.title}</h4>
                <p className="text-xs text-[#344054] mt-2 leading-relaxed bg-[#F9FAFB] p-3 rounded-lg border border-[#EAECF0]">
                  <strong className="text-[#101828]">Angle:</strong> {opp.angle}
                </p>

                {/* Why it matters */}
                <p className="text-xs text-[#667085] mt-2.5 leading-relaxed">
                  <strong className="text-[#344054]">Why it matters:</strong> {opp.why_it_matters}
                </p>

                {/* Source Article Link (if available) */}
                {opp.article && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6257E8]">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <a
                      href={opp.article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium truncate max-w-xs hover:text-[#5245db]"
                    >
                      Source: {opp.article.title}
                    </a>
                  </div>
                )}

                {/* Recommended Channels */}
                <div className="mt-3.5 flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#667085]">Channels:</span>
                  {opp.recommended_channels.map((ch) => (
                    <span
                      key={ch}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#F2F4F7] text-[#344054] tracking-wide"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-[#EAECF0] flex items-center justify-between">
                <button
                  onClick={() => handleDismiss(opp.id)}
                  className="text-xs text-[#667085] hover:text-[#101828] font-medium transition-colors"
                >
                  Dismiss
                </button>

                <button
                  onClick={() => handleConvert(opp)}
                  disabled={convertingId === opp.id}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#101828] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs disabled:opacity-50"
                >
                  {convertingId === opp.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{convertingId === opp.id ? 'Generating Drafts...' : 'Convert to Draft Post'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
