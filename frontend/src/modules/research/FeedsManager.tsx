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
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'

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

      {/* Subscribed Feeds Section */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Subscribed Industry Feeds</h3>
            <p className="text-xs text-foreground-secondary">
              Real-time RSS / Atom sources automatically ingested and deduplicated.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            variant="default"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add RSS Feed</span>
          </Button>
        </div>

        {feeds.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-border bg-background-subtle">
            <Rss className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground">No RSS feeds subscribed yet</p>
            <p className="text-[11px] text-foreground-secondary mt-0.5 mb-3">
              Add your industry news sources, blogs, or competitor feeds to automatically feed the radar.
            </p>
            <Button
              type="button"
              onClick={() => setShowAddModal(true)}
              variant="outline"
              size="sm"
            >
              Add First Feed
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {feeds.map((feed) => (
              <div key={feed.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">{feed.name}</span>
                    <Badge variant="secondary">{feed.category}</Badge>
                    {feed.status === 'failing' && (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> Failing
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-foreground-secondary">
                    <span className="truncate max-w-xs">{feed.url}</span>
                    <span>•</span>
                    <span>{feed.articles_count ?? 0} articles</span>
                    <span>•</span>
                    <span className="font-mono">
                      {feed.last_fetched_at
                        ? `Last sync: ${new Date(feed.last_fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never synced'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSyncFeed(feed.id)}
                    disabled={syncingId === feed.id}
                    title="Sync Now"
                    aria-label="Sync Now"
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground transition-colors disabled:opacity-50 outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === feed.id ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFeed(feed.id)}
                    title="Delete Feed"
                    aria-label="Delete Feed"
                    className="p-1.5 rounded-lg border border-border hover:bg-status-danger-bg hover:text-status-danger text-foreground-muted transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
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
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ingested Article Stream</h3>
            <p className="text-xs text-foreground-secondary">Recent articles extracted and sanitized from active feeds.</p>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <Input
                type="text"
                placeholder="Search headlines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-48 text-xs py-1.5 h-8"
              />
            </form>

            <button
              type="button"
              onClick={() => setSavedOnly(!savedOnly)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                savedOnly
                  ? 'bg-brand-accent text-interactive-primary-fg border-brand-accent'
                  : 'border-border bg-surface text-foreground-secondary hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} />
              <span>Saved Only</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-foreground-secondary">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-accent" />
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-secondary">
            No articles found. Sync your feeds to ingest recent stories.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {articles.map((article) => (
              <div key={article.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {article.feed && (
                      <Badge variant="accent">
                        {article.feed.name}
                      </Badge>
                    )}
                    <span className="text-[11px] text-foreground-muted font-mono">
                      {new Date(article.published_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {article.relevance_score >= 80 && (
                      <Badge variant="success">
                        High Match
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-xs font-semibold text-foreground leading-snug">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand-accent transition-colors inline-flex items-center gap-1"
                    >
                      {article.title}
                      <ExternalLink className="w-3 h-3 text-foreground-muted" />
                    </a>
                  </h4>

                  {article.summary && (
                    <p className="text-[11px] text-foreground-secondary line-clamp-2 leading-relaxed">{article.summary}</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSave(article.id)}
                    title={article.is_saved ? 'Remove bookmark' : 'Bookmark article'}
                    aria-label={article.is_saved ? 'Remove bookmark' : 'Bookmark article'}
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-raised text-foreground-muted hover:text-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${article.is_saved ? 'fill-brand-accent text-brand-accent' : ''}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Subscribe to RSS Feed</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFeedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Feed Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. TechCrunch Enterprise"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Feed URL (RSS or Atom)</label>
                <Input
                  type="url"
                  required
                  placeholder="https://example.com/feed.xml"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                />
                <span className="text-[10px] text-foreground-muted mt-1 block">
                  Strict SSRF protection active. Private and internal network addresses are blocked.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={feedCategory}
                    onChange={(e) => setFeedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface text-foreground border border-border text-xs outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="industry_news">Industry News</option>
                    <option value="technology">Technology & AI</option>
                    <option value="competitor_blog">Competitor Blog</option>
                    <option value="design">Design & Branding</option>
                    <option value="finance">Finance & Markets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Fetch Cadence</label>
                  <select
                    value={fetchFrequency}
                    onChange={(e) => setFetchFrequency(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface text-foreground border border-border text-xs outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value={30}>Every 30 mins</option>
                    <option value={60}>Every 1 hour</option>
                    <option value={180}>Every 3 hours</option>
                    <option value={720}>Every 12 hours</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="default"
                >
                  {submitting ? 'Subscribing...' : 'Add Feed'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
