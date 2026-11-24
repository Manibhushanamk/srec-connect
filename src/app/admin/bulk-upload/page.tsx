'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminBulkUploadPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const actorRole = sessionUser?.role || 'STUDENT';
  const isSuperAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
  const isHOD = actorRole === 'HOD';
  const isWebManager = actorRole === 'WEB_MANAGER';
  const userDeptId = sessionUser?.departmentId;

  const [importType, setImportType] = useState<'STUDENT' | 'FACULTY' | 'WEB_MANAGER'>('STUDENT');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Validation response
  const [validationResult, setValidationResult] = useState<{
    summary: { total: number; valid: number; invalid: number };
    validRows: any[];
    errorRows: Array<{ rowNumber: number; data: any; errors: string[] }>;
    departmentScope?: { id: string; name: string; code: string } | null;
  } | null>(null);

  const [commitResult, setCommitResult] = useState<{
    success: boolean;
    message: string;
    insertedCount: number;
  } | null>(null);

  // Guess or retrieve department code from session or fallback
  const currentDeptCode = validationResult?.departmentScope?.code || 'AIML';

  // 1. Download sample template (CSV or Excel)
  const handleDownloadTemplate = (format: 'csv' | 'xlsx' = 'csv') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `SREC_${importType}_Import_Template`;

    if (importType === 'STUDENT') {
      headers = ['rollNumber', 'name', 'email', 'department', 'batch', 'section', 'phone'];
      rows = [
        {
          rollNumber: '22091A3201',
          name: 'K. Rajesh',
          email: '22091a3201@srecnandyal.edu.in',
          department: currentDeptCode,
          batch: '2024-2028',
          section: 'A',
          phone: '9876543210',
        },
        {
          rollNumber: '25X55A3306',
          name: 'Mani Bhushanam K',
          email: '25x55a3306@srecnandyal.edu.in',
          department: currentDeptCode,
          batch: '2024-2028',
          section: 'A',
          phone: '9876543211',
        },
        {
          rollNumber: '22091A3202',
          name: 'S. Anitha',
          email: '22091a3202@srecnandyal.edu.in',
          department: currentDeptCode,
          batch: '2024-2028',
          section: 'B',
          phone: '9876543212',
        },
      ];
    } else if (importType === 'FACULTY') {
      headers = ['name', 'email', 'department', 'designation', 'specialization', 'experience', 'degrees', 'cabin', 'phone'];
      rows = [
        {
          name: 'Dr. P. Venkata Subbaiah',
          email: 'venkata.subbaiah@srecnandyal.edu.in',
          department: currentDeptCode,
          designation: 'Professor',
          specialization: 'Artificial Intelligence & Machine Learning',
          experience: '15+ Years',
          degrees: 'M.Tech, Ph.D.',
          cabin: 'Cabin-304',
          phone: '9876543201',
        },
        {
          name: 'M. Lakshmi',
          email: 'lakshmi.m@srecnandyal.edu.in',
          department: currentDeptCode,
          designation: 'Assistant Professor',
          specialization: 'Deep Learning & Computer Vision',
          experience: '6+ Years',
          degrees: 'M.Tech',
          cabin: 'Cabin-201',
          phone: '9876543202',
        },
      ];
    } else {
      // WEB_MANAGER
      headers = ['name', 'email', 'department', 'phone'];
      rows = [
        {
          name: `${currentDeptCode} Web Administrator`,
          email: `${currentDeptCode.toLowerCase()}.web@srecnandyal.edu.in`,
          department: currentDeptCode,
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
    } else {
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, importType);
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  };

  // 2. Parse uploaded file
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

  // 3. Stage 1: Validate rows against backend rules and existing records
  const validateRows = async (rowsToValidate: any[]) => {
    if (rowsToValidate.length === 0) return;
    setIsValidating(true);

    try {
      const res = await fetch('/api/admin/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          rows: rowsToValidate,
          type: importType,
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
  };

  // 4. Stage 2: Transactionally Commit Staged Batch
  const handleCommit = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setIsCommitting(true);

    try {
      const res = await fetch('/api/admin/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          rows: validationResult.validRows,
          type: importType,
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Bulk Provisioning Engine
            </h1>
            <Badge variant="cyan" size="sm">RBAC Enforced</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Batch provision Students, Faculty, and Web Managers using CSV or Excel with department boundaries and collision prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/users">
            <Button variant="secondary" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              <span>Back to Directory</span>
            </Button>
          </Link>
          <div className="flex items-center gap-1 border border-slate-700 rounded-xl p-0.5 bg-slate-900">
            <Button variant="primary" size="sm" onClick={() => handleDownloadTemplate('csv')} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>CSV Template</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleDownloadTemplate('xlsx')} className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel (.xlsx)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Department Scoping Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Authority Scope</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {actorRole}
              </span>
            </div>
            <p className="text-xs text-white font-medium mt-0.5">
              {isSuperAdmin
                ? 'Global Sovereign Scope — You can provision users across all college departments.'
                : isHOD
                ? `Department Scope — Locked to your department. You can provision Web Managers, Faculty, and Students.`
                : `Department Scope — Locked to your department. You can provision Faculty and Students.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showGuide ? 'Hide Column Guide' : 'View Column Specifications'}</span>
        </button>
      </div>

      {/* Column Guide Accordion */}
      {showGuide && (
        <Card variant="glass" className="border-cyan-500/20 bg-cyan-500/5 animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Required & Optional Columns for {importType} Ingestion</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            {importType === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">rollNumber *</span>
                  <span className="block text-[11px] text-slate-400">SREC format (e.g. 22091A3201). Unique.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">name *</span>
                  <span className="block text-[11px] text-slate-400">Full student name.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">email *</span>
                  <span className="block text-[11px] text-slate-400">College institutional email. Unique.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">department</span>
                  <span className="block text-[11px] text-slate-400">Dept code (e.g. AIML, CSE). Auto-assigned for HOD.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">batch</span>
                  <span className="block text-[11px] text-slate-400">e.g. 2024-2028. For Diploma Lateral Entry (e.g. 25X55A... joining in 2025 into 2nd year), auto-maps to 2024-2028.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">section / phone</span>
                  <span className="block text-[11px] text-slate-400">Section (A, B) and optional 10-digit phone.</span>
                </div>
              </div>
            )}

            {importType === 'FACULTY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">name *</span>
                  <span className="block text-[11px] text-slate-400">Professor / Faculty name.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">email *</span>
                  <span className="block text-[11px] text-slate-400">Institutional email. Unique.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">designation</span>
                  <span className="block text-[11px] text-slate-400">Professor, Associate Professor, Assistant Professor.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">specialization</span>
                  <span className="block text-[11px] text-slate-400">Research or academic domain.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">degrees / experience</span>
                  <span className="block text-[11px] text-slate-400">e.g. M.Tech, Ph.D. / 10+ Years.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">cabin / phone</span>
                  <span className="block text-[11px] text-slate-400">Cabin number and contact phone.</span>
                </div>
              </div>
            )}

            {importType === 'WEB_MANAGER' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">name *</span>
                  <span className="block text-[11px] text-slate-400">Department Web Manager name.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">email *</span>
                  <span className="block text-[11px] text-slate-400">Official college email address.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-slate-300 font-bold">phone</span>
                  <span className="block text-[11px] text-slate-400">Optional 10-digit mobile contact.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Target Type Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => {
            setImportType('STUDENT');
            resetAll();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            importType === 'STUDENT'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Ingestion</span>
        </button>

        <button
          onClick={() => {
            setImportType('FACULTY');
            resetAll();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            importType === 'FACULTY'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty Ingestion</span>
        </button>

        {/* Web Manager tab: Visible to Super Admin and HOD */}
        {(isSuperAdmin || isHOD) && (
          <button
            onClick={() => {
              setImportType('WEB_MANAGER');
              resetAll();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              importType === 'WEB_MANAGER'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Web Manager Ingestion</span>
          </button>
        )}
      </div>

      {/* Dropzone */}
      {!commitResult && (
        <Card variant="glass" className="border-slate-800 border-dashed bg-slate-950/60">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base font-bold text-white">
                {file ? file.name : `Select or drag ${importType.toLowerCase().replace('_', ' ')} CSV or Excel file`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: <span className="font-mono text-cyan-400">.csv, .xlsx, .xls</span> (Max 1,000 rows per batch)
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
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-sm">
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

      {/* Validating indicator */}
      {isValidating && (
        <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-center space-y-2 animate-fade-in">
          <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-xs font-semibold text-white">Validating records against institutional RBAC and database...</p>
        </div>
      )}

      {/* Stage 1 Results & Stage 2 Commit Box */}
      {validationResult && !commitResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="glass" className="border-slate-800 bg-slate-950/60">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">
                  {validationResult.summary.total}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Total Staged</p>
                  <p className="text-lg font-extrabold text-white">Records Parsed</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-400 uppercase font-bold">Valid & Authorized</p>
                  <p className="text-lg font-extrabold text-emerald-300">
                    {validationResult.summary.valid} Rows
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              variant="glass"
              className={validationResult.summary.invalid > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-800 bg-slate-950/60'}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    validationResult.summary.invalid > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Validation Failures</p>
                  <p
                    className={`text-lg font-extrabold ${
                      validationResult.summary.invalid > 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {validationResult.summary.invalid} Rows
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Table if any */}
          {validationResult.errorRows.length > 0 && (
            <Card variant="glass" className="border-rose-500/30 bg-slate-950/80">
              <CardHeader className="pb-3 border-b border-rose-500/20 bg-rose-500/5">
                <CardTitle className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Validation Failures ({validationResult.errorRows.length} rows excluded)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold">
                      <th className="py-2.5 px-4">Row #</th>
                      <th className="py-2.5 px-4">Record Identifier</th>
                      <th className="py-2.5 px-4">Detected Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {validationResult.errorRows.map((err) => (
                      <tr key={err.rowNumber} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-white">
                          Line {err.rowNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-white">{err.data.name || 'Unnamed'}</span>
                          <span className="block text-slate-400 font-mono text-[11px]">
                            {err.data.rollNumber || err.data.email}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-rose-400">
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

          {/* Valid Rows Preview Table */}
          {validationResult.validRows.length > 0 && (
            <Card variant="glass" className="border-slate-800 bg-slate-950/80">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-xs font-bold text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Valid Records Preview ({validationResult.validRows.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Target Role: <span className="font-mono text-cyan-400 font-bold">{validationResult.validRows[0]?.role}</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold sticky top-0">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Identifier / Designation</th>
                      <th className="py-2 px-3">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {validationResult.validRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 text-white font-sans font-medium">{r.name}</td>
                        <td className="py-2 px-3 text-slate-300">{r.email}</td>
                        <td className="py-2 px-3 text-cyan-400">{r.rollNumber || r.designation || 'Web Manager'}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
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

          {/* Stage 2 Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md gap-4">
            <div>
              <p className="font-extrabold text-white text-base">
                Ready to Commit Stage 2 Batch
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {validationResult.summary.valid} records will be permanently provisioned into the database.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={isCommitting || validationResult.summary.valid === 0}
              onClick={handleCommit}
              className="gap-2 shadow-lg shadow-cyan-500/25"
            >
              {isCommitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Commit {validationResult.summary.valid} Valid Records</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Commit Success Result */}
      {commitResult && (
        <Card variant="glass" className="border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-emerald-300">
                Batch Successfully Ingested!
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                {commitResult.message}. All provisioned accounts can now sign in immediately using Google Workspace SSO.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Link href="/admin/users">
                <Button variant="primary" size="sm" className="gap-2 text-xs">
                  <Users className="w-4 h-4" />
                  <span>View in User Directory</span>
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={resetAll} className="gap-2 text-xs">
                <Upload className="w-4 h-4" />
                <span>Upload Another Batch</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
