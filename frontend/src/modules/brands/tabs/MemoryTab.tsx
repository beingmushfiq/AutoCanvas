import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Brain, Loader2, CheckCircle2, Lightbulb, AlertCircle, Award } from 'lucide-react'
import { apiClient, type ApiResponse, type BrandMemoryItem } from '../../../lib/api/client'

interface MemoryTabProps {
  brandId: string
}

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
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved Fact</span>
          </span>
        )
      case 'successful_style':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
            <Award className="w-3 h-3" />
            <span>Successful Style</span>
          </span>
        )
      case 'failed_experiment':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3" />
            <span>Failed Pattern</span>
          </span>
        )
      case 'audience_insight':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
            <Lightbulb className="w-3 h-3" />
            <span>Audience Insight</span>
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-800">
            Milestone
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">Long-term Brand Memory & Facts</h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Verified corporate truths, learned performance patterns, and audience findings retained across sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6257E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5246D6] transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Memory Entry</span>
        </button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#344054]">
            New Verified Brand Memory
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
              >
                <option value="approved_fact">Approved Truth / Fact</option>
                <option value="successful_style">Successful Style / Pattern</option>
                <option value="failed_experiment">Failed Experiment / Avoid</option>
                <option value="audience_insight">Audience Insight</option>
                <option value="campaign_milestone">Campaign Milestone</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#344054] mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Tier Fair Use Policy Statement"
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Memory Content</label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State the verified fact or performance takeaway with crystal clarity..."
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#6257E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5246D6] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      )}

      {/* Memory Entries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#667085] bg-white rounded-xl border border-[#EAECF0]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6257E8]" />
            Loading brand memory entries...
          </div>
        ) : memories.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085] bg-white rounded-xl border border-[#EAECF0]">
            <Brain className="w-8 h-8 text-[#98A2B3] mx-auto mb-2" />
            No brand memories recorded yet. Record verified facts and performance findings to guide future content generation.
          </div>
        ) : (
          memories.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-white rounded-xl border border-[#EAECF0] shadow-xs flex items-start justify-between gap-4 hover:border-[#D0D5DD] transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  {getCategoryBadge(entry.category)}
                  <h4 className="text-xs font-bold text-[#101828]">{entry.title}</h4>
                </div>
                <p className="text-xs text-[#475467] leading-relaxed">{entry.content}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-[#98A2B3]">
                  <span>Confidence: {(entry.confidence_score * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                title="Delete memory entry"
                className="text-[#98A2B3] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
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
