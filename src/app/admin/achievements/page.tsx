'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EditAchievementModal } from '@/components/admin/EditAchievementModal';
import { ProofPreview } from '@/components/shared/ProofPreview';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { isLateralEntryRoll } from '@/lib/studentHelper';
import {
  canExportCategory,
  canManageCategories,
  toPrivateDocumentUrl,
  WORKFLOW_STATUS_LABELS,
} from '@/lib/admin-auth';
import { createCustomCategoryOption, removeCategoryOption } from '@/lib/client-creatable';
import { ACHIEVEMENT_TIMELINE_PRESETS } from '@/lib/timeline';
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Code,
  Download,
  Edit,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Forward,
  History,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

type WorkflowTab =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'RESUBMISSION_REQUIRED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ALL';

const WORKFLOW_TABS: Array<{ key: WorkflowTab; label: string }> = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'APPROVED', label: 'Awaiting HOD' },
  { key: 'RESUBMISSION_REQUIRED', label: 'Resubmission' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'PUBLISHED', label: 'Approved & Published' },
  { key: 'ALL', label: 'All' },
];

function StatusPill({ status }: { status: string }) {
  const label = WORKFLOW_STATUS_LABELS[status] || status;
  if (status === 'PUBLISHED' || status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-[#CA8A04]/45 dark:border-[#FACC15]/50 bg-[#CA8A04]/15 dark:bg-[#FACC15]/15 text-[#92400E] dark:text-[#FACC15]">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-rose-500/40 bg-rose-500/10 text-rose-400">
        <XCircle className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'RESUBMISSION_REQUIRED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-orange-500/40 bg-orange-500/10 text-orange-400">
        <RotateCcw className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'UNDER_REVIEW') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-[#EA580C]/40 dark:border-[#F97316]/40 bg-[#EA580C]/10 dark:bg-[#F97316]/10 text-[#C2410C] dark:text-[#F97316]">
        <FileCheck2 className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-amber-500/40 bg-amber-500/10 text-amber-400">
      <Clock className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function AdminAchievementsContent() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get('status')?.toUpperCase() || 'SUBMITTED';
  const normalizedInitial: WorkflowTab =
    urlStatus === 'PENDING' || urlStatus === 'DRAFT'
      ? 'SUBMITTED'
      : WORKFLOW_TABS.some((t) => t.key === urlStatus)
      ? (urlStatus as WorkflowTab)
      : 'SUBMITTED';

  const [achievements, setAchievements] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [actorRole, setActorRole] = useState<string>('FACULTY');
  const [actorId, setActorId] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<WorkflowTab>(normalizedInitial);
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [scopedDepartment, setScopedDepartment] = useState<{ id: string; code: string; name: string } | null>(null);
  const [exportBusyFormat, setExportBusyFormat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Action bar states
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'FORWARD_HOD' | 'PUBLISH' | 'UNDER_REVIEW' | null>(null);
  const [reasonMode, setReasonMode] = useState<'REJECTED' | 'RESUBMISSION_REQUIRED' | null>(null);
  const [reasonDraft, setReasonDraft] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal edit state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const queueContainerRef = useRef<HTMLDivElement | null>(null);
  const preservedScrollRef = useRef<number | null>(null);

  useEffect(() => {
    const param = searchParams.get('status')?.toUpperCase();
    if (!param) return;
    if (param === 'PENDING' || param === 'DRAFT') {
      setStatusFilter('SUBMITTED');
    } else if (WORKFLOW_TABS.some((t) => t.key === param)) {
      setStatusFilter(param as WorkflowTab);
    }
  }, [searchParams]);

  const fetchAchievements = useCallback(
    async (preferredNextId?: string | null) => {
      if (queueContainerRef.current) {
        preservedScrollRef.current = queueContainerRef.current.scrollTop;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          status: statusFilter === 'ALL' ? 'ALL' : statusFilter,
        });
        if (timelineFilter && timelineFilter !== 'ALL') params.set('timeline', timelineFilter);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (categoryFilter && categoryFilter !== 'ALL') params.set('categoryId', categoryFilter);
        if (levelFilter && levelFilter !== 'ALL') params.set('level', levelFilter);
        if (departmentFilter && departmentFilter !== 'ALL') params.set('departmentId', departmentFilter);

        const res = await fetch(`/api/admin/achievements?${params.toString()}`);
        const data = await res.json();
        const nextList = data.achievements || [];
        setAchievements(nextList);
        setStatusCounts(data.statusCounts || {});
        if (data.actorRole) setActorRole(data.actorRole);
        if (data.actorId) setActorId(data.actorId);
        if (data.scopedDepartment !== undefined) setScopedDepartment(data.scopedDepartment);

        setSelectedId((prevSelected) => {
          if (preferredNextId && nextList.some((a: any) => a.id === preferredNextId)) {
            return preferredNextId;
          }
          if (prevSelected && nextList.some((a: any) => a.id === prevSelected)) {
            return prevSelected;
          }
          return nextList[0]?.id || null;
        });
      } finally {
        setLoading(false);
        requestAnimationFrame(() => {
          if (queueContainerRef.current && preservedScrollRef.current !== null) {
            queueContainerRef.current.scrollTop = preservedScrollRef.current;
            preservedScrollRef.current = null;
          }
        });
      }
    },
    [statusFilter, timelineFilter, dateFrom, dateTo, categoryFilter, levelFilter, departmentFilter]
  );

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((d) => setCategories(d.categories || []));
    fetch('/api/departments?all=true')
      .then((res) => res.json())
      .then((d) => setDepartments(d.departments || []));
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return achievements;
    const term = searchTerm.trim().toLowerCase();
    return achievements.filter(
      (a) =>
        a.title?.toLowerCase().includes(term) ||
        a.personName?.toLowerCase().includes(term) ||
        a.primaryStudentRoll?.toLowerCase().includes(term) ||
        a.organizationEventName?.toLowerCase().includes(term)
    );
  }, [achievements, searchTerm]);

  const selectedItem = useMemo(
    () => filtered.find((a) => a.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  useEffect(() => {
    setConfirmMode(null);
    setReasonMode(null);
    setReasonDraft('');
  }, [selectedItem?.id]);

  const computeNextItemId = (currentId: string) => {
    const idx = filtered.findIndex((a) => a.id === currentId);
    if (idx === -1) return null;
    return filtered[idx + 1]?.id || filtered[idx - 1]?.id || null;
  };

  const handleWorkflowTransition = async (
    id: string,
    status: string,
    rejectionReason?: string
  ): Promise<boolean> => {
    if ((status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') && !rejectionReason?.trim()) {
      setActionFeedback({
        type: 'err',
        text:
          status === 'REJECTED'
            ? 'A non-empty rejection reason is mandatory.'
            : 'Non-empty revision remarks are mandatory for resubmission.',
      });
      return false;
    }

    setActionBusy(true);
    setActionFeedback(null);
    const nextCandidateId = computeNextItemId(id);

    try {
      const res = await fetch('/api/admin/achievements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionFeedback({ type: 'err', text: data.error || 'Workflow update rejected.' });
        return false;
      }

      setConfirmMode(null);
      setReasonMode(null);
      setReasonDraft('');
      setActionFeedback({
        type: 'ok',
        text: `Updated submission to ${WORKFLOW_STATUS_LABELS[status] || status}.`,
      });
      await fetchAchievements(nextCandidateId);
      return true;
    } catch {
      setActionFeedback({ type: 'err', text: 'Network error updating achievement status.' });
      return false;
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move this submission to trash?')) return;
    const nextCandidateId = computeNextItemId(id);
    const res = await fetch('/api/admin/achievements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMobileDrawerOpen(false);
      await fetchAchievements(nextCandidateId);
    } else {
      const data = await res.json();
      setActionFeedback({ type: 'err', text: data.error || 'Delete denied.' });
    }
  };

  const handleOpenEdit = (ach: any) => {
    const existingPost = ach.posts?.[0];
    const postMedia = existingPost?.media?.[0]?.url;
    setEditingItem({
      ...ach,
      departmentId: ach.departmentId || ach.department?.id || '',
      status: ach.status || 'PENDING',
      rejectionReason: ach.rejectionReason || '',
      title: ach.title || '',
      personType: ach.personType || 'STUDENT',
      personName: ach.personName || ach.primaryStudent?.name || ach.faculty?.name || '',
      primaryStudentRoll: ach.primaryStudentRoll || ach.primaryStudent?.rollNumber || '',
      facultyDesignation: ach.facultyDesignation || ach.faculty?.designation || '',
      categoryId: ach.categoryId || categories[0]?.id || '',
      positionRank: ach.positionRank || '',
      organizationEventName: ach.organizationEventName || '',
      level: ach.level || 'COLLEGE',
      achievementDate: ach.achievementDate
        ? new Date(ach.achievementDate).toISOString().split('T')[0]
        : '',
      academicYear: ach.academicYear || '2025-2026',
      participationType:
        ach.participationType || (ach.teamMembers?.length > 0 ? 'TEAM' : 'SOLO'),
      teamName: ach.teamName || '',
      description: ach.description || '',
      googleDriveUrl: ach.googleDriveUrl || ach.certificateUrl || '',
      certificateUrl: ach.certificateUrl || ach.googleDriveUrl || '',
      teamMembers: Array.isArray(ach.teamMembers) ? ach.teamMembers : [],
      postToFeed: !!existingPost,
      feedCaption: existingPost?.content || '',
      feedImageUrl: postMedia || '',
    });
  };

  const handleSaveEdit = async (publishImmediately: boolean = false) => {
    if (!editingItem) return;
    setSavingEdit(true);
    const nextCandidateId = editingItem.id;
    const res = await fetch('/api/admin/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingItem,
        status: publishImmediately ? 'PUBLISHED' : editingItem.status,
      }),
    });
    setSavingEdit(false);
    if (res.ok) {
      setEditingItem(null);
      await fetchAchievements(nextCandidateId);
    } else {
      const data = await res.json();
      setActionFeedback({ type: 'err', text: data.error || 'Failed to save changes.' });
    }
  };

  const handleQueueKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (filtered.length === 0) return;
    const currentIndex = filtered.findIndex((item) => item.id === (selectedItem?.id || ''));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
      const next = filtered[nextIdx];
      if (next) {
        setSelectedId(next.id);
        document.getElementById(`queue-item-${next.id}`)?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
      const prev = filtered[prevIdx];
      if (prev) {
        setSelectedId(prev.id);
        document.getElementById(`queue-item-${prev.id}`)?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter' && selectedItem) {
      e.preventDefault();
      setMobileDrawerOpen(true);
    }
  };

  const canDirectPublish = actorRole === 'HOD' || actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
  const canDeleteRecord = actorRole === 'HOD' || actorRole === 'SUPER_ADMIN';
  const canManageDropdownCategories = canManageCategories(actorRole);
  const canDownloadAchievements = canExportCategory(actorRole, 'ACHIEVEMENTS');
  const isSuperOrGlobalAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';

  const exportStudioQuery = useMemo(() => {
    const p = new URLSearchParams({ category: 'ACHIEVEMENTS' });
    if (statusFilter && statusFilter !== 'ALL') p.set('status', statusFilter);
    if (timelineFilter && timelineFilter !== 'ALL') p.set('timeline', timelineFilter);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    if (categoryFilter && categoryFilter !== 'ALL') p.set('achievementCategoryId', categoryFilter);
    if (levelFilter && levelFilter !== 'ALL') p.set('level', levelFilter);
    if (departmentFilter && departmentFilter !== 'ALL') p.set('departmentId', departmentFilter);
    if (searchTerm.trim()) p.set('search', searchTerm.trim());
    return p.toString();
  }, [statusFilter, timelineFilter, dateFrom, dateTo, categoryFilter, levelFilter, departmentFilter, searchTerm]);

  const handleExportFiltered = async (fmt: 'xlsx' | 'csv' | 'html' | 'json') => {
    setExportBusyFormat(fmt);
    setActionFeedback(null);
    try {
      const params = new URLSearchParams(exportStudioQuery);
      params.set('format', fmt);
      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Export failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `SREC_ACHIEVEMENTS_${new Date().toISOString().split('T')[0]}.${fmt}`;
      if (disposition) {
        const m = disposition.match(/filename="?([^"]+)"?/);
        if (m?.[1]) filename = m[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setActionFeedback({ type: 'ok', text: `Downloaded ${filename}` });
    } catch (err: any) {
      setActionFeedback({ type: 'err', text: err?.message || 'Failed to export achievements.' });
    } finally {
      setExportBusyFormat(null);
    }
  };
  const isSelfSubmitted =
    Boolean(selectedItem?.createdById) &&
    selectedItem.createdById === actorId &&
    actorRole !== 'SUPER_ADMIN';

  const certificatePreviewUrl = toPrivateDocumentUrl(
    selectedItem?.privateCertificateUrl || selectedItem?.certificateUrl || selectedItem?.googleDriveUrl
  );

  return (
    <div className="space-y-4">
      {/* Header & Workflow State Filter Pills */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Badge variant="cyan" size="sm" className="mb-1">
              Split-Screen Verification Desk
            </Badge>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Faculty &amp; HOD Verification Desk
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              40/60 master-detail review workspace • Use Up/Down arrow keys to triage queue items without losing scroll position.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{filtered.length} shown</span>
            <span>•</span>
            <span>Role: {actorRole}</span>
          </div>
        </div>

        {/* All 6 Workflow State Tabs + All */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
          role="tablist"
          aria-label="Verification workflow states"
        >
          {WORKFLOW_TABS.map((tab) => {
            const count = statusCounts[tab.key] ?? 0;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setMobileDrawerOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? tab.key === 'PUBLISHED' || tab.key === 'APPROVED'
                      ? 'bg-[#CA8A04] dark:bg-[#FACC15] text-white dark:text-[#0D0E12] border-[#CA8A04] dark:border-[#FACC15]'
                      : 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card/60 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    active ? 'bg-black/20 text-current' : 'bg-background text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeline Period, Category Manager & Multi-Format Export Controls */}
        <div className="glass-card p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* Time Period / Timeline Selector */}
            <div>
              <label htmlFor="admin-ach-timeline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                <span>Achievement Timeline / Period</span>
              </label>
              <select
                id="admin-ach-timeline"
                value={timelineFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setTimelineFilter(val);
                  if (val !== 'CUSTOM') {
                    setDateFrom('');
                    setDateTo('');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {ACHIEVEMENT_TIMELINE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown with Admin Add & Remove */}
            <div>
              <label htmlFor="admin-ach-category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Award className="w-3 h-3 text-primary" />
                <span>Category {canManageDropdownCategories ? '(Add / Remove)' : ''}</span>
              </label>
              <CreatableSelect
                id="admin-ach-category"
                value={categoryFilter === 'ALL' ? '' : categoryFilter}
                onChange={(val) => setCategoryFilter(val || 'ALL')}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="All Categories"
                customOptionLabel={canManageDropdownCategories ? '+ Add Custom Category...' : '+ Custom Category...'}
                customPlaceholder="Type new category name..."
                onCreateCustom={
                  canManageDropdownCategories
                    ? async (name) => {
                        const created = await createCustomCategoryOption(name, 'ACHIEVEMENT');
                        if (created) {
                          setCategories((prev) =>
                            prev.some((c) => c.id === created.value)
                              ? prev
                              : [...prev, { id: created.value, name: created.label }]
                          );
                        }
                        return created;
                      }
                    : undefined
                }
                onRemoveOption={
                  canManageDropdownCategories
                    ? async (opt) => {
                        const ok = await removeCategoryOption(opt);
                        if (ok) {
                          setCategories((prev) => prev.filter((c) => c.id !== opt.value));
                          if (categoryFilter === opt.value) setCategoryFilter('ALL');
                          setActionFeedback({ type: 'ok', text: `Removed category "${opt.label}".` });
                        }
                        return ok;
                      }
                    : undefined
                }
              />
            </div>

            {/* Level Filter */}
            <div>
              <label htmlFor="admin-ach-level" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-primary" />
                <span>Recognition Level</span>
              </label>
              <CreatableSelect
                id="admin-ach-level"
                value={levelFilter === 'ALL' ? '' : levelFilter}
                onChange={(val) => setLevelFilter(val || 'ALL')}
                options={[
                  { value: 'INTERNATIONAL', label: 'International' },
                  { value: 'NATIONAL', label: 'National' },
                  { value: 'STATE', label: 'State' },
                  { value: 'UNIVERSITY', label: 'University' },
                  { value: 'COLLEGE', label: 'College' },
                  { value: 'DEPARTMENT', label: 'Department' },
                ]}
                placeholder="All Levels"
                customOptionLabel="+ Custom Level..."
                customPlaceholder="Type level..."
              />
            </div>

            {/* Department Filter / Lock */}
            <div>
              <label htmlFor="admin-ach-dept" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary" />
                <span>Department Scope</span>
              </label>
              {isSuperOrGlobalAdmin ? (
                <select
                  id="admin-ach-dept"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary truncate">
                  {scopedDepartment ? `Locked: ${scopedDepartment.code} (${scopedDepartment.name})` : 'Department Scoped'}
                </div>
              )}
            </div>
          </div>

          {(timelineFilter === 'CUSTOM' || dateFrom || dateTo) && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Custom Date Range:
              </span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setTimelineFilter('CUSTOM');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setTimelineFilter('CUSTOM');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
            </div>
          )}

          {/* Direct Download Bar for Web Manager & Above */}
          {canDownloadAchievements && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-foreground">Download Filtered Achievements:</span>
                <span className="hidden sm:inline">
                  ({filtered.length} matching records • {ACHIEVEMENT_TIMELINE_PRESETS.find((t) => t.value === timelineFilter)?.label || 'All Time'})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={Boolean(exportBusyFormat)}
                  onClick={() => void handleExportFiltered('xlsx')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/35 text-emerald-500 dark:text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{exportBusyFormat === 'xlsx' ? 'Exporting...' : 'Excel (.xlsx)'}</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportBusyFormat)}
                  onClick={() => void handleExportFiltered('csv')}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/35 text-cyan-600 dark:text-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{exportBusyFormat === 'csv' ? 'Exporting...' : 'CSV'}</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportBusyFormat)}
                  onClick={() => void handleExportFiltered('html')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/35 text-purple-600 dark:text-purple-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{exportBusyFormat === 'html' ? 'Preparing...' : 'PDF / Print'}</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportBusyFormat)}
                  onClick={() => void handleExportFiltered('json')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/35 text-amber-600 dark:text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{exportBusyFormat === 'json' ? 'Exporting...' : 'JSON'}</span>
                </button>
                <Link
                  href={`/admin/export?${exportStudioQuery}`}
                  className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground inline-flex items-center gap-1"
                >
                  <span>Export Studio &rarr;</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div
          role={actionFeedback.type === 'err' ? 'alert' : 'status'}
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            actionFeedback.type === 'ok'
              ? 'border-[#CA8A04]/40 dark:border-[#FACC15]/40 bg-[#CA8A04]/12 dark:bg-[#FACC15]/12 text-[#92400E] dark:text-[#FACC15]'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          <span>{actionFeedback.text}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-current opacity-70 hover:opacity-100 text-[11px] font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split-Screen Workspace: 40% Left Queue / 60% Right Detail Pane */}
      <div className="flex flex-col md:flex-row gap-4 lg:gap-5 items-start">
        {/* LEFT PANE (40% on lg, 42% on md, full-width on mobile when drawer closed) */}
        <section
          aria-label="Submissions Queue"
          className={`w-full md:w-[42%] lg:w-[40%] shrink-0 glass-card overflow-hidden flex flex-col ${
            mobileDrawerOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search submissions by roll number, title, recipient, or event"
                placeholder="Search roll number, honor title, recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div
            ref={queueContainerRef}
            role="listbox"
            tabIndex={0}
            aria-label="Submission review queue"
            onKeyDown={handleQueueKeyDown}
            className="divide-y divide-border max-h-[65vh] lg:max-h-[70vh] overflow-y-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {loading ? (
              <div className="p-10 text-center text-xs font-mono text-primary">
                Loading verification queue...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Award className="w-8 h-8 text-muted-foreground mx-auto opacity-60" />
                <p className="text-xs font-semibold text-foreground">No matching submissions</p>
                <p className="text-[11px] text-muted-foreground">
                  Try clearing search text or switching workflow tabs.
                </p>
              </div>
            ) : (
              filtered.map((ach) => {
                const isSelected = selectedItem?.id === ach.id;
                const isLateral = isLateralEntryRoll(ach.primaryStudentRoll);

                return (
                  <button
                    key={ach.id}
                    id={`queue-item-${ach.id}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => {
                      setSelectedId(ach.id);
                      setMobileDrawerOpen(true);
                    }}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer block border-l-4 ${
                      isSelected
                        ? 'bg-background border-l-primary'
                        : 'bg-card border-l-transparent hover:bg-background/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <StatusPill status={ach.status} />
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {ach.achievementDate
                          ? new Date(ach.achievementDate).toLocaleDateString()
                          : ''}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-foreground line-clamp-1">
                      {ach.title}
                    </h3>

                    <div className="mt-1 flex items-center flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/90">{ach.personName}</span>
                      {ach.primaryStudentRoll && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-primary">
                          {ach.primaryStudentRoll}
                        </span>
                      )}
                      {isLateral && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
                          5A Lateral Entry
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-muted-foreground truncate">
                      {ach.organizationEventName} • {ach.category?.name || 'Honor'} • {ach.level}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANE (60% on lg, 58% on md, full-screen mobile drawer on <768px) */}
        <section
          aria-label="Submission Detail & Certificate Preview"
          className={`w-full md:w-[58%] lg:w-[60%] glass-card overflow-hidden flex flex-col ${
            mobileDrawerOpen
              ? 'fixed inset-0 z-40 rounded-none md:static md:rounded-2xl md:z-auto'
              : 'hidden md:flex'
          }`}
        >
          {!selectedItem ? (
            <div className="p-16 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
              <FileCheck2 className="w-10 h-10 text-muted-foreground opacity-60" />
              <h2 className="text-sm font-bold text-foreground">Select a Submission</h2>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a record from the left queue to inspect its private certificate stream, student metadata, and audit history.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Back-to-Queue Bar (<768px) */}
              <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Queue</span>
                </button>
                <StatusPill status={selectedItem.status} />
              </div>

              {/* Detail Scroll Content */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1 max-h-[75vh] md:max-h-[65vh]">
                {/* Header & Key Meta */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusPill status={selectedItem.status} />
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-background border border-border text-muted-foreground">
                        {selectedItem.department?.code || 'DEPT'} • {selectedItem.academicYear}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-background border border-border text-foreground">
                        {selectedItem.level}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-foreground leading-snug">
                      {selectedItem.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Hosted by <strong className="text-foreground">{selectedItem.organizationEventName}</strong>
                      {selectedItem.positionRank ? ` • Award: ${selectedItem.positionRank}` : ''}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(selectedItem)}
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                  >
                    Edit Fields
                  </Button>
                </div>

                {/* Rejection / Resubmission Banner if present */}
                {selectedItem.rejectionReason && (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 space-y-1">
                    <div className="font-bold text-rose-400">Latest Review Remarks</div>
                    <p>{selectedItem.rejectionReason}</p>
                  </div>
                )}

                {/* Embedded Private Certificate Preview (/api/drive/document/[id]) */}
                <div className="rounded-xl border border-border bg-background overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between gap-2 bg-card">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-primary" />
                      <span>Private Certificate Preview</span>
                    </span>
                    {certificatePreviewUrl && (
                      <a
                        href={certificatePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open Authenticated Stream</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <ProofPreview
                    url={certificatePreviewUrl}
                    title={selectedItem.title}
                    heightClass="h-72"
                    className="m-2"
                  />
                </div>

                {/* Recipient & Academic Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span>Recipient Metadata</span>
                    </div>
                    <p className="text-muted-foreground">
                      Name: <strong className="text-foreground">{selectedItem.personName}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Roll / ID:{' '}
                      <span className="font-mono text-foreground">
                        {selectedItem.primaryStudentRoll || 'Faculty Record'}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Submitted By:{' '}
                      <span className="text-foreground">
                        {selectedItem.createdBy?.email || 'Institutional Seed'} ({selectedItem.createdBy?.role || 'N/A'})
                      </span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>Participation &amp; Description</span>
                    </div>
                    <p className="text-muted-foreground">
                      Mode: <strong className="text-foreground">{selectedItem.participationType}</strong>
                      {selectedItem.teamMembers?.length > 0
                        ? ` (${selectedItem.teamMembers.length} teammates)`
                        : ''}
                    </p>
                    <p className="text-muted-foreground line-clamp-3">
                      {selectedItem.description || 'No abstract provided.'}
                    </p>
                  </div>
                </div>

                {/* Chronological Review & Audit History */}
                <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <History className="w-3.5 h-3.5 text-primary" />
                    <span>Chronological Audit History</span>
                  </div>
                  {selectedItem.auditLogs?.length > 0 ? (
                    <ul className="space-y-2 text-[11px]" role="list">
                      {selectedItem.auditLogs.map((log: any) => (
                        <li
                          key={log.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/50 last:border-none last:pb-0"
                        >
                          <div className="text-foreground">
                            <span className="font-mono font-semibold text-primary">{log.action}</span>{' '}
                            <span className="text-muted-foreground">
                              by {log.actorEmail} ({log.actorRole})
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      No review transitions recorded yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Sticky Review Action Bar */}
              <div className="p-4 border-t border-border bg-card space-y-3 shrink-0">
                {isSelfSubmitted && (
                  <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Self-Submitted Record: Self-approval is disabled for non-Super-Admin accounts. Request peer faculty or HOD sign-off.
                    </span>
                  </div>
                )}

                {/* Inline Mandatory Rejection / Resubmission Reason Form */}
                {reasonMode && (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-background space-y-2">
                    <label
                      htmlFor="review-reason-input"
                      className="block text-xs font-bold text-rose-400"
                    >
                      {reasonMode === 'REJECTED'
                        ? 'Enter Mandatory Rejection Reason'
                        : 'Enter Mandatory Resubmission Instructions'}
                    </label>
                    <textarea
                      id="review-reason-input"
                      rows={2}
                      value={reasonDraft}
                      onChange={(e) => setReasonDraft(e.target.value)}
                      placeholder="Explain what needs correction or why evidence failed verification..."
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-rose-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReasonMode(null);
                          setReasonDraft('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={actionBusy}
                        onClick={() =>
                          handleWorkflowTransition(selectedItem.id, reasonMode, reasonDraft)
                        }
                      >
                        Confirm {reasonMode === 'REJECTED' ? 'Rejection' : 'Resubmission Request'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Explicit Confirmation Bar for Approve/Forward */}
                {confirmMode && (
                  <div className="p-3 rounded-xl border border-[#CA8A04]/40 dark:border-[#FACC15]/40 bg-[#CA8A04]/12 dark:bg-[#FACC15]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {confirmMode === 'PUBLISH'
                        ? 'Confirm Final Approval & Publish to SREC Honors Wall?'
                        : confirmMode === 'FORWARD_HOD'
                        ? 'Confirm Forward to Department HOD for Final Sign-Off?'
                        : 'Mark submission Under Faculty Review?'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfirmMode(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={actionBusy}
                        className="bg-[#CA8A04] dark:bg-[#FACC15] hover:opacity-90 text-white dark:text-[#0D0E12] font-bold"
                        onClick={() =>
                          handleWorkflowTransition(
                            selectedItem.id,
                            confirmMode === 'PUBLISH'
                              ? 'PUBLISHED'
                              : confirmMode === 'FORWARD_HOD'
                              ? 'APPROVED'
                              : 'UNDER_REVIEW'
                          )
                        }
                      >
                        Yes, Confirm
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedItem.status !== 'UNDER_REVIEW' && selectedItem.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionBusy}
                        onClick={() => setConfirmMode('UNDER_REVIEW')}
                      >
                        Mark Under Review
                      </Button>
                    )}

                    {selectedItem.status !== 'APPROVED' && selectedItem.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="cyan"
                        disabled={actionBusy || isSelfSubmitted}
                        onClick={() => setConfirmMode('FORWARD_HOD')}
                        leftIcon={<Forward className="w-3.5 h-3.5" />}
                      >
                        Approve &amp; Forward to HOD
                      </Button>
                    )}

                    {canDirectPublish && selectedItem.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        disabled={actionBusy || isSelfSubmitted}
                        onClick={() => setConfirmMode('PUBLISH')}
                        className="bg-[#CA8A04] dark:bg-[#FACC15] hover:opacity-90 text-white dark:text-[#0D0E12] font-bold"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve &amp; Publish
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionBusy}
                      onClick={() => {
                        setConfirmMode(null);
                        setReasonMode('RESUBMISSION_REQUIRED');
                        setReasonDraft(selectedItem.rejectionReason || '');
                      }}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Request Resubmission
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      disabled={actionBusy}
                      onClick={() => {
                        setConfirmMode(null);
                        setReasonMode('REJECTED');
                        setReasonDraft(selectedItem.rejectionReason || '');
                      }}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>

                    {canDeleteRecord && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(selectedItem.id)}
                        className="text-muted-foreground hover:text-rose-400"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <EditAchievementModal
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        categories={categories}
        departments={departments}
        savingEdit={savingEdit}
        canManageCategories={canManageDropdownCategories}
        onCategoryRemoved={(removedId) => {
          setCategories((prev) => prev.filter((c) => c.id !== removedId));
          if (categoryFilter === removedId) setCategoryFilter('ALL');
        }}
        onSaveEdit={handleSaveEdit}
        onRejectAction={handleWorkflowTransition}
      />
    </div>
  );
}

export default function AdminAchievementsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 py-8">
          <div className="h-10 w-64 bg-card rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 h-96 bg-card rounded-2xl animate-pulse border border-border" />
            <div className="lg:col-span-7 h-96 bg-card rounded-2xl animate-pulse border border-border" />
          </div>
        </div>
      }
    >
      <AdminAchievementsContent />
    </React.Suspense>
  );
}
