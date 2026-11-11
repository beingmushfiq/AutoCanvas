import React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            'flex w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-foreground-muted',
            'transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-brand-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-status-danger focus-visible:ring-status-danger',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[11px] text-status-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

