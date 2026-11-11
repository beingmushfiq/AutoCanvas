import React from 'react'
import { Skeleton } from '../skeleton'
import { Card } from '../card'

export const CanvasStudioSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150" aria-label="Loading creative canvas studio">
      {/* Canvas Studio Toolbar */}
      <Card className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-6 w-px mx-1" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </Card>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Center Artboard Stage */}
        <Card className="lg:col-span-3 p-6 flex flex-col items-center justify-center bg-background-sunken/40 border-border">
          <div className="w-full max-w-xl aspect-16/9 bg-surface rounded-xl border border-border shadow-xl p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </Card>

        {/* Right Properties & Layers Panel */}
        <Card className="p-4 space-y-5">
          <div className="space-y-2 pb-4 border-b border-border">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <div className="space-y-3 pb-4 border-b border-border">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background-subtle">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6 rounded-md" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

