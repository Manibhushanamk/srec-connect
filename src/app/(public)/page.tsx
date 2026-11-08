'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StoryHighlights } from '@/components/social/StoryHighlights';
import { FeedCard } from '@/components/social/FeedCard';
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

const SAMPLE_POSTS = [
  {
    id: 'post-1',
    author: {
      id: 'u1',
      name: 'Mani Bhushanam K',
      role: 'STUDENT' as const,
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
      role: 'FACULTY' as const,
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
      role: 'STUDENT' as const,
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

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'portfolios') {
      setActiveTab('PORTFOLIOS');
    } else if (tabParam === 'department') {
      setActiveTab('DEPARTMENT');
    }
  }, [searchParams]);

  const filteredPosts = SAMPLE_POSTS.filter((post) => {
    if (feedFilter === 'ALL') return true;
    return post.author.role === feedFilter;
  });

  return (
    <div className="space-y-4">
      {/* 1. Instagram Stories Bar (Department Highlights) */}
      <StoryHighlights />

      {/* 2. Instagram/LinkedIn Quick Post Composer Trigger */}
      <div className="social-card p-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <Link
            href="/login"
            className="flex-1 px-4 py-2.5 rounded-full bg-secondary/80 border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            Share an academic update, project or paper...
          </Link>
          <button className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-colors">
            <Image className="w-5 h-5 text-emerald-500" />
          </button>
          <button className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-colors">
            <Award className="w-5 h-5 text-amber-500" />
          </button>
        </div>
      </div>

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
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                feedFilter === 'ALL' ? 'bg-secondary text-foreground font-semibold' : ''
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFeedFilter('STUDENT')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                feedFilter === 'STUDENT' ? 'bg-secondary text-foreground font-semibold' : ''
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setFeedFilter('FACULTY')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                feedFilter === 'FACULTY' ? 'bg-secondary text-foreground font-semibold' : ''
              }`}
            >
              Faculty
            </button>
          </div>
        )}
      </div>

      {/* 4. Tab 1: Community Feed (Instagram + LinkedIn hybrid) */}
      {activeTab === 'FEED' && (
        <div className="space-y-4 pt-1">
          {filteredPosts.map((post) => (
            <FeedCard key={post.id} {...post} />
          ))}
        </div>
      )}

      {/* 5. Tab 2: LinkedIn-Style Portfolios Showcase */}
      {activeTab === 'PORTFOLIOS' && (
        <div className="space-y-6 pt-2">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-xs text-primary flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Verified Department Talents</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Portfolios displayed here are authenticated with verified college roll numbers, faculty endorsements, and official achievement certificates.
              </p>
            </div>
          </div>

          <ProfileHeader
            name="Mani Bhushanam K"
            rollNumber="22091A3201"
            role="STUDENT"
            department="CSE (AI & ML)"
            batch="2022-2026"
            section="A"
            headline="Undergraduate Researcher • Deep Learning & Mobile Vision Specialist"
            isVerified={true}
            stats={{
              postsCount: 14,
              verifiedAchievementsCount: 6,
              eventsCount: 8,
              skillsCount: 12,
            }}
            githubUrl="https://github.com"
            linkedinUrl="https://linkedin.com"
            skills={['PyTorch', 'Computer Vision', 'Next.js 15', 'TypeScript', 'TensorFlow', 'PostgreSQL']}
            isOwner={false}
          />
        </div>
      )}

      {/* 6. Tab 3: Official Department Overview */}
      {activeTab === 'DEPARTMENT' && (
        <div className="space-y-4 pt-2">
          <div className="social-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Department of Computer Science & Engineering
                </h2>
                <p className="text-xs font-semibold text-primary">
                  Artificial Intelligence & Machine Learning (Autonomous)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                The Department of CSE (AI & ML) at Santhiram Engineering College, Nandyal was established to impart world-class technical education in artificial intelligence, deep learning, computer vision, and cognitive systems.
              </p>
              <p>
                With state-of-the-art computational labs, accredited curriculum, and active industry-sponsored hackathons, the department empowers students to build impactful AI applications solving real-world challenges.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
              <div className="p-3 rounded-xl bg-secondary/50">
                <p className="text-base font-bold text-foreground">60 Intake</p>
                <p className="text-[11px] text-muted-foreground">Annual Intake</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50">
                <p className="text-base font-bold text-foreground">2022</p>
                <p className="text-[11px] text-muted-foreground">Established</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 col-span-2 sm:col-span-1">
                <p className="text-base font-bold text-primary">100% Verified</p>
                <p className="text-[11px] text-muted-foreground">Digital Portfolios</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
