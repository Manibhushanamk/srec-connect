'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  Users,
  GraduationCap,
  Briefcase,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminBulkUploadPage() {
  const [importType, setImportType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Validation response
  const [validationResult, setValidationResult] = useState<{
    summary: { total: number; valid: number; invalid: number };
    validRows: any[];
    errorRows: Array<{ rowNumber: number; data: any; errors: string[] }>;
  } | null>(null);

  const [commitResult, setCommitResult] = useState<{
    success: boolean;
    message: string;
    insertedCount: number;
  } | null>(null);

  // 1. Download sample template
  const handleDownloadTemplate = () => {
    let csvContent = '';
    if (importType === 'STUDENT') {
      csvContent = 'rollNumber,name,email,department,batch,section\n' +
        '22091A3210,K. Rajesh,22091a3210@srecnandyal.edu.in,AIML,2022-2026,A\n' +
        '22091A3211,S. Anitha,22091a3211@srecnandyal.edu.in,AIML,2022-2026,A\n' +
        '22091A0512,V. Karthik,22091a0512@srecnandyal.edu.in,CSE,2022-2026,B\n';
    } else {
      csvContent = 'name,email,department,designation\n' +
        'Dr. P. Venkata Subbaiah,venkata.subbaiah@srecnandyal.edu.in,AIML,Professor\n' +
        'M. Lakshmi,lakshmi.m@srecnandyal.edu.in,CSE,Assistant Professor\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SREC_${importType}_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Two-Stage Bulk Provisioning Engine
            </h1>
            <Badge variant="cyan" size="sm">Phase 3</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Batch provision Students and Faculty using CSV / Excel with row-level validation and collision prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/users">
            <Button variant="secondary" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              <span>Back to Directory</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </Button>
        </div>
      </div>

      {/* Target Type Selector */}
      <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-muted/50 border border-border/80 w-fit">
        <button
          onClick={() => {
            setImportType('STUDENT');
            resetAll();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            importType === 'STUDENT'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Ingestion (Roll Numbers)</span>
        </button>

        <button
          onClick={() => {
            setImportType('FACULTY');
            resetAll();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            importType === 'FACULTY'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty & HOD Ingestion</span>
        </button>
      </div>

      {/* Dropzone */}
      {!commitResult && (
        <Card variant="glass" className="border-border/60 border-dashed">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base font-bold text-foreground">
                {file ? file.name : `Select or drag ${importType.toLowerCase()} CSV or Excel file`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: <span className="font-mono">.csv, .xlsx, .xls</span> (Max 5,000 rows per batch)
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
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm">
                  <Upload className="w-4 h-4" />
                  {file ? 'Replace File' : 'Browse Files'}
                </span>
              </label>

              {file && (
                <Button variant="secondary" onClick={resetAll} className="gap-2">
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
        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-2 animate-fade-in">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-sm font-semibold text-foreground">Validating records against institutional rules and Neon DB...</p>
        </div>
      )}

      {/* Stage 1 Results & Stage 2 Commit Box */}
      {validationResult && !commitResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="glass" className="border-border/60">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
                  {validationResult.summary.total}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Total Staged</p>
                  <p className="text-lg font-extrabold text-foreground">Records Parsed</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-lg">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold">Valid & Ready</p>
                  <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {validationResult.summary.valid} Rows
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className={validationResult.summary.invalid > 0 ? 'border-destructive/20 bg-destructive/5' : 'border-border/60'}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  validationResult.summary.invalid > 0 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Errors Detected</p>
                  <p className={`text-lg font-extrabold ${validationResult.summary.invalid > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {validationResult.summary.invalid} Rows
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Table if any */}
          {validationResult.errorRows.length > 0 && (
            <Card variant="glass" className="border-destructive/30">
              <CardHeader className="pb-3 border-b border-destructive/20 bg-destructive/5">
                <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Validation Failures ({validationResult.errorRows.length} rows excluded)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 font-bold text-muted-foreground">
                      <th className="py-2.5 px-4">Row #</th>
                      <th className="py-2.5 px-4">Record Identifier</th>
                      <th className="py-2.5 px-4">Detected Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {validationResult.errorRows.map((err) => (
                      <tr key={err.rowNumber} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                          Line {err.rowNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-foreground">{err.data.name || 'Unnamed'}</span>
                          <span className="block text-muted-foreground font-mono text-[11px]">{err.data.rollNumber || err.data.email}</span>
                        </td>
                        <td className="py-2.5 px-4 text-destructive">
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

          {/* Stage 2 Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl bg-card border border-border/80 shadow-md gap-4">
            <div>
              <p className="font-extrabold text-foreground text-base">
                Ready to Commit Stage 2 Batch
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {validationResult.summary.valid} records will be permanently provisioned in <code className="font-mono">v3_production</code>.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={isCommitting || validationResult.summary.valid === 0}
              onClick={handleCommit}
              className="gap-2 shadow-lg shadow-primary/25"
            >
              {isCommitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                Batch Successfully Committed!
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {commitResult.message}. All provisioned students can now sign in using their institutional email or permanent roll number.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Link href="/admin/users">
                <Button variant="primary" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span>View in User Directory</span>
                </Button>
              </Link>
              <Button variant="secondary" onClick={resetAll} className="gap-2">
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
