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
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type CompetitorInsights,
  type CompetitorPost,
  type CompetitorProfile,
} from '../../lib/api/client'

interface CompetitorManagerProps {
  brandId: string
}

export const CompetitorManager: React.FC<CompetitorManagerProps> = ({ brandId }) => {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([])
  const [insights, setInsights] = useState<CompetitorInsights | null>(null)
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
      const [compsRes, insightsRes] = await Promise.all([
        apiClient.get<ApiResponse<CompetitorProfile[]>>(`/brands/${brandId}/competitors`),
        apiClient.get<ApiResponse<CompetitorInsights>>(`/brands/${brandId}/competitor-insights`),
      ])

      const compList = compsRes.data || []
      setCompetitors(compList)
      setInsights(insightsRes.data || null)

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
      <div className="p-12 text-center text-xs text-[#667085]">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6257E8]" />
        Loading competitor intelligence...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Aggregate Insights Banner */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-xs">
            <span className="text-xs font-medium text-[#667085]">Competitors Tracked</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#101828]">{insights.total_competitors}</span>
              <span className="text-xs text-emerald-600 font-medium">Active</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-xs">
            <span className="text-xs font-medium text-[#667085]">Observed Posts</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#101828]">{insights.total_posts_observed}</span>
              <span className="text-xs text-[#667085]">Logged</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-xs">
            <span className="text-xs font-medium text-[#667085]">Avg Posts / Week</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#101828]">{insights.avg_posts_per_week}</span>
              <span className="text-xs text-[#667085]">Cadence</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-xs">
            <span className="text-xs font-medium text-[#667085]">Total Engagements</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#6257E8]">{insights.total_engagements_observed}</span>
              <span className="text-xs text-[#667085]">Signals</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Themes Tag Cloud */}
      {insights && insights.top_themes.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-[#EAECF0] shadow-xs">
          <div className="flex items-center gap-2 mb-2.5">
            <Tag className="w-3.5 h-3.5 text-[#6257E8]" />
            <span className="text-xs font-bold text-[#101828]">Top Observed Themes in Market</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.top_themes.map((t) => (
              <span
                key={t.theme}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F4F3FF] text-[#6257E8] border border-[#6257E8]/20 flex items-center gap-1.5"
              >
                <span>#{t.theme}</span>
                <span className="text-[10px] bg-white px-1.5 py-0.2 rounded-full font-bold shadow-xs">
                  {t.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace: Left Column Competitor List, Right Column Posts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Competitors */}
        <div className="bg-white rounded-xl border border-[#EAECF0] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
            <h4 className="text-xs font-bold text-[#101828] uppercase tracking-wide">Competitors</h4>
            <button
              onClick={() => setShowAddCompetitorModal(true)}
              className="p-1 rounded-md bg-[#6257E8] text-white hover:bg-[#5245db] transition-colors"
              title="Add Competitor"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {competitors.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#667085]">No competitors registered yet.</div>
          ) : (
            <div className="space-y-1.5">
              {competitors.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => handleSelectCompetitor(comp.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeCompetitorId === comp.id
                      ? 'bg-[#F4F3FF] border-[#6257E8] text-[#101828]'
                      : 'border-[#EAECF0] hover:bg-gray-50 text-[#344054]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{comp.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#EAECF0] font-semibold text-[#667085]">
                      {comp.posts_count ?? 0} posts
                    </span>
                  </div>
                  {comp.website_url && (
                    <span className="text-[11px] text-[#667085] truncate block mt-0.5">
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
            <div className="bg-white rounded-xl border border-[#EAECF0] p-5 shadow-xs">
              <div className="flex items-start justify-between pb-4 border-b border-[#EAECF0] mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#101828]">{activeComp.name}</h3>
                    {activeComp.website_url && (
                      <a
                        href={activeComp.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#6257E8] hover:text-[#5245db]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#667085]">
                    {activeComp.strengths && <span>Strengths: {activeComp.strengths}</span>}
                  </div>
                </div>

                <button
                  onClick={() => setShowLogPostModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Post</span>
                </button>
              </div>

              {/* Observed Posts Feed */}
              {posts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#667085]">
                  No posts logged for {activeComp.name} yet. Click &quot;Log Post&quot; to track their content moves.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 rounded-xl border border-[#EAECF0] bg-[#FAFAFA] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#101828] text-white">
                            {post.platform}
                          </span>
                          <span className="text-[#667085] text-[11px]">
                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Observed recently'}
                          </span>
                        </div>

                        {post.engagement_signals && (
                          <div className="flex items-center gap-3 text-[11px] text-[#475467] font-medium">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-[#6257E8]" /> {post.engagement_signals.likes ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-[#6257E8]" /> {post.engagement_signals.comments ?? 0}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-[#101828] leading-relaxed whitespace-pre-wrap">{post.post_text}</p>

                      {post.tactical_takeaway && (
                        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/50 flex items-start gap-2 text-xs text-amber-900">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Takeaway:</strong> {post.tactical_takeaway}
                          </span>
                        </div>
                      )}

                      {post.observed_themes && post.observed_themes.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {post.observed_themes.map((th) => (
                            <span
                              key={th}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[#D0D5DD] text-[#344054]"
                            >
                              #{th}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#EAECF0] p-12 text-center text-xs text-[#667085]">
              Select a competitor from the left or register a new one to view observations.
            </div>
          )}
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showAddCompetitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#EAECF0] shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#101828]">Add Competitor Profile</h3>
              <button
                onClick={() => setShowAddCompetitorModal(false)}
                className="text-[#667085] hover:text-[#101828] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCompetitorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Competitor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://acme.example.com"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Key Strengths</label>
                <input
                  type="text"
                  placeholder="e.g. Fast shipping, high ad spend"
                  value={compStrengths}
                  onChange={(e) => setCompStrengths(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Observation Frequency</label>
                <select
                  value={compCadence}
                  onChange={(e) => setCompCadence(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Vulnerabilities / Gaps</label>
                <input
                  type="text"
                  placeholder="e.g. Weak technical content, slow replies"
                  value={compWeaknesses}
                  onChange={(e) => setCompWeaknesses(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompetitorModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Competitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Post Modal */}
      {showLogPostModal && activeComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-[#EAECF0] shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#101828]">Log Competitor Post</h3>
                <p className="text-xs text-[#667085]">Observed post for {activeComp.name}</p>
              </div>
              <button
                onClick={() => setShowLogPostModal(false)}
                className="text-[#667085] hover:text-[#101828] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogPostSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Platform</label>
                  <select
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Tone</label>
                  <input
                    type="text"
                    value={postTone}
                    onChange={(e) => setPostTone(e.target.value)}
                    placeholder="e.g. Technical, Promotional"
                    className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Post Text / Copy</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste observed post copy..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Estimated Likes</label>
                  <input
                    type="number"
                    value={postLikes}
                    onChange={(e) => setPostLikes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Estimated Comments</label>
                  <input
                    type="number"
                    value={postComments}
                    onChange={(e) => setPostComments(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Observed Themes (comma-separated)
                </label>
                <input
                  type="text"
                  value={postThemesStr}
                  onChange={(e) => setPostThemesStr(e.target.value)}
                  placeholder="e.g. ai_trends, hiring, customer_story"
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Tactical Takeaway / Opportunity</label>
                <input
                  type="text"
                  value={postTakeaway}
                  onChange={(e) => setPostTakeaway(e.target.value)}
                  placeholder="e.g. They ignored pricing pushback; we can post about transparent pricing"
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogPostModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Log Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
