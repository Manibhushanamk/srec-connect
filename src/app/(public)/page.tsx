'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StoryHighlights } from '@/components/social/StoryHighlights';
import { FeedCard, FeedPostProps } from '@/components/social/FeedCard';
import { PostComposer } from '@/components/social/PostComposer';
import { ProfileHeader } from '@/components/portfolio/ProfileHeader';
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
      name: 'Mani Bhushanam K',
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
      name: 'Dr. B. Ramanjaneyulu',
      role: 'FACULTY',
      designation: 'Associate Professor & HOD',
      department: 'CSE (AI & ML)',
      isVerified: true,
    },
    content: `📢 Congratulations to the CSE (AI & ML) Department for successfully publishing 8 research papers in Scopus-indexed IEEE conferences this semester! \n\nEvery student working on AI ethics and large-scale vision transformers is encouraged to register for the upcoming Hands-on PyTorch Workshop scheduled next Friday.\n\n#ResearchExcellence #SRECAIML #IEEE #MachineLearning`,
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
      name: 'A. Sneha Reddy',
      role: 'STUDENT',
      rollNumber: '22091A3215',
      department: 'CSE (AI & ML)',
      isVerified: true,
    },
    content: `Excited to present our NLP research paper on "Low-Resource Indic Language Translation using Optimized Transformer Ensembles" at the upcoming International Conference on AI & Robotics! 📚✨\n\n#NLP #MachineLearning #ResearchPaper #AIML`,
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
      title: 'Scopus Indexed Paper Acceptance (ICAIR-2026)',
      category: 'Research Publication',
      issuer: 'IEEE Computer Society',
      date: 'Oct 2026',
      isVerified: true,
    },
  },
];

export default function HomePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'portfolios' ? 'PORTFOLIOS' : 'FEED';
  const [activeTab, setActiveTab] = useState<'FEED' | 'PORTFOLIOS' | 'DEPARTMENT'>(initialTab);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [posts, setPosts] = useState<FeedPostProps[]>(FALLBACK_POSTS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'portfolios') {
      setActiveTab('PORTFOLIOS');
    } else if (tabParam === 'department') {
      setActiveTab('DEPARTMENT');
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
            setPosts(data.posts);
          } else {
            // Keep fallback posts if database currently has 0 posts
            setPosts(FALLBACK_POSTS);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live posts, displaying fallback:', err);
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
    return post.author.role === feedFilter;
  });

  return (
    <div className="space-y-4">
      {/* 1. Instagram Stories Bar (Department Highlights) */}
      <StoryHighlights />

      {/* 2. Interactive Post Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* 3. Instagram / LinkedIn Feed Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2 px-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'FEED'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Department Feed
          </button>
          <button
            onClick={() => setActiveTab('PORTFOLIOS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'PORTFOLIOS'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Verified Portfolios
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'DEPARTMENT'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            About CSE (AI & ML)
          </button>
        </div>

        {activeTab === 'FEED' && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <button
              onClick={() => setFeedFilter('ALL')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                feedFilter === 'ALL' ? 'bg-secondary text-foreground font-semibold shadow-xs' : 'hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFeedFilter('STUDENT')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                feedFilter === 'STUDENT' ? 'bg-secondary text-foreground font-semibold shadow-xs' : 'hover:text-foreground'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setFeedFilter('FACULTY')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                feedFilter === 'FACULTY' ? 'bg-secondary text-foreground font-semibold shadow-xs' : 'hover:text-foreground'
              }`}
            >
              Faculty
            </button>
          </div>
        )}
      </div>

      {/* 4. Tab 1: Department Community Feed */}
      {activeTab === 'FEED' && (
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-4 text-xs font-mono text-cyan-500 animate-pulse">
              Syncing live feed...
            </div>
          )}
          {filteredPosts.map((post) => (
            <FeedCard key={post.id} {...post} />
          ))}
        </div>
      )}

      {/* 5. Tab 2: Verified Academic Portfolios Preview */}
      {activeTab === 'PORTFOLIOS' && (
        <div className="space-y-4">
          <ProfileHeader
            name="Mani Bhushanam K"
            rollNumber="22091A3201"
            role="STUDENT"
            department="Computer Science & Engineering (AI & ML)"
            batch="2022-2026"
            section="A"
            headline="Undergraduate Researcher & Machine Learning Engineer | SREC Nandyal"
            bio="Building intelligent systems, deep learning computer vision architectures, and real-time inference pipelines. Passionate about AI research and distributed full-stack platforms."
            email="22091a3201@srecnandyal.edu.in"
            isVerified={true}
            stats={{
              postsCount: 14,
              verifiedAchievementsCount: 8,
              eventsCount: 12,
              skillsCount: 6,
            }}
            skills={['PyTorch', 'TensorFlow', 'Computer Vision', 'Next.js', 'PostgreSQL', 'Docker']}
            isOwner={true}
          />
        </div>
      )}

      {/* 6. Tab 3: About Department Overview */}
      {activeTab === 'DEPARTMENT' && (
        <div className="social-card p-6 border-border space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Department of CSE (AI & ML)</h2>
              <p className="text-xs text-muted-foreground">Santhiram Engineering College (SREC), Nandyal</p>
            </div>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            The Department of Computer Science & Engineering (Artificial Intelligence and Machine Learning) is committed to fostering innovation and research excellence. With state-of-the-art GPU labs, curriculum aligned with industry standards, and active hackathon culture, our students and faculty pioneer cutting-edge developments.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-lg font-bold text-foreground">180</p>
              <p className="text-[11px] text-muted-foreground">Annual Intake</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-lg font-bold text-primary">15+</p>
              <p className="text-[11px] text-muted-foreground">Faculty Members</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-lg font-bold text-emerald-500">92%</p>
              <p className="text-[11px] text-muted-foreground">Placement Rate</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-lg font-bold text-amber-500">24+</p>
              <p className="text-[11px] text-muted-foreground">Hackathon Wins</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
