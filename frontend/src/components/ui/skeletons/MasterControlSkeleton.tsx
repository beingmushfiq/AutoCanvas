import React from 'react'
import { Skeleton } from '../skeleton'
import { Card } from '../card'

export const MasterControlSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150" aria-label="Loading master control panel">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Configuration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-5">
          <div className="space-y-1 pb-3 border-b border-border">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-80" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </Card>

        {/* Right Audit & Telemetry Sidebar */}
        <Card className="p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-full" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-background-subtle space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
