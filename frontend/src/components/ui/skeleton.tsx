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

// Composite Presets for Dimension-Matched Zero-Layout-Shift Loading
export { DashboardSkeleton } from './skeletons/DashboardSkeleton'
export { CalendarSkeleton } from './skeletons/CalendarSkeleton'
export { CanvasStudioSkeleton } from './skeletons/CanvasStudioSkeleton'
export { TableSkeleton } from './skeletons/TableSkeleton'
export { InboxSkeleton } from './skeletons/InboxSkeleton'
export { RadarSkeleton } from './skeletons/RadarSkeleton'
export { MasterControlSkeleton } from './skeletons/MasterControlSkeleton'
export { ViewSkeleton } from './skeletons/ViewSkeleton'
