import React, { useState } from 'react'
import { Save, Loader2, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { apiClient, type BrandVisualData } from '../../../lib/api/client'

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
  const [secondaryColor, setSecondaryColor] = useState(initialVisual?.secondary_color || '#6257E8')
  const [accentColors, setAccentColors] = useState<string[]>(initialVisual?.accent_colors || ['#F59E0B', '#10B981'])
  const [newAccent, setNewAccent] = useState('#EC4899')

  const [primaryFont, setPrimaryFont] = useState(initialVisual?.primary_font || 'Inter')
  const [secondaryFont, setSecondaryFont] = useState(initialVisual?.secondary_font || 'Plus Jakarta Sans')
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

      {/* Live Brand Palette Preview */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs">
        <h3 className="text-sm font-bold text-[#101828] mb-3">Live Visual Preview</h3>
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
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#101828]">Color Foundation</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 px-3 py-2 text-xs font-mono border border-[#D0D5DD] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5">Secondary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-32 px-3 py-2 text-xs font-mono border border-[#D0D5DD] rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="pt-3 border-t border-[#EAECF0]">
          <label className="block text-xs font-semibold text-[#344054] mb-2">Accent Palette</label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {accentColors.map((color, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] text-xs font-mono"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                <span>{color}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAccent(color)}
                  className="text-gray-400 hover:text-rose-600 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newAccent}
              onChange={(e) => setNewAccent(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={newAccent}
              onChange={(e) => setNewAccent(e.target.value)}
              className="w-28 px-2.5 py-1.5 text-xs font-mono border border-[#D0D5DD] rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddAccent}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#344054] bg-[#F2F4F7] hover:bg-[#EAECF0] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Accent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Typography System */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#101828]">Typography Hierarchy</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Primary Font (Headlines & Display)
            </label>
            <select
              value={primaryFont}
              onChange={(e) => setPrimaryFont(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            >
              <option value="Inter">Inter (Clean Modern Sans)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Contemporary)</option>
              <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
              <option value="Space Grotesk">Space Grotesk (Tech Monospace-inspired)</option>
              <option value="Outfit">Outfit (Geometric)</option>
              <option value="Syne">Syne (Bold Expressive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Secondary Font (Body & Subheadings)
            </label>
            <select
              value={secondaryFont}
              onChange={(e) => setSecondaryFont(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Exclusions */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#101828]">Visual Exclusions & Design Don'ts</h3>
        <p className="text-xs text-[#667085]">
          Styles, effects, or visual elements that the creative rendering engine should never generate.
        </p>
        <textarea
          rows={3}
          value={exclusionsText}
          onChange={(e) => setExclusionsText(e.target.value)}
          placeholder="No 3D glassy gradients&#10;No stock photos with generic handshakes&#10;No neon lime on white backgrounds"
          className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg font-mono focus:ring-2 focus:ring-[#6257E8]"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Visual Identity</span>
        </button>
      </div>
    </form>
  )
}
