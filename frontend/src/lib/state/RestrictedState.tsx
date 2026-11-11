import React from 'react'
import { ShieldAlert, ArrowUpRight, Lock } from 'lucide-react'

export interface RestrictedStateProps {
  title?: string
  description?: string
  requiredRole?: string
  requiredPlan?: string
  onAction?: () => void
  actionLabel?: string
  className?: string
}

export const RestrictedState: React.FC<RestrictedStateProps> = ({
  title = 'Restricted Workspace Capability',
  description = 'Your current tenant role or subscription tier does not have permission to access this operational studio.',
  requiredRole,
  requiredPlan = 'Agency Pro',
  onAction,
  actionLabel = 'Upgrade Workspace Tier',
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-border bg-surface shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-brand-accent-subtle border border-brand-accent/30 flex items-center justify-center text-brand-accent mb-4 shadow-2xs">
        <Lock className="w-6 h-6 text-brand-accent" aria-hidden="true" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
        {requiredPlan && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-accent-subtle text-foreground text-[10px] font-mono font-bold uppercase tracking-wider">
            Plan: {requiredPlan}
          </span>
        )}
        {requiredRole && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background-subtle border border-border text-foreground-secondary text-[10px] font-mono font-medium uppercase tracking-wider">
            Role: {requiredRole}
          </span>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight max-w-md">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-foreground-secondary max-w-md mt-1.5 leading-relaxed">
        {description}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <span>{actionLabel}</span>
          <ArrowUpRight className="w-4 h-4 text-brand-accent" aria-hidden="true" />
        </button>
      )}

      <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-foreground-muted">
        <ShieldAlert className="w-3.5 h-3.5 text-brand-accent shrink-0" aria-hidden="true" />
        <span>Multi-Tenant Access Governance Enforced</span>
      </div>
    </div>
  )
}
