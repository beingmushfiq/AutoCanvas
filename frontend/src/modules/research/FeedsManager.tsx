import React, { useState, useEffect } from 'react'
import {
  Rss,
  Plus,
  RefreshCw,
  Trash2,
  Bookmark,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react'
import { apiClient, type ApiResponse, type FeedArticle, type RssFeed } from '../../lib/api/client'

interface FeedsManagerProps {
  brandId: string
}

export const FeedsManager: React.FC<FeedsManagerProps> = ({ brandId }) => {
  const [feeds, setFeeds] = useState<RssFeed[]>([])
  const [articles, setArticles] = useState<FeedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Add Feed Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [feedName, setFeedName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [feedCategory, setFeedCategory] = useState('industry_news')
  const [fetchFrequency, setFetchFrequency] = useState(60)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [feedsRes, articlesRes] = await Promise.all([
        apiClient.get<ApiResponse<RssFeed[]>>(`/brands/${brandId}/feeds`),
        apiClient.get<ApiResponse<FeedArticle[]>>(
          `/brands/${brandId}/articles?per_page=25${search ? `&search=${encodeURIComponent(search)}` : ''}${
            savedOnly ? '&saved_only=1' : ''
          }`
        ),
      ])

      setFeeds(feedsRes.data || [])
      setArticles(articlesRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feeds and articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [brandId, savedOnly])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleSyncFeed = async (feedId: string) => {
    try {
      setSyncingId(feedId)
      setError(null)
      const res = await apiClient.post<ApiResponse<{ feed: RssFeed; new_articles_count: number }>>(
        `/research/feeds/${feedId}/sync`
      )
      setSuccess(`Feed synced! ${res.data?.new_articles_count ?? 0} new articles ingested.`)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to remove this RSS feed?')) return
    try {
      await apiClient.delete(`/research/feeds/${feedId}`)
      setFeeds(feeds.filter((f) => f.id !== feedId))
      setSuccess('RSS feed deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feed')
    }
  }

  const handleToggleSave = async (articleId: string) => {
    try {
      const res = await apiClient.post<ApiResponse<{ id: string; is_saved: boolean }>>(
        `/research/articles/${articleId}/toggle-save`
      )
      setArticles(
        articles.map((a) => (a.id === articleId ? { ...a, is_saved: res.data?.is_saved ?? !a.is_saved } : a))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bookmark article')
    }
  }

  const handleAddFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      await apiClient.post(`/brands/${brandId}/feeds`, {
        name: feedName,
        url: feedUrl,
        category: feedCategory,
        fetch_frequency_minutes: fetchFrequency,
      })
      setShowAddModal(false)
      setFeedName('')
      setFeedUrl('')
      setSuccess('RSS Feed successfully added!')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add RSS feed')
    } finally {
      setSubmitting(false)
    }
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

      {/* Subscribed Feeds Section */}
      <div className="bg-white rounded-xl border border-[#EAECF0] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#101828]">Subscribed Industry Feeds</h3>
            <p className="text-xs text-[#667085]">
              Real-time RSS / Atom sources automatically ingested and deduplicated.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add RSS Feed</span>
          </button>
        </div>

        {feeds.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-[#EAECF0] bg-[#F9FAFB]">
            <Rss className="w-8 h-8 text-[#98A2B3] mx-auto mb-2" />
            <p className="text-xs font-medium text-[#344054]">No RSS feeds subscribed yet</p>
            <p className="text-[11px] text-[#667085] mt-0.5 mb-3">
              Add your industry news sources, blogs, or competitor feeds to automatically feed the radar.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-gray-50"
            >
              Add First Feed
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EAECF0]">
            {feeds.map((feed) => (
              <div key={feed.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#101828] truncate">{feed.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F2F4F7] text-[#344054]">
                      {feed.category}
                    </span>
                    {feed.status === 'failing' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" /> Failing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#667085]">
                    <span className="truncate max-w-xs">{feed.url}</span>
                    <span>•</span>
                    <span>{feed.articles_count ?? 0} articles</span>
                    <span>•</span>
                    <span>
                      {feed.last_fetched_at
                        ? `Last sync: ${new Date(feed.last_fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never synced'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSyncFeed(feed.id)}
                    disabled={syncingId === feed.id}
                    title="Sync Now"
                    className="p-1.5 rounded-lg border border-[#EAECF0] hover:bg-[#F2F4F7] text-[#344054] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === feed.id ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleDeleteFeed(feed.id)}
                    title="Delete Feed"
                    className="p-1.5 rounded-lg border border-[#EAECF0] hover:bg-rose-50 hover:text-rose-600 text-[#667085] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingested Articles Stream */}
      <div className="bg-white rounded-xl border border-[#EAECF0] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#101828]">Ingested Article Stream</h3>
            <p className="text-xs text-[#667085]">Recent articles extracted and sanitized from active feeds.</p>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input
                type="text"
                placeholder="Search headlines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8] w-48"
              />
            </form>

            <button
              onClick={() => setSavedOnly(!savedOnly)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                savedOnly
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-gray-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>Saved Only</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6257E8]" />
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            No articles found. Sync your feeds to ingest recent stories.
          </div>
        ) : (
          <div className="divide-y divide-[#EAECF0]">
            {articles.map((article) => (
              <div key={article.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {article.feed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F4F3FF] text-[#6257E8]">
                        {article.feed.name}
                      </span>
                    )}
                    <span className="text-[11px] text-[#667085]">
                      {new Date(article.published_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {article.relevance_score >= 80 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        High Match
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-semibold text-[#101828] leading-snug">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#6257E8] transition-colors inline-flex items-center gap-1"
                    >
                      {article.title}
                      <ExternalLink className="w-3 h-3 text-[#98A2B3]" />
                    </a>
                  </h4>

                  {article.summary && (
                    <p className="text-[11px] text-[#475467] line-clamp-2 leading-relaxed">{article.summary}</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSave(article.id)}
                    title={article.is_saved ? 'Remove bookmark' : 'Bookmark article'}
                    className="p-1.5 rounded-lg border border-[#EAECF0] hover:bg-[#F2F4F7] text-[#667085] transition-colors"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${article.is_saved ? 'fill-amber-500 text-amber-500' : ''}`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Feed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#EAECF0] shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#101828]">Subscribe to RSS Feed</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#667085] hover:text-[#101828] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFeedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Feed Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TechCrunch Enterprise"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Feed URL (RSS or Atom)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed.xml"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                />
                <span className="text-[10px] text-[#667085] mt-1 block">
                  Strict SSRF protection active. Private and internal network addresses are blocked.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Category</label>
                  <select
                    value={feedCategory}
                    onChange={(e) => setFeedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                  >
                    <option value="industry_news">Industry News</option>
                    <option value="technology">Technology & AI</option>
                    <option value="competitor_blog">Competitor Blog</option>
                    <option value="design">Design & Branding</option>
                    <option value="finance">Finance & Markets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Fetch Cadence</label>
                  <select
                    value={fetchFrequency}
                    onChange={(e) => setFetchFrequency(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-xs focus:outline-none focus:border-[#6257E8]"
                  >
                    <option value={30}>Every 30 mins</option>
                    <option value={60}>Every 1 hour</option>
                    <option value={180}>Every 3 hours</option>
                    <option value={720}>Every 12 hours</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-xs font-semibold text-[#344054] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5245db] disabled:opacity-50"
                >
                  {submitting ? 'Subscribing...' : 'Add Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
