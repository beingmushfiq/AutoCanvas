import React from 'react'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  current?: boolean
}

interface BreadcrumbBarProps {
  items: BreadcrumbItem[]
  className?: string
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-foreground-muted shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-bold text-foreground truncate max-w-[180px] sm:max-w-none"
                >
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-foreground-secondary hover:text-foreground font-medium transition-colors truncate max-w-[120px] sm:max-w-none outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring rounded-xs"
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="text-foreground-secondary hover:text-foreground font-medium transition-colors truncate max-w-[120px] sm:max-w-none outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring rounded-xs"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-foreground-secondary font-medium truncate max-w-[120px] sm:max-w-none">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
