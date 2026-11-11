import React from 'react'

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-surface-raised text-foreground border-border',
    secondary: 'bg-background-subtle text-foreground-secondary border-border-subtle',
    outline: 'border-border text-foreground-secondary bg-transparent',
    success: 'bg-status-success-bg text-status-success border-transparent',
    warning: 'bg-status-warning-bg text-status-warning border-transparent',
    danger: 'bg-status-danger-bg text-status-danger border-transparent',
    accent: 'bg-brand-accent-subtle text-foreground border-transparent',
  }[variant]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono-numeric font-medium border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  )
}

