import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shimmer = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl bg-muted/60 dark:bg-slate-800/70',
        shimmer ? 'animate-shimmer' : 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

/**
 * 1. Scholar Directory Card Skeleton
 * Accurately mimics the Scholar Directory & Profile card layout:
 * Banner, overlapping avatar, action buttons, metadata, 4-metric stat boxes, and skill chips.
 */
export const ScholarDirectoryCardSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-card rounded-3xl border border-border overflow-hidden shadow-subtle flex flex-col">
      {/* 1. Header Banner */}
      <div className="h-32 sm:h-36 w-full relative bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-800/90 overflow-hidden shrink-0 animate-shimmer">
        <div className="absolute top-3.5 right-3.5">
          <Skeleton className="h-6 w-36 sm:w-48 rounded-full bg-black/20 dark:bg-white/10" />
        </div>
      </div>

      {/* 2. Overlapping Avatar & Action Buttons */}
      <div className="px-5 sm:px-6 pb-6 relative flex-1 flex flex-col -mt-12 sm:-mt-14">
        <div className="flex items-end justify-between gap-3 mb-3">
          {/* Avatar Skeleton */}
          <div className="relative inline-block">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-card bg-muted/80 dark:bg-slate-700/80 shadow-md" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>

        {/* 3. Name, Role & Verification Badge */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-6 w-40 sm:w-48 rounded-lg" />
            <Skeleton className="h-5 w-18 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-3/4 rounded-md" />
        </div>

        {/* 4. Metadata Line */}
        <div className="flex flex-wrap items-center gap-3 py-2.5 border-y border-border/60 mb-4">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <Skeleton className="h-3.5 w-28 rounded-md" />
        </div>

        {/* 5. Four Metric Stat Boxes Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`p-2.5 rounded-2xl border text-center space-y-1 ${
                i === 2
                  ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30'
                  : 'bg-secondary/40 border-border/60'
              }`}
            >
              <Skeleton className="h-5 w-8 mx-auto rounded-md" />
              <Skeleton className="h-2.5 w-12 mx-auto rounded-sm" />
            </div>
          ))}
        </div>

        {/* 6. Skills / Specialization Chips */}
        <div className="mt-auto space-y-2">
          <Skeleton className="h-3 w-36 rounded-md" />
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <Skeleton key={idx} className="h-7 w-20 sm:w-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. Directory Page Skeleton
 * Full page skeleton with header, horizontal filter toolbar, and grid of scholar cards.
 */
export const DirectoryPageSkeleton: React.FC<{
  badgeText?: string;
  title?: string;
  count?: number;
}> = ({ count = 6 }) => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>

      {/* Horizontal Filter Bar Skeleton */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <Skeleton className="h-10 w-32 sm:w-40 rounded-xl" />
            <Skeleton className="h-10 w-32 sm:w-40 rounded-xl" />
            <Skeleton className="h-10 w-28 sm:w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {Array.from({ length: count }).map((_, i) => (
          <ScholarDirectoryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

/**
 * 3. Instagram Story Highlights Skeleton
 */
export const StoryHighlightsSkeleton: React.FC = () => {
  return (
    <div className="social-card p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <Skeleton className="h-3.5 w-36 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
      <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-hidden py-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="p-0.5 rounded-full border-2 border-primary/20 dark:border-primary/40">
              <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-12 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 4. Post Composer Skeleton
 */
export const PostComposerSkeleton: React.FC = () => {
  return (
    <div className="social-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * 5. Feed Card Skeleton
 */
export const FeedCardSkeleton: React.FC = () => {
  return (
    <div className="social-card p-4 sm:p-5 mb-4 space-y-4">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>

      {/* Post Text */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-5/6 rounded-md" />
        <Skeleton className="h-3.5 w-4/6 rounded-md" />
      </div>

      {/* Geometry-matched Media Box (aspect-[4/3] matching FeedCard to keep CLS <= 0.1) */}
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <div className="flex gap-4">
          <Skeleton className="h-11 w-16 rounded-lg" />
          <Skeleton className="h-11 w-16 rounded-lg" />
          <Skeleton className="h-11 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * 6. Stats Grid Skeleton
 */
export const StatsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="social-card p-4 space-y-2">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-3 w-28 rounded-sm" />
        </div>
      ))}
    </div>
  );
};

/**
 * 7. Profile Header Skeleton
 */
export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="social-card overflow-hidden mb-6">
      <Skeleton className="h-36 sm:h-52 w-full rounded-none" />
      <div className="p-4 sm:p-6 -mt-14 sm:-mt-18 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-card" />
          <div className="space-y-2 mb-2">
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * 8. Table Rows Skeleton
 */
export const TableRowsSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 9. Event Card Skeleton
 */
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="social-card p-5 space-y-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3.5 w-full rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};
