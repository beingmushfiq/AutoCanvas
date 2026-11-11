import React, { useState, useEffect } from 'react'
import {
  Plus,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Tag,
  Lightbulb,
  X,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Compass,
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type CompetitorGapReport,
  type CompetitorInsights,
  type CompetitorPost,
  type CompetitorProfile,
} from '../../lib/api/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'

interface CompetitorManagerProps {
  brandId: string
}

export const CompetitorManager: React.FC<CompetitorManagerProps> = ({ brandId }) => {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([])
  const [insights, setInsights] = useState<CompetitorInsights | null>(null)
  const [gaps, setGaps] = useState<CompetitorGapReport | null>(null)
  const [activeCompetitorId, setActiveCompetitorId] = useState<string | null>(null)
  const [posts, setPosts] = useState<CompetitorPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modals
  const [showAddCompetitorModal, setShowAddCompetitorModal] = useState(false)
  const [showLogPostModal, setShowLogPostModal] = useState(false)

  // New Competitor Form
  const [compName, setCompName] = useState('')
  const [compWebsite, setCompWebsite] = useState('')
  const [compStrengths, setCompStrengths] = useState('')
  const [compWeaknesses, setCompWeaknesses] = useState('')
  const [compCadence, setCompCadence] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  // Log Post Form
  const [postPlatform, setPostPlatform] = useState<
    'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'other'
  >('linkedin')
  const [postUrl, setPostUrl] = useState('')
  const [postText, setPostText] = useState('')
  const [postLikes, setPostLikes] = useState(0)
  const [postComments, setPostComments] = useState(0)
  const [postThemesStr, setPostThemesStr] = useState('ai_automation, product_update')
  const [postTone, setPostTone] = useState('professional')
  const [postTakeaway, setPostTakeaway] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [compsRes, insightsRes, gapsRes] = await Promise.all([
        apiClient.get<ApiResponse<CompetitorProfile[]>>(`/brands/${brandId}/competitors`),
        apiClient.get<ApiResponse<CompetitorInsights>>(`/brands/${brandId}/competitor-insights`),
        apiClient.getCompetitorGaps(brandId).catch(() => ({ success: false, data: undefined })),
      ])

      const compList = compsRes.data || []
      setCompetitors(compList)
      setInsights(insightsRes.data || null)
      if (gapsRes.success && gapsRes.data) {
        setGaps(gapsRes.data)
      }

      if (compList.length > 0 && !activeCompetitorId) {
        setActiveCompetitorId(compList[0].id)
        await fetchCompetitorPosts(compList[0].id)
      } else if (activeCompetitorId) {
        await fetchCompetitorPosts(activeCompetitorId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competitors')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitorPosts = async (compId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<CompetitorPost[]>>(`/research/competitors/${compId}/posts`)
      setPosts(res.data || [])
    } catch (err) {
      console.error('Failed to load posts:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [brandId])

  const handleSelectCompetitor = (compId: string) => {
    setActiveCompetitorId(compId)
    fetchCompetitorPosts(compId)
  }

  const handleAddCompetitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      await apiClient.post(`/brands/${brandId}/competitors`, {
        name: compName,
        website_url: compWebsite || null,
        strengths: compStrengths || null,
        weaknesses: compWeaknesses || null,
        observation_frequency: compCadence,
      })
      setShowAddCompetitorModal(false)
      setCompName('')
      setCompWebsite('')
      setCompStrengths('')
      setCompWeaknesses('')
      setSuccess('Competitor profile registered.')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register competitor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompetitorId) return
    try {
      setSubmitting(true)
      setError(null)
      const themes = postThemesStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      await apiClient.post(`/research/competitors/${activeCompetitorId}/posts`, {
        platform: postPlatform,
        post_url: postUrl || null,
        post_text: postText,
        engagement_signals: { likes: postLikes, comments: postComments },
        observed_themes: themes,
        tone: postTone,
        tactical_takeaway: postTakeaway || null,
      })
      setShowLogPostModal(false)
      setPostText('')
      setPostUrl('')
      setPostTakeaway('')
      setSuccess('Competitor post observation recorded!')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record post observation')
    } finally {
      setSubmitting(false)
    }
  }

  const activeComp = competitors.find((c) => c.id === activeCompetitorId)

  if (loading && competitors.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-foreground-secondary">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-accent" />
        Loading competitor intelligence...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {success && (
        <div className="p-3.5 rounded-xl bg-status-success-bg border border-status-success text-xs text-status-success flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess(null)} className="hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger text-xs text-status-danger flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Aggregate Insights Banner */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs">
            <span className="text-xs font-medium text-foreground-secondary">Competitors Tracked</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{insights.total_competitors}</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs">
            <span className="text-xs font-medium text-foreground-secondary">Observed Posts</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{insights.total_posts_observed}</span>
              <span className="text-xs text-foreground-muted">Logged</span>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs">
            <span className="text-xs font-medium text-foreground-secondary">Avg Posts / Week</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{insights.avg_posts_per_week}</span>
              <span className="text-xs text-foreground-muted">Cadence</span>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs">
            <span className="text-xs font-medium text-foreground-secondary">Total Engagements</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-brand-accent">{insights.total_engagements_observed}</span>
              <span className="text-xs text-foreground-muted">Signals</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Themes Tag Cloud */}
      {insights && insights.top_themes.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs">
          <div className="flex items-center gap-2 mb-2.5">
            <Tag className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-xs font-bold text-foreground">Top Observed Themes in Market</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.top_themes.map((t) => (
              <span
                key={t.theme}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background-subtle text-foreground border border-border flex items-center gap-1.5"
              >
                <span>#{t.theme}</span>
                <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded-full font-bold shadow-2xs border border-border">
                  {t.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Market Whitespace (Gap Analysis) */}
      {gaps && gaps.whitespace_opportunities.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface border border-brand-accent/30 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-bold text-foreground">
              Market Whitespace: Untapped Content Pillar Opportunities
            </span>
            <Badge variant="accent">
              {gaps.total_gaps_identified} Untapped Themes
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gaps.whitespace_opportunities.map((gap) => (
              <div
                key={gap.pillar_id}
                className="p-3 rounded-xl bg-surface-raised border border-border text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{gap.pillar_name}</span>
                  <Badge variant="success">Zero Competitor Activity</Badge>
                </div>
                <p className="text-[11px] text-foreground-secondary leading-relaxed">
                  {gap.strategic_advantage}
                </p>
                <div className="text-[11px] font-medium text-brand-accent">
                  👉 {gap.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace: Left Column Competitor List, Right Column Posts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Competitors */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-wide">Competitors</h4>
            <Button
              type="button"
              onClick={() => setShowAddCompetitorModal(true)}
              variant="default"
              size="icon"
              title="Add Competitor"
              aria-label="Add Competitor"
              className="w-7 h-7"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {competitors.length === 0 ? (
            <div className="py-8 text-center text-xs text-foreground-muted">No competitors registered yet.</div>
          ) : (
            <div className="space-y-1.5">
              {competitors.map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleSelectCompetitor(comp.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    activeCompetitorId === comp.id
                      ? 'bg-background-subtle border-brand-accent text-foreground font-semibold'
                      : 'border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{comp.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border font-semibold text-foreground-muted">
                      {comp.posts_count ?? 0} posts
                    </span>
                  </div>
                  {comp.website_url && (
                    <span className="text-[11px] text-foreground-muted truncate block mt-0.5">
                      {comp.website_url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Competitor Posts & Observation */}
        <div className="md:col-span-2 space-y-4">
          {activeComp ? (
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between pb-4 border-b border-border mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{activeComp.name}</h3>
                    {activeComp.website_url && (
                      <a
                        href={activeComp.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-accent hover:opacity-80"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-foreground-secondary">
                    {activeComp.strengths && <span>Strengths: {activeComp.strengths}</span>}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setShowLogPostModal(true)}
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Post</span>
                </Button>
              </div>

              {/* Observed Posts Feed */}
              {posts.length === 0 ? (
                <div className="p-8 text-center text-xs text-foreground-secondary">
                  No posts logged for {activeComp.name} yet. Click &quot;Log Post&quot; to track their content moves.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 rounded-xl border border-border bg-background-subtle space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="uppercase font-bold">
                            {post.platform}
                          </Badge>
                          <span className="text-foreground-muted text-[11px] font-mono">
                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Observed recently'}
                          </span>
                        </div>

                        {post.engagement_signals && (
                          <div className="flex items-center gap-3 text-[11px] text-foreground-secondary font-medium">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-brand-accent" /> {post.engagement_signals.likes ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-brand-accent" /> {post.engagement_signals.comments ?? 0}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{post.post_text}</p>

                      {post.tactical_takeaway && (
                        <div className="p-2.5 rounded-xl bg-status-warning-bg border border-status-warning text-status-warning flex items-start gap-2 text-xs">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Takeaway:</strong> {post.tactical_takeaway}
                          </span>
                        </div>
                      )}

                      {post.observed_themes && post.observed_themes.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {post.observed_themes.map((th) => (
                            <Badge
                              key={th}
                              variant="outline"
                            >
                              #{th}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-12 text-center text-xs text-foreground-secondary">
              Select a competitor from the left or register a new one to view observations.
            </div>
          )}
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showAddCompetitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Add Competitor Profile</h3>
              <button
                type="button"
                onClick={() => setShowAddCompetitorModal(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCompetitorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Competitor Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Website URL</label>
                <Input
                  type="url"
                  placeholder="https://acme.example.com"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Key Strengths</label>
                <Input
                  type="text"
                  placeholder="e.g. Fast shipping, high ad spend"
                  value={compStrengths}
                  onChange={(e) => setCompStrengths(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Observation Frequency</label>
                <select
                  value={compCadence}
                  onChange={(e) => setCompCadence(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-3 py-2 rounded-xl bg-surface text-foreground border border-border text-xs outline-hidden focus:ring-2 focus:ring-focus-ring"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Vulnerabilities / Gaps</label>
                <Input
                  type="text"
                  placeholder="e.g. Weak technical content, slow replies"
                  value={compWeaknesses}
                  onChange={(e) => setCompWeaknesses(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCompetitorModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="default"
                >
                  {submitting ? 'Saving...' : 'Add Competitor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Post Modal */}
      {showLogPostModal && activeComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-2xl w-full max-w-lg border border-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Log Competitor Post</h3>
                <p className="text-xs text-foreground-secondary">Observed post for {activeComp.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogPostModal(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogPostSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Platform</label>
                  <select
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface text-foreground border border-border text-xs outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Tone</label>
                  <Input
                    type="text"
                    value={postTone}
                    onChange={(e) => setPostTone(e.target.value)}
                    placeholder="e.g. Technical, Promotional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Post Text / Copy</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste observed post copy..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Estimated Likes</label>
                  <Input
                    type="number"
                    value={postLikes}
                    onChange={(e) => setPostLikes(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Estimated Comments</label>
                  <Input
                    type="number"
                    value={postComments}
                    onChange={(e) => setPostComments(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Observed Themes (comma-separated)
                </label>
                <Input
                  type="text"
                  value={postThemesStr}
                  onChange={(e) => setPostThemesStr(e.target.value)}
                  placeholder="e.g. ai_trends, hiring, customer_story"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tactical Takeaway / Opportunity</label>
                <Input
                  type="text"
                  value={postTakeaway}
                  onChange={(e) => setPostTakeaway(e.target.value)}
                  placeholder="e.g. They ignored pricing pushback; we can post about transparent pricing"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLogPostModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="default"
                >
                  {submitting ? 'Recording...' : 'Log Observation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
