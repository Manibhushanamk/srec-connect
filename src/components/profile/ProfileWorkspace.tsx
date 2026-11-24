'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Shield,
  Crown,
  GraduationCap,
  Briefcase,
  User,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  Sparkles,
  ArrowRight,
  Building2,
  Calendar,
  Lock,
  ShieldCheck,
  Layers,
  ChevronRight,
  Sliders,
  LogOut,
  Award,
  MessageCircle,
  PlusCircle,
} from 'lucide-react';
import { AchievementCard } from '@/components/cards/AchievementCard';
import { FeedCard } from '@/components/social/FeedCard';
import { isLateralEntryRoll } from '@/lib/studentHelper';
import { GoogleDriveCard } from '@/components/dashboard/GoogleDriveCard';

interface ProfileWorkspaceProps {
  initialUser: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    avatarUrl: string | null;
    headline: string | null;
    bio: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    skills?: string | null;
    department?: { name: string; code: string } | null;
    departmentName?: string | null;
    counts?: {
      posts: number;
      eventRegistrations: number;
    };
    student?: {
      id: string;
      name?: string | null;
      rollNumber: string;
      batch?: string | null;
      section?: string | null;
      headline?: string | null;
      bio?: string | null;
      phone?: string | null;
      linkedinUrl?: string | null;
      githubUrl?: string | null;
      portfolioUrl?: string | null;
      avatarUrl?: string | null;
      skills?: string | null;
      achievements?: any[];
    } | null;
    faculty?: {
      id: string;
      name?: string | null;
      designation?: string | null;
      degrees?: string | null;
      experience?: string | null;
      specialization?: string | null;
      cabin?: string | null;
      bio?: string | null;
      googleScholar?: string | null;
      linkedinUrl?: string | null;
      avatarUrl?: string | null;
      skills?: string | null;
      achievements?: any[];
    } | null;
    posts?: any[];
    createdAt: string;
  };
}

