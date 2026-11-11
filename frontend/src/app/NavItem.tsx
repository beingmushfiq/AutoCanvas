import React from 'react'

interface NavItemProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  isActive: boolean
  badge?: string
  onClick: () => void
}

export const NavItem: React.FC<NavItemProps> = ({
  id,
  label,
  icon: Icon,
  isActive,
  badge,
  onClick,
}) => {
  return (
    <button
      key={id}
      type="button"
      role="link"
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={`w-full group relative flex items-center justify-between px-3 py-[var(--density-nav-py,0.5rem)] text-xs font-medium rounded-xl transition-all duration-150 outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 select-none ${
        isActive
          ? 'bg-nav-item-active-bg text-nav-item-active-fg font-semibold shadow-2xs'
          : 'text-nav-item-fg hover:bg-nav-item-hover-bg hover:text-nav-item-hover-fg'
      }`}
    >
      {/* Direction B: Editorial Amber Left Indicator Mark */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-nav-item-active-mark"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2.5 truncate">
        <Icon
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-brand-accent' : 'text-foreground-muted group-hover:text-foreground'
          }`}
        />
        <span className="truncate">{label}</span>
      </div>

      {badge && (
        <span className="text-[10px] font-mono-numeric px-1.5 py-0.5 rounded-full bg-background-subtle border border-border text-foreground-secondary font-medium">
          {badge}
        </span>
      )}
    </button>
  )
}

