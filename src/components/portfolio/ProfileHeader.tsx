'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Shield, Award, Calendar, ExternalLink, MapPin, Mail, Github, Linkedin, Plus, Share2 } from 'lucide-react';

export interface ProfileHeaderProps {
  name: string;
  rollNumber?: string;
  designation?: string;
  role: 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN';
  department: string;
  batch?: string;
  section?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  headline?: string;
  bio?: string;
  email?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isVerified: boolean;
  stats: {
    postsCount: number;
    verifiedAchievementsCount: number;
    eventsCount: number;
    skillsCount: number;
  };
  skills?: string[];
  isOwner?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  rollNumber,
  designation,
  role,
  department,
  batch,
  section,
  avatarUrl,
  bannerUrl,
  headline,
  bio,
  email,
  location = 'Nandyal, Andhra Pradesh',
  githubUrl,
  linkedinUrl,
  isVerified,
  stats,
  skills = ['Deep Learning', 'Computer Vision', 'PyTorch', 'Next.js', 'Python', 'Natural Language Processing'],
  isOwner = true,
}) => {
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'FEED' | 'ACHIEVEMENTS'>('PORTFOLIO');

  return (
    <div className="w-full bg-card rounded-3xl border border-border overflow-hidden shadow-subtle mb-6">
      {/* 1. LinkedIn Cover Banner */}
      <div className="h-44 sm:h-52 w-full relative bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/40 backdrop-blur-md text-white border border-white/10">
            {department}
          </span>
        </div>
      </div>

      {/* 2. Overlapping Avatar & Action Bar */}
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
          <div className="relative inline-block">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-card bg-primary/10 overflow-hidden shadow-lg flex items-center justify-center font-bold text-3xl text-primary">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.substring(0, 2).toUpperCase()
              )}
            </div>
            {isVerified && (
              <div
                className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-primary text-white border-2 border-card flex items-center justify-center shadow-md"
                title="Verified Department Member"
              >
                <CheckCircle2 className="w-4 h-4 fill-primary text-white" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isOwner ? (
              <>
                <Link
                  href="/dashboard/student/submit"
                  className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Submit Achievement
                </Link>
                <Link
                  href="/profile"
                  className="btn-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
                >
                  Edit Portfolio
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  if (email) {
                    navigator.clipboard.writeText(email);
                    alert(`Copied institutional email to clipboard: ${email}`);
                  }
                }}
                className="btn-primary text-xs py-2 px-4"
              >
                Connect
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Profile link copied to clipboard!');
              }}
              className="btn-secondary text-xs py-2 px-3"
              aria-label="Share Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. LinkedIn Headline & Academic Identity */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{name}</h1>
            {isVerified && (
              <span className="verified-badge">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Verified
              </span>
            )}
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-muted text-foreground">
              {role}
            </span>
          </div>

          <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-2xl">
            {headline || 'Undergraduate Researcher & Machine Learning Engineer | CSE - AIML'}
          </p>

          <div className="flex items-center gap-y-1 gap-x-4 text-xs text-muted-foreground flex-wrap pt-1 font-mono">
            {rollNumber && (
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Roll: {rollNumber}
              </span>
            )}
            {batch && (
              <span>Batch: {batch} {section ? `(Sec ${section})` : ''}</span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
            {email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {email}
              </span>
            )}
          </div>
        </div>

        {/* 4. Social & Professional Links */}
        <div className="flex items-center gap-3 pt-3">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors text-xs flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900 transition-colors text-xs flex items-center gap-1.5"
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          )}
        </div>

        {/* 5. Quick Stats Counter Bar */}
        <div className="grid grid-cols-4 gap-2 py-4 my-4 border-y border-border text-center">
          <div className="p-2 rounded-xl bg-muted/40">
            <p className="text-lg font-bold text-foreground">{stats.postsCount}</p>
            <p className="text-[11px] text-muted-foreground">Posts</p>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <p className="text-lg font-bold text-primary">{stats.verifiedAchievementsCount}</p>
            <p className="text-[11px] text-primary font-medium">Verified</p>
          </div>
          <div className="p-2 rounded-xl bg-muted/40">
            <p className="text-lg font-bold text-foreground">{stats.eventsCount}</p>
            <p className="text-[11px] text-muted-foreground">Events</p>
          </div>
          <div className="p-2 rounded-xl bg-muted/40">
            <p className="text-lg font-bold text-foreground">{stats.skillsCount}</p>
            <p className="text-[11px] text-muted-foreground">Skills</p>
          </div>
        </div>

        {/* 6. Skills Tags (LinkedIn-style Endorsement Chips) */}
        {skills.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Verified Technical Skills
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground border border-border flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-3 h-3 text-primary" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
