'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Download,
  FileSpreadsheet,
  GraduationCap,
  CheckCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  FileText,
  Filter,
  Eye,
  Sparkles,
  Shield,
  ShieldAlert,
  Printer,
  Code,
  RefreshCw,
  Clock,
  Lock,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreatableSelect, SelectOption } from '@/components/ui/CreatableSelect';
import { canExportCategory, canManageCategories } from '@/lib/admin-auth';
import {
  createCustomBatchOption,
  createCustomCategoryOption,
  removeBatchOption,
  removeCategoryOption,
} from '@/lib/client-creatable';
import { ACADEMIC_BATCH_OPTIONS, buildMergedBatchOptions } from '@/lib/studentHelper';
import { ACHIEVEMENT_TIMELINE_PRESETS, EVENT_TIMELINE_PRESETS } from '@/lib/timeline';

type ExportCategory =
  | 'ACHIEVEMENTS'
  | 'STUDENTS'
  | 'FACULTY'
  | 'EVENTS'
  | 'INCIDENTS'
  | 'COMPLETE_INSTITUTIONAL_DUMP';
type ExportFormat = 'xlsx' | 'csv' | 'html' | 'json';

interface CompliancePreset {
  id: string;
  name: string;
  category: ExportCategory;
  format: ExportFormat;
  status: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const COMPLIANCE_PRESETS: CompliancePreset[] = [
  {
    id: 'naac_5_3',
    name: 'NAAC Criterion 5.3 (Student Awards & Progression)',
    category: 'ACHIEVEMENTS',
    format: 'xlsx',
    status: 'APPROVED',
    description: 'Formatted Excel register of national/international awards, medals, and state recognitions.',
    badge: 'NAAC A+ Mandatory',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  },
  {
    id: 'nba_4',
    name: 'NBA Criterion 4 (External Competitions & Hackathons)',
    category: 'ACHIEVEMENTS',
    format: 'xlsx',
    status: 'PUBLISHED',
    description: 'Verified student technical papers, design hackathons, and industry competitive milestones.',
    badge: 'NBA Tier-1 Audit',
    badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  },
  {
    id: 'student_roster',
    name: 'Student Master Roster (With Lateral Entry Tags)',
    category: 'STUDENTS',
    format: 'xlsx',
    status: 'ALL',
    description: 'Master enrollment register identifying 4-year and 3-year Diploma Lateral Entry scholars with sections.',
    badge: 'Autonomous Registry',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  },
  {
    id: 'faculty_registry',
    name: 'Faculty Teaching & Research Registry',
    category: 'FACULTY',
    format: 'xlsx',
    status: 'ALL',
    description: 'Complete academic faculty roster, designations, department appointments, and credentials.',
    badge: 'Staff Registry',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  },
  {
    id: 'events_audit',
    name: 'Campus Events & Participant Telemetry',
    category: 'EVENTS',
    format: 'xlsx',
    status: 'ALL',
    description: 'Departmental symposiums, workshops, guest lectures, and student registration volume.',
    badge: 'Event Telemetry',
    badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  },
  {
    id: 'grievance_dossier',
    name: 'Grievance & Disciplinary Case Audit Dossier',
    category: 'INCIDENTS',
    format: 'html',
    status: 'ALL',
    description: 'Printable confidential audit dossier with official SREC letterhead and IQAC signature blocks.',
    badge: 'Confidential Audit',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  },
  {
    id: 'full_dump',
    name: 'Master Institutional Multi-Sheet Archive',
    category: 'COMPLETE_INSTITUTIONAL_DUMP',
    format: 'xlsx',
    status: 'ALL',
    description: 'Comprehensive Excel workbook containing dedicated sheets for all 5 institutional domains.',
    badge: 'Complete Archive',
    badgeColor: 'border-brand-500/30 text-brand-400 bg-brand-500/10',
  },
];

const DEFAULT_ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025', '2023-2024', '2022-2023'];

function AdminExportContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const initialCategory = (searchParams.get('category')?.toUpperCase() || 'ACHIEVEMENTS') as ExportCategory;
  const [category, setCategory] = useState<ExportCategory>(initialCategory);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [departmentId, setDepartmentId] = useState<string>(searchParams.get('departmentId') || 'ALL');
  const [academicYear, setAcademicYear] = useState<string>(searchParams.get('academicYear') || 'ALL');
  const [batch, setBatch] = useState<string>(searchParams.get('batch') || 'ALL');
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [timeline, setTimeline] = useState<string>(searchParams.get('timeline') || 'ALL');
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '');
  const [achievementCategoryId, setAchievementCategoryId] = useState<string>(
    searchParams.get('achievementCategoryId') || 'ALL'
  );
  const [level, setLevel] = useState<string>(searchParams.get('level') || 'ALL');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');

  const [departments, setDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type?: string }>>([]);
  const [batchOptions, setBatchOptions] = useState<SelectOption[]>(ACADEMIC_BATCH_OPTIONS);

  const [actorRole, setActorRole] = useState<string>((session?.user as any)?.role || 'WEB_MANAGER');
  const [scopedDepartment, setScopedDepartment] = useState<{ id: string; code: string; name: string } | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalCount: number;
    departmentName: string;
    academicYear: string;
    timelineLabel?: string;
    headers: string[];
    sample: Record<string, any>[];
  } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (role) setActorRole(role);
  }, [session?.user]);

  useEffect(() => {
    Promise.all([
      fetch('/api/departments?all=true').then((r) => (r.ok ? r.json() : { departments: [] })),
      fetch('/api/categories').then((r) => (r.ok ? r.json() : { categories: [] })),
      fetch('/api/batches').then((r) => (r.ok ? r.json() : { batches: [] })),
    ])
      .then(([deptRes, catRes, batchRes]) => {
        setDepartments(deptRes.departments || []);
        setCategories(catRes.categories || []);
        setBatchOptions(buildMergedBatchOptions(batchRes.batches || []));
      })
      .catch(() => null);
  }, []);

  const buildQueryParams = useCallback(
    (includePreview: boolean) => {
      const params = new URLSearchParams({
        category,
        format,
        departmentId,
        academicYear,
        batch,
        status,
        timeline,
        achievementCategoryId,
        level,
      });
      if (includePreview) params.set('preview', 'true');
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      return params;
    },
    [
      category,
      format,
      departmentId,
      academicYear,
      batch,
      status,
      timeline,
      dateFrom,
      dateTo,
      achievementCategoryId,
      level,
      searchTerm,
    ]
  );

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setExportError(null);
    try {
      const params = buildQueryParams(true);
      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to load data preview (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPreviewData(data);
      if (data.actorRole) setActorRole(data.actorRole);
      if (data.scopedDepartment !== undefined) setScopedDepartment(data.scopedDepartment);
    } catch (err: any) {
      setExportError(err?.message || 'Unable to load preview for current scope.');
    } finally {
      setPreviewLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  const applyPreset = (preset: CompliancePreset) => {
    setCategory(preset.category);
    setFormat(preset.format);
    setStatus(preset.status);
    setExportSuccess(null);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const params = buildQueryParams(false);
      const url = `/api/admin/export?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `SREC_${category}_${new Date().toISOString().split('T')[0]}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setExportSuccess(`Successfully generated and downloaded ${filename}`);
    } catch (err: any) {
      setExportError(err.message || 'An unexpected error occurred during export.');
    } finally {
      setIsExporting(false);
    }
  };

  const isGlobalScopeAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
  const canEditDropdownOptions = canManageCategories(actorRole);

  const allDomains: Array<{ value: ExportCategory; label: string }> = [
    { value: 'ACHIEVEMENTS', label: 'Achievements & Honors' },
    { value: 'EVENTS', label: 'Campus Events & Attendance' },
    { value: 'STUDENTS', label: 'Student Master Roster' },
    { value: 'FACULTY', label: 'Faculty & HOD Registry' },
    { value: 'INCIDENTS', label: 'Grievance & Disciplinary' },
    { value: 'COMPLETE_INSTITUTIONAL_DUMP', label: 'Full Master Dump (All Sheets)' },
  ];
  const availableDomains = allDomains.filter((d) => canExportCategory(actorRole, d.value));

  const visiblePresets = COMPLIANCE_PRESETS.filter((p) => canExportCategory(actorRole, p.category));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5" aria-label="Breadcrumb">
            <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">Institutional Export Center</span>
          </nav>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Institutional Data Export Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              NAAC &amp; NBA Certified
            </span>
            {!isGlobalScopeAdmin && scopedDepartment && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/30">
                <Lock className="w-3 h-3" />
                Dept Locked: {scopedDepartment.code}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-3xl">
            Filter achievements and institutional records by timeline period, category, batch, and verification status, then download in Excel (.xlsx), CSV, Printable PDF/HTML, or JSON.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button
            onClick={() => void fetchPreview()}
            variant="outline"
            size="sm"
            disabled={previewLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Preview</span>
          </Button>

          <Button
            onClick={() => void handleDownload()}
            disabled={isExporting}
            className="btn-primary text-xs flex items-center gap-2 shadow-lg shadow-primary/20 py-2 px-4"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating {format.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Dossier ({format.toUpperCase()})</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* IQAC & JNTUA 5A Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl glass-card border-[#CA8A04]/40 dark:border-[#FACC15]/40 text-xs flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold text-[#92400E] dark:text-[#FACC15] block">IQAC Compliance Notice</span>
            <span className="text-muted-foreground">
              Formatted for NAAC 5.3.1 / NBA 4.4 — pending SREC IQAC template sign-off
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-primary/30 text-xs flex items-start gap-2.5">
          <GraduationCap className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold text-primary block">JNTUA 5A Lateral Entry Verification</span>
            <span className="text-muted-foreground">
              Validated against standard JNTUA 5A rules — confirm legacy exceptions with SREC Academic Section
            </span>
          </div>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{exportSuccess}</span>
        </div>
      )}

      {exportError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs animate-in fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="font-medium">{exportError}</span>
        </div>
      )}

      {/* 1. Compliance Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Accreditation Compliance Presets (1-Click)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Click any card to auto-configure filters &amp; format
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visiblePresets.map((preset) => {
            const isSelected =
              category === preset.category &&
              format === preset.format &&
              (preset.status === 'ALL' || status === preset.status);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-md'
                    : 'bg-card/60 hover:bg-card border-border hover:border-border/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                      .{preset.format}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground leading-snug mb-1">{preset.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{preset.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Scope: {preset.category}</span>
                  <span className="text-primary font-semibold">Apply Preset &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Scope & Timeline Filter Controls */}
      <Card variant="bento">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-sm font-bold">Timeline &amp; Scope Controls</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {previewData?.timelineLabel ? `Active Period: ${previewData.timelineLabel}` : 'Select period & filters'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Domain */}
            <div>
              <label htmlFor="export-domain" className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                1. Data Domain
              </label>
              <select
                id="export-domain"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExportCategory)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {availableDomains.map((dom) => (
                  <option key={dom.value} value={dom.value}>
                    {dom.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="export-department" className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                2. Department Scope
              </label>
              {isGlobalScopeAdmin ? (
                <select
                  id="export-department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="ALL">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} — {dept.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {scopedDepartment ? `${scopedDepartment.code} — ${scopedDepartment.name}` : 'Department Locked'}
                  </span>
                </div>
              )}
            </div>

            {/* Time Period / Timeline Preset */}
            <div>
              <label htmlFor="export-timeline" className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                <span>3. Time Period / Timeline</span>
              </label>
              <select
                id="export-timeline"
                value={timeline}
                onChange={(e) => {
                  const next = e.target.value;
                  setTimeline(next);
                  if (next !== 'CUSTOM') {
                    setDateFrom('');
                    setDateTo('');
                  }
                }}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {(category === 'EVENTS' ? EVENT_TIMELINE_PRESETS : ACHIEVEMENT_TIMELINE_PRESETS).map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="export-status" className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                4. Verification Status
              </label>
              <select
                id="export-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="APPROVED">Approved / Awaiting HOD</option>
                <option value="UNDER_REVIEW">Under Faculty Review</option>
                <option value="SUBMITTED">Submitted / Pending</option>
                <option value="REJECTED">Rejected Submissions</option>
                <option value="ACTIVE">Active Records Only</option>
                <option value="INACTIVE">Inactive Records Only</option>
              </select>
            </div>

            {/* Category Dropdown with Add + Remove */}
            <div>
              <label htmlFor="export-ach-category" className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase flex items-center gap-1">
                <Award className="w-3 h-3 text-primary" />
                <span>5. Achievement / Event Category</span>
              </label>
              <CreatableSelect
                id="export-ach-category"
                value={achievementCategoryId === 'ALL' ? '' : achievementCategoryId}
                onChange={(val) => setAchievementCategoryId(val || 'ALL')}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="All Categories"
                customOptionLabel="+ Add Website Category..."
                customPlaceholder="Type category name..."
                onCreateCustom={
                  canEditDropdownOptions
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
                  canEditDropdownOptions
                    ? async (opt) => {
                        const ok = await removeCategoryOption(opt);
                        if (ok) {
                          setCategories((prev) => prev.filter((c) => c.id !== opt.value));
                          if (achievementCategoryId === opt.value) setAchievementCategoryId('ALL');
                        }
                        return ok;
                      }
                    : undefined
                }
              />
            </div>

            {/* Academic Year */}
            <div>
              <label htmlFor="export-ay" className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                6. Academic Year
              </label>
              <CreatableSelect
                id="export-ay"
                value={academicYear === 'ALL' ? '' : academicYear}
                onChange={(val) => setAcademicYear(val || 'ALL')}
                options={DEFAULT_ACADEMIC_YEARS.map((ay) => ({ value: ay, label: `AY ${ay}` }))}
                placeholder="All Academic Years"
                customOptionLabel="+ Custom Academic Year..."
                customPlaceholder="e.g. 2027-2028"
              />
            </div>

            {/* Batch */}
            <div>
              <label htmlFor="export-batch" className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                7. Graduation Batch
              </label>
              <CreatableSelect
                id="export-batch"
                value={batch === 'ALL' ? '' : batch}
                onChange={(val) => setBatch(val || 'ALL')}
                options={batchOptions}
                placeholder="All Batches"
                customOptionLabel="+ Custom Batch (Not listed)..."
                customPlaceholder="e.g. 2026-2030"
                onCreateCustom={async (name) => {
                  const created = await createCustomBatchOption(name);
                  if (created) {
                    setBatchOptions((prev) => buildMergedBatchOptions([...prev, created]));
                  }
                  return created;
                }}
                onRemoveOption={
                  canEditDropdownOptions
                    ? async (opt) => {
                        const ok = await removeBatchOption(opt.value);
                        if (ok) {
                          setBatchOptions((prev) => prev.filter((b) => b.value !== opt.value));
                          if (batch === opt.value) setBatch('ALL');
                        }
                        return ok;
                      }
                    : undefined
                }
              />
            </div>

            {/* Level / Search */}
            <div>
              <label htmlFor="export-search" className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                8. Level or Keyword
              </label>
              <div className="flex gap-1.5">
                <select
                  aria-label="Recognition Level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-1/2 text-xs rounded-xl bg-background border border-border px-2.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">All Levels</option>
                  <option value="INTERNATIONAL">International</option>
                  <option value="NATIONAL">National</option>
                  <option value="STATE">State</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="COLLEGE">College</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
                <input
                  id="export-search"
                  type="search"
                  placeholder="Roll / title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-1/2 text-xs rounded-xl bg-background border border-border px-2.5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Explicit Date Window when CUSTOM selected or typed */}
          {(timeline === 'CUSTOM' || dateFrom || dateTo) && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Custom Time Period:
              </span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setTimeline('CUSTOM');
                  }}
                  className="text-xs rounded-lg bg-background border border-border px-2.5 py-1.5 text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setTimeline('CUSTOM');
                  }}
                  className="text-xs rounded-lg bg-background border border-border px-2.5 py-1.5 text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </label>
            </div>
          )}

          {/* Format Selector Pills */}
          <div className="pt-3 border-t border-border/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-foreground">Select Output Format:</span>
              <div className="inline-flex flex-wrap rounded-xl bg-secondary/60 p-1 border border-border gap-1">
                <button
                  type="button"
                  onClick={() => setFormat('xlsx')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === 'xlsx'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === 'csv'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CSV with BOM (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('html')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === 'html'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Printable HTML / PDF (.html)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === 'json'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Structured JSON (.json)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {previewData && (
                <Badge variant="cyan" className="py-1 px-2.5 text-xs">
                  <strong>{previewData.totalCount}</strong>&nbsp;Records Ready
                </Badge>
              )}

              <Button
                onClick={() => void handleDownload()}
                disabled={isExporting}
                size="sm"
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Real-Time Data Preview Table */}
      <Card variant="bento">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm font-bold">Live Data Preview (Top 5 Rows)</CardTitle>
            </div>
            {previewData && (
              <span className="text-xs text-muted-foreground">
                Showing top sample rows of {previewData.totalCount} matching institutional records
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {previewLoading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Fetching synchronized institutional registry rows...</p>
            </div>
          ) : !previewData || previewData.sample.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-semibold text-foreground">No Records Found for the Selected Scope</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Try switching the timeline period, category, academic year, or verification status filters to expand the query boundary.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/70 sticky top-0 z-10 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5 whitespace-nowrap">#</th>
                    {previewData.headers.map((header) => (
                      <th key={header} className="px-3.5 py-2.5 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {previewData.sample.map((row, idx) => (
                    <tr key={idx} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">{idx + 1}</td>
                      {previewData.headers.map((header) => {
                        const val = row[header];
                        return (
                          <td
                            key={header}
                            className="px-3.5 py-2.5 whitespace-nowrap text-foreground max-w-[240px] truncate"
                            title={String(val ?? '')}
                          >
                            {val !== null && val !== undefined ? String(val) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminExportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading Institutional Export Center...
        </div>
      }
    >
      <AdminExportContent />
    </Suspense>
  );
}
