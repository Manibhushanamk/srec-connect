'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StoryHighlights } from '@/components/social/StoryHighlights';
import { FeedCard, FeedPostProps } from '@/components/social/FeedCard';
import { FeedCardSkeleton } from '@/components/ui/Skeleton';
import { PostComposer } from '@/components/social/PostComposer';
import { ScholarDirectoryCard, ScholarDirectoryCardProps } from '@/components/cards/ScholarDirectoryCard';
import {
  Sparkles,
  Award,
  ChevronRight,
  GraduationCap,
  Users,
} from 'lucide-react';

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'portfolios' ? 'PORTFOLIOS' : 'FEED';
  const [activeTab, setActiveTab] = useState<'FEED' | 'PORTFOLIOS'>(initialTab);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [posts, setPosts] = useState<FeedPostProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredScholars, setFeaturedScholars] = useState<ScholarDirectoryCardProps[]>([]);
  const [isLoadingScholars, setIsLoadingScholars] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'portfolios') {
      setActiveTab('PORTFOLIOS');
    }
  }, [searchParams]);

  // Fetch live posts from API
  useEffect(() => {
    async function loadLivePosts() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/posts?filter=${feedFilter}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(Array.isArray(data.posts) ? data.posts : []);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.warn('Could not fetch live posts:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadLivePosts();
  }, [feedFilter]);

  // Fetch active featured scholars for the Portfolios tab
  useEffect(() => {
    if (activeTab === 'PORTFOLIOS' && featuredScholars.length === 0) {
      setIsLoadingScholars(true);
      fetch('/api/scholars/featured')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.scholars)) {
            setFeaturedScholars(data.scholars);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch featured scholars:', err);
        })
        .finally(() => {
          setIsLoadingScholars(false);
        });
    }
  }, [activeTab, featuredScholars.length]);

  const handlePostCreated = (newPost: any) => {
    const formatted: FeedPostProps = {
      id: newPost.id,
      content: newPost.content,
      createdAt: 'Just now',
      author: {
        id: newPost.author?.id || 'u',
        name: newPost.author?.name || 'Campus Member',
        role: newPost.author?.role || 'STUDENT',
        rollNumber: newPost.author?.student?.rollNumber,
        designation: newPost.author?.faculty?.designation,
        department: newPost.author?.student?.departmentName || newPost.author?.faculty?.departmentName || 'CSE (AI & ML)',
        isVerified: true,
      },
      images: newPost.images || [],
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. Official Institutional Stories Bar */}
      <StoryHighlights />

      {/* 2. Unified Post Creation Trigger */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* 3. Feed Navigation & Filter Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-3 pt-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'FEED'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Campus Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('PORTFOLIOS')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PORTFOLIOS'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Featured Scholars</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/achievements"
            className="hidden sm:inline-flex items-center gap-1 text-muted-foreground hover:text-primary font-medium transition-colors"
          >
            <span>Verified Honors</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feed Sub-filters for Students vs Faculty */}
      {activeTab === 'FEED' && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-muted-foreground font-medium mr-1 hidden sm:inline">Filter:</span>
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/60">
              <button
                onClick={() => setFeedFilter('ALL')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  feedFilter === 'ALL'
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => setFeedFilter('STUDENT')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  feedFilter === 'STUDENT'
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setFeedFilter('FACULTY')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  feedFilter === 'FACULTY'
                    ? 'bg-background text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Faculty
              </button>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {filteredPosts.length} post{filteredPosts.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* 4. Tab 1: Department Community Feed */}
      {activeTab === 'FEED' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <FeedCardSkeleton />
              <FeedCardSkeleton />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="social-card p-10 text-center space-y-3 bg-card border border-border rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-muted-foreground">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No posts found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active posts match the selected filter. Share an achievement or research milestone with the department!
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <FeedCard key={post.id} {...post} />
            ))
          )}
        </div>
      )}

      {/* 5. Tab 2: Verified Academic Portfolios Preview */}
      {activeTab === 'PORTFOLIOS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border text-xs">
            <span className="text-muted-foreground font-medium">
              Featured Verified Scholar Portfolios from CSE (AI & ML) Department
            </span>
            <div className="flex items-center gap-3">
              <Link href="/students" className="font-semibold text-primary hover:underline flex items-center gap-1">
                <span>All Students</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-border">|</span>
              <Link href="/faculty" className="font-semibold text-primary hover:underline flex items-center gap-1">
                <span>All Faculty</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isLoadingScholars ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 rounded-2xl bg-card/60 border border-border/80 animate-pulse" />
              <div className="h-64 rounded-2xl bg-card/60 border border-border/80 animate-pulse" />
            </div>
          ) : featuredScholars.length === 0 ? (
            <div className="social-card p-10 text-center space-y-3 bg-card border border-border rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No featured scholars available</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No verified active scholar profiles found. Browse our complete directories for students and faculty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredScholars.map((scholar) => (
                <ScholarDirectoryCard key={`${scholar.type}-${scholar.id}`} {...scholar} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 max-w-4xl mx-auto py-6">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      }
    >
      <HomePageContent />
    </React.Suspense>
  );
}
