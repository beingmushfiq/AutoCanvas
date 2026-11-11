import React from 'react'
import type { LucideIcon } from 'lucide-react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
}

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const ActionIcon = action?.icon
  const SecondaryActionIcon = secondaryAction?.icon

  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border bg-surface transition-colors ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-foreground-secondary mb-4 shadow-2xs">
        <Icon className="w-6 h-6 text-brand-accent" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-foreground-secondary max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 cursor-pointer"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
              <span>{action.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold hover:bg-surface-raised active:scale-98 transition-all focus:outline-hidden focus:ring-2 focus:ring-focus-ring cursor-pointer"
            >
              {SecondaryActionIcon && <SecondaryActionIcon className="w-4 h-4" aria-hidden="true" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
