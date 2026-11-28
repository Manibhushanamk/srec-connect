'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';
import { ProofPreview } from '@/components/shared/ProofPreview';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { createCustomCategoryOption } from '@/lib/client-creatable';
import { formatDate } from '@/lib/utils';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit3,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  FileText,
  Calendar,
  Building,
  Tag,
  Trophy,
  Users,
  Info,
  Eye,
} from 'lucide-react';

export interface StudentAchievementItem {
  id: string;
  title: string;
  description: string | null;
  level: string;
  positionRank: string | null;
  organizationEventName: string;
  academicYear: string;
  achievementDate: string | Date;
  status: string;
  rejectionReason?: string | null;
  googleDriveUrl?: string | null;
  certificateUrl?: string | null;
  categoryId: string;
  category: { id: string; name: string };
  department?: { id: string; name: string; code: string } | null;
  teamMembers?: { id: string; rollNumber: string; studentName: string; isLeader?: boolean }[];
}

interface StudentAchievementsListProps {
  achievements: StudentAchievementItem[];
  categories: { id: string; name: string }[];
}

export function StudentAchievementsList({ achievements: initialList, categories: initialCategories }: StudentAchievementsListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [achievements, setAchievements] = useState<StudentAchievementItem[]>(initialList);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES'>('ALL');
  const [expandedProofId, setExpandedProofId] = useState<string | null>(null);
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<StudentAchievementItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    level: 'COLLEGE',
    positionRank: '',
    organizationEventName: '',
    academicYear: '2025-2026',
    achievementDate: '',
    googleDriveUrl: '',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Withdraw / Delete State
  const [withdrawingItem, setWithdrawingItem] = useState<StudentAchievementItem | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Tab counters
  const pendingCount = achievements.filter(
    (a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW' || a.status === 'DRAFT'
  ).length;
  const approvedCount = achievements.filter(
    (a) => a.status === 'APPROVED' || a.status === 'PUBLISHED'
  ).length;
  const needsChangesCount = achievements.filter(
    (a) => a.status === 'RESUBMISSION_REQUIRED'
  ).length;

  const filteredAchievements = achievements.filter((a) => {
    if (filterTab === 'PENDING') {
      return a.status === 'PENDING' || a.status === 'UNDER_REVIEW' || a.status === 'DRAFT';
    }
    if (filterTab === 'APPROVED') {
      return a.status === 'APPROVED' || a.status === 'PUBLISHED';
    }
    if (filterTab === 'NEEDS_CHANGES') {
      return a.status === 'RESUBMISSION_REQUIRED';
    }
    return true;
  });

  const handleOpenEdit = (item: StudentAchievementItem) => {
    // Client-side lockout guard
    if (item.status === 'APPROVED' || item.status === 'PUBLISHED') {
      alert(
        '🔒 This achievement has been verified and approved by the department. Approved records are permanently locked and cannot be edited to maintain institutional audit integrity.'
      );
      return;
    }

    setEditingItem(item);
    setEditFormData({
      title: item.title,
      description: item.description || '',
      categoryId: item.categoryId || (item.category?.id ?? ''),
      level: item.level || 'COLLEGE',
      positionRank: item.positionRank || '',
      organizationEventName: item.organizationEventName || '',
      academicYear: item.academicYear || '2025-2026',
      achievementDate: item.achievementDate
        ? new Date(item.achievementDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      googleDriveUrl: item.googleDriveUrl || item.certificateUrl || '',
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editFormData.title.trim() || !editFormData.organizationEventName.trim() || !editFormData.categoryId) {
      setEditError('Title, Category, and Event/Organization are required.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const res = await fetch('/api/achievements/submit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          ...editFormData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update achievement');
      }

      // Optimistically update local list
      setAchievements((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                title: editFormData.title.trim(),
                description: editFormData.description.trim() || null,
                categoryId: editFormData.categoryId,
                category: categories.find((c) => c.id === editFormData.categoryId) || item.category,
                level: editFormData.level,
                positionRank: editFormData.positionRank.trim() || null,
                organizationEventName: editFormData.organizationEventName.trim(),
                academicYear: editFormData.academicYear,
                achievementDate: editFormData.achievementDate,
                googleDriveUrl: editFormData.googleDriveUrl.trim() || null,
                certificateUrl: editFormData.googleDriveUrl.trim() || null,
                // If it was in resubmission, editing transitions it back to PENDING review
                status: item.status === 'RESUBMISSION_REQUIRED' ? 'PENDING' : item.status,
                rejectionReason: null,
              }
            : item
        )
      );

      setEditingItem(null);
      router.refresh();
    } catch (err: any) {
      console.error('[Update Achievement Error]:', err);
      setEditError(err.message || 'Error saving changes. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawingItem) return;

    if (withdrawingItem.status === 'APPROVED' || withdrawingItem.status === 'PUBLISHED') {
      alert('Approved achievements cannot be removed.');
      setWithdrawingItem(null);
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      const res = await fetch(`/api/achievements/submit?id=${withdrawingItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to withdraw request');
      }

      // Remove from list
      setAchievements((prev) => prev.filter((item) => item.id !== withdrawingItem.id));
      setWithdrawingItem(null);
      router.refresh();
    } catch (err: any) {
      console.error('[Withdraw Error]:', err);
      setWithdrawError(err.message || 'Error withdrawing achievement');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Your Achievements & Submissions</span>
          </h2>
          <p className="text-sm text-slate-400">
            Pending requests can be edited or withdrawn until approved by faculty.
          </p>
        </div>

        <Link href="/dashboard/student/submit">
          <Button variant="primary" size="sm" className="gap-2 shadow-lg shadow-brand-500/20">
            <Award className="w-4 h-4" />
            Submit New Achievement
          </Button>
        </Link>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto text-sm">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            filterTab === 'ALL'
              ? 'bg-slate-800 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          All Submissions
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
            {achievements.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('PENDING')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            filterTab === 'PENDING'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          In Review (Editable)
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterTab('APPROVED')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            filterTab === 'APPROVED'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Approved & Locked
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            {approvedCount}
          </span>
        </button>

        {needsChangesCount > 0 && (
          <button
            onClick={() => setFilterTab('NEEDS_CHANGES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              filterTab === 'NEEDS_CHANGES'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Changes
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {needsChangesCount}
            </span>
          </button>
        )}
      </div>

      {/* 3. Achievements Card List */}
      {filteredAchievements.length === 0 ? (
        <EmptyStatePreset
          type="achievements"
          action={{
            label: 'Submit Your First Achievement',
            href: '/dashboard/student/submit',
            variant: 'primary',
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredAchievements.map((item) => {
            const isApproved = item.status === 'APPROVED' || item.status === 'PUBLISHED';
            const isPending = item.status === 'PENDING' || item.status === 'UNDER_REVIEW' || item.status === 'DRAFT';
            const isNeedsChanges = item.status === 'RESUBMISSION_REQUIRED';
            const docUrl = item.googleDriveUrl || item.certificateUrl;
            const resolvedDocHref = (() => {
              if (!docUrl) return null;
              const match = docUrl.match(/\/file\/d\/([A-Za-z0-9_-]+)/) || docUrl.match(/\/api\/drive\/(?:file|document)\/([A-Za-z0-9_-]+)/);
              if (match?.[1]) return `/api/drive/document/${match[1]}`;
              return docUrl;
            })();

            return (
              <Card
                key={item.id}
                variant="glass"
                className={`p-5 transition-all duration-200 border ${
                  isApproved
                    ? 'border-emerald-500/30 hover:border-emerald-500/50 bg-gradient-to-r from-emerald-950/10 to-transparent'
                    : isNeedsChanges
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Icon & Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isNeedsChanges
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      }`}
                    >
                      <Award className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-100 text-base leading-snug">
                          {item.title}
                        </h3>

                        {/* Status Badges */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <Lock className="w-3 h-3" />
                            Approved & Verified (Locked)
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock className="w-3 h-3 animate-pulse" />
                            In Review (Editable)
                          </span>
                        )}
                        {isNeedsChanges && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <AlertTriangle className="w-3 h-3" />
                            Needs Changes & Resubmission
                          </span>
                        )}
                      </div>

                      {/* Meta information tags */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.category?.name || 'Achievement'}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-300">{item.organizationEventName}</span>
                        <span>•</span>
                        <span>Level: {item.level}</span>
                        {item.positionRank && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">{item.positionRank}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(item.achievementDate)}</span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 pt-1">{item.description}</p>
                      )}

                      {/* Resubmission feedback box */}
                      {isNeedsChanges && item.rejectionReason && (
                        <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Reviewer Feedback: </span>
                            {item.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Contextual Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* View Certificate / Drive Link & Card Proof Preview Toggle */}
                    {resolvedDocHref && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedProofId((prev) => (prev === item.id ? null : item.id))
                          }
                          className="px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Toggle inline certificate preview on card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{expandedProofId === item.id ? 'Hide Preview' : 'Preview Proof'}</span>
                        </button>
                        <a
                          href={resolvedDocHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                          title="Open Certificate / Proof Document"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Document</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </>
                    )}

                    {/* Pending Submissions: EDIT & WITHDRAW */}
                    {(isPending || isNeedsChanges) && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 rounded-lg bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                          title="Edit this pending request"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isNeedsChanges ? 'Edit & Resubmit' : 'Edit Request'}</span>
                        </button>

                        <button
                          onClick={() => setWithdrawingItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 text-xs font-medium transition-colors flex items-center gap-1.5"
                          title="Withdraw and delete this request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Withdraw</span>
                        </button>
                      </>
                    )}

                    {/* Approved Submissions: LOCKED Notice */}
                    {isApproved && (
                      <div
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400/90 text-xs font-medium flex items-center gap-1.5 cursor-help"
                        title="Official academic record locked to guarantee institutional audit integrity."
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Audit Locked</span>
                      </div>
                    )}
                  </div>
                </div>
                {resolvedDocHref && expandedProofId === item.id && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <ProofPreview url={resolvedDocHref} title={item.title} heightClass="h-56" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Interactive Edit Modal for Pending Achievements */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#0D0E12]/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-sheet liquid-sheet-enter rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card/95 px-6 py-4 border-b border-border flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Edit Pending Achievement</h3>
                  <p className="text-xs text-muted-foreground">
                    Modifying request #{editingItem.id.slice(-6)} • Changes update review queue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Achievement / Honor Title *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g. First Prize in National Level AI Hackathon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Category *</label>
                  <CreatableSelect
                    required
                    value={editFormData.categoryId}
                    onChange={(val) => setEditFormData({ ...editFormData, categoryId: val })}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Select Category"
                    customOptionLabel="+ Custom Category..."
                    customPlaceholder="Type custom category..."
                    onCreateCustom={async (name) => {
                      const created = await createCustomCategoryOption(name, 'ACHIEVEMENT');
                      if (created) {
                        setCategories((prev) =>
                          prev.some((c) => c.id === created.value) ? prev : [...prev, { id: created.value, name: created.label }]
                        );
                      }
                      return created;
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Level *</label>
                  <CreatableSelect
                    required
                    value={editFormData.level}
                    onChange={(val) => setEditFormData({ ...editFormData, level: val })}
                    options={[
                      { value: 'COLLEGE', label: 'College / Intra-Campus' },
                      { value: 'INTER_COLLEGE', label: 'Inter-College' },
                      { value: 'STATE', label: 'State Level' },
                      { value: 'NATIONAL', label: 'National Level' },
                      { value: 'INTERNATIONAL', label: 'International Level' },
                    ]}
                    customOptionLabel="+ Custom Level..."
                    customPlaceholder="Type custom level..."
                  />
                </div>
              </div>

              {/* Event Name & Position Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organizing Event / Body *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.organizationEventName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, organizationEventName: e.target.value })
                    }
                    placeholder="e.g. Smart India Hackathon / IIT Bombay"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Position / Rank / Award
                  </label>
                  <input
                    type="text"
                    value={editFormData.positionRank}
                    onChange={(e) => setEditFormData({ ...editFormData, positionRank: e.target.value })}
                    placeholder="e.g. 1st Place, Finalist, Special Mention"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Achievement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.achievementDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, achievementDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Academic Year *
                  </label>
                  <CreatableSelect
                    required
                    value={editFormData.academicYear}
                    onChange={(val) =>
                      setEditFormData({ ...editFormData, academicYear: val })
                    }
                    options={[
                      { value: '2026-2027', label: '2026-2027' },
                      { value: '2025-2026', label: '2025-2026' },
                      { value: '2024-2025', label: '2024-2025' },
                      { value: '2023-2024', label: '2023-2024' },
                      { value: '2022-2023', label: '2022-2023' },
                    ]}
                    customOptionLabel="+ Custom Academic Year..."
                    customPlaceholder="e.g. 2027-2028"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Project Details
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Summarize project problem statement, technology stack, and outcomes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Certificate / Google Drive Document */}
              <div className="pt-2">
                <DriveFileUploader
                  value={editFormData.googleDriveUrl}
                  onChange={(url) => setEditFormData({ ...editFormData, googleDriveUrl: url })}
                  label="Update Certificate / Proof Document"
                  helpText="Upload new certificate directly to your Google Drive folder or provide link."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingEdit}
                  className="gap-2 px-5"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Updates...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save & Update Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Withdraw Confirmation Modal */}
      {withdrawingItem && (
        <div className="fixed inset-0 z-50 bg-[#0D0E12]/75 flex items-center justify-center p-4">
          <div className="glass-sheet liquid-sheet-enter rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">Withdraw Submission?</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to withdraw{' '}
                <span className="text-foreground font-semibold">"{withdrawingItem.title}"</span>?
              </p>
              <p className="text-xs text-slate-500 pt-1">
                This will remove the request from the faculty approval desk. You can always submit a new achievement later.
              </p>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
                {withdrawError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWithdrawingItem(null)}
                disabled={isWithdrawing}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={isWithdrawing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirm Withdrawal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