export const ProfileWorkspace: React.FC<ProfileWorkspaceProps> = ({ initialUser }) => {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'customize' | 'security'>('overview');

  // Form State - initialized with official academic name
  const [name, setName] = useState(
    initialUser.faculty?.name ||
    initialUser.student?.name ||
    initialUser.name ||
    ''
  );
  const [headline, setHeadline] = useState(
    initialUser.headline ||
    (initialUser.student?.headline ?? '') ||
    (initialUser.role === 'SUPER_ADMIN' ? 'Autonomous Sovereign Administrator & Systems Architect' : '')
  );
  const [bio, setBio] = useState(
    initialUser.bio ||
    (initialUser.student?.bio ?? '') ||
    (initialUser.faculty?.bio ?? '')
  );
  const [phone, setPhone] = useState(
    initialUser.phone ||
    (initialUser.student?.phone ?? '')
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialUser.avatarUrl ||
    initialUser.student?.avatarUrl ||
    initialUser.faculty?.avatarUrl ||
    ''
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    initialUser.linkedinUrl ||
    initialUser.student?.linkedinUrl ||
    initialUser.faculty?.linkedinUrl ||
    ''
  );
  const [githubUrl, setGithubUrl] = useState(
    initialUser.githubUrl ||
    initialUser.student?.githubUrl ||
    ''
  );
  const [portfolioUrl, setPortfolioUrl] = useState(
    initialUser.student?.portfolioUrl || ''
  );
  const [skills, setSkills] = useState(
    initialUser.skills ||
    initialUser.student?.skills ||
    initialUser.faculty?.skills ||
    initialUser.faculty?.specialization ||
    ''
  );
  const [imgError, setImgError] = useState(false);

  const skillsList = skills
    .split(/[,;&•]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isSuperAdmin = initialUser.role === 'SUPER_ADMIN' || initialUser.role === 'ADMIN';
  const isHOD = initialUser.role === 'HOD';
  const isWebManager = initialUser.role === 'WEB_MANAGER';
  const canManageAcademicAnchors = isSuperAdmin || isHOD || isWebManager;
  const isFaculty = initialUser.role === 'FACULTY' || isHOD || Boolean(initialUser.faculty);
  const isStudent = (initialUser.role === 'STUDENT' || !isFaculty) && Boolean(initialUser.student);

  // Faculty Academic Credentials state
  const [designation, setDesignation] = useState(
    initialUser.faculty?.designation || (isHOD ? 'Professor & Head of Department' : 'Faculty Member')
  );
  const [degrees, setDegrees] = useState(
    initialUser.faculty?.degrees || 'Ph.D., M.Tech'
  );
  const [experience, setExperience] = useState(
    initialUser.faculty?.experience || '15+ Years'
  );
  const [cabin, setCabin] = useState(
    initialUser.faculty?.cabin || 'Room 204, Department HOD & Faculty Wing'
  );
  const [specialization, setSpecialization] = useState(
    initialUser.faculty?.specialization || 'Edge AI, Distributed Computing, Deep Learning'
  );

  // Student Academic Credentials state
  const [batch, setBatch] = useState(initialUser.student?.batch || '2022-2026');
  const [section, setSection] = useState(initialUser.student?.section || 'A');

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const defaultHeadline = isFaculty
    ? `${designation}${degrees ? ` • ${degrees}` : ''}`
    : isStudent
    ? `Student Scholar • CSE (AI & ML)${batch ? ` • Batch ${batch}` : ''}`
    : isSuperAdmin
    ? 'Systems Administrator & Academic Governance'
    : 'Department Member • CSE (AI & ML)';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
          skills: skills.trim(),
          // Academic credentials
          designation: designation.trim(),
          degrees: degrees.trim(),
          experience: experience.trim(),
          cabin: cabin.trim(),
          specialization: specialization.trim(),
          batch: batch.trim(),
          section: section.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Synchronize client session immediately
      if (updateSession) {
        await updateSession({ name: name.trim() });
      }

      setFeedback({ type: 'success', text: 'Profile customizations saved successfully!' });
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Profile Header Hero */}
      <div className="social-card overflow-hidden border-border bg-card shadow-subtle">
        {/* Banner */}
        <div className={`h-32 sm:h-44 w-full relative ${
          isSuperAdmin
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900'
            : isHOD
            ? 'bg-gradient-to-r from-blue-900 via-sky-950 to-indigo-900'
            : isFaculty
            ? 'bg-gradient-to-r from-slate-800 via-cyan-950 to-slate-900'
            : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900'
        }`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30" />
          
          {/* Role Status Tag on Banner */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                SOVEREIGN SUPER ADMIN
              </span>
            )}
            {isHOD && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 backdrop-blur-md shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                HEAD OF DEPARTMENT
              </span>
            )}
            {isFaculty && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                ACADEMIC FACULTY
              </span>
            )}
            {isStudent && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 backdrop-blur-md shadow-sm">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                STUDENT SCHOLAR
              </span>
            )}
          </div>
        </div>

        {/* Profile Card Info */}
        <div className="p-4 sm:p-6 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* Avatar pulled up over banner */}
              <div className="-mt-14 sm:-mt-16 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card border-4 border-card text-primary flex items-center justify-center font-bold text-2xl overflow-hidden shadow-card shrink-0">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={name || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  (name || 'U').substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Title & Headline below banner */}
              <div className="min-w-0 pt-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {name || 'Authenticated User'}
                  </h1>
                  {isSuperAdmin && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Root Clearance
                    </span>
                  )}
                  {isStudent && initialUser.student?.rollNumber && (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {initialUser.student.rollNumber}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-foreground/80 font-medium mt-0.5 line-clamp-1">
                  {headline || defaultHeadline}
                </p>

                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{initialUser.email}</span>
                  <span>•</span>
                  <span>{initialUser.department?.name || 'CSE (AI & ML)'}</span>
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-1 sm:flex-initial"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </Link>
              )}
              {isStudent && initialUser.student?.rollNumber && (
                <Link
                  href={`/students/${initialUser.student.rollNumber}`}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-1 sm:flex-initial"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Portfolio</span>
                </Link>
              )}
              {isFaculty && initialUser.faculty?.id && (
                <Link
                  href={`/faculty/${initialUser.faculty.id}`}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-1 sm:flex-initial"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Directory</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('customize')}
                className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-1 sm:flex-initial"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/signin' })}
                className="text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold transition-all flex-1 sm:flex-initial"
                title="Log out of SREC Connect"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Bio Preview */}
          {bio && activeTab === 'overview' && (
            <div className="mt-5 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                About & Statement
              </h4>
              <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {bio}
              </p>
            </div>
          )}

          {/* Social Links Preview */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60 flex-wrap">
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-medium"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground font-medium"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}
            {portfolioUrl && (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-500 hover:underline font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </a>
            )}
            {phone && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>{phone}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Profile Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('customize')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'customize'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Edit & Customize</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>System Role & Security</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & ROLE LAUNCHPAD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Admin Launchpad for Super Admin and Department HOD */}
          {(isSuperAdmin || isHOD) && (
            <div className="social-card p-5 border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Administrator Command Launchpad</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sovereign operational desks for Santhiram Engineering College
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Full Clearance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Link
                  href="/admin"
                  className="p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Command Center
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Global KPI oversight, system health and quick metrics.</p>
                </Link>

                <Link
                  href="/admin/users"
                  className="p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      User Management
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Role assignments, account status toggles and directory.</p>
                </Link>

                <Link
                  href="/admin/bulk-upload"
                  className="p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Bulk Ingestion
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">CSV/XLSX student provisioning and verification.</p>
                </Link>

                <Link
                  href="/admin/analytics"
                  className="p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Analytics Hub
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Recharts trends, department comparisons and momentum.</p>
                </Link>

                <Link
                  href="/admin/discipline"
                  className="p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Discipline & Grievances
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Confidential HOD cases, incident dossiers and outcomes.</p>
                </Link>

                <Link
                  href="/admin/notices"
                  className="p-3.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Notices & Circulars
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Targeted department circulars and notification broadcasts.</p>
                </Link>
              </div>
            </div>
          )}

          {/* 1. Four Stat Metrics Row */}
          {(() => {
            const achievements = initialUser.faculty?.achievements || initialUser.student?.achievements || [];
            const specializationList = (specialization || initialUser.faculty?.specialization || 'Deep Learning, Machine Learning, Edge AI')
              .split(/[,;&•]/)
              .map((s) => s.trim())
              .filter(Boolean);

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border text-center">
                    <p className="text-xl font-black text-foreground">{(initialUser.posts || []).length}</p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">Posts</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 text-center">
                    <p className="text-xl font-black text-primary">{achievements.length}</p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-primary mt-0.5">Verified</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border text-center">
                    <p className="text-base sm:text-lg font-black text-foreground truncate">
                      {isFaculty ? experience : `${initialUser.counts?.eventRegistrations ?? 0}`}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
                      {isFaculty ? 'Experience' : 'Events'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border text-center">
                    <p className="text-xl font-black text-foreground">
                      {isFaculty ? (skillsList.length || specializationList.length) : skillsList.length}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">
                      {isFaculty ? 'Research Areas' : 'Skills'}
                    </p>
                  </div>
                </div>

                {/* 2. Detailed Academic Credentials Grid */}
                <div className="social-card p-5 border-border bg-card space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>Official Academic Profile & Credentials</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                        Verified SREC Record
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('customize')}
                        className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit Credentials</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {isFaculty && (
                      <>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Designation</span>
                          <span className="font-bold text-foreground mt-0.5 block">
                            {designation || (initialUser.role === 'HOD' ? 'Professor & HOD' : 'Faculty Member')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Qualifications</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            {degrees || 'Ph.D., M.Tech'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Total Experience</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            {experience || '15+ Years Teaching & Research'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Department</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            {initialUser.department?.name || initialUser.departmentName || 'Artificial Intelligence & Machine Learning'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Office / Cabin</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            {cabin || 'Room 204, Department HOD & Faculty Wing'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Campus Email</span>
                          <span className="font-mono text-muted-foreground mt-0.5 block truncate">
                            {initialUser.email}
                          </span>
                        </div>
                      </>
                    )}

                    {isStudent && (
                      <>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">SREC Roll Number</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-foreground">
                              {initialUser.student?.rollNumber || 'Not Linked'}
                            </span>
                            {isLateralEntryRoll(initialUser.student?.rollNumber) && (
                              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                Lateral Entry
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Academic Batch</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            {batch || '2024-2028'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Class Section</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            Section {section || 'A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Department & Degree</span>
                          <span className="font-medium text-foreground mt-0.5 block">
                            B.Tech — {initialUser.department?.name || 'CSE (AI & ML)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px] uppercase font-semibold">Official Campus Email</span>
                          <span className="font-mono text-muted-foreground mt-0.5 block truncate">
                            {initialUser.email}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Specializations / Technical Focus */}
                  {isFaculty && (
                    <div className="pt-3 border-t border-border/60">
                      <span className="text-muted-foreground block text-[11px] uppercase font-semibold mb-2">
                        Research Specializations & Subject Expertise
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {specializationList.map((spec, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground border border-border"
                          >
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span>{spec}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Skills & Competencies */}
                  <div className="pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                        Technical Skills &amp; Competencies
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('customize')}
                        className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit Skills</span>
                      </button>
                    </div>
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                          >
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                        <span>No technical competencies listed yet.</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('customize')}
                          className="text-primary hover:underline font-medium not-italic"
                        >
                          Add your skills now →
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                {/* Google Drive Integration & Storage Card */}
                <GoogleDriveCard className="mb-5" />

                {/* 3. Verified Achievements & Research Publications */}
                <div className="social-card p-5 border-border bg-card space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span>Verified Achievements & Publications ({achievements.length})</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Officially verified honors, hackathon awards, and research publications
                      </p>
                    </div>
                    <Link
                      href="/achievements/submit"
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <span>+ Submit New</span>
                    </Link>
                  </div>

                  {achievements.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
                      <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-foreground">No Verified Records Yet</p>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                        Submit your research papers, conference presentations, patents, or competitive achievements for institutional verification.
                      </p>
                      <Link href="/achievements/submit" className="btn-primary text-xs py-2 px-4 inline-flex">
                        Submit Record Now
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {achievements.map((ach: any) => (
                        <AchievementCard
                          key={ach.id}
                          id={ach.id}
                          title={ach.title}
                          description={ach.description}
                          categoryName={ach.categoryName || ach.category || 'National Honor'}
                          level={ach.level || 'NATIONAL'}
                          positionRank={ach.positionRank}
                          participationType={ach.participationType || 'SOLO'}
                          organizationEventName={ach.organizationEventName || ach.organization || 'Institutional Award'}
                          academicYear={ach.academicYear || '2025-2026'}
                          achievementDate={ach.achievementDate}
                          personName={ach.personName || initialUser.name || 'Campus Scholar'}
                          personType={ach.personType || (initialUser.role === 'STUDENT' ? 'STUDENT' : 'FACULTY')}
                          rollNumber={ach.rollNumber || initialUser.student?.rollNumber}
                          departmentName={ach.departmentName || initialUser.department?.name || initialUser.departmentName || 'Computer Science & Engineering (AI & ML)'}
                          googleDriveUrl={ach.googleDriveUrl}
                          certificateUrl={ach.certificateUrl || ach.googleDriveUrl}
                          tags={ach.tags}
                          href={`/achievements/${ach.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Quick Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="social-card p-4 border-border bg-card space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Institutional Affiliation
              </span>
              <p className="text-sm font-bold text-foreground">
                Santhiram Engineering College (Autonomous), Nandyal
              </p>
              <p className="text-xs text-muted-foreground">
                Affiliated to JNTUA Ananthapuramu • Approved by AICTE
              </p>
            </div>

            <div className="social-card p-4 border-border bg-card space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Account Status & Role
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-foreground">Active Account</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  {initialUser.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Member since {new Date(initialUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* 4. Community Feed Posts Section */}
          <div className="social-card p-5 border-border bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>Published Community Posts &amp; Broadcasts ({(initialUser.posts || []).length})</span>
              </h3>
              <Link
                href="/?create=true"
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create New Post</span>
              </Link>
            </div>

            {(initialUser.posts || []).length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-border rounded-2xl bg-secondary/20">
                <MessageCircle className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-foreground">No Community Posts Yet</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                  Share academic updates, research publications, or campus announcements directly to the feed.
                </p>
                <Link
                  href="/?create=true"
                  className="btn-primary text-xs py-1.5 px-3.5 mt-3 inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Share a Post</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {initialUser.posts!.map((post: any) => (
                  <FeedCard key={post.id} {...post} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EDIT & CUSTOMIZATION */}
      {activeTab === 'customize' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="social-card p-5 sm:p-6 border-border bg-card space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Personal Profile Customization</h3>
              <p className="text-xs text-muted-foreground">
                Personalize how your identity appears across posts, comments, directories, and portfolios.
              </p>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  placeholder="e.g. Mani Bhushanam K"
                  required
                />
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Professional Headline / Title
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  placeholder="e.g. Lead Systems Administrator & Deep Learning Researcher"
                  maxLength={200}
                />
                <span className="text-[11px] text-muted-foreground block text-right mt-1">
                  {headline.length}/200 characters
                </span>
              </div>

              {/* Avatar URL with live preview */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Profile Avatar Image URL (HTTPS)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="flex-1 text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* About / Bio */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  About Me / Bio Statement
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all resize-none"
                  placeholder="Share your academic background, research interests, technical skills..."
                  maxLength={1000}
                />
                <span className="text-[11px] text-muted-foreground block text-right mt-1">
                  {bio.length}/1000 characters
                </span>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Contact Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Social & Professional Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              {/* Website / Portfolio Link */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Personal Website / Portfolio Link
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  placeholder="https://myportfolio.com"
                />
              </div>

              {/* Technical Skills & Competencies */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground">
                    Technical Skills &amp; Core Competencies
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {skillsList.length} {skillsList.length === 1 ? 'skill' : 'skills'}
                  </span>
                </div>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  placeholder="e.g. Python, PyTorch, React, TypeScript, Next.js, Docker, SQL, Machine Learning"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate each skill or technical competency with a comma. These display as interactive badges on your portfolio and public directory cards.
                </p>

                {/* Quick Add Badges */}
                <div className="pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Click to Quick-Add Common Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Python',
                      'PyTorch',
                      'TypeScript',
                      'Next.js',
                      'React',
                      'FastAPI',
                      'Tailwind CSS',
                      'PostgreSQL',
                      'Docker',
                      'Deep Learning',
                      'Machine Learning',
                      'Computer Vision',
                      'Data Structures',
                      'Git',
                      'Cloud Computing',
                    ].map((badge) => {
                      const isAdded = skillsList.some(
                        (s) => s.toLowerCase() === badge.toLowerCase()
                      );
                      return (
                        <button
                          key={badge}
                          type="button"
                          onClick={() => {
                            if (isAdded) return;
                            const newSkills = skills.trim()
                              ? `${skills.trim()}, ${badge}`
                              : badge;
                            setSkills(newSkills);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                            isAdded
                              ? 'bg-primary/20 text-primary border-primary/40 font-semibold cursor-default'
                              : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground hover:border-primary/30 cursor-pointer'
                          }`}
                        >
                          {isAdded ? `✓ ${badge}` : `+ ${badge}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview of Chips */}
                {skillsList.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Live Badge Preview:
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/80">
                      {skillsList.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                        >
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Credentials Section */}
              {(isFaculty || isStudent) && (
                <div className="pt-5 border-t border-border/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Official Academic Credentials &amp; Institutional Record
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Edit your official designation, degrees, research specializations, and office location.
                      </p>
                    </div>
                  </div>

                  {isFaculty && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Academic Designation / Role
                          </label>
                          <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                            placeholder="e.g. Professor & Head of Department"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Qualifications &amp; Degrees
                          </label>
                          <input
                            type="text"
                            value={degrees}
                            onChange={(e) => setDegrees(e.target.value)}
                            className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                            placeholder="e.g. Ph.D., M.Tech"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Total Academic &amp; Research Experience
                          </label>
                          <input
                            type="text"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                            placeholder="e.g. 15+ Years"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Office / Faculty Cabin Location
                          </label>
                          <input
                            type="text"
                            value={cabin}
                            onChange={(e) => setCabin(e.target.value)}
                            className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                            placeholder="e.g. Room 204, Department HOD & Faculty Wing"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Research Specializations &amp; Subject Expertise
                        </label>
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                          placeholder="e.g. Edge AI, Distributed Computing, Deep Learning"
                        />
                        <span className="text-[11px] text-muted-foreground block mt-1">
                          Comma-separated list of research topics, specializations, or core competencies.
                        </span>
                      </div>
                    </div>
                  )}

                  {isStudent && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-foreground">
                              Academic Batch
                            </label>
                            {!canManageAcademicAnchors && (
                              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full border border-border">
                                <Lock className="w-2.5 h-2.5 text-amber-500" />
                                Locked
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={batch}
                            disabled={!canManageAcademicAnchors}
                            onChange={(e) => setBatch(e.target.value)}
                            className={`w-full text-xs rounded-xl p-3 border transition-all ${
                              canManageAcademicAnchors
                                ? 'bg-secondary/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background'
                                : 'bg-secondary/20 border-border/60 text-muted-foreground cursor-not-allowed'
                            }`}
                            placeholder="e.g. 2022-2026"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-foreground">
                              Class Section
                            </label>
                            {!canManageAcademicAnchors && (
                              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full border border-border">
                                <Lock className="w-2.5 h-2.5 text-amber-500" />
                                Locked
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={section}
                            disabled={!canManageAcademicAnchors}
                            onChange={(e) => setSection(e.target.value)}
                            className={`w-full text-xs rounded-xl p-3 border transition-all ${
                              canManageAcademicAnchors
                                ? 'bg-secondary/50 border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background'
                                : 'bg-secondary/20 border-border/60 text-muted-foreground cursor-not-allowed'
                            }`}
                            placeholder="e.g. A"
                          />
                        </div>
                      </div>
                      {!canManageAcademicAnchors && (
                        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Academic Batch and Class Section are verified institutional anchors editable exclusively by the HOD, Web Manager, or Super Admin.</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary text-xs py-2.5 px-6 gap-2"
              >
                {isSaving ? (
                  <span className="animate-pulse">Saving Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Customizations</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: SYSTEM ROLE & SECURITY CLEARANCE */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="social-card p-5 sm:p-6 border-border bg-card space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span>Institutional Identity & Security Governance</span>
            </div>
            <p className="text-xs text-muted-foreground">
              These official parameters are managed under SREC institutional guidelines and cannot be modified by user request.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/40">
                <span className="text-xs text-muted-foreground">Account Email (Login Identity)</span>
                <span className="text-xs font-mono font-semibold text-foreground">{initialUser.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/40">
                <span className="text-xs text-muted-foreground">Assigned Role Clearance</span>
                <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {initialUser.role}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/40">
                <span className="text-xs text-muted-foreground">Account Classification</span>
                <span className="text-xs font-semibold text-foreground">
                  {isSuperAdmin
                    ? 'Autonomous Super Administrator'
                    : isHOD
                    ? 'Department Head'
                    : isFaculty
                    ? 'Faculty Member'
                    : 'Enrolled University Student'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/40">
                <span className="text-xs text-muted-foreground">System User ID</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                  {initialUser.id}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Active Authentication Session</h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Terminate your active authenticated session on this browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/signin' })}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of SREC Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Session Logout Bar */}
      <div className="mt-8 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Sign Out of Campus Session</h4>
            <p className="text-[11px] text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{initialUser.email}</span>. Click to securely terminate your session.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
