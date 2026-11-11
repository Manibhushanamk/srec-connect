'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StoryHighlights } from '@/components/social/StoryHighlights';
import { FeedCard, FeedPostProps } from '@/components/social/FeedCard';
import { FeedCardSkeleton } from '@/components/ui/Skeleton';
import { PostComposer } from '@/components/social/PostComposer';
import { ProfileHeader } from '@/components/portfolio/ProfileHeader';
import { ScholarDirectoryCard } from '@/components/cards/ScholarDirectoryCard';
import {
  Sparkles,
  Award,
  BookOpen,
  Calendar,
  Shield,
  GraduationCap,
  PlusCircle,
  Filter,
  Image,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Brain,
  Code,
  CheckCircle2,
} from 'lucide-react';

const FALLBACK_POSTS: FeedPostProps[] = [
  {
    id: 'post-1',
    author: {
      id: 'u1',
      name: 'K. V. Naveen Kumar',
      role: 'STUDENT',
      rollNumber: '22091A3201',
      department: 'CSE (AI & ML)',
      isVerified: true,
    },
    content: `🚀 Proud to share that our team won 1st Place at the National AI Hackathon 2026! 🏆\n\nWe built an automated Deep Learning pipeline for real-time agricultural crop disease detection using PyTorch and mobile edge inference. Special thanks to our faculty mentor Dr. K. Subhashini for continuous guidance.\n\n#AIML #DeepLearning #SmartAgriculture #HackathonWinner #SREC`,
    images: [
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: '2 hours ago',
    likesCount: 42,
    commentsCount: 9,
    isLiked: false,
    isBookmarked: true,
    achievement: {
      id: 'ach-1',
      title: 'First Prize — National Agri-AI Hackathon 2026',
      category: 'National Hackathon',
      issuer: 'Ministry of Education & AICTE',
      date: 'Nov 2026',
      isVerified: true,
    },
  },
  {
    id: 'post-2',
    author: {
      id: 'f1',
      name: 'Mani Bhushanam K',
      role: 'HOD',
      designation: 'Professor & Head of Department',
      department: 'CSE (AI & ML)',
      isVerified: true,
    },
    content: `📢 Congratulations to the CSE (AI & ML) Department scholars for successfully publishing research in Scopus-indexed IEEE conferences and winning National AI Hackathons this semester! \n\nEvery student working on AI ethics and edge vision transformers is encouraged to register for the upcoming Hands-on PyTorch Workshop scheduled next Friday.\n\n#ResearchExcellence #SRECAIML #IEEE #MachineLearning`,
    createdAt: '5 hours ago',
    likesCount: 88,
    commentsCount: 16,
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 'post-3',
    author: {
      id: 'u2',
      name: 'P. Sai Kumar',
      role: 'STUDENT',
      rollNumber: '22091A3202',
      department: 'CSE (AI & ML)',
      isVerified: true,
    },
    content: `Excited to announce our Scopus Q1 indexed research paper on "Multi-Modal Edge Vision for Crop Health" has been published with IEEE Computer Society (ICAIVC-2026)! 📚✨ Special thanks to our faculty mentors for their constant support.\n\n#NLP #MachineLearning #ResearchPaper #AIML #IEEE`,
    images: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: '1 day ago',
    likesCount: 35,
    commentsCount: 5,
    isLiked: false,
    isBookmarked: false,
    achievement: {
      id: 'ach-2',
      title: 'Scopus Q1 Indexed Research Paper (ICAIVC-2026)',
      category: 'Research Publication',
      issuer: 'IEEE Computer Society',
      date: 'Sep 2026',
      isVerified: true,
    },
  },
];

export default function HomePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'portfolios' ? 'PORTFOLIOS' : 'FEED';
  const [activeTab, setActiveTab] = useState<'FEED' | 'PORTFOLIOS'>(initialTab);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [posts, setPosts] = useState<FeedPostProps[]>(FALLBACK_POSTS);
  const [isLoading, setIsLoading] = useState(false);

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
          if (data.posts && data.posts.length > 0) {
            // Merge live posts with fallback showcase posts so feed is always rich and engaging
            const combined = [...data.posts];
            for (const fb of FALLBACK_POSTS) {
              if (!combined.some((p) => p.id === fb.id)) {
                combined.push(fb);
              }
            }
            setPosts(combined);
          } else {
            setPosts(FALLBACK_POSTS);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live posts, displaying fallback:', err);
        setPosts(FALLBACK_POSTS);
      } finally {
        setIsLoading(false);
      }
    }
    loadLivePosts();
  }, [feedFilter]);

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
      images: (newPost.media || []).map((m: any) => m.url),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
    };
    setPosts((prev) => [formatted, ...prev]);
  };

  const filteredPosts = posts.filter((post) => {
    if (feedFilter === 'ALL') return true;
    if (feedFilter === 'STUDENT') return post.author.role === 'STUDENT';
    if (feedFilter === 'FACULTY') return post.author.role === 'FACULTY' || post.author.role === 'HOD';
    return true;
  });

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* 1. Instagram Stories Bar (Department Highlights) */}
      <StoryHighlights />

      {/* 2. Interactive Post Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* 3. Modern Segmented Tab Bar */}
      <div className="bg-card/70 dark:bg-space-850/70 backdrop-blur-md rounded-2xl p-1.5 border border-border/70 shadow-xs">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 ${
              activeTab === 'FEED'
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 font-medium'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Department Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('PORTFOLIOS')}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 ${
              activeTab === 'PORTFOLIOS'
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 font-medium'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Verified Portfolios</span>
          </button>
        </div>
      </div>

      {/* 3b. Audience Filter Bar (Shown when viewing Feed) */}
      {activeTab === 'FEED' && (
        <div className="flex items-center justify-between px-1 pt-1 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3 text-primary" />
              <span>Filter:</span>
            </span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/60 dark:bg-space-800/80 border border-border/50">
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
                No posts match the selected filter. Try selecting &quot;All Posts&quot; or share an update with the department!
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
            <Link href="/students" className="font-semibold text-primary hover:underline flex items-center gap-1">
              <span>View All Students</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScholarDirectoryCard
              type="STUDENT"
              id="cmw7bcqo90008ik9rnhnvbarx"
              name="P. Sai Kumar"
              role="STUDENT"
              departmentName="Artificial Intelligence & Machine Learning"
              headline="Student & AI Researcher | SREC Roll 22091A3202"
              rollNumber="22091A3202"
              batch="2022-2026"
              section="A"
              email="22091a3202@srecnandyal.edu.in"
              stats={{
                postsCount: 0,
                verifiedCount: 1,
                eventsCount: 2,
                skillsCount: 5,
              }}
              skills={['PyTorch', 'TensorFlow', 'Computer Vision', 'Deep Learning', 'Docker']}
              actionLabel="Connect"
              href="/students/22091A3202"
            />

            <ScholarDirectoryCard
              type="FACULTY"
              id="cmw7jtpt30011ikhmx621nfsr"
              name="Mani Bhushanam K"
              role="HOD"
              departmentName="Artificial Intelligence & Machine Learning"
              headline="Professor & Head of Department | Artificial Intelligence & Machine Learning"
              designation="Professor & HOD"
              qualification="Ph.D., M.Tech"
              specialization="Edge AI, Distributed Computing, Deep Learning"
              email="manibhushanam5k@gmail.com"
              stats={{
                postsCount: 0,
                verifiedCount: 1,
                eventsCount: 15,
                skillsCount: 3,
              }}
              skills={['Edge AI', 'Distributed Computing', 'Deep Learning']}
              actionLabel="Connect"
              href="/faculty/cmw7jtpt30011ikhmx621nfsr"
            />

            <ScholarDirectoryCard
              type="STUDENT"
              id="cmw79c5v0004kikd6kyjzv8tg"
              name="K. V. Naveen Kumar"
              role="STUDENT"
              departmentName="Artificial Intelligence & Machine Learning"
              headline="Undergraduate AI Researcher | SREC Roll 22091A3201"
              rollNumber="22091A3201"
              batch="2022-2026"
              section="A"
              email="22091a3201@srecnandyal.edu.in"
              stats={{
                postsCount: 0,
                verifiedCount: 2,
                eventsCount: 3,
                skillsCount: 5,
              }}
              skills={['Smart Agriculture', 'IoT Hardware', 'Edge AI', 'Full Stack', 'Python']}
              actionLabel="Connect"
              href="/students/22091A3201"
            />

            <ScholarDirectoryCard
              type="FACULTY"
              id="cmw7bbzt10006ik59bnc32odt"
              name="A. Ramesh"
              role="Assistant Professor"
              departmentName="Artificial Intelligence & Machine Learning"
              headline="Assistant Professor • Deep Learning & Natural Language Processing"
              designation="Assistant Professor"
              qualification="M.Tech (CSE)"
              specialization="Deep Learning & Natural Language Processing"
              email="faculty.aiml@srecnandyal.edu.in"
              stats={{
                postsCount: 0,
                verifiedCount: 0,
                eventsCount: 6,
                skillsCount: 2,
              }}
              skills={['Deep Learning', 'Natural Language Processing']}
              actionLabel="Connect"
              href="/faculty/cmw7bbzt10006ik59bnc32odt"
            />
          </div>
        </div>
      )}
    </div>
  );
}
