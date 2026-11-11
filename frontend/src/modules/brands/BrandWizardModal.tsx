import React, { useState } from 'react'
import {
  SparklesIcon,
  Cancel01Icon,
  Building02Icon,
  Globe02Icon,
  AlertCircleIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import { HugeIcon } from '../../components/ui/hugeicon'
import { apiClient, type ApiResponse } from '../../lib/api/client'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { appToast } from '../../lib/toast'

interface BrandWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (brandId: string) => void
}

export const BrandWizardModal: React.FC<BrandWizardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#101828')
  const [secondaryColor, setSecondaryColor] = useState('#F59E0B')
  const [primaryFont, setPrimaryFont] = useState('Geist')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Intercept unauthenticated guest attempts gracefully
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('autocanvas:open-auth', { detail: { mode: 'login' } }))
      appToast.info('Authentication Required', {
        description: 'Please sign in or create an account to save custom brands to your workspace.',
      })
      return
    }

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
        appToast.success('Brand Created', {
          description: `"${name}" is ready for autonomous content creation.`,
        })
        onSuccess(res.data.id)
        onClose()
      }
    } catch (err: any) {
      const isUnauth = err?.status === 401 || err?.message?.toLowerCase().includes('unauthenticated')
      if (isUnauth) {
        setError('UNAUTHENTICATED')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create brand')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg border border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border text-brand-accent flex items-center justify-center shadow-2xs">
              <HugeIcon icon={SparklesIcon} size="sm" />
            </div>
            <div>
              <h3 id="brand-modal-title" className="text-base font-bold text-foreground">
                Create New Brand
              </h3>
              <p className="text-xs text-foreground-secondary">Establish identity, visual foundation, and positioning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close brand creation wizard"
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring cursor-pointer"
          >
            <HugeIcon icon={Cancel01Icon} size="sm" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Polite Guest Banner when in demo mode */}
          {!isAuthenticated && (
            <div className="p-3.5 rounded-xl border border-border bg-background-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-brand-accent shrink-0">
                  <HugeIcon icon={SparklesIcon} size="xs" />
                </div>
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Guest Preview Mode</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-brand-accent-subtle text-foreground text-[9px] font-mono font-bold">
                      Demo
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-secondary mt-0.5">
                    Sign in to save and manage brand profiles in your workspace.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('autocanvas:open-auth', { detail: { mode: 'login' } }))
                }}
                className="shrink-0 text-xs py-1.5 px-3"
              >
                Sign In
              </Button>
            </div>
          )}

          {/* Interactive Error Box */}
          {error && (
            error === 'UNAUTHENTICATED' ? (
              <div className="p-3.5 text-xs bg-status-danger/10 text-status-danger rounded-xl border border-status-danger/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <HugeIcon icon={AlertCircleIcon} size="sm" className="shrink-0 text-status-danger" />
                  <div>
                    <span className="font-bold block">Authentication Required</span>
                    <span className="text-[11px] opacity-90">
                      Your session is unauthenticated or has expired. Please sign in to create brands.
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => {
                    onClose()
                    window.dispatchEvent(new CustomEvent('autocanvas:open-auth', { detail: { mode: 'login' } }))
                  }}
                  className="shrink-0 text-xs"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="p-3 text-xs bg-status-danger/10 text-status-danger rounded-xl border border-status-danger/30 font-semibold flex items-center gap-2">
                <HugeIcon icon={AlertCircleIcon} size="sm" className="shrink-0 text-status-danger" />
                <span>{error}</span>
              </div>
            )
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Brand Name <span className="text-status-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 pointer-events-none">
                <HugeIcon icon={Building02Icon} size="sm" className="text-foreground-muted" />
              </span>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Studio"
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Industry</label>
              <Input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS / E-commerce"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Website URL</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 pointer-events-none">
                  <HugeIcon icon={Globe02Icon} size="sm" className="text-foreground-muted" />
                </span>
                <Input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Business Description</label>
            <textarea
              rows={2}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="What does this brand do, who is it for, and what problem does it solve?"
              className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          {/* Visual Defaults */}
          <div className="pt-2 border-t border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              Visual Seed Colors & Font
            </span>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <label className="block text-[11px] font-medium text-foreground-secondary mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface"
                  />
                  <span className="text-xs font-mono text-foreground">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground-secondary mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface"
                  />
                  <span className="text-xs font-mono text-foreground">{secondaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground-secondary mb-1">Font Family</label>
                <select
                  value={primaryFont}
                  onChange={(e) => setPrimaryFont(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-surface text-foreground border border-border rounded-xl outline-hidden focus:ring-2 focus:ring-focus-ring"
                >
                  <option value="Geist">Geist (Modern Sans)</option>
                  <option value="Inter">Inter</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  <option value="Outfit">Outfit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="gap-1.5 cursor-pointer"
            >
              {loading ? (
                <HugeIcon icon={Loading03Icon} size="sm" className="animate-spin" />
              ) : (
                <HugeIcon icon={SparklesIcon} size="sm" />
              )}
              <span>{isAuthenticated ? 'Create Brand' : 'Sign In to Save Brand'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
