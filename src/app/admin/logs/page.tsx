'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  History,
  Shield,
  ShieldAlert,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Users,
  Eye,
  RefreshCw,
  FileText,
  AlertTriangle,
  ArrowRight,
  Database,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatTimeAgo } from '@/lib/utils';

interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    department?: { name: string; code: string } | null;
  } | null;
}

interface LogStats {
  totalEvents: number;
  todayEvents: number;
  moderationEvents: number;
  securityEvents: number;
  topActions: { action: string; count: number }[];
  currentUserRole: string;
  departmentName: string;
}

export default function AdminAuditLogsPage() {
  const { data: session, status: authStatus } = useSession();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'HOD';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: activeTab,
        role: roleFilter,
        dateRange,
        page: page.toString(),
        limit: '30',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && isAuthorized) {
      fetchLogs();
    } else if (authStatus === 'authenticated' && !isAuthorized) {
      setLoading(false);
    }
  }, [authStatus, isAuthorized, activeTab, roleFilter, dateRange, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExport = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      action: activeTab,
      role: roleFilter,
      dateRange,
      export: format,
    });
    if (search.trim()) params.set('search', search.trim());
    window.open(`/api/admin/logs?${params.toString()}`, '_blank');
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const parseMetadata = (metaString: string | null) => {
    if (!metaString) return null;
    try {
      return JSON.parse(metaString);
    } catch {
      return metaString;
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('PUBLISH') || act.includes('APPROVE') || act.includes('RESTORE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('REJECT') || act.includes('PURGE') || act.includes('DELETE') || act.includes('SUSPEND')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('UPDATE') || act.includes('ROLE') || act.includes('STATUS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          <span>{action}</span>
        </span>
      );
    }
    if (act.includes('UPLOAD') || act.includes('DRIVE') || act.includes('CREATE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          <FileText className="w-3 h-3 text-blue-400" />
          <span>{action}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-secondary text-secondary-foreground border border-border">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span>{action}</span>
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      SUPER_ADMIN: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40' },
      ADMIN: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/40' },
      HOD: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40' },
      WEB_MANAGER: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/40' },
      FACULTY: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
      STUDENT: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/40' },
    };
    const c = map[role] || { bg: 'bg-secondary', text: 'text-secondary-foreground', border: 'border-border' };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider ${c.bg} ${c.text} border ${c.border}`}>
        {role}
      </span>
    );
  };

  // 1. Authorization Guard
  if (authStatus === 'loading') {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-mono text-cyan-400 animate-pulse">Authenticating Security Clearance...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="border-rose-500/40 bg-rose-950/20 text-center p-8">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Security Clearance Required</h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Institutional Audit Logs are strictly restricted to Department Heads (HOD) and Super Administrators. Your current role does not possess the requisite audit governance clearance.
          </p>
          <div className="mt-6">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Return to Command Center
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-2">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Institutional Compliance & Governance
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Audit Intelligence Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable forensic audit trail for HOD and Executive Administration across all campus operations, approvals, and security events.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('csv')}
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="cyan"
            size="sm"
            onClick={() => handleExport('json')}
            className="text-xs gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Recorded Events</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {stats ? stats.totalEvents.toLocaleString() : '...'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Scoped to {stats?.departmentName || 'Campus'}
          </p>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Mutations</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 mt-2">
            {stats ? stats.todayEvents.toLocaleString() : '...'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Recorded in last 24h</p>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Moderation Decisions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            {stats ? stats.moderationEvents.toLocaleString() : '...'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Honors & Incident reviews</p>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Security & Roles</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">
            {stats ? stats.securityEvents.toLocaleString() : '...'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Permission & User updates</p>
        </Card>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'All Audit Stream' },
          { id: 'MODERATION', label: 'Moderation & Honors' },
          { id: 'SECURITY', label: 'Security & Roles' },
          { id: 'DATA', label: 'Storage & Ingestion' },
          { id: 'TRASH', label: 'System Recovery' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Search & Multi-Filter Control Bar */}
      <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Actor Email, Action, Entity ID, IP, or Metadata content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Actor Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="HOD">HOD</option>
              <option value="WEB_MANAGER">Web Manager</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Student</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="text-xs">
              Apply
            </Button>
          </div>
        </form>
      </div>

      {/* 5. Audit Log Table */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-xs font-mono text-cyan-400 animate-pulse">
            Synchronizing Cryptographic Audit Stream...
          </p>
        </div>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/20">
          <Shield className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Audit Records Matching Filter</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or selecting a different timeframe tab above.
          </p>
        </Card>
      ) : (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action & Severity</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4 text-right">Forensic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => {
                  const meta = parseMetadata(log.metadata);
                  const isRecent = Date.now() - new Date(log.createdAt).getTime() < 3600000;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-300">
                          {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />}
                          <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                          <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                          {formatTimeAgo(log.createdAt)}
                        </span>
                      </td>

                      {/* 2. Actor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : log.actorEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[170px]">
                            <p className="font-semibold text-white truncate" title={log.actor?.name || log.actorEmail}>
                              {log.actor?.name || log.actorEmail.split('@')[0]}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {getRoleBadge(log.actorRole)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* 4. Target Entity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5 truncate max-w-[120px]" title={log.entityId}>
                            {log.entityId.slice(0, 10)}...
                          </span>
                        )}
                      </td>

                      {/* 5. Summary */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-slate-300 truncate font-mono text-[11px]">
                          {meta && typeof meta === 'object' ? (
                            meta.newStatus ? (
                              <span>Status: <b className="text-emerald-400">{meta.newStatus}</b></span>
                            ) : meta.fileName ? (
                              <span>File: <b>{meta.fileName}</b></span>
                            ) : meta.targetRole ? (
                              <span>Role: <b>{meta.targetRole}</b></span>
                            ) : meta.studentRollNumber ? (
                              <span>Roll: <b>{meta.studentRollNumber}</b></span>
                            ) : (
                              JSON.stringify(meta)
                            )
                          ) : (
                            log.metadata || 'Event registered'
                          )}
                        </p>
                      </td>

                      {/* 6. Forensic Action Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                          title="Inspect Forensic Record"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2 text-xs"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Forensic Deep-Dive Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Forensic Audit Record Inspector"
          description="Cryptographic event record captured by SREC Institutional Audit Infrastructure."
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Event Overview Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getActionBadge(selectedLog.action)}
                  <span className="font-mono text-slate-400 text-[11px]">
                    ID: {selectedLog.id}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedLog.id, 'id')}
                  className="text-slate-400 hover:text-white"
                  title="Copy Log ID"
                >
                  {copiedId === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block uppercase font-mono text-[10px]">Timestamp (ISO)</span>
                  <span className="font-mono text-white mt-0.5 block">{selectedLog.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-mono text-[10px]">Relative Elapsed</span>
                  <span className="text-cyan-400 font-semibold mt-0.5 block">{formatTimeAgo(selectedLog.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Actor Information */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase font-mono text-[10px] font-bold block">
                Actor Profile & Security Clearance
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Name & Role</span>
                  <span className="font-semibold text-white mt-0.5 flex items-center gap-2">
                    {selectedLog.actor?.name || 'Institutional Operator'}
                    {getRoleBadge(selectedLog.actorRole)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Actor Email</span>
                  <span className="font-mono text-slate-300 mt-0.5 block">{selectedLog.actorEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Actor ID</span>
                  <span className="font-mono text-slate-400 mt-0.5 block">{selectedLog.actorId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Department Anchor</span>
                  <span className="text-white mt-0.5 block">
                    {selectedLog.actor?.department?.name || 'Institutional Core'}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Entity & Network Footprint */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase font-mono text-[10px] font-bold block">
                Target Entity & Network Origin
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Entity Type</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">{selectedLog.entityType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entity ID</span>
                  <span className="font-mono text-cyan-400 mt-0.5 block truncate" title={selectedLog.entityId || 'None'}>
                    {selectedLog.entityId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Origin IP Address</span>
                  <span className="font-mono text-slate-300 mt-0.5 block">
                    {selectedLog.ipAddress || 'Internal Network / Direct API'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Client User Agent</span>
                  <span className="font-mono text-slate-400 mt-0.5 block truncate" title={selectedLog.userAgent || 'Server Side'}>
                    {selectedLog.userAgent || 'Verified Session Worker'}
                  </span>
                </div>
              </div>
            </div>

            {/* Formatted JSON Metadata Viewer */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase font-mono text-[10px] font-bold">
                  Raw Event Metadata (JSON Payload)
                </span>
                <button
                  onClick={() => {
                    if (navigator.clipboard && selectedLog.metadata) {
                      navigator.clipboard.writeText(selectedLog.metadata);
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }
                  }}
                  className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900/90 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-48 border border-slate-800">
                {selectedLog.metadata
                  ? JSON.stringify(parseMetadata(selectedLog.metadata), null, 2)
                  : '// No extended metadata attached to this record'}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
