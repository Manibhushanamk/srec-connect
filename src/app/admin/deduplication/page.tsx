'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Search,
  Users,
  ShieldCheck,
  Award,
  ArrowLeft,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DuplicateScanResult {
  scanCompletedAt: string;
  duplicateEmails: Array<{ email: string; count: number; names: string[] }>;
  duplicateRolls: Array<{ rollNumber: string; count: number; users: Array<{ id: string; name: string; email: string }> }>;
  duplicateAchievements: Array<{ title: string; count: number; recipient: string }>;
}

export default function AdminDeduplicationPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<DuplicateScanResult | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'ROLL' | 'EMAIL' | 'HONOR'>('ALL');

  const runScan = async () => {
    setIsScanning(true);
    try {
      // Fetch users and achievements to detect client/server collisions
      const [usersRes, achsRes] = await Promise.all([
        fetch('/api/admin/users?limit=1000'),
        fetch('/api/admin/achievements?status=ALL'),
      ]);

      const usersData = await usersRes.json();
      const achsData = await achsRes.json();

      const users: any[] = usersData.users || [];
      const achs: any[] = achsData.achievements || [];

      // 1. Scan for email duplicates
      const emailMap = new Map<string, string[]>();
      users.forEach((u) => {
        const e = u.email?.toLowerCase().trim();
        if (e) {
          if (!emailMap.has(e)) emailMap.set(e, []);
          emailMap.get(e)!.push(u.name);
        }
      });
      const duplicateEmails = Array.from(emailMap.entries())
        .filter(([_, names]) => names.length > 1)
        .map(([email, names]) => ({ email, count: names.length, names }));

      // 2. Scan for roll number duplicates
      const rollMap = new Map<string, Array<{ id: string; name: string; email: string }>>();
      users.forEach((u) => {
        const r = u.student?.rollNumber?.toUpperCase().trim();
        if (r) {
          if (!rollMap.has(r)) rollMap.set(r, []);
          rollMap.get(r)!.push({ id: u.id, name: u.name, email: u.email });
        }
      });
      const duplicateRolls = Array.from(rollMap.entries())
        .filter(([_, list]) => list.length > 1)
        .map(([rollNumber, list]) => ({ rollNumber, count: list.length, users: list }));

      // 3. Scan for achievement duplicate submissions
      const titleMap = new Map<string, { count: number; recipient: string }>();
      achs.forEach((a) => {
        const key = `${a.title?.toLowerCase().trim()}:::${(a.personName || a.primaryStudentRoll || '').toLowerCase().trim()}`;
        if (!titleMap.has(key)) {
          titleMap.set(key, { count: 1, recipient: a.personName || a.primaryStudentRoll || '' });
        } else {
          titleMap.get(key)!.count += 1;
        }
      });
      const duplicateAchievements = Array.from(titleMap.entries())
        .filter(([_, v]) => v.count > 1)
        .map(([k, v]) => ({ title: k.split(':::')[0], count: v.count, recipient: v.recipient }));

      setResults({
        scanCompletedAt: new Date().toLocaleTimeString(),
        duplicateEmails,
        duplicateRolls,
        duplicateAchievements,
      });
    } catch (err) {
      console.error('Scan error', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const totalCollisions =
    (results?.duplicateEmails.length || 0) +
    (results?.duplicateRolls.length || 0) +
    (results?.duplicateAchievements.length || 0);

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
              Data Collision Radar & Deduplication
            </h1>
            <Badge variant="rose" size="sm">Integrity Scanner</Badge>
          </div>
          <p className="mt-1 text-slate-400 text-xs sm:text-sm pl-7">
            Identify and remediate duplicate student enrollments, conflicting SREC roll numbers, and redundant submissions.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={runScan}
          disabled={isScanning}
          className="gap-2 self-start sm:self-auto"
        >
          {isScanning ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <RotateCcw className="w-4 h-4" />}
          <span>{isScanning ? 'Scanning Cluster...' : 'Rescan Radar'}</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duplicate Roll Numbers</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {results ? results.duplicateRolls.length : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">High-impact academic collisions</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duplicate Emails</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {results ? results.duplicateEmails.length : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Conflicting Google SSO accounts</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Honor Collisions</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {results ? results.duplicateAchievements.length : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Repeated certificate submissions</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Results Table */}
      <Card variant="glass" className="border-border/60 overflow-hidden">
        <CardHeader className="border-b border-border/80 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Scan Diagnostics: {totalCollisions === 0 ? 'Zero Collisions Detected' : `${totalCollisions} Conflicts Found`}
          </CardTitle>
          {results && (
            <span className="text-xs font-mono text-slate-500">
              Scanned at {results.scanCompletedAt}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isScanning ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Traversing institutional database for duplicate records...</p>
            </div>
          ) : totalCollisions === 0 ? (
            <div className="py-16 text-center space-y-2 p-6">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Database is 100% Normalized</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No duplicate student roll numbers, conflicting institutional emails, or duplicate achievement submissions were found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {results?.duplicateRolls.map((dup, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="rose" size="sm">Duplicate Roll</Badge>
                      <span className="font-mono font-bold text-sm text-foreground">{dup.rollNumber}</span>
                      <span className="text-xs text-muted-foreground">({dup.count} accounts linked)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Users: {dup.users.map((u) => `${u.name} (${u.email})`).join(' • ')}
                    </p>
                  </div>
                  <Link href={`/admin/users?search=${dup.rollNumber}`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      Resolve Conflict
                    </Button>
                  </Link>
                </div>
              ))}

              {results?.duplicateEmails.map((dup, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" size="sm">Duplicate Email</Badge>
                      <span className="font-mono text-sm text-foreground">{dup.email}</span>
                      <span className="text-xs text-muted-foreground">({dup.count} users)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Profiles: {dup.names.join(', ')}
                    </p>
                  </div>
                  <Link href={`/admin/users?search=${dup.email}`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      Inspect Users
                    </Button>
                  </Link>
                </div>
              ))}

              {results?.duplicateAchievements.map((dup, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="violet" size="sm">Honor Collision</Badge>
                      <span className="font-semibold text-sm text-foreground">{dup.title}</span>
                      <span className="text-xs text-muted-foreground">({dup.count} submissions)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Recipient / Roll: {dup.recipient}
                    </p>
                  </div>
                  <Link href={`/admin/achievements?status=ALL`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      Manage Submissions
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
