import React from 'react';
import { StatsGridSkeleton, TableRowsSkeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 py-6 animate-in fade-in duration-200">
      <StatsGridSkeleton />
      <div className="social-card p-6 border-border bg-card">
        <div className="h-6 w-48 bg-muted/60 rounded-lg mb-4 animate-pulse" />
        <TableRowsSkeleton rows={6} />
      </div>
    </div>
  );
}
