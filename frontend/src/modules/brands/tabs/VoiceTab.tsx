import React, { useState } from 'react'
import { Save, Loader2, CheckCircle2, Plus, X } from 'lucide-react'
import { apiClient, type BrandVoiceData } from '../../../lib/api/client'

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

      {/* Voice Core */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#101828]">Brand Voice & Personality</h3>

        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1">Overall Tone of Voice</label>
          <input
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g. Authoritative, insightful, warm, direct"
            className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Formality Level</label>
            <select
              value={formalityLevel}
              onChange={(e) => setFormalityLevel(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            >
              <option value="conversational">Conversational (Approachable & Natural)</option>
              <option value="formal">Formal (Corporate & Traditional)</option>
              <option value="casual">Casual (Relaxed & Playful)</option>
              <option value="technical">Technical (Precise & Analytical)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Primary Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            >
              <option value="en">English (Global standard)</option>
              <option value="bn">Bengali (বাংলা)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="pt-2 border-t border-[#EAECF0]">
          <label className="block text-xs font-semibold text-[#344054] mb-2">Personality Traits</label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {personalityTraits.map((trait, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6257E8]/10 text-[#6257E8] text-xs font-semibold"
              >
                {trait}
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(trait)}
                  className="hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm">
            <input
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
              className="flex-1 px-3 py-1.5 text-xs border border-[#D0D5DD] rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddTrait}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#F2F4F7] text-[#344054] hover:bg-[#EAECF0] rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Channel-Specific Adaptations */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">Channel-Specific Tone Adaptations</h3>
          <p className="text-xs text-[#667085] mt-0.5">
            AutoCanvas adapts each post to the target platform rather than cross-posting identical text.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              LinkedIn Voice Adaptation
            </label>
            <input
              type="text"
              value={linkedinRule}
              onChange={(e) => setLinkedinRule(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Facebook Voice Adaptation
            </label>
            <input
              type="text"
              value={facebookRule}
              onChange={(e) => setFacebookRule(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Instagram Voice Adaptation
            </label>
            <input
              type="text"
              value={instagramRule}
              onChange={(e) => setInstagramRule(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#6257E8] text-white text-xs font-semibold rounded-xl hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Voice & Tone</span>
        </button>
      </div>
    </form>
  )
}

