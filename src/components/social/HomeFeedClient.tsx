'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { StoryHighlights } from '@/components/social/StoryHighlights';
import { FeedCard, FeedPostProps } from '@/components/social/FeedCard';
import { FeedCardSkeleton } from '@/components/ui/Skeleton';
import { PostComposer } from '@/components/social/PostComposer';
import {
  Sparkles,
  Award,
  ChevronRight,
  HardDrive,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
  LogIn,
} from 'lucide-react';

interface WorkspaceData {
  authenticated: boolean;
  identity?: {
    id: string;
    name: string;
    email: string;
    role: string;
    rollNumber: string | null;
    batch: string | null;
    section: string | null;
    semester: string | null;
    department: string;
  };
  pipeline?: {
    submitted: number;
    underFacultyReview: number;
    awaitingHod: number;
    resubmissionRequired: number;
    rejected: number;
    approvedPublished: number;
  };
  pendingSubmissions?: {
    id: string;
    title: string;
    organizationEventName: string;
    status: string;
    rejectionReason: string | null;
  }[];
  driveConnected?: boolean;
}

interface HomeFeedClientProps {
  initialPosts: FeedPostProps[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

export function HomeFeedClient({
  initialPosts,
  initialNextCursor,
  initialHasMore,
}: HomeFeedClientProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const composeParam = searchParams.get('compose');
  const initialComposeMode =
    composeParam === 'milestone' ? 'milestone' : composeParam === 'post' ? 'post' : null;
  const initialTab = searchParams.get('tab') === 'workspace' ? 'WORKSPACE' : 'FEED';

  const [activeTab, setActiveTab] = useState<'FEED' | 'WORKSPACE'>(initialTab);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [posts, setPosts] = useState<FeedPostProps[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedInitialRef = useRef(false);

  const scrollPositionsRef = useRef<{ FEED: number; WORKSPACE: number }>({
    FEED: 0,
    WORKSPACE: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      scrollPositionsRef.current[activeTab] = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab]);

  const handleTabSwitch = (nextTab: 'FEED' | 'WORKSPACE') => {
    if (nextTab === activeTab) return;
    if (typeof window !== 'undefined') {
      scrollPositionsRef.current[activeTab] = window.scrollY;
    }
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetY = scrollPositionsRef.current[activeTab] || 0;
    if (targetY === 0 && window.scrollY === 0) return;
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab]);

  useEffect(() => {
    if (composeParam === 'post' || composeParam === 'milestone') {
      setActiveTab('FEED');
    } else if (searchParams.get('tab') === 'workspace') {
      setActiveTab('WORKSPACE');
    }
  }, [composeParam, searchParams]);

  // Refetch only when filter changes away from initial ALL, or silently hydrate signed-in likes/bookmarks
  useEffect(() => {
    if (!hasHydratedInitialRef.current) {
      hasHydratedInitialRef.current = true;
      if (feedFilter === 'ALL' && !session?.user?.email) {
        return;
      }
    }

    let active = true;
    async function loadFilteredPosts() {
      const showSkeleton = feedFilter !== 'ALL' || posts.length === 0;
      if (showSkeleton) setIsLoading(true);
      try {
        const res = await fetch(`/api/posts?filter=${feedFilter}&take=10`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setPosts(Array.isArray(data.posts) ? data.posts : []);
          setNextCursor(data.nextCursor || null);
          setHasMore(Boolean(data.hasMore));
        }
      } catch (err) {
        console.warn('Could not fetch live posts:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadFilteredPosts();
    return () => {
      active = false;
    };
  }, [feedFilter, session?.user?.email]);

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/posts?filter=${feedFilter}&take=10&cursor=${encodeURIComponent(nextCursor)}`
      );
      if (res.ok) {
        const data = await res.json();
        const incoming: FeedPostProps[] = Array.isArray(data.posts) ? data.posts : [];
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...incoming.filter((p) => !existingIds.has(p.id))];
        });
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      console.warn('Failed to load next feed page:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [feedFilter, hasMore, isLoadingMore, nextCursor]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || activeTab !== 'FEED' || !hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: '250px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, hasMore, isLoadingMore, loadMorePosts]);

  // Fetch My Workspace pipeline when tab active
  useEffect(() => {
    if (activeTab === 'WORKSPACE' && !workspaceData) {
      setIsLoadingWorkspace(true);
      fetch('/api/user/workspace')
        .then((res) => res.json())
        .then((data) => setWorkspaceData(data))
        .catch(() => setWorkspaceData({ authenticated: false }))
        .finally(() => setIsLoadingWorkspace(false));
    }
  }, [activeTab, workspaceData, session]);

  const handlePostCreated = (newPost: any) => {
    const formatted: FeedPostProps = {
      id: newPost.id,
      content: newPost.content,
      createdAt: newPost.createdAt || new Date().toISOString(),
      updatedAt: newPost.updatedAt,
      visibility: newPost.visibility || 'PUBLIC',
      author: {
        id: newPost.author?.id || 'u',
        name: newPost.author?.name || 'Campus Member',
        role: newPost.author?.role || 'STUDENT',
        departmentId: newPost.author?.departmentId || null,
        rollNumber: newPost.author?.student?.rollNumber,
        designation: newPost.author?.faculty?.designation,
        department:
          newPost.author?.student?.departmentName ||
          newPost.author?.faculty?.departmentName ||
          'CSE (AI & ML)',
        isVerified: true,
      },
      images: (newPost.images || newPost.media?.map((m: any) => m.url) || []).slice(0, 2),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
      initialComments: [],
      collaborators: newPost.collaborators || [],
      achievement: newPost.achievement,
    };
    setPosts((prev) => [formatted, ...prev]);
  };

  const filteredPosts = posts.filter((post) => {
    if (feedFilter === 'STUDENT') {
      return post.author.role === 'STUDENT';
    }
    if (feedFilter === 'FACULTY') {
      return post.author.role === 'FACULTY' || post.author.role === 'HOD';
    }
    return true;
  });

  return (
    <div className="md:flex md:flex-col md:h-full max-w-4xl mx-auto pb-12 md:pb-0">
      {/* 1. Balanced Hub Segmented Control: Campus Feed (default) & My Workspace */}
      <div
        role="tablist"
        aria-label="Campus Hub Switcher"
        className="grid grid-cols-2 p-1 glass-card mb-5 md:mb-0 md:shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'FEED'}
          onClick={() => handleTabSwitch('FEED')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'FEED'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Campus Feed</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'WORKSPACE'}
          onClick={() => handleTabSwitch('WORKSPACE')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'WORKSPACE'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="w-4 h-4" aria-hidden="true" />
          <span>My Workspace</span>
        </button>
      </div>

      {/* 2. Tab 1: Campus Feed (kept mounted with hidden class for state/scroll preservation) */}
      <div className={`md:flex-1 md:min-h-0 md:overflow-y-auto md:overscroll-contain no-scrollbar space-y-5 mt-5 md:mt-4 ${activeTab === 'FEED' ? '' : 'hidden'}`}>
        <StoryHighlights />

        <PostComposer
          onPostCreated={handlePostCreated}
          initialComposeMode={initialComposeMode}
        />

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-muted-foreground font-medium mr-1 hidden sm:inline">Filter:</span>
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setFeedFilter('ALL')}
                className={`whitespace-nowrap min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  feedFilter === 'ALL'
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Posts
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('STUDENT')}
                className={`whitespace-nowrap min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  feedFilter === 'STUDENT'
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('FACULTY')}
                className={`whitespace-nowrap min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  feedFilter === 'FACULTY'
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Faculty
              </button>
            </div>
          </div>
          <Link
            href="/achievements"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
          >
            <span>Verified Honors</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="social-card p-8 sm:p-12 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-foreground">No posts yet in this feed</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Share a campus photo moment, project milestone, or submit a verified academic achievement.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/achievements/submit"
                className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-[#CA8A04] dark:bg-[#FACC15] text-white dark:text-[#0D0E12] font-semibold text-xs hover:opacity-95 transition-opacity shadow-xs"
              >
                Submit Academic Achievement
              </Link>
              <Link
                href="/achievements"
                className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-secondary text-foreground font-semibold text-xs border border-border hover:bg-secondary/80 transition-colors"
              >
                Verified Honors
              </Link>
              <Link
                href="/events"
                className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-secondary text-foreground font-semibold text-xs border border-border hover:bg-secondary/80 transition-colors"
              >
                View Campus Events
              </Link>
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const firstMediaIdx = filteredPosts.findIndex(
                (p) => Array.isArray(p.images) && p.images.length > 0
              );
              return filteredPosts.map((post, idx) => (
                <FeedCard
                  key={post.id}
                  {...post}
                  isAboveFold={idx <= 1 || idx === firstMediaIdx}
                  isPriority={idx === firstMediaIdx && firstMediaIdx <= 2}
                />
              ));
            })()}

            {hasMore && (
              <div ref={loadMoreSentinelRef} className="pt-2 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={loadMorePosts}
                  disabled={isLoadingMore}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl glass-card text-xs font-semibold text-foreground hover:border-primary/40 transition-colors disabled:opacity-60"
                >
                  {isLoadingMore ? 'Loading more posts...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Tab 2: My Workspace */}
      {activeTab === 'WORKSPACE' && (
        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto md:overscroll-contain no-scrollbar space-y-5 mt-5 md:mt-4">
          {isLoadingWorkspace ? (
            <div className="space-y-4">
              <FeedCardSkeleton />
            </div>
          ) : !workspaceData?.authenticated ? (
            <div className="social-card p-8 sm:p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-[#C2410C] dark:text-[#F97316] flex items-center justify-center mx-auto">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Sign in to open My Workspace</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                Track your 6-state achievement verification pipeline, certificate resubmission remarks, and Google Drive storage sync.
              </p>
              <Link
                href="/signin"
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] dark:bg-[#F97316] text-white font-semibold text-sm hover:bg-[#C2410C] dark:hover:bg-[#FB923C] transition-colors shadow-[0_4px_16px_rgba(249,115,22,0.34)]"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with SREC Google Account</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Academic Identity Card */}
              <div className="social-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      {workspaceData.identity?.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#CA8A04]/15 dark:bg-[#FACC15]/15 text-[#92400E] dark:text-[#FACC15] border border-[#CA8A04]/35 dark:border-[#FACC15]/35">
                      {workspaceData.identity?.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {workspaceData.identity?.rollNumber ? `Roll: ${workspaceData.identity.rollNumber} • ` : ''}
                    {workspaceData.identity?.department}
                    {workspaceData.identity?.batch ? ` • Batch ${workspaceData.identity.batch}` : ''}
                    {workspaceData.identity?.semester ? ` • Sem ${workspaceData.identity.semester}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      workspaceData.driveConnected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    {workspaceData.driveConnected ? 'Google Drive Synced' : 'Drive Not Linked'}
                  </span>
                  <Link
                    href="/achievements/submit"
                    className="min-h-[44px] inline-flex items-center px-3.5 py-2 rounded-xl bg-[#CA8A04] dark:bg-[#FACC15] text-white dark:text-[#0D0E12] text-xs font-bold hover:opacity-95 transition-opacity"
                  >
                    + Submit Honor
                  </Link>
                </div>
              </div>

              {/* 6-State Verification Pipeline Counts */}
              <div className="social-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" />
                    <span>Achievement Verification Pipeline</span>
                  </h3>
                  <Link href="/dashboard/student" className="text-xs font-semibold text-[#C2410C] dark:text-[#F97316] hover:underline">
                    Full Dashboard
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                  {[
                    { label: 'Submitted', value: workspaceData.pipeline?.submitted ?? 0 },
                    { label: 'Faculty Review', value: workspaceData.pipeline?.underFacultyReview ?? 0 },
                    { label: 'HOD Approval', value: workspaceData.pipeline?.awaitingHod ?? 0 },
                    { label: 'Resubmit Req.', value: workspaceData.pipeline?.resubmissionRequired ?? 0 },
                    { label: 'Rejected', value: workspaceData.pipeline?.rejected ?? 0 },
                    { label: 'Approved & Pub.', value: workspaceData.pipeline?.approvedPublished ?? 0, gold: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`p-3 rounded-xl border ${
                        item.gold
                          ? 'bg-[#CA8A04]/12 dark:bg-[#FACC15]/12 border-[#CA8A04]/40 dark:border-[#FACC15]/40'
                          : 'liquid-chip'
                      }`}
                    >
                      <p className="text-lg font-extrabold text-foreground">{item.value}</p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Pending / Resubmission Remarks */}
              <div className="social-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Active Submission Updates &amp; Remarks</span>
                </h3>
                {workspaceData.pendingSubmissions && workspaceData.pendingSubmissions.length > 0 ? (
                  <div className="space-y-2.5">
                    {workspaceData.pendingSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-xl liquid-chip flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{sub.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{sub.organizationEventName}</p>
                          {sub.rejectionReason && (
                            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{sub.rejectionReason}</span>
                            </p>
                          )}
                        </div>
                        <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-[#CA8A04]/40 dark:border-[#FACC15]/40 bg-[#CA8A04]/12 dark:bg-[#FACC15]/12 text-[#92400E] dark:text-[#FACC15]">
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>All recent achievement submissions have finished review or are awaiting a new upload.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
