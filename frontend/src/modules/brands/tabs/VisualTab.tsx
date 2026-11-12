import React, { useState } from 'react'
import { Save, Loader2, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { apiClient, type BrandVisualData } from '../../../lib/api/client'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

interface VisualTabProps {
  brandId: string
  initialVisual: BrandVisualData | null
  onUpdated: () => void
}

export const VisualTab: React.FC<VisualTabProps> = ({ brandId, initialVisual, onUpdated }) => {
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [primaryColor, setPrimaryColor] = useState(initialVisual?.primary_color || '#101828')
  const [secondaryColor, setSecondaryColor] = useState(initialVisual?.secondary_color || '#F59E0B')
  const [accentColors, setAccentColors] = useState<string[]>(initialVisual?.accent_colors || ['#F59E0B', '#10B981'])
  const [newAccent, setNewAccent] = useState('#6366F1')

  const [primaryFont, setPrimaryFont] = useState(initialVisual?.primary_font || 'Geist')
  const [secondaryFont, setSecondaryFont] = useState(initialVisual?.secondary_font || 'Inter')
  const [exclusionsText, setExclusionsText] = useState((initialVisual?.visual_exclusions || []).join('\n'))

  const handleAddAccent = () => {
    if (!accentColors.includes(newAccent)) {
      setAccentColors([...accentColors, newAccent])
    }
  }

  const handleRemoveAccent = (colorToRemove: string) => {
    setAccentColors(accentColors.filter((c) => c !== colorToRemove))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const visual_exclusions = exclusionsText.split('\n').map((s) => s.trim()).filter(Boolean)

      await apiClient.put(`/brands/${brandId}/visual`, {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_colors: accentColors,
        primary_font: primaryFont,
        secondary_font: secondaryFont,
        visual_exclusions,
      })

      setSuccessMsg('Visual identity tokens saved successfully.')
      onUpdated()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save visual identity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
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

      {/* Live Brand Palette Preview */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs">
        <h3 className="text-sm font-bold text-foreground mb-3">Live Visual Preview</h3>
        <div
          className="p-6 rounded-xl text-white transition-all shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: secondaryColor }}
            >
              Secondary Accent
            </span>
            <div className="flex gap-1.5">
              {accentColors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <h4 className="text-lg font-bold mb-1" style={{ fontFamily: primaryFont }}>
            Autonomous Brand Operations
          </h4>
          <p className="text-xs text-white/80" style={{ fontFamily: secondaryFont }}>
            Crafted with precision typography ({primaryFont} & {secondaryFont})
          </p>
        </div>
      </div>

      {/* Color System */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Color Foundation</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-surface"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Secondary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-surface"
              />
              <Input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-32 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="pt-3 border-t border-border">
          <label className="block text-xs font-semibold text-foreground mb-3">Accent Palette</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {accentColors.map((color, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-surface-muted"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newAccents = [...accentColors]
                    newAccents[idx] = e.target.value
                    setAccentColors(newAccents)
                  }}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const newAccents = [...accentColors]
                    newAccents[idx] = e.target.value
                    setAccentColors(newAccents)
                  }}
                  className="flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAccent(color)}
                  className="text-foreground-muted hover:text-status-danger p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <input
              type="color"
              value={newAccent}
              onChange={(e) => setNewAccent(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-surface"
            />
            <Input
              type="text"
              value={newAccent}
              onChange={(e) => setNewAccent(e.target.value)}
              className="w-32 font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAccent}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Accent</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Typography System */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Typography Hierarchy</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Primary Font (Headlines & Display)
            </label>
            <select
              value={primaryFont}
              onChange={(e) => setPrimaryFont(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
            >
              <option value="Geist">Geist (Modern Sans)</option>
              <option value="Inter">Inter (Clean Modern Sans)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Contemporary)</option>
              <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
              <option value="Space Grotesk">Space Grotesk (Tech Monospace-inspired)</option>
              <option value="Outfit">Outfit (Geometric)</option>
              <option value="Syne">Syne (Bold Expressive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Secondary Font (Body & Subheadings)
            </label>
            <select
              value={secondaryFont}
              onChange={(e) => setSecondaryFont(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
            >
              <option value="Inter">Inter</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Geist">Geist</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Exclusions */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Visual Exclusions & Design Don'ts</h3>
        <p className="text-xs text-foreground-secondary">
          Styles, effects, or visual elements that the creative rendering engine should never generate.
        </p>
        <textarea
          rows={3}
          value={exclusionsText}
          onChange={(e) => setExclusionsText(e.target.value)}
          placeholder="No 3D glassy gradients&#10;No stock photos with generic handshakes&#10;No neon lime on white backgrounds"
          className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground font-mono placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          variant="default"
          className="gap-2 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Visual Identity</span>
        </Button>
      </div>
    </form>
  )
}
