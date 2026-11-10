import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, PieChart, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient, type ApiResponse, type ContentPillar } from '../../lib/api/client'

interface PillarsManagerModalProps {
  isOpen: boolean
  brandId: string
  onClose: () => void
  onUpdated: () => void
}

export const PillarsManagerModal: React.FC<PillarsManagerModalProps> = ({
  isOpen,
  brandId,
  onClose,
  onUpdated,
}) => {
  const [pillars, setPillars] = useState<ContentPillar[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [weight, setWeight] = useState(25)
  const [colorTag, setColorTag] = useState('#6257E8')

  const fetchPillars = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<ApiResponse<ContentPillar[]>>(`/brands/${brandId}/pillars`)
      setPillars(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content pillars')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchPillars()
    }
  }, [isOpen, brandId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await apiClient.post(`/brands/${brandId}/pillars`, {
        name,
        description: description || null,
        target_audience: targetAudience || null,
        weight_percentage: weight,
        color_tag: colorTag,
      })

      setName('')
      setDescription('')
      setTargetAudience('')
      setShowAdd(false)
      setSuccessMsg('Content pillar added.')
      fetchPillars()
      onUpdated()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pillar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, pillarName: string) => {
    if (!confirm(`Delete content pillar "${pillarName}"?`)) return

    try {
      await apiClient.delete(`/brands/${brandId}/pillars/${id}`)
      setPillars(pillars.filter((p) => p.id !== id))
      onUpdated()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete pillar')
    }
  }

  if (!isOpen) return null

  const totalWeight = pillars.reduce((sum, p) => sum + p.weight_percentage, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-[#EAECF0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6257E8]/10 text-[#6257E8] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">Content Pillars & Strategy</h3>
              <p className="text-xs text-[#667085]">Distribution weights & editorial focus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#98A2B3] hover:text-[#344054] hover:bg-[#F2F4F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
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

          {/* Distribution Balance Bar */}
          <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#344054]">Pillar Distribution Mix</span>
              <span className={totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}>
                Total Weight: {totalWeight}%
              </span>
            </div>
            <div className="h-3 w-full bg-[#EAECF0] rounded-full overflow-hidden flex">
              {pillars.map((p) => (
                <div
                  key={p.id}
                  style={{ width: `${p.weight_percentage}%`, backgroundColor: p.color_tag }}
                  title={`${p.name} (${p.weight_percentage}%)`}
                  className="h-full transition-all"
                />
              ))}
            </div>
          </div>

          {/* Add Pillar Form */}
          {showAdd ? (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-[#D0D5DD] bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#344054]">
                New Content Pillar
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Pillar Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Thought Leadership"
                    className="w-full px-3 py-1.5 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Weight (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs border border-[#D0D5DD] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objective, theme, and key angles..."
                  className="w-full px-3 py-1.5 text-xs border border-[#D0D5DD] rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#475467]">Color:</span>
                  <input
                    type="color"
                    value={colorTag}
                    onChange={(e) => setColorTag(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-[#6257E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5246D6] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Pillar'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-2 border-2 border-dashed border-[#D0D5DD] rounded-xl text-xs font-semibold text-[#6257E8] hover:bg-[#6257E8]/5 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Content Pillar</span>
            </button>
          )}

          {/* Pillars List */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#667085]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6257E8]" />
                Loading pillars...
              </div>
            ) : pillars.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085] bg-[#F9FAFB] rounded-xl">
                No content pillars created yet. Add pillars above to guide content planning distribution.
              </div>
            ) : (
              pillars.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white border border-[#EAECF0] rounded-xl flex items-center justify-between shadow-xs hover:border-[#D0D5DD] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color_tag }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#101828]">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#F2F4F7] text-[#475467] rounded font-semibold">
                          {p.weight_percentage}%
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-[#667085] mt-0.5 truncate max-w-sm">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#98A2B3]">
                      {p.content_items_count ?? 0} posts
                    </span>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

