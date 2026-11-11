import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { modalBackdropVariants, modalCardVariants } from '../../../lib/motion/variants'
import { apiClient } from '../../../lib/api/client'
import { appToast } from '../../../lib/toast'
import { ShieldAlert, CheckCircle2, X, Loader2 } from 'lucide-react'

interface SuspendTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organization: {
    id: string
    name: string
    status: string
  } | null
}

export const SuspendTenantModal: React.FC<SuspendTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organization,
}) => {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSuspended = organization?.status === 'suspended'
  const actionTarget = isSuspended ? 'active' : 'suspended'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    setIsSubmitting(true)

    try {
      await apiClient.put(`/control-plane/organizations/${organization.id}/status`, {
        status: actionTarget,
        reason: reason || undefined,
      })

      appToast.success(
        isSuspended
          ? `Organization '${organization.name}' has been reactivated.`
          : `Organization '${organization.name}' has been suspended.`
      )

      onSuccess()
      setReason('')
      onClose()
    } catch (err) {
      console.error('Failed to change tenant status:', err)
      appToast.error((err as Error).message || 'Failed to update organization status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && organization && (
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
            aria-labelledby="suspend-modal-title"
            variants={modalCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSuspended
                      ? 'bg-status-success/15 text-status-success border border-status-success/30'
                      : 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                  }`}
                >
                  {isSuspended ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 id="suspend-modal-title" className="text-base font-bold text-foreground">
                    {isSuspended ? 'Reactivate Organization' : 'Suspend Organization'}
                  </h3>
                  <p className="text-xs text-foreground-secondary">{organization.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-foreground-secondary leading-relaxed">
              {isSuspended ? (
                <span>
                  Reactivating <strong>{organization.name}</strong> will restore access for all tenant members and resume scheduled publishing queues.
                </span>
              ) : (
                <span>
                  Suspending <strong>{organization.name}</strong> will immediately revoke all active session tokens for its members and halt all outgoing publishing jobs. Data and scheduled posts are preserved.
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSuspended && (
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Administrative Reason (Required for Audit Log) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Delinquent billing terms / policy compliance review..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!isSuspended && !reason.trim())}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                    isSuspended
                      ? 'bg-status-success text-white hover:opacity-90'
                      : 'bg-status-danger text-white hover:opacity-90'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSuspended ? 'Confirm Reactivation' : 'Confirm Suspension'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
