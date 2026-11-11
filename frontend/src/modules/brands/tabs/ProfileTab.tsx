import React, { useState } from 'react'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient, type BrandProfileData } from '../../../lib/api/client'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

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

      {/* Core Positioning */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Positioning & Core Strategy</h3>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Market Positioning Statement
          </label>
          <Input
            type="text"
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            placeholder="e.g. The modern, autonomous operating system for high-growth brands"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Business & Company Overview
          </label>
          <textarea
            rows={3}
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="Detailed description of what the company does, products offered, and origin story..."
            className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Mission Statement</label>
            <textarea
              rows={2}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Why this company exists..."
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Vision Statement</label>
            <textarea
              rows={2}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Where the company aims to be in 5-10 years..."
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
            />
          </div>
        </div>
      </div>

      {/* Target Audience & USPs */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Target Audience & Differentiation</h3>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Target Audience</label>
          <Input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. Founders, Marketing Directors, Mid-market B2B executives"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Unique Selling Propositions (USPs)
            <span className="text-[11px] font-normal text-foreground-muted ml-1">(One per line)</span>
          </label>
          <textarea
            rows={3}
            value={uspsText}
            onChange={(e) => setUspsText(e.target.value)}
            placeholder="Autonomous end-to-end content delivery&#10;Verified brand voice consistency&#10;Instant multi-network publishing"
            className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground font-mono placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Primary Call-to-Action</label>
            <Input
              type="text"
              value={primaryCta}
              onChange={(e) => setPrimaryCta(e.target.value)}
              placeholder="e.g. Book a Demo / Start Free Trial"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Secondary Call-to-Action</label>
            <Input
              type="text"
              value={secondaryCta}
              onChange={(e) => setSecondaryCta(e.target.value)}
              placeholder="e.g. Download Case Study / Learn More"
            />
          </div>
        </div>
      </div>

      {/* Compliance & Exclusions */}
      <div className="bg-surface p-6 rounded-2xl border border-status-danger/30 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-status-danger">Content Guardrails & Prohibited Topics</h3>
        <p className="text-xs text-foreground-secondary">
          Topics, competitors, or claims the AI content engine is strictly forbidden from referencing.
        </p>
        <textarea
          rows={3}
          value={prohibitedText}
          onChange={(e) => setProhibitedText(e.target.value)}
          placeholder="Unverified health benefits&#10;Direct competitor disparagement&#10;Price discounting without approval"
          className="w-full px-3 py-2 text-xs bg-surface border border-status-danger/40 rounded-xl text-foreground font-mono placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-status-danger"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          variant="default"
          className="gap-2 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Profile Changes</span>
        </Button>
      </div>
    </form>
  )
}
