import React from 'react'

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  pulse?: boolean
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = false,
  className = '',
}) => {
  const dotColor = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    info: 'bg-status-info',
    neutral: 'bg-foreground-muted',
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span className="text-foreground-secondary">{label}</span>}
    </span>
  )
}

