import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '../../components/ui/empty-state'
import { Skeleton } from '../../components/ui/skeleton'
import { ErrorState, type ErrorStateProps } from './ErrorState'
import { RestrictedState, type RestrictedStateProps } from './RestrictedState'

export type SystemLifecycleStatus =
  | 'loading'
  | 'content'
  | 'empty'
  | 'error'
  | 'restricted'
  | 'offline'

export interface StateBoundaryProps<T> {
  status: SystemLifecycleStatus
  data?: T | null
  isEmpty?: (data: T) => boolean
  onRetry?: () => void
  loadingComponent?: React.ReactNode
  emptyConfig?: {
    icon: LucideIcon
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
      icon?: LucideIcon
    }
  }
  errorConfig?: Partial<ErrorStateProps>
  restrictedConfig?: Partial<RestrictedStateProps>
  className?: string
  children: (data: T) => React.ReactNode
}

/**
 * Universal StateBoundary Component
 * Implements the system-wide finite state machine for loading, content,
 * empty, error, restricted, and offline states with full WCAG 2.2 AA compliance.
 */
export function StateBoundary<T>({
  status,
  data,
  isEmpty,
  onRetry,
  loadingComponent,
  emptyConfig,
  errorConfig,
  restrictedConfig,
  className = '',
  children,
}: StateBoundaryProps<T>): React.ReactElement {
  // 1. Loading State
  if (status === 'loading') {
    if (loadingComponent) {
      return (
        <div role="status" aria-busy="true" aria-live="polite" className={className}>
          {loadingComponent}
        </div>
      )
    }

    // Default Layout-Matched Skeleton
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading content..."
        aria-live="polite"
        className={`space-y-4 p-4 rounded-2xl border border-border bg-surface ${className}`}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    )
  }

  // 2. Error State
  if (status === 'error') {
    return (
      <ErrorState
        title={errorConfig?.title}
        message={errorConfig?.message}
        error={errorConfig?.error}
        errorCode={errorConfig?.errorCode}
        onRetry={onRetry || errorConfig?.onRetry}
        onBack={errorConfig?.onBack}
        className={className}
      />
    )
  }

  // 3. Permission / Restricted State
  if (status === 'restricted') {
    return (
      <RestrictedState
        title={restrictedConfig?.title}
        description={restrictedConfig?.description}
        requiredRole={restrictedConfig?.requiredRole}
        requiredPlan={restrictedConfig?.requiredPlan}
        onAction={restrictedConfig?.onAction}
        actionLabel={restrictedConfig?.actionLabel}
        className={className}
      />
    )
  }

  // Determine if data is empty
  const isDataEmpty =
    status === 'empty' ||
    !data ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof isEmpty === 'function' && isEmpty(data))

  // 4. Empty State
  if (isDataEmpty && emptyConfig) {
    return (
      <EmptyState
        icon={emptyConfig.icon}
        title={emptyConfig.title}
        description={emptyConfig.description}
        action={emptyConfig.action}
        className={className}
      />
    )
  }

  // 5. Content (Success / Default / Offline-Cached) State
  return (
    <div role="region" className={className}>
      {children(data as T)}
    </div>
  )
}
