'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type ExportCategory = 'STUDENTS' | 'FACULTY' | 'ACHIEVEMENTS' | 'INCIDENTS' | 'EVENTS';

export default function AdminExportPage() {
  const [activeCategory, setActiveCategory] = useState<ExportCategory>('STUDENTS');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const exportOptions = [
    {
      id: 'STUDENTS' as ExportCategory,
      title: 'Student Master Directory',
      description: 'Export all pre-provisioned and registered students with SREC roll numbers, batch, section, and email.',
      icon: GraduationCap,
      color: 'text-cyan-400',
      badge: 'Academic Records',
    },
    {
      id: 'FACULTY' as ExportCategory,
      title: 'Faculty & HOD Directory',
      description: 'Export teaching faculty records, designations, department assignments, and specializations.',
      icon: Briefcase,
      color: 'text-purple-400',
      badge: 'Staff Registry',
    },
    {
      id: 'ACHIEVEMENTS' as ExportCategory,
      title: 'Verified Honors & Achievements',
      description: 'Export all approved and published student achievements, rank, host institution, and verification timestamps.',
      icon: Award,
      color: 'text-emerald-400',
      badge: 'NAAC / NBA Audit',
    },
    {
      id: 'EVENTS' as ExportCategory,
      title: 'Events & Registration Logs',
      description: 'Export departmental events, seat capacity, organizer details, and attendee rosters.',
      icon: Calendar,
      color: 'text-amber-400',
      badge: 'Event Telemetry',
    },
    {
      id: 'INCIDENTS' as ExportCategory,
      title: 'Grievance & Disciplinary Audit',
      description: 'Export institutional case logs, category breakdown, resolution statuses, and official sanction dates.',
      icon: ShieldAlert,
      color: 'text-rose-400',
      badge: 'Confidential Audit',
    },
  ];

  const handleTriggerExport = async () => {
    setIsExporting(true);
    setDownloadSuccess(null);

    try {
      let endpoint = '';
      let filename = `SREC_${activeCategory}_${new Date().toISOString().split('T')[0]}`;

      if (activeCategory === 'STUDENTS') {
        endpoint = '/api/admin/users?role=STUDENT&limit=1000';
      } else if (activeCategory === 'FACULTY') {
        endpoint = '/api/admin/users?role=FACULTY&limit=1000';
      } else if (activeCategory === 'ACHIEVEMENTS') {
        endpoint = '/api/admin/achievements?status=ALL';
      } else if (activeCategory === 'EVENTS') {
        endpoint = '/api/events?status=ALL';
      } else if (activeCategory === 'INCIDENTS') {
        endpoint = '/api/incidents?status=ALL';
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      let exportContent = '';
      let mimeType = 'text/csv;charset=utf-8;';

      if (format === 'json') {
        exportContent = JSON.stringify(data, null, 2);
        mimeType = 'application/json;charset=utf-8;';
        filename += '.json';
      } else {
        filename += '.csv';
        // Build CSV string based on category
        if (activeCategory === 'STUDENTS' || activeCategory === 'FACULTY') {
          const users = data.users || [];
          const headers = ['User ID', 'Name', 'Email', 'Role', 'Roll Number', 'Department', 'Designation', 'Status'];
          const rows = users.map((u: any) => [
            `"${u.id}"`,
            `"${u.name}"`,
            `"${u.email}"`,
            `"${u.role}"`,
            `"${u.student?.rollNumber || ''}"`,
            `"${u.department?.code || ''}"`,
            `"${u.faculty?.designation || ''}"`,
            `"${u.status}"`,
          ]);
          exportContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
        } else if (activeCategory === 'ACHIEVEMENTS') {
          const achs = data.achievements || [];
          const headers = ['ID', 'Title', 'Recipient', 'Roll Number', 'Department', 'Category', 'Level', 'Status', 'Date'];
          const rows = achs.map((a: any) => [
            `"${a.id}"`,
            `"${a.title.replace(/"/g, '""')}"`,
            `"${a.personName}"`,
            `"${a.primaryStudentRoll || ''}"`,
            `"${a.department?.code || ''}"`,
            `"${a.category?.name || ''}"`,
            `"${a.level}"`,
            `"${a.status}"`,
            `"${a.achievementDate}"`,
          ]);
          exportContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
        } else if (activeCategory === 'EVENTS') {
          const evts = data.events || [];
          const headers = ['ID', 'Title', 'Venue', 'Organizer', 'Capacity', 'Start Date', 'End Date', 'Status'];
          const rows = evts.map((e: any) => [
            `"${e.id}"`,
            `"${e.title.replace(/"/g, '""')}"`,
            `"${e.venue}"`,
            `"${e.organizer}"`,
            `"${e.capacity}"`,
            `"${e.startDate}"`,
            `"${e.endDate}"`,
            `"${e.status}"`,
          ]);
          exportContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
        } else {
          const incs = data.incidents || [];
          const headers = ['ID', 'Title', 'Student Roll', 'Reporter', 'Category', 'Priority', 'Status', 'Created At'];
          const rows = incs.map((i: any) => [
            `"${i.id}"`,
            `"${i.title.replace(/"/g, '""')}"`,
            `"${i.student?.rollNumber || ''}"`,
            `"${i.reporter?.name || ''}"`,
            `"${i.category}"`,
            `"${i.priority}"`,
            `"${i.status}"`,
            `"${i.createdAt}"`,
          ]);
          exportContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
        }
      }

      // Trigger instant browser download
      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(`Successfully compiled and exported ${filename}`);
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Institutional Data Export Center
            </h1>
            <Badge variant="emerald" size="sm">Audit Ready</Badge>
          </div>
          <p className="mt-1 text-slate-400 text-xs sm:text-sm pl-7">
            Generate authenticated CSV / JSON compliance dumps for NAAC, NBA, and college management records.
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportOptions.map((opt) => {
          const isSelected = activeCategory === opt.id;
          return (
            <Card
              key={opt.id}
              variant="bento"
              onClick={() => setActiveCategory(opt.id)}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-500/80 bg-space-800/80 shadow-lg shadow-brand-500/10'
                  : 'hover:border-slate-700 bg-space-900/60'
              }`}
            >
              <CardContent className="p-5 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-space-800 flex items-center justify-center ${opt.color}`}>
                      <opt.icon className="w-5 h-5" />
                    </div>
                    <Badge variant="slate" size="sm">{opt.badge}</Badge>
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{opt.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-brand-400' : 'text-slate-500'}`}>
                    {isSelected ? '✓ Selected for Dump' : 'Click to Select'}
                  </span>
                  <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-brand-500 border-brand-400' : 'border-slate-700'}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Action Card */}
      <Card variant="glass" className="border-border/60">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Configure File Format & Encoding
            </h4>
            <p className="text-xs text-slate-400">
              Universal UTF-8 CSV is recommended for Microsoft Excel, Google Sheets, and institutional databases.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  format === 'csv' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                CSV (Excel)
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  format === 'json' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw JSON
              </button>
            </div>

            <Button
              variant="primary"
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isExporting ? 'Generating Dump...' : `Download ${activeCategory} Export`}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
