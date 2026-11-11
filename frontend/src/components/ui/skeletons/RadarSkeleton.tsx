import React from 'react'
import { Skeleton } from '../skeleton'
import { Card } from '../card'

export const RadarSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150" aria-label="Loading news and content radar">
      {/* Radar Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Top 4 Radar Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>

      {/* Radar Tab Strip */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>

      {/* Trending Story Clusters */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="pt-2 flex items-center justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
