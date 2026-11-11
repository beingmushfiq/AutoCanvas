import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, PieChart, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient, type ApiResponse, type ContentPillar } from '../../lib/api/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'

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
  const [colorTag, setColorTag] = useState('#F59E0B')

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border text-brand-accent flex items-center justify-center shadow-2xs">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Content Pillars & Strategy</h3>
              <p className="text-xs text-foreground-secondary">Distribution weights & editorial focus</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
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

          {/* Distribution Balance Bar */}
          <div className="bg-background-subtle p-4 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Pillar Distribution Mix</span>
              <span className={totalWeight === 100 ? 'text-status-success' : 'text-status-warning font-mono'}>
                Total Weight: {totalWeight}%
              </span>
            </div>
            <div className="h-3 w-full bg-surface border border-border rounded-full overflow-hidden flex">
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
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-border bg-surface space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                New Content Pillar
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">Pillar Name *</label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Thought Leadership"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Weight (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objective, theme, and key angles..."
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground-secondary">Color:</span>
                  <input
                    type="color"
                    value={colorTag}
                    onChange={(e) => setColorTag(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-border bg-surface p-0.5"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    variant="default"
                    size="sm"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Pillar'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-brand-accent hover:bg-brand-accent/5 flex items-center justify-center gap-1.5 transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Content Pillar</span>
            </button>
          )}

          {/* Pillars List */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-foreground-secondary">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-accent" />
                Loading pillars...
              </div>
            ) : pillars.length === 0 ? (
              <div className="p-6 text-center text-xs text-foreground-secondary bg-background-subtle rounded-xl border border-border">
                No content pillars created yet. Add pillars above to guide content planning distribution.
              </div>
            ) : (
              pillars.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between shadow-2xs hover:border-brand-accent/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-border/40"
                      style={{ backgroundColor: p.color_tag }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        <Badge variant="secondary" className="font-mono">
                          {p.weight_percentage}%
                        </Badge>
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-foreground-secondary mt-0.5 truncate max-w-sm">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-foreground-muted font-mono">
                      {p.content_items_count ?? 0} posts
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      aria-label={`Delete pillar ${p.name}`}
                      className="p-1.5 text-foreground-muted hover:text-status-danger rounded-lg hover:bg-status-danger-bg transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
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
