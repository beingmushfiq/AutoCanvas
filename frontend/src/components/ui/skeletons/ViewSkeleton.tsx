import React from 'react'
import { DashboardSkeleton } from './DashboardSkeleton'
import { CalendarSkeleton } from './CalendarSkeleton'
import { CanvasStudioSkeleton } from './CanvasStudioSkeleton'
import { TableSkeleton } from './TableSkeleton'
import { InboxSkeleton } from './InboxSkeleton'
import { RadarSkeleton } from './RadarSkeleton'
import { MasterControlSkeleton } from './MasterControlSkeleton'

interface ViewSkeletonProps {
  type: string
}

export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({ type }) => {
  switch (type) {
    case 'calendar':
      return <CalendarSkeleton />
    case 'creative':
      return <CanvasStudioSkeleton />
    case 'autopilot':
    case 'radar':
      return <RadarSkeleton />
    case 'inbox':
      return <InboxSkeleton />
    case 'audit':
      return <TableSkeleton title="Security Audit & Compliance Trail" columns={5} />
    case 'team':
      return <TableSkeleton title="Organization Team Members & Access" columns={4} />
    case 'billing':
      return <TableSkeleton title="Subscription Tiers & Invoices" columns={4} />
    case 'master_control':
    case 'master-control':
      return <MasterControlSkeleton />
    case 'overview':
    case 'brands':
    case 'content':
    case 'research':
    case 'accounts':
    default:
      return <DashboardSkeleton />
  }
}
