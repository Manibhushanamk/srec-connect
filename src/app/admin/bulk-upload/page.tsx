'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Download,
  Users,
  GraduationCap,
  Briefcase,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building2,
  HelpCircle,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DeptOption {
  id: string;
  code: string;
  name: string;
}

export default function AdminBulkUploadPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const actorRole = sessionUser?.role || 'STUDENT';
  const isSuperAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
  const isHOD = actorRole === 'HOD';
  const isWebManager = actorRole === 'WEB_MANAGER';

  const [importType, setImportType] = useState<'STUDENT' | 'FACULTY' | 'WEB_MANAGER'>('STUDENT');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [progress, setProgress] = useState(0);

  // Scope loaded directly from server
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');
  const [departmentScope, setDepartmentScope] = useState<DeptOption | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<Array<'STUDENT' | 'FACULTY' | 'WEB_MANAGER'>>([
    'STUDENT',
    'FACULTY',
  ]);

  const [validationResult, setValidationResult] = useState<{
    summary: { total: number; valid: number; invalid: number };
    validRows: any[];
    errorRows: Array<{ rowNumber: number; data: any; errors: string[] }>;
    departmentScope?: DeptOption | null;
  } | null>(null);

  const [commitResult, setCommitResult] = useState<{
    success: boolean;
    message: string;
    insertedCount: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/users/bulk-import')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        if (Array.isArray(data.departments)) setDepartments(data.departments);
        if (data.departmentScope) {
          setDepartmentScope(data.departmentScope);
          setTargetDepartmentId(data.departmentScope.id);
        } else if (Array.isArray(data.departments) && data.departments.length > 0) {
          const aiml = data.departments.find((d: DeptOption) => d.code.toUpperCase() === 'AIML') || data.departments[0];
          setTargetDepartmentId(aiml.id);
        }
        if (Array.isArray(data.allowedImportTypes) && data.allowedImportTypes.length > 0) {
          setAllowedTypes(data.allowedImportTypes);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const activeDept =
    departments.find((d) => d.id === targetDepartmentId) ||
    validationResult?.departmentScope ||
    departmentScope;
  const currentDeptCode = activeDept?.code || 'DEPT';

  // 1. Download department-free CSV or Excel template (scoped to uploader's department)
  const handleDownloadTemplate = (format: 'csv' | 'xlsx' = 'csv') => {
    let headers: string[] = [];
    let rows: any[] = [];
    const filename = `SREC_${currentDeptCode}_${importType}_Template`;

    if (importType === 'STUDENT') {
      headers = ['rollNumber', 'name', 'email', 'batch', 'section', 'phone'];
      rows = [
        {
          rollNumber: '22091A3201',
          name: 'K. Rajesh',
          email: '22091a3201@srecnandyal.edu.in',
          batch: '2022-2026',
          section: 'A',
          phone: '9876543210',
        },
        {
          rollNumber: '25X55A3306',
          name: 'Mani Bhushanam K',
          email: '25x55a3306@srecnandyal.edu.in',
          batch: '2024-2028',
          section: 'A',
          phone: '9876543211',
        },
        {
          rollNumber: '26091A3201',
          name: 'S. Anitha',
          email: '26091a3201@srecnandyal.edu.in',
          batch: '2026-2030',
          section: 'B',
          phone: '9876543212',
        },
      ];
    } else if (importType === 'FACULTY') {
      headers = ['name', 'email', 'designation', 'roleCategory', 'specialization', 'experience', 'degrees', 'cabin', 'phone'];
      rows = [
        {
          name: 'Dr. P. Venkata Subbaiah',
          email: 'venkata.subbaiah@srecnandyal.edu.in',
          designation: 'Professor',
          roleCategory: 'PROFESSOR',
          specialization: 'Artificial Intelligence & Machine Learning',
          experience: '15+ Years',
          degrees: 'M.Tech, Ph.D.',
          cabin: 'Cabin-304',
          phone: '9876543201',
        },
        {
          name: 'M. Lakshmi',
          email: 'lakshmi.m@srecnandyal.edu.in',
          designation: 'Assistant Professor',
          roleCategory: 'ASSISTANT_PROFESSOR',
          specialization: 'Deep Learning & Computer Vision',
          experience: '6+ Years',
          degrees: 'M.Tech',
          cabin: 'Cabin-201',
          phone: '9876543202',
        },
      ];
    } else {
      headers = ['name', 'email', 'phone'];
      rows = [
        {
          name: `${currentDeptCode} Web Administrator`,
          email: `${currentDeptCode.toLowerCase()}.web@srecnandyal.edu.in`,
          phone: '9876543203',
        },
      ];
    }

    if (format === 'csv') {
      const csvStr = Papa.unparse(rows, { columns: headers });
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, importType);
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  };

  // 2. Parse uploaded CSV / Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationResult(null);
    setCommitResult(null);

    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedRows(results.data);
          validateRows(results.data);
        },
        error: (err) => {
          console.error('CSV parse error:', err);
        },
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setParsedRows(data);
        validateRows(data);
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const runWithProgress = (callback: () => Promise<void>) => {
    setProgress(0);
    let current = 0;
    const timer = setInterval(() => {
      current += Math.random() * 12 + 3;
      if (current > 90) current = 90;
      setProgress(Math.round(current));
    }, 200);
    return callback().finally(() => {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => setProgress(0), 400);
    });
  };

  // 3. Stage 1: Validate rows
  const validateRows = async (rowsToValidate: any[]) => {
    if (rowsToValidate.length === 0) return;
    setIsValidating(true);

    await runWithProgress(async () => {
      try {
        const res = await fetch('/api/admin/users/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'validate',
            rows: rowsToValidate,
            type: importType,
            targetDepartmentId: isSuperAdmin ? targetDepartmentId || undefined : undefined,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setValidationResult(data);
        } else {
          alert(data.error || 'Validation failed');
        }
      } catch (err) {
        console.error('Validation request failed', err);
      } finally {
        setIsValidating(false);
      }
    });
  };

  // 4. Stage 2: Transactionally commit validated batch
  const handleCommit = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setIsCommitting(true);

    await runWithProgress(async () => {
      try {
        const res = await fetch('/api/admin/users/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'commit',
            rows: validationResult.validRows,
            type: importType,
            targetDepartmentId: isSuperAdmin ? targetDepartmentId || undefined : undefined,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setCommitResult(data);
        } else {
          alert(data.error || 'Commit failed');
        }
      } catch (err) {
        console.error('Commit request failed', err);
      } finally {
        setIsCommitting(false);
      }
    });
  };

  const resetAll = () => {
    setFile(null);
    setParsedRows([]);
    setValidationResult(null);
    setCommitResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Department Bulk Ingestion
            </h1>
            <Badge variant="brand" size="sm">Auto-Scoped</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Department-isolated CSV/Excel provisioning without needing a department column — accounts automatically bind to{' '}
            <span className="font-semibold text-foreground">{activeDept?.name || 'your assigned department'}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={isWebManager ? '/admin' : '/admin/users'}>
            <Button variant="secondary" size="sm" className="gap-2">
              {isWebManager ? <LayoutDashboard className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              <span>{isWebManager ? 'Command Center' : 'User Directory'}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-1 border border-border rounded-xl p-0.5 glass-card">
            <Button variant="primary" size="sm" onClick={() => handleDownloadTemplate('csv')} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>CSV Template</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleDownloadTemplate('xlsx')} className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel (.xlsx)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Department Scoping Banner */}
      <div className="p-4 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department Lock</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                {actorRole} • {currentDeptCode}
              </span>
            </div>
            <p className="text-xs text-foreground font-medium mt-0.5">
              {isSuperAdmin
                ? 'Choose target academic department below; all rows assign automatically without needing a CSV department column.'
                : isHOD
                ? `Locked strictly to ${activeDept?.name || 'your department'}. You can provision Students, Faculty, and Web Managers.`
                : `Locked strictly to ${activeDept?.name || 'your department'}. You can provision Students and Faculty only.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isSuperAdmin && departments.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="bulk-target-dept" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Target Dept:
              </label>
              <select
                id="bulk-target-dept"
                value={targetDepartmentId}
                onChange={(e) => {
                  setTargetDepartmentId(e.target.value);
                  if (parsedRows.length > 0) validateRows(parsedRows);
                }}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-primary hover:underline flex items-center gap-1.5 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showGuide ? 'Hide Column Guide' : 'View Column Guide'}</span>
          </button>
        </div>
      </div>

      {/* Column Guide Accordion (No Department column required) */}
      {showGuide && (
        <Card variant="glass" className="border-primary/25 animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Template Columns for {importType} ({currentDeptCode} auto-bound)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            {importType === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-primary font-bold">rollNumber *</span>
                  <span className="block text-[11px] text-muted-foreground">SREC/JNTUA ID (e.g. 22091A3201 or 25X55A3306).</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-primary font-bold">name *</span>
                  <span className="block text-[11px] text-muted-foreground">Full student name.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-primary font-bold">email *</span>
                  <span className="block text-[11px] text-muted-foreground">Unique college institutional email.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-foreground font-bold">batch</span>
                  <span className="block text-[11px] text-muted-foreground">Any cohort (e.g. 2024-2028, 2026-2030). Custom batches auto-register.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-foreground font-bold">section / phone</span>
                  <span className="block text-[11px] text-muted-foreground">Section (A, B, or custom) &amp; optional phone.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Department Auto-Bound</span>
                  <span className="block text-[11px] text-muted-foreground">Removed from template; auto-assigned to {currentDeptCode}.</span>
                </div>
              </div>
            )}

            {importType === 'FACULTY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-primary font-bold">name * / email *</span>
                  <span className="block text-[11px] text-muted-foreground">Faculty full name and unique college email.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-foreground font-bold">designation / roleCategory</span>
                  <span className="block text-[11px] text-muted-foreground">Professor, Associate Professor, Assistant Professor, or custom.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-foreground font-bold">specialization / degrees / experience / cabin / phone</span>
                  <span className="block text-[11px] text-muted-foreground">Auto-bound to {currentDeptCode}.</span>
                </div>
              </div>
            )}

            {importType === 'WEB_MANAGER' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-primary font-bold">name *</span>
                  <span className="block text-[11px] text-muted-foreground">Department Web Manager name.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-primary font-bold">email *</span>
                  <span className="block text-[11px] text-muted-foreground">Official college email address.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="font-mono text-foreground font-bold">phone</span>
                  <span className="block text-[11px] text-muted-foreground">Optional contact phone ({currentDeptCode} auto-bound).</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Target Type Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 glass-card w-fit">
        {allowedTypes.includes('STUDENT') && (
          <button
            type="button"
            onClick={() => {
              setImportType('STUDENT');
              resetAll();
            }}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'STUDENT'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Ingestion</span>
          </button>
        )}

        {allowedTypes.includes('FACULTY') && (
          <button
            type="button"
            onClick={() => {
              setImportType('FACULTY');
              resetAll();
            }}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'FACULTY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Faculty Ingestion</span>
          </button>
        )}

        {allowedTypes.includes('WEB_MANAGER') && (isSuperAdmin || isHOD) && (
          <button
            type="button"
            onClick={() => {
              setImportType('WEB_MANAGER');
              resetAll();
            }}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'WEB_MANAGER'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Web Manager Ingestion</span>
          </button>
        )}
      </div>

      {/* Dropzone */}
      {!commitResult && (
        <Card variant="glass" className="border-dashed border-2 border-border">
          <CardContent className="p-6 sm:p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <p className="text-base font-bold text-foreground">
                {file ? file.name : `Select ${importType.toLowerCase().replace('_', ' ')} CSV or Excel file`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: <span className="font-mono text-primary font-semibold">.csv, .xlsx, .xls</span> (Max 1,000 rows • Department column not needed)
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm">
                  <Upload className="w-4 h-4" />
                  {file ? 'Replace File' : 'Browse Files'}
                </span>
              </label>

              {file && (
                <Button variant="secondary" size="sm" onClick={resetAll} className="gap-2 text-xs">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validating progress bar */}
      {isValidating && (
        <div className="p-3 glass-card space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-foreground">Validating records against indexed DB...</p>
            <span className="text-[11px] font-mono text-primary font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Stage 1 Results & Stage 2 Commit Box */}
      {validationResult && !commitResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 glass-card">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                {validationResult.summary.total}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Total</p>
                <p className="text-sm font-bold text-foreground leading-tight">Parsed</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold leading-none">Valid</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300 leading-tight">{validationResult.summary.valid} Rows</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${validationResult.summary.invalid > 0 ? 'bg-rose-500/10 border-rose-500/25' : 'glass-card'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${validationResult.summary.invalid > 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-secondary text-muted-foreground'}`}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none">Errors</p>
                <p className={`text-sm font-bold leading-tight ${validationResult.summary.invalid > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>{validationResult.summary.invalid} Rows</p>
              </div>
            </div>
          </div>

          {validationResult.errorRows.length > 0 && (
            <Card variant="glass" className="border-rose-500/30">
              <CardHeader className="pb-3 border-b border-rose-500/20 bg-rose-500/5">
                <CardTitle className="text-xs font-bold text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Validation Failures ({validationResult.errorRows.length} rows excluded)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 text-muted-foreground font-bold">
                      <th className="py-2.5 px-4">Row #</th>
                      <th className="py-2.5 px-4">Record Identifier</th>
                      <th className="py-2.5 px-4">Detected Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {validationResult.errorRows.map((err) => (
                      <tr key={err.rowNumber}>
                        <td className="py-2.5 px-4 font-mono font-bold text-foreground">Line {err.rowNumber}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-foreground">{err.data.name || 'Unnamed'}</span>
                          <span className="block text-muted-foreground font-mono text-[11px]">
                            {err.data.rollNumber || err.data.email}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-rose-500">
                          <ul className="list-disc list-inside space-y-0.5">
                            {err.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {validationResult.validRows.length > 0 && (
            <Card variant="glass">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-xs font-bold text-foreground flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Valid Records Preview ({validationResult.validRows.length})</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Auto-bound Dept:{' '}
                    <span className="font-mono text-primary font-bold">{validationResult.validRows[0]?.deptCode}</span>
                    {' • '}Role: <span className="font-mono font-bold">{validationResult.validRows[0]?.role}</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 text-muted-foreground font-bold sticky top-0">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Identifier / Designation</th>
                      <th className="py-2 px-3">Batch / Dept</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {validationResult.validRows.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 px-3 text-foreground font-sans font-medium">{r.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.email}</td>
                        <td className="py-2 px-3 text-primary">{r.rollNumber || r.designation || 'Web Manager'}</td>
                        <td className="py-2 px-3 text-foreground">
                          {r.role === 'STUDENT' ? `${r.batch} • ` : ''}
                          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 text-[10px]">
                            {r.deptCode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="p-4 glass-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-bold text-foreground text-sm">Ready to Commit into {currentDeptCode}</p>
                <p className="text-[11px] text-muted-foreground">
                  {validationResult.summary.valid} records will be transactionally provisioned via batched SQL.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={isCommitting || validationResult.summary.valid === 0}
                onClick={handleCommit}
                className="gap-2"
              >
                {isCommitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Commit {validationResult.summary.valid} Records</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Commit Success Result */}
      {commitResult && (
        <div className="p-6 glass-card border-emerald-500/30 text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-emerald-500">Batch Successfully Ingested!</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md mx-auto">
              {commitResult.message} All provisioned accounts can sign in via Google Workspace SSO.
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <Link href={isWebManager ? '/students' : '/admin/users'}>
              <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{isWebManager ? 'View Student Directory' : 'View Directory'}</span>
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={resetAll} className="gap-1.5 text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Another</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
