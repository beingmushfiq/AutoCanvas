import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Brain, Loader2, CheckCircle2, Lightbulb, AlertCircle, Award } from 'lucide-react'
import { apiClient, type ApiResponse, type BrandMemoryItem } from '../../../lib/api/client'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'

interface MemoryTabProps {
  brandId: string
}

const DEMO_MEMORY_ITEMS: BrandMemoryItem[] = [
  {
    id: 'mem-demo-1',
    category: 'successful_style',
    title: 'Carousel Structure vs Single Image',
    content: 'Audiences engage 3x more with structured 4-slide carousels on LinkedIn compared to static single images.',
    confidence_score: 0.94,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'mem-demo-2',
    category: 'approved_fact',
    title: 'Editorial Tone Restrictions',
    content: 'Strictly avoid hollow marketing buzzwords such as "game-changer", "synergy", or "revolutionary" in copy.',
    confidence_score: 0.98,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'mem-demo-3',
    category: 'audience_insight',
    title: 'Peak Audience Responsiveness',
    content: 'Executive followers on LinkedIn have maximum interaction velocity between 09:00 - 11:00 UTC on Tuesdays and Thursdays.',
    confidence_score: 0.89,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'mem-demo-4',
    category: 'campaign_milestone',
    title: 'Deterministic SVG Rendering Launch',
    content: 'Generated 42,000 impressions in the first 48 hours with a 6.2% engagement rate across LinkedIn and Twitter.',
    confidence_score: 0.96,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

export const MemoryTab: React.FC<MemoryTabProps> = ({ brandId }) => {
  const [memories, setMemories] = useState<BrandMemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // New entry form
  const [showAddForm, setShowAddForm] = useState(false)
  const [category, setCategory] = useState<BrandMemoryItem['category']>('approved_fact')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchMemories = async () => {
    if (brandId === 'demo-brand-1') {
      setMemories(DEMO_MEMORY_ITEMS)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await apiClient.get<ApiResponse<BrandMemoryItem[]>>(`/brands/${brandId}/memory`)
      setMemories(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brand memories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [brandId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await apiClient.post(`/brands/${brandId}/memory`, {
        category,
        title,
        content,
      })

      setTitle('')
      setContent('')
      setShowAddForm(false)
      setSuccessMsg('Brand memory entry added successfully.')
      fetchMemories()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory entry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory entry?')) return

    try {
      await apiClient.delete(`/brands/${brandId}/memory/${id}`)
      setMemories(memories.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    }
  }

  const getCategoryBadge = (cat: BrandMemoryItem['category']) => {
    switch (cat) {
      case 'approved_fact':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved Fact</span>
          </Badge>
        )
      case 'successful_style':
        return (
          <Badge variant="secondary" className="gap-1">
            <Award className="w-3 h-3" />
            <span>Successful Style</span>
          </Badge>
        )
      case 'failed_experiment':
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Failed Pattern</span>
          </Badge>
        )
      case 'audience_insight':
        return (
          <Badge variant="warning" className="gap-1">
            <Lightbulb className="w-3 h-3" />
            <span>Audience Insight</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            Milestone
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {successMsg && (
        <div className="p-3 bg-status-success-bg border border-status-success text-status-success rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-status-danger-bg border border-status-danger text-status-danger rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Long-term Brand Memory & Facts</h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Verified corporate truths, learned performance patterns, and audience findings retained across sessions.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          variant="default"
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Memory Entry</span>
        </Button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            New Verified Brand Memory
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
              >
                <option value="approved_fact">Approved Truth / Fact</option>
                <option value="successful_style">Successful Style / Pattern</option>
                <option value="failed_experiment">Failed Experiment / Avoid</option>
                <option value="audience_insight">Audience Insight</option>
                <option value="campaign_milestone">Campaign Milestone</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">Title</label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Tier Fair Use Policy Statement"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Memory Content</label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State the verified fact or performance takeaway with crystal clarity..."
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="default"
              size="sm"
              className="gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save Entry</span>
            </Button>
          </div>
        </form>
      )}

      {/* Memory Entries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-foreground-secondary bg-surface rounded-2xl border border-border">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-accent" />
            Loading brand memory entries...
          </div>
        ) : memories.length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-secondary bg-surface rounded-2xl border border-border">
            <Brain className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
            No brand memories recorded yet. Record verified facts and performance findings to guide future content generation.
          </div>
        ) : (
          memories.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-start justify-between gap-4 hover:border-brand-accent/40 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  {getCategoryBadge(entry.category)}
                  <h4 className="text-xs font-bold text-foreground">{entry.title}</h4>
                </div>
                <p className="text-xs text-foreground-secondary leading-relaxed">{entry.content}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-foreground-muted">
                  <span>Confidence: {(entry.confidence_score * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span className="font-mono">{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                title="Delete memory entry"
                aria-label="Delete memory entry"
                className="text-foreground-muted hover:text-status-danger p-1.5 rounded-lg hover:bg-status-danger-bg transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
