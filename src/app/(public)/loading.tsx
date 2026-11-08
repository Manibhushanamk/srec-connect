import React from 'react';
import { FeedCardSkeleton, StatsGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 py-4 animate-in fade-in duration-200">
      <StatsGridSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </div>
  );
}
