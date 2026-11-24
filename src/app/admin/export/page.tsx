'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Download,
  FileSpreadsheet,
  Users,
  Award,
  Calendar,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  CheckCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  FileText,
  Filter,
  Eye,
  Building2,
  Sparkles,
  Shield,
  Layers,
  Printer,
  Code,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type ExportCategory = 'ACHIEVEMENTS' | 'STUDENTS' | 'FACULTY' | 'EVENTS' | 'INCIDENTS' | 'COMPLETE_INSTITUTIONAL_DUMP';
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
    status: 'APPROVED',
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

const DEPARTMENTS = [
  { id: 'ALL', code: 'ALL', name: 'All 11 Departments' },
  { id: 'cmw79c2jf004eikd6mwiabfvk', code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
  { id: '11b25ee5-996a-4b3d-a8f1-729a22cd42a5', code: 'CSE', name: 'Computer Science & Engineering' },
  { id: '48de801a-ac4d-4bea-9807-9048bd8983c4', code: 'CSD', name: 'Data Science' },
  { id: '57a5b9a5-1ed3-43cd-b4a3-4f5cb6b70677', code: 'CSG', name: 'Computer Science & Design' },
  { id: '31cb91f6-249d-412c-9f9c-953c9a08a696', code: 'ECE', name: 'Electronics & Communication Engineering' },
  { id: 'f4841dd5-ef2e-4b7f-beb9-88673e3a32df', code: 'EEE', name: 'Electrical & Electronics Engineering' },
  { id: '06cf3157-321f-4ffe-a302-08df53c593fb', code: 'CIVIL', name: 'Civil Engineering' },
  { id: 'c0b02b9d-074d-495b-889e-dc3b70c126a9', code: 'MECH', name: 'Mechanical Engineering' },
  { id: '6da0ac6c-a2f0-4879-893d-d224eec8cb20', code: 'MBA', name: 'Master of Business Administration' },
  { id: '2bc9b2c1-f714-45b3-abab-c9ca707fad2e', code: 'MCA', name: 'Master of Computer Applications' },
  { id: 'f98eed0a-bc73-4ff8-b71f-153635863082', code: 'BSH', name: 'Basic Sciences & Humanities' },
];

const ACADEMIC_YEARS = ['ALL', '2026-2027', '2025-2026', '2024-2025', '2023-2024', '2022-2023'];
const BATCHES = ['ALL', '2025-2029', '2024-2028', '2023-2027', '2022-2026', '2021-2025'];

export default function AdminExportPage() {
  const [category, setCategory] = useState<ExportCategory>('ACHIEVEMENTS');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [academicYear, setAcademicYear] = useState<string>('ALL');
  const [batch, setBatch] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalCount: number;
    departmentName: string;
    academicYear: string;
    headers: string[];
    sample: Record<string, any>[];
  } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Fetch live preview whenever filters change
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setExportError(null);
    try {
      const params = new URLSearchParams({
        category,
        format,
        preview: 'true',
        departmentId,
        academicYear,
        batch,
        status,
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      });

      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load data preview (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPreviewData(data);
    } catch (err: any) {
      console.warn('[Export Preview Warning]:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [category, format, departmentId, academicYear, batch, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Apply a Compliance Preset
  const applyPreset = (preset: CompliancePreset) => {
    setCategory(preset.category);
    setFormat(preset.format);
    setStatus(preset.status);
    setExportSuccess(null);
  };

  // Trigger File Download
  const handleDownload = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const params = new URLSearchParams({
        category,
        format,
        departmentId,
        academicYear,
        batch,
        status,
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      });

      const url = `/api/admin/export?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Export failed with status ${res.status}`);
      }

      // Handle download stream
      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `SREC_${category}_${new Date().toISOString().split('T')[0]}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
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

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5" aria-label="Breadcrumb">
            <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Executive Command Center</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-medium">Institutional Export Center</span>
          </nav>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Institutional Data Export Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              NAAC & NBA Certified
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-3xl">
            Autonomous academic registry, accreditation dossier generator & multi-format data export engine.
            All reports feature SREC official header, IQAC compliance verification, and UTF-8 formatting.
          </p>
        </div>

        {/* Primary Download Trigger in Top Header */}
        <div className="shrink-0 flex items-center gap-2">
          <Button
            onClick={fetchPreview}
            variant="outline"
            size="sm"
            disabled={previewLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Preview</span>
          </Button>

          <Button
            onClick={handleDownload}
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

      {/* Notifications */}
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

      {/* 1. Quick Compliance Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Accreditation Compliance Presets (1-Click)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Click any card to auto-configure filters & format
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {COMPLIANCE_PRESETS.map((preset) => {
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
                  <h3 className="text-xs font-bold text-foreground leading-snug mb-1">
                    {preset.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
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

      {/* 2. Interactive Filter Configuration Grid */}
      <Card variant="bento">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-sm font-bold">Interactive Scope & Filter Controls</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              Configure parameters to tailor the institutional export
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                1. Data Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExportCategory)}
                className="w-full text-xs rounded-xl bg-secondary/60 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="ACHIEVEMENTS">🏆 Verified Achievements</option>
                <option value="STUDENTS">🎓 Student Master Roster</option>
                <option value="FACULTY">💼 Faculty & HOD Registry</option>
                <option value="EVENTS">📅 Campus Events & Registrations</option>
                <option value="INCIDENTS">🛡️ Grievance & Disciplinary</option>
                <option value="COMPLETE_INSTITUTIONAL_DUMP">📦 Full Master Dump (All Sheets)</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                2. Department Scope
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs rounded-xl bg-secondary/60 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code === 'ALL' ? '🏛️ All 11 Departments' : `${dept.code} — ${dept.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                3. Verification Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs rounded-xl bg-secondary/60 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved / Published Only</option>
                <option value="PENDING">Pending Verification Only</option>
                <option value="REJECTED">Rejected Submissions</option>
                <option value="ACTIVE">Active Records Only</option>
                <option value="INACTIVE">Inactive Records Only</option>
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                4. Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs rounded-xl bg-secondary/60 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {ACADEMIC_YEARS.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay === 'ALL' ? 'All Academic Years' : `AY ${ay}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch (for students) */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                5. Graduation Batch
              </label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full text-xs rounded-xl bg-secondary/60 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b === 'ALL' ? 'All Batches' : `Batch ${b}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Quick Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase">
                6. Date Window
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full text-[11px] rounded-lg bg-secondary/60 border border-border px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  title="Date From"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full text-[11px] rounded-lg bg-secondary/60 border border-border px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  title="Date To"
                />
              </div>
            </div>
          </div>

          {/* Format Selector Pills */}
          <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Select Output Format:</span>
              <div className="inline-flex rounded-xl bg-secondary/60 p-1 border border-border">
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
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="cyan" className="py-1 px-2.5">
                    <strong>{previewData.totalCount}</strong>&nbsp;Records Ready
                  </Badge>
                </div>
              )}

              <Button
                onClick={handleDownload}
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
              <CardTitle className="text-sm font-bold">
                Live Data Preview (Top 5 Rows)
              </CardTitle>
            </div>
            {previewData && (
              <span className="text-xs text-muted-foreground">
                Showing top sample rows of {previewData.totalCount} total verified institutional records
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
                Try switching the department, academic year, or verification status filters to expand the query boundary.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
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
                    <tr
                      key={idx}
                      className="hover:bg-secondary/40 transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">
                        {idx + 1}
                      </td>
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
