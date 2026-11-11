import React from 'react'
import { Skeleton } from '../skeleton'
import { Card } from '../card'

export const InboxSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-180px)] min-h-[500px] animate-in fade-in duration-150" aria-label="Loading social inbox stream">
      {/* Left Conversations List */}
      <Card className="p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-xl border border-border/50 bg-background-subtle/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Right Active Conversation Stream */}
      <Card className="md:col-span-2 p-6 flex flex-col justify-between">
        {/* Thread Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Message Bubbles */}
        <div className="space-y-4 py-6">
          <div className="flex gap-3 max-w-md">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-2 bg-background-subtle p-3 rounded-2xl rounded-tl-sm w-full">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
          <div className="flex gap-3 max-w-md ml-auto flex-row-reverse">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-2 bg-surface-raised border border-border p-3 rounded-2xl rounded-tr-sm w-full">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>

        {/* Reply Composer */}
        <div className="pt-4 border-t border-border flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </Card>
    </div>
  )
}
