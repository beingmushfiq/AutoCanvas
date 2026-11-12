import React from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default:
        'bg-interactive-primary text-interactive-primary-fg hover:opacity-90 active:scale-98 shadow-2xs',
      secondary:
        'bg-surface border border-border text-foreground hover:bg-surface-raised active:scale-98',
      outline:
        'border border-border text-foreground-secondary hover:text-foreground hover:border-border-strong active:scale-98 bg-transparent',
      ghost:
        'text-foreground-secondary hover:text-foreground hover:bg-background-subtle active:scale-98 bg-transparent',
      destructive:
        'bg-status-danger text-white hover:opacity-90 active:scale-98 shadow-2xs',
      accent:
        'bg-brand-accent text-interactive-primary-fg hover:opacity-90 active:scale-98 shadow-2xs font-semibold',
    }[variant]

    const sizeStyles = {
      sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-3.5 py-2 text-xs font-semibold rounded-xl gap-2',
      lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2.5',
      icon: 'p-2 rounded-lg',
    }[size]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer',
          'outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 disabled:cursor-not-allowed',
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

