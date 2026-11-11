import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { modalBackdropVariants, modalCardVariants } from '../../../lib/motion/variants'
import { apiClient } from '../../../lib/api/client'
import { appToast } from '../../../lib/toast'
import {
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  ShieldAlert,
  Loader2,
  Shuffle,
  Eye,
  EyeOff,
} from 'lucide-react'

export interface PlanItem {
  id: string
  name: string
  slug: string
  price_monthly: string | number
  features?: Record<string, any>
}

interface RegisterTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  plans?: PlanItem[]
}

export const RegisterTenantModal: React.FC<RegisterTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plans = [],
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Step 1: Organization Data
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [timezone, setTimezone] = useState('UTC')

  // Step 2: Owner Data
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sendInvite, setSendInvite] = useState(false)

  // Step 3: Subscription Plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const defaultPlan = plans.find((p) => p.slug === 'pro' || p.slug === 'agency') || plans[0]
      setSelectedPlanId(defaultPlan.id)
    }
  }, [plans, selectedPlanId])

  // Auto-generate slug as user types organization name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    setSlug(
      newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    )
  }

  const handleGenerateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*'
    let generated = ''
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setOwnerPassword(generated)
    setShowPassword(true)
  }

  const handleReset = () => {
    setStep(1)
    setName('')
    setSlug('')
    setBillingEmail('')
    setTimezone('UTC')
    setOwnerName('')
    setOwnerEmail('')
    setOwnerPassword('')
    setShowPassword(false)
    setSendInvite(false)
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      await apiClient.post('/control-plane/organizations', {
        name,
        slug: slug || undefined,
        billing_email: billingEmail || ownerEmail,
        timezone,
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_password: ownerPassword || undefined,
        send_invite: sendInvite,
        plan_id: selectedPlanId || undefined,
      })

      appToast.success(`Organization '${name}' provisioned successfully!`)
      onSuccess()
      handleReset()
      onClose()
    } catch (err) {
      console.error('Failed to register tenant:', err)
      setErrorMsg((err as Error).message || 'Failed to register organization.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-tenant-title"
            variants={modalCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="register-tenant-title" className="text-base font-bold text-foreground">
                    Register New Client Organization
                  </h2>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    Step {step} of 3: {step === 1 ? 'Organization Profile' : step === 2 ? 'Owner Account' : 'Subscription & Quota'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-brand-accent' : 'bg-background-subtle'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-brand-accent' : 'bg-background-subtle'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-brand-accent' : 'bg-background-subtle'}`} />
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-status-danger/30 bg-status-danger/10 text-status-danger text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep((step + 1) as any) }}>
              {/* STEP 1: Organization Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Media Corp"
                      value={name}
                      onChange={handleNameChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Organization Slug (Unique Identifier) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="acme-media-corp"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Billing Email
                      </label>
                      <input
                        type="email"
                        placeholder="billing@acme.com"
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Operating Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      >
                        <option value="UTC">UTC (Universal)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Chicago">America/Chicago (CST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                        <option value="Asia/Dhaka">Asia/Dhaka (BST)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Owner User Setup */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Connor"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Owner Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@acme.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-foreground-secondary">
                        Initial Owner Password
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomPassword}
                        className="text-[11px] font-mono text-brand-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Generate Random</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Leave blank to auto-generate or set initial password"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-foreground-muted hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendInvite}
                        onChange={(e) => setSendInvite(e.target.checked)}
                        className="rounded border-border text-brand-accent focus:ring-brand-accent w-4 h-4"
                      />
                      <span className="text-xs text-foreground-secondary">
                        Send invitation email with login credentials to owner
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: Subscription Plan Selection */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-xs text-foreground-secondary">
                    Select the initial subscription plan for this organization:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                    {plans.map((p) => {
                      const isSelected = selectedPlanId === p.id
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                            isSelected
                              ? 'border-brand-accent bg-brand-accent/10 ring-1 ring-brand-accent shadow-sm'
                              : 'border-border bg-background hover:border-brand-accent/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-foreground">{p.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-accent" />}
                            </div>
                            <div className="mt-1 text-base font-bold font-mono text-foreground">
                              ${p.price_monthly}
                              <span className="text-[10px] font-normal text-foreground-muted"> / mo</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-foreground-secondary space-y-0.5">
                            {p.features?.max_brands && (
                              <div>{p.features.max_brands} Brands included</div>
                            )}
                            {p.features?.max_members && (
                              <div>{p.features.max_members} Team members</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as any)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-raised text-foreground text-xs font-semibold transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md cursor-pointer"
                  >
                    <span>Next: {step === 1 ? 'Owner Account' : 'Select Plan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning Tenant...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                        <span>Confirm & Provision Organization</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
