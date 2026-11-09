import React, { useState } from 'react'
import { X, Sparkles, Building2, Globe, Loader2 } from 'lucide-react'
import { apiClient, type ApiResponse } from '../../lib/api/client'

interface BrandWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (brandId: string) => void
}

export const BrandWizardModal: React.FC<BrandWizardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#101828')
  const [secondaryColor, setSecondaryColor] = useState('#6257E8')
  const [primaryFont, setPrimaryFont] = useState('Inter')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.post<ApiResponse<{ id: string; name: string }>>('/brands', {
        name,
        industry: industry || null,
        website_url: websiteUrl || null,
        business_description: businessDescription || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        primary_font: primaryFont,
      })

      if (res.data?.id) {
        onSuccess(res.data.id)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brand')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-[#EAECF0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0] bg-[#F9FAFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6257E8]/10 text-[#6257E8] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">Create New Brand</h3>
              <p className="text-xs text-[#667085]">Establish identity, visual foundation, and positioning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#98A2B3] hover:text-[#344054] hover:bg-[#F2F4F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Studio"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#6257E8] focus:border-[#6257E8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS / E-commerce"
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Website URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#6257E8]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1">Business Description</label>
            <textarea
              rows={2}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="What does this brand do, who is it for, and what problem does it solve?"
              className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#6257E8]"
            />
          </div>

          {/* Visual Defaults */}
          <div className="pt-2 border-t border-[#EAECF0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              Visual Seed Colors & Font
            </span>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <label className="block text-[11px] font-medium text-[#475467] mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-[#344054]">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#475467] mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-[#344054]">{secondaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#475467] mb-1">Font Family</label>
                <select
                  value={primaryFont}
                  onChange={(e) => setPrimaryFont(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#D0D5DD] rounded-lg"
                >
                  <option value="Inter">Inter (Sans)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  <option value="Outfit">Outfit (Modern)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#EAECF0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F2F4F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6257E8] rounded-lg hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Brand</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
