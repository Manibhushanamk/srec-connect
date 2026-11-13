'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Shield,
  Award,
  Calendar,
  MapPin,
  Mail,
  Share2,
  ExternalLink,
  BookOpen,
  Phone,
  Sparkles,
  ArrowRight,
  FileCheck,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface ScholarDirectoryCardProps {
  type: 'STUDENT' | 'FACULTY' | 'ACHIEVEMENT';
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  departmentName?: string;
  headline?: string;
  email?: string | null;
  // Student props
  rollNumber?: string | null;
  batch?: string | null;
  section?: string | null;
  // Faculty props
  designation?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  phone?: string | null;
  // Achievement props
  achievementTitle?: string;
  category?: string;
  level?: string;
  positionRank?: string | null;
  participationType?: string | null;
  achievementDate?: string;
  organization?: string;
  googleDriveUrl?: string | null;
  // Stats
  stats?: {
    postsCount?: number;
    verifiedCount?: number;
    eventsCount?: number;
    skillsCount?: number;
  };
  skills?: string[];
  href?: string;
  actionLabel?: string;
}

export function ScholarDirectoryCard({
  type,
  id,
  name,
  avatarUrl,
  role,
  departmentName = 'Computer Science & Engineering (AI & ML)',
  headline,
  email,
  rollNumber,
  batch,
  section,
  designation,
  qualification,
  specialization,
  phone,
  achievementTitle,
  category,
  level,
  positionRank,
  participationType,
  achievementDate,
  organization,
  googleDriveUrl,
  stats,
  skills = [],
  href,
  actionLabel,
}: ScholarDirectoryCardProps) {
  const [copied, setCopied] = useState(false);

  const defaultSkills =
    type === 'STUDENT'
      ? ['PyTorch', 'TensorFlow', 'Computer Vision', 'Next.js', 'PostgreSQL', 'Docker']
      : type === 'FACULTY'
      ? ['Deep Learning', 'Natural Language Processing', 'Edge AI', 'Big Data', 'Robotics']
      : ['National Recognition', 'Autonomous SREC', 'Verified Proof', 'Peer Reviewed'];

  const displaySkills = skills.length > 0 ? skills : defaultSkills;

  const formatRank = (rank?: string | null) => {
    if (!rank) return '1st';
    const r = rank.toLowerCase();
    if (r.includes('first') || r.includes('1st') || r === '1') return '1st';
    if (r.includes('second') || r.includes('2nd') || r === '2') return '2nd';
    if (r.includes('third') || r.includes('3rd') || r === '3') return '3rd';
    if (r.includes('grand') || r.includes('winner')) return 'Winner';
    if (r.includes('best') || r.includes('q1')) return 'Q1 Rank';
    return rank.length > 8 ? rank.slice(0, 8) : rank;
  };

  const formatLevel = (lvl?: string | null) => {
    if (!lvl) return 'National';
    const mapping: Record<string, string> = {
      INTERNATIONAL: 'Global',
      NATIONAL: 'National',
      STATE: 'State',
      UNIVERSITY: 'Univ',
      COLLEGE: 'College',
      DEPARTMENT: 'Dept',
    };
    return mapping[lvl.toUpperCase()] || (lvl.length > 8 ? lvl.slice(0, 8) : lvl);
  };

  const defaultHeadline =
    headline ||
    (type === 'STUDENT'
      ? `Undergraduate AI Researcher & Machine Learning Engineer | SREC Nandyal`
      : type === 'FACULTY'
      ? `${designation || 'Faculty Member'} | Department of CSE (AI & ML)`
      : `${category || 'Academic Honor'} • ${organization || 'SREC Nandyal'}`);

  const targetHref =
    href ||
    (type === 'STUDENT'
      ? `/students/${rollNumber || id}`
      : type === 'FACULTY'
      ? `/faculty/${id}`
      : googleDriveUrl || `/achievements`);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${targetHref}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="@container directory-card w-full bg-card rounded-3xl border border-border overflow-hidden shadow-subtle hover:border-primary/50 hover:shadow-card transition-all duration-200 flex flex-col group">
      {/* 1. Header Banner with Department Pill & Dot Pattern */}
      <div className="h-32 sm:h-36 w-full relative bg-gradient-to-r from-blue-900/70 via-indigo-900/50 to-slate-900/90 overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Department Pill */}
        <div className="absolute top-3.5 right-3.5 flex gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-black/50 backdrop-blur-md text-white border border-white/10 shadow-xs">
            {departmentName}
          </span>
        </div>
      </div>

      {/* 2. Overlapping Avatar & Action Buttons */}
      <div className="px-5 sm:px-6 pb-6 relative flex-1 flex flex-col -mt-12 sm:-mt-14">
        <div className="flex items-end justify-between gap-3 mb-3">
          {/* Circular Avatar */}
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-card bg-primary/10 overflow-hidden shadow-md flex items-center justify-center font-bold text-2xl text-primary shrink-0 group-hover:scale-105 transition-transform">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  width={96}
                  height={96}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : type === 'ACHIEVEMENT' ? (
                <Award className="w-9 h-9 text-primary" />
              ) : (
                name.substring(0, 2).toUpperCase()
              )}
            </div>
            {/* Verified Badge */}
            <div
              className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-primary text-white border-2 border-card flex items-center justify-center shadow-xs"
              title="Verified SREC Institutional Member"
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-primary text-white" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={targetHref}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>{actionLabel || (type === 'ACHIEVEMENT' ? 'Certificate' : 'Connect')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl border border-border bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
              aria-label={copied ? 'Link Copied!' : `Share profile for ${name}`}
              title={copied ? 'Link Copied!' : 'Share Profile'}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Name, Role & Verification Badge */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={targetHref}>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              Verified
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
              {role}
            </span>
          </div>

          {/* Headline / Title */}
          <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
            {defaultHeadline}
          </p>
        </div>

        {/* 4. Metadata Line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground py-2 border-y border-border/60 mb-4">
          {rollNumber && (
            <div className="flex items-center gap-1 font-mono font-medium text-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Roll: {rollNumber}</span>
            </div>
          )}

          {type === 'STUDENT' && batch && (
            <div className="flex items-center gap-1">
              <span>Batch: {batch} {section && `(Sec ${section})`}</span>
            </div>
          )}

          {designation && (
            <div className="flex items-center gap-1 font-medium text-foreground">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>{designation} {qualification && `• ${qualification}`}</span>
            </div>
          )}

          {achievementDate && (
            <div className="flex items-center gap-1 font-medium text-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{achievementDate}</span>
            </div>
          )}

          {type === 'ACHIEVEMENT' ? (
            organization && (
              <div className="flex items-center gap-1 max-w-[260px]">
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate" title={organization}>{organization}</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Nandyal, Andhra Pradesh</span>
            </div>
          )}

          {email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{email}</span>
            </div>
          )}
        </div>

        {/* 5. Four Metric Stat Boxes Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/60 text-center">
            <p className="text-sm sm:text-base font-extrabold text-foreground truncate" title={positionRank || '1st'}>
              {type === 'ACHIEVEMENT' ? formatRank(positionRank) : (stats?.postsCount ?? 0)}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
              {type === 'STUDENT' ? 'Posts' : type === 'FACULTY' ? 'Papers' : 'Rank'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/30 text-center">
            <p className="text-base sm:text-lg font-extrabold text-primary">
              {type === 'ACHIEVEMENT' ? formatLevel(level) : (stats?.verifiedCount ?? 0)}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mt-0.5">
              {type === 'ACHIEVEMENT' ? 'Level' : 'Verified'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/60 text-center">
            <p className="text-sm sm:text-base font-extrabold text-foreground truncate">
              {type === 'ACHIEVEMENT' ? (batch || '2025-26') : (stats?.eventsCount ?? 0)}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
              {type === 'STUDENT' ? 'Events' : type === 'FACULTY' ? 'Exp (Yrs)' : 'Year'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/60 text-center">
            <p className="text-sm sm:text-base font-extrabold text-foreground truncate">
              {type === 'ACHIEVEMENT' ? (participationType || 'Solo') : (stats?.skillsCount ?? displaySkills.length)}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
              {type === 'ACHIEVEMENT' ? 'Entry' : type === 'FACULTY' ? 'Areas' : 'Skills'}
            </p>
          </div>
        </div>

        {/* 6. Skills / Specialization Chips */}
        <div className="mt-auto space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {type === 'FACULTY'
              ? 'RESEARCH SPECIALIZATIONS'
              : type === 'ACHIEVEMENT'
              ? 'VERIFIED RECOGNITION HIGHLIGHTS'
              : 'VERIFIED TECHNICAL SKILLS'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.slice(0, 6).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-secondary/60 hover:bg-secondary border border-border/80 text-foreground transition-colors shadow-2xs"
              >
                <Award className="w-3 h-3 text-primary shrink-0" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
