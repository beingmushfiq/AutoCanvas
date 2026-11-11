import React from 'react'
import { cn } from '../../lib/utils'

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-background-subtle border border-border-subtle',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

