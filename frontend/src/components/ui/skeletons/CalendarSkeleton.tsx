import React from 'react'
import { Skeleton } from '../skeleton'
import { Card } from '../card'

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150" aria-label="Loading calendar">
      {/* Calendar Header Controls */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </Card>

      {/* Calendar Day Header */}
      <div className="grid grid-cols-7 gap-2 px-2 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="py-2 flex justify-center">
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>

      {/* Calendar Month Grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <Card key={i} className="min-h-28 p-2 flex flex-col justify-between border-border/60">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-4" />
              {i % 4 === 0 && <Skeleton className="h-3 w-8 rounded-full" />}
            </div>
            {i % 3 === 0 && (
              <div className="space-y-1.5 mt-2">
                <Skeleton className="h-5 w-full rounded-md" />
                {i % 6 === 0 && <Skeleton className="h-5 w-4/5 rounded-md" />}
              </div>
            )}
            <div className="mt-auto pt-1 flex justify-end">
              <Skeleton className="h-2 w-6" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
