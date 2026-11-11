import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  const ActionIcon = action?.icon

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
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  )
}

