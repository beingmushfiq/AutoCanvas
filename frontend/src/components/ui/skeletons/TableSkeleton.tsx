import React from 'react'
import { Skeleton } from '../skeleton'
import { Card } from '../card'

interface TableSkeletonProps {
  columns?: number
  rows?: number
  title?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 5,
  rows = 7,
  title,
}) => {
  return (
    <Card className="p-6 space-y-4 animate-in fade-in duration-150" aria-label="Loading table data">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          {title ? (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          ) : (
            <Skeleton className="h-5 w-48" />
          )}
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Table Content */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Table Head */}
        <div className="bg-background-subtle border-b border-border p-3 grid grid-cols-12 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className={i === 0 ? 'col-span-4' : i === 1 ? 'col-span-3' : 'col-span-2'}
            >
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="p-4 grid grid-cols-12 gap-4 items-center">
              {Array.from({ length: columns }).map((_, c) => (
                <div
                  key={c}
                  className={c === 0 ? 'col-span-4' : c === 1 ? 'col-span-3' : 'col-span-2'}
                >
                  <Skeleton
                    className={`h-4 ${
                      c === 0 ? 'w-4/5' : c === columns - 1 ? 'w-12 ml-auto' : 'w-24'
                    }`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Table Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </Card>
  )
}
