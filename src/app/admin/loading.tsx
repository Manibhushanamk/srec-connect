import React from 'react';
import { StatsGridSkeleton, TableRowsSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 py-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-60 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatsGridSkeleton />

      {/* Main Table / Data Card */}
      <div className="social-card p-6 border-border bg-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <TableRowsSkeleton rows={6} />
      </div>
    </div>
  );
}
