import React from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'

interface NavItemProps {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  isActive: boolean
  badge?: string
  isCollapsed?: boolean
  onClick: () => void
}

export const NavItem: React.FC<NavItemProps> = ({
  id,
  label,
  icon: Icon,
  isActive,
  badge,
  isCollapsed = false,
  onClick,
}) => {
  const buttonContent = (
    <button
      key={id}
      type="button"
      role="link"
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      onClick={onClick}
      className={`group relative flex items-center rounded-xl transition-all duration-150 outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 select-none ${
        isCollapsed
          ? 'w-10 h-10 mx-auto justify-center'
          : 'w-full justify-between px-3 py-[var(--density-nav-py,0.5rem)] text-xs font-medium'
      } ${
        isActive
          ? 'bg-nav-item-active-bg text-nav-item-active-fg font-semibold shadow-2xs'
          : 'text-nav-item-fg hover:bg-nav-item-hover-bg hover:text-nav-item-hover-fg'
      }`}
    >
      {/* Editorial Amber Left Indicator Mark */}
      {isActive && (
        <span
          className={`absolute left-0 w-[3px] rounded-r-full bg-nav-item-active-mark ${
            isCollapsed ? 'top-2 bottom-2' : 'top-1.5 bottom-1.5'
          }`}
          aria-hidden="true"
        />
      )}

      <div className={`flex items-center gap-2.5 truncate ${isCollapsed ? 'justify-center' : ''}`}>
        <Icon
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-brand-accent' : 'text-foreground-muted group-hover:text-foreground'
          }`}
        />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </div>

      {!isCollapsed && badge && (
        <span className="text-[10px] font-mono-numeric px-1.5 py-0.5 rounded-full bg-background-subtle border border-border text-foreground-secondary font-medium">
          {badge}
        </span>
      )}
    </button>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2 text-xs font-medium">
          <span>{label}</span>
          {badge && (
            <span className="text-[10px] font-mono-numeric px-1.5 py-0.2 rounded-full bg-surface-raised border border-border text-foreground-muted">
              {badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
}
