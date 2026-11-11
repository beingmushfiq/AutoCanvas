import React from 'react'
import { usePreferences } from '../../lib/theme/PreferencesContext'

interface LogoProps {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showWordmark = true,
  size = 'md',
}) => {
  const { theme } = usePreferences()
  const isDark = theme === 'dark'

  const dimensions = {
    sm: { symbol: 24, text: 'text-sm' },
    md: { symbol: 28, text: 'text-base' },
    lg: { symbol: 36, text: 'text-lg' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Symbol: "The Frame" */}
      <svg
        width={dimensions.symbol}
        height={dimensions.symbol}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-150 ease-out hover:scale-105"
        aria-hidden="true"
      >
        {/* Outer Frame */}
        <rect
          x="4"
          y="4"
          width="19"
          height="19"
          rx="3"
          stroke="var(--foreground)"
          strokeWidth="1.75"
        />
        {/* Inner Frame */}
        <rect
          x="9"
          y="9"
          width="19"
          height="19"
          rx="3"
          stroke="var(--foreground-muted)"
          strokeWidth="1.5"
        />
        {/* Editorial Amber Focal Anchor */}
        <circle
          cx="9"
          cy="9"
          r="2.5"
          fill={isDark ? 'var(--brand-accent)' : 'oklch(68% 0.18 60)'}
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-sans tracking-tight ${dimensions.text}`}>
            <span className="font-bold text-foreground">Auto</span><span className="font-normal text-foreground-secondary">Canvas</span>
          </span>
          <span className="text-[10px] font-mono tracking-wider uppercase text-foreground-muted mt-0.5">
            Brand Ops
          </span>
        </div>
      )}
    </div>
  )
}

