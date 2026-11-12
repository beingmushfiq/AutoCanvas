import React, { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
  showLeftIcon?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, showLeftIcon = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {showLeftIcon && (
            <Lock
              className="w-4 h-4 text-foreground-muted absolute left-3 top-2.5 pointer-events-none z-10"
              aria-hidden="true"
            />
          )}

          <input
            type={showPassword ? 'text' : 'password'}
            ref={ref}
            aria-invalid={Boolean(error)}
            className={cn(
              'flex w-full rounded-xl border border-border bg-background py-2 text-xs text-foreground font-mono placeholder:text-foreground-muted placeholder:font-sans',
              showLeftIcon ? 'pl-9 pr-10' : 'pl-3.5 pr-10',
              'transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-brand-accent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-status-danger focus-visible:ring-status-danger',
              className
            )}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-2.5 top-2 p-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-background-subtle focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden cursor-pointer transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {error && (
          <p className="mt-1 text-[11px] text-status-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

