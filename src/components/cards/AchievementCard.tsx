'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Share2,
  Users,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  Shield,
  X,
  FileText,
  Eye,
} from 'lucide-react';

export interface AchievementCardProps {
  id: string;
  title: string;
  description?: string | null;
  categoryName?: string | null;
  level: string;
  positionRank?: string | null;
  participationType?: string | null;
  organizationEventName: string;
  academicYear?: string;
  achievementDate: string;
  personName: string;
  personType?: 'STUDENT' | 'FACULTY';
  rollNumber?: string | null;
  departmentName?: string | null;
  certificateUrl?: string | null;
  googleDriveUrl?: string | null;
  tags?: string[] | string | null;
  status?: string;
  href?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  id,
  title,
  description,
  categoryName = 'National Honor',
  level = 'NATIONAL',
  positionRank = '1st Place',
  participationType = 'SOLO',
  organizationEventName,
  academicYear = '2025-2026',
  achievementDate,
  personName,
  personType = 'STUDENT',
  rollNumber,
  departmentName = 'Artificial Intelligence & Machine Learning',
  certificateUrl,
  googleDriveUrl,
  tags = [],
  href,
}) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDirectMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('/api/drive/file/')) return url;
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `/api/drive/file/${driveMatch[1]}`;
    }
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `/api/drive/file/${idMatch[1]}`;
    }
    return url;
  };

  const rawProof = googleDriveUrl || certificateUrl;
  const hasProof = !!rawProof;
  const proofUrl = getDirectMediaUrl(rawProof) || `/achievements/${id}`;
  const detailHref = href || `/achievements/${id}`;

  const isImageMedia = (url?: string | null): boolean => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    if (url.startsWith('/api/drive/file/')) return true;
    if (url.startsWith('/uploads/')) return true;
    if (url.includes('googleusercontent.com')) return true;
    if (url.includes('drive.google.com/file/d/')) return true;
    if (url.includes('drive.google.com/uc?id=')) return true;
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(url);
  };

  const getDriveEmbedUrl = (url?: string | null): string => {
    if (!url) return '';
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    const proxyMatch = url.match(/\/api\/drive\/file\/([a-zA-Z0-9_-]+)/);
    if (proxyMatch && proxyMatch[1] && !proxyMatch[1].startsWith('srec-')) {
      return `https://drive.google.com/file/d/${proxyMatch[1]}/preview`;
    }
    return url;
  };

  const formatLevel = (lvl: string) => {
    const map: Record<string, string> = {
      INTERNATIONAL: 'Global / International',
      NATIONAL: 'National Level',
      STATE: 'State Level',
      UNIVERSITY: 'University Level',
      COLLEGE: 'College / Institutional',
    };
    return map[lvl.toUpperCase()] || lvl;
  };

  const formatRank = (r?: string | null) => {
    if (!r) return 'Winner';
    const lower = r.toLowerCase();
    if (lower.includes('first') || lower.includes('1st') || lower === '1') return '1st Place';
    if (lower.includes('second') || lower.includes('2nd') || lower === '2') return '2nd Place';
    if (lower.includes('third') || lower.includes('3rd') || lower === '3') return '3rd Place';
    if (lower.includes('q1')) return 'Scopus Q1';
    if (lower.includes('grand')) return 'Grand Winner';
    if (lower.includes('best')) return 'Best Paper';
    if (lower.includes('patent')) return 'Patent Granted';
    return r.length > 14 ? `${r.slice(0, 12)}...` : r;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/achievements/${id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parsedTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
    ? tags.split(/[,;#]/).map((t) => t.trim()).filter(Boolean)
    : [];

  const isTeam = String(participationType).toUpperCase() === 'TEAM';

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="@container w-full min-w-0 bg-card rounded-3xl border border-border overflow-hidden shadow-subtle hover:border-primary/50 hover:shadow-card transition-all duration-200 flex flex-col group cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`View achievement details for ${title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return;
            e.preventDefault();
            setShowModal(true);
          } else if (e.key === ' ') {
            e.preventDefault();
            setShowModal(true);
          }
        }}
      >
        {/* 1. Prestigious Honor Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 px-5 pt-5 pb-6 border-b border-border/40 text-white overflow-hidden">
          {/* Ambient Subtle Grid */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />

          {/* Top Badges Row */}
          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap mb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary/20 text-blue-300 border border-primary/40 shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{categoryName}</span>
              </span>

              <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/15 backdrop-blur-xs">
                {formatLevel(level)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Verified SREC Honor
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="relative z-10 space-y-1.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>

            {/* Issuing Authority / Organization */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate" title={organizationEventName}>
                {organizationEventName}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Proof Visual Preview Frame (Same style as post media) */}
        {hasProof && (
          <div className="relative w-full aspect-[16/9] max-h-48 overflow-hidden bg-slate-950/20 border-b border-border group-hover:border-primary/40 transition-colors">
            {isImageMedia(proofUrl) ? (
              <img
                src={proofUrl}
                alt={`Proof for ${title}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-center">
                <FileText className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-xs font-bold text-white">Verified Academic Proof Attached</span>
                <span className="text-[10px] text-slate-400">Google Drive Document • Click to preview</span>
              </div>
            )}
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white border border-white/20 flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Verified Proof</span>
            </div>
          </div>
        )}

        {/* 2. Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Achiever Info Row */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center shrink-0 shadow-xs text-sm">
                {personName.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold text-foreground truncate">{personName}</p>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-background border border-border text-foreground">
                    {personType}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 truncate mt-0.5">
                  {rollNumber && (
                    <span className="font-mono text-foreground font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3 text-primary" />
                      {rollNumber}
                    </span>
                  )}
                  <span>•</span>
                  <span className="truncate">{departmentName}</span>
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-background text-foreground border border-border shrink-0 flex items-center gap-1">
              {isTeam ? <Users className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-primary" />}
              <span>{isTeam ? 'Team Project' : 'Solo Entry'}</span>
            </span>
          </div>

          {/* 3. Four Metric Honor Boxes */}
          <div className="grid grid-cols-2 @[440px]:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/60 text-center min-w-0">
              <p className="text-sm sm:text-base font-extrabold text-foreground truncate" title={positionRank || 'Winner'}>
                {formatRank(positionRank)}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 truncate">
                Rank
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/30 text-center min-w-0">
              <p className="text-sm sm:text-base font-extrabold text-primary truncate" title={formatLevel(level)}>
                {level === 'INTERNATIONAL' ? 'Global' : level === 'NATIONAL' ? 'National' : level}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mt-0.5 truncate">
                Level
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/60 text-center min-w-0">
              <p className="text-sm sm:text-base font-extrabold text-foreground truncate">
                {academicYear || '2025-26'}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 truncate">
                Academic Year
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-secondary/40 border border-border/60 text-center min-w-0">
              <p className="text-sm sm:text-base font-extrabold text-foreground truncate">
                {achievementDate ? achievementDate.slice(0, 11) : 'Published'}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 truncate">
                Date
              </p>
            </div>
          </div>

          {/* 4. Description Excerpt (if any) */}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* 5. Tags Strip */}
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsedTags.slice(0, 4).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-muted/70 text-foreground border border-border/60"
                >
                  <Sparkles className="w-3 h-3 text-primary/70 shrink-0" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* 6. Action Footer Bar */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>View Proof</span>
                <span className="hidden @[380px]:inline">/ Certificate</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
                title={copied ? 'Link Copied!' : 'Share Honor'}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0 ml-auto"
            >
              <span>View Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Tap-To-View Dossier Modal */}
      {showModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 p-6 text-white border-b border-border/40">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary/20 text-blue-300 border border-primary/40">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{categoryName}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
                    {formatLevel(level)}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Verified SREC Honor
                  </span>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-2 font-medium">
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{organizationEventName}</span>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Achiever Card */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-lg shadow-sm">
                    {personName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-foreground">{personName}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-background border border-border text-foreground">
                        {personType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      {rollNumber && (
                        <span className="font-mono text-foreground font-semibold flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                          {rollNumber}
                        </span>
                      )}
                      <span>•</span>
                      <span>{departmentName}</span>
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-background text-foreground border border-border flex items-center gap-1.5">
                  {isTeam ? <Users className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
                  <span>{isTeam ? 'Team Project' : 'Solo Entry'}</span>
                </span>
              </div>

              {/* 4 Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-center">
                  <p className="text-base font-black text-foreground">{positionRank || 'Winner'}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Position / Rank</p>
                </div>
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 text-center">
                  <p className="text-base font-black text-primary">{formatLevel(level)}</p>
                  <p className="text-[10px] uppercase font-bold text-primary mt-0.5">Level</p>
                </div>
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-center">
                  <p className="text-base font-black text-foreground">{academicYear || '2025-2026'}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Academic Year</p>
                </div>
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-center">
                  <p className="text-base font-black text-foreground">
                    {achievementDate ? new Date(achievementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Conferred Date</p>
                </div>
              </div>

              {/* Description */}
              {description && (
                <div className="space-y-1.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Honor Abstract & Impact
                  </h5>
                  <div className="p-4 rounded-2xl bg-background border border-border text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {description}
                  </div>
                </div>
              )}

              {/* Tags */}
              {parsedTags.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Verified Competency Tags
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {parsedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-muted text-foreground border border-border"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Card Certificate & Document Proof Display */}
              {hasProof && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Official Certificate Proof Preview</span>
                    </h5>
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Open Original on Google Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-slate-950/60 flex items-center justify-center min-h-[260px] max-h-[500px] shadow-inner">
                    {isImageMedia(proofUrl) ? (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={proofUrl}
                          alt={`Certificate for ${title}`}
                          className="max-h-[460px] w-auto max-w-full object-contain rounded-xl shadow-md"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <iframe
                        src={getDriveEmbedUrl(proofUrl)}
                        title={`Proof Document for ${title}`}
                        className="w-full h-[420px] rounded-xl border-none"
                        allow="autoplay"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Official Proof Certificate Access */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Official Google Drive Verification Record</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Institutional certificate, paper manuscript, or award citation securely archived in SREC CONNECT folder.
                  </p>
                </div>

                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all shrink-0 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Drive Proof</span>
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2">
              <Link
                href={detailHref}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Open Dedicated Honor Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
