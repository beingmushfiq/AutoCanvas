import React, { useState } from 'react'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient, type BrandProfileData } from '../../../lib/api/client'

interface ProfileTabProps {
  brandId: string
  initialProfile: BrandProfileData | null
  onUpdated: () => void
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ brandId, initialProfile, onUpdated }) => {
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [businessDescription, setBusinessDescription] = useState(initialProfile?.business_description || '')
  const [mission, setMission] = useState(initialProfile?.mission || '')
  const [vision, setVision] = useState(initialProfile?.vision || '')
  const [positioning, setPositioning] = useState(initialProfile?.positioning || '')
  const [targetAudience, setTargetAudience] = useState(initialProfile?.target_audience || '')
  const [uspsText, setUspsText] = useState((initialProfile?.usps || []).join('\n'))
  const [primaryCta, setPrimaryCta] = useState(initialProfile?.primary_cta || '')
  const [secondaryCta, setSecondaryCta] = useState(initialProfile?.secondary_cta || '')
  const [prohibitedText, setProhibitedText] = useState((initialProfile?.prohibited_subjects || []).join('\n'))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const usps = uspsText.split('\n').map((s) => s.trim()).filter(Boolean)
      const prohibited_subjects = prohibitedText.split('\n').map((s) => s.trim()).filter(Boolean)

      await apiClient.put(`/brands/${brandId}/profile`, {
        business_description: businessDescription,
        mission,
        vision,
        positioning,
        target_audience: targetAudience,
        usps,
        primary_cta: primaryCta,
        secondary_cta: secondaryCta,
        prohibited_subjects,
      })

      setSuccessMsg('Brand positioning and profile saved successfully.')
      onUpdated()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
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

      {/* Core Positioning */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#101828]">Positioning & Core Strategy</h3>

        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1">
            Market Positioning Statement
          </label>
          <input
            type="text"
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            placeholder="e.g. The modern, autonomous operating system for high-growth brands"
            className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1">
            Business & Company Overview
          </label>
          <textarea
            rows={3}
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="Detailed description of what the company does, products offered, and origin story..."
            className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Mission Statement</label>
            <textarea
              rows={2}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Why this company exists..."
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Vision Statement</label>
            <textarea
              rows={2}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Where the company aims to be in 5-10 years..."
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
            />
          </div>
        </div>
      </div>

      {/* Target Audience & USPs */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#101828]">Target Audience & Differentiation</h3>

        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1">Target Audience</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. Founders, Marketing Directors, Mid-market B2B executives"
            className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1">
            Unique Selling Propositions (USPs)
            <span className="text-[11px] font-normal text-[#667085] ml-1">(One per line)</span>
          </label>
          <textarea
            rows={3}
            value={uspsText}
            onChange={(e) => setUspsText(e.target.value)}
            placeholder="Autonomous end-to-end content delivery&#10;Verified brand voice consistency&#10;Instant multi-network publishing"
            className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg font-mono focus:ring-2 focus:ring-[#6257E8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Primary Call-to-Action</label>
            <input
              type="text"
              value={primaryCta}
              onChange={(e) => setPrimaryCta(e.target.value)}
              placeholder="e.g. Book a Demo / Start Free Trial"
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Secondary Call-to-Action</label>
            <input
              type="text"
              value={secondaryCta}
              onChange={(e) => setSecondaryCta(e.target.value)}
              placeholder="e.g. Download Case Study / Learn More"
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Compliance & Exclusions */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-rose-700">Content Guardrails & Prohibited Topics</h3>
        <p className="text-xs text-[#667085]">
          Topics, competitors, or claims the AI content engine is strictly forbidden from referencing.
        </p>
        <textarea
          rows={3}
          value={prohibitedText}
          onChange={(e) => setProhibitedText(e.target.value)}
          placeholder="Unverified health benefits&#10;Direct competitor disparagement&#10;Price discounting without approval"
          className="w-full px-3 py-2 text-xs border border-rose-200 rounded-lg font-mono focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Profile Changes</span>
        </button>
      </div>
    </form>
  )
}
