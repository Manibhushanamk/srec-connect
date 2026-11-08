import React from 'react';
import {
  StoryHighlightsSkeleton,
  PostComposerSkeleton,
  FeedCardSkeleton,
  Skeleton,
} from '@/components/ui/Skeleton';

export default function PublicLoading() {
  return (
    <div className="space-y-4 max-w-full animate-in fade-in duration-200">
      {/* 1. Instagram Highlights Skeleton */}
      <StoryHighlightsSkeleton />

      {/* 2. Interactive Post Composer Skeleton */}
      <PostComposerSkeleton />

      {/* 3. Segmented Tab Bar Skeleton */}
      <div className="bg-card/70 dark:bg-space-850/70 rounded-2xl p-1.5 border border-border/70 flex items-center gap-2">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>

      {/* 4. Feed Post Cards Skeleton */}
      <div className="space-y-4">
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </div>
    </div>
  );
}
