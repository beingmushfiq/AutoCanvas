import React, { useState } from 'react'
import { Save, Loader2, CheckCircle2, Plus, X } from 'lucide-react'
import { apiClient, type BrandVoiceData } from '../../../lib/api/client'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

interface VoiceTabProps {
  brandId: string
  initialVoice: BrandVoiceData | null
  onUpdated: () => void
}

export const VoiceTab: React.FC<VoiceTabProps> = ({ brandId, initialVoice, onUpdated }) => {
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [tone, setTone] = useState(initialVoice?.tone || 'Confident, professional, engaging')
  const [formalityLevel, setFormalityLevel] = useState<'formal' | 'casual' | 'conversational' | 'technical'>(
    initialVoice?.formality_level || 'conversational'
  )
  const [preferredLanguage, setPreferredLanguage] = useState(initialVoice?.preferred_language || 'en')
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(
    initialVoice?.personality_traits || ['Authoritative', 'Innovative', 'Empathetic', 'Action-Oriented']
  )
  const [newTrait, setNewTrait] = useState('')

  // Channel specific rules
  const [linkedinRule, setLinkedinRule] = useState(
    initialVoice?.channel_language_rules?.linkedin?.tone || 'Analytical, visionary, data-backed insights with zero fluff'
  )
  const [facebookRule, setFacebookRule] = useState(
    initialVoice?.channel_language_rules?.facebook?.tone || 'Engaging, community-focused, warm storytelling'
  )
  const [instagramRule, setInstagramRule] = useState(
    initialVoice?.channel_language_rules?.instagram?.tone || 'Punchy, aesthetic captions with strong visual framing and curated hashtags'
  )

  const handleAddTrait = () => {
    if (newTrait.trim() && !personalityTraits.includes(newTrait.trim())) {
      setPersonalityTraits([...personalityTraits, newTrait.trim()])
      setNewTrait('')
    }
  }

  const handleRemoveTrait = (trait: string) => {
    setPersonalityTraits(personalityTraits.filter((t) => t !== trait))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await apiClient.put(`/brands/${brandId}/voice`, {
        tone,
        formality_level: formalityLevel,
        preferred_language: preferredLanguage,
        personality_traits: personalityTraits,
        channel_language_rules: {
          linkedin: { tone: linkedinRule },
          facebook: { tone: facebookRule },
          instagram: { tone: instagramRule },
        },
      })

      setSuccessMsg('Brand voice and channel guidelines saved successfully.')
      onUpdated()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save voice profile')
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

      {/* Voice Core */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Brand Voice & Personality</h3>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Overall Tone of Voice</label>
          <Input
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g. Authoritative, insightful, warm, direct"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Formality Level</label>
            <select
              value={formalityLevel}
              onChange={(e) => setFormalityLevel(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
            >
              <option value="conversational">Conversational (Approachable & Natural)</option>
              <option value="formal">Formal (Corporate & Traditional)</option>
              <option value="casual">Casual (Relaxed & Playful)</option>
              <option value="technical">Technical (Precise & Analytical)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Primary Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
            >
              <option value="en">English (Global standard)</option>
              <option value="bn">Bengali (বাংলা)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="pt-2 border-t border-border">
          <label className="block text-xs font-semibold text-foreground mb-2">Personality Traits</label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {personalityTraits.map((trait, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background-subtle border border-border text-foreground text-xs font-semibold"
              >
                {trait}
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(trait)}
                  aria-label={`Remove trait ${trait}`}
                  className="hover:text-status-danger transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <Input
              type="text"
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTrait()
                }
              }}
              placeholder="Add trait (e.g. Visionary)..."
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTrait}
              className="gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Channel-Specific Adaptations */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Channel-Specific Tone Adaptations</h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            AutoCanvas adapts each post to the target platform rather than cross-posting identical text.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              LinkedIn Voice Adaptation
            </label>
            <Input
              type="text"
              value={linkedinRule}
              onChange={(e) => setLinkedinRule(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Facebook Voice Adaptation
            </label>
            <Input
              type="text"
              value={facebookRule}
              onChange={(e) => setFacebookRule(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Instagram Voice Adaptation
            </label>
            <Input
              type="text"
              value={instagramRule}
              onChange={(e) => setInstagramRule(e.target.value)}
            />
          </div>
        </div>
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
          <span>Save Voice & Tone</span>
        </Button>
      </div>
    </form>
  )
}
