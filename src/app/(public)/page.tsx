import React, { Suspense } from 'react';
import { HomeFeedClient } from '@/components/social/HomeFeedClient';
import { FeedCardSkeleton } from '@/components/ui/Skeleton';
import { getInitialPublicFeed } from '@/lib/feed-query';

export const revalidate = 15;

export default async function HomePage() {
  const initialFeed = await getInitialPublicFeed();

  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-4xl mx-auto py-4">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      }
    >
      <HomeFeedClient
        initialPosts={initialFeed.posts}
        initialNextCursor={initialFeed.nextCursor}
        initialHasMore={initialFeed.hasMore}
      />
    </Suspense>
  );
}
