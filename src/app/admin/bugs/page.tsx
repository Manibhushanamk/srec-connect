'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bug,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  RefreshCw,
  UserCheck,
  FileText,
  ChevronRight,
  X,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BugReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  route?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  screenshotUrl?: string;
  reporterEmail?: string;
  reporterRole?: string;
  reporter?: { name?: string; email?: string };
  assignedTo?: { name?: string; email?: string };
  internalNotes?: string;
  resolutionNotes?: string;
  auditTrail?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  NEW: { label: 'New', color: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  TRIAGED: { label: 'Triaged', color: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  INVESTIGATING: { label: 'Investigating', color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  FIX_IN_PROGRESS: { label: 'Fix in Progress', color: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  CLOSED: { label: 'Closed', color: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  DUPLICATE: { label: 'Duplicate', color: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  CANNOT_REPRODUCE: { label: 'Cannot Reproduce', color: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  REOPENED: { label: 'Reopened', color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
};

const SEVERITY_CONFIG: Record<string, { label: string; badge: string }> = {
  LOW: { label: 'Low', badge: 'bg-slate-500/10 text-slate-300 border-slate-700' },
  MEDIUM: { label: 'Medium', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  HIGH: { label: 'High', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  CRITICAL: { label: 'Critical', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
};

export default function AdminBugDashboardPage() {
  const { data: session } = useSession();

  const [reports, setReports] = useState<BugReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<BugReportItem | null>(null);

  // Triage state
  const [editStatus, setEditStatus] = useState<string>('');
  const [editSeverity, setEditSeverity] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/bug-reports?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('[Admin Bug Dashboard] Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, severityFilter]);

  const handleOpenReport = (report: BugReportItem) => {
    setSelectedReport(report);
    setEditStatus(report.status);
    setEditSeverity(report.severity);
    setInternalNotes(report.internalNotes || '');
    setResolutionNotes(report.resolutionNotes || '');
    setUpdateSuccess(false);
  };

  const handleSaveTriage = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/bug-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          severity: editSeverity,
          internalNotes,
          resolutionNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateSuccess(true);
        setSelectedReport(data.report);
        fetchReports();
      }
    } catch (err) {
      console.error('[Admin Bug Triage Update Error]', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Metrics
  const totalCount = reports.length;
  const newCount = reports.filter((r) => r.status === 'NEW').length;
  const inProgressCount = reports.filter((r) => ['TRIAGED', 'INVESTIGATING', 'FIX_IN_PROGRESS'].includes(r.status)).length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
  const criticalCount = reports.filter((r) => r.severity === 'CRITICAL' && r.status !== 'CLOSED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bug className="w-5 h-5" />
            </div>
            Bug Reports & Issue Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Institutional bug triage desk, diagnostic auditing, and resolution lifecycle tracking.
          </p>
        </div>
        <Button
          onClick={fetchReports}
          variant="outline"
          className="text-xs flex items-center gap-2 self-start sm:self-auto border-slate-800 hover:bg-slate-800/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Desk</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-space-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Logged</span>
            <Bug className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-cyan-400">
            <span>New Unreviewed</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{newCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-purple-400">
            <span>Fix in Progress</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{inProgressCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{resolvedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span>Critical Unresolved</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{criticalCount}</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search bug reports by title, description, route, or reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchReports(); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="TRIAGED">Triaged</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="FIX_IN_PROGRESS">Fix in Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-space-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-space-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-space-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Issue Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Severity</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Reporter</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    <span>Loading bug reports...</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Bug className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-300">No Bug Reports Found</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const statusMeta = STATUS_CONFIG[report.status] || STATUS_CONFIG.NEW;
                  const severityMeta = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.MEDIUM;

                  return (
                    <tr
                      key={report.id}
                      onClick={() => handleOpenReport(report)}
                      className="hover:bg-space-800/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white max-w-xs sm:max-w-md truncate">
                          {report.title}
                        </div>
                        {report.route && (
                          <div className="text-[11px] font-mono text-cyan-400/80 truncate mt-0.5">
                            {report.route}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-slate-300">{report.category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${severityMeta.badge}`}
                        >
                          {severityMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusMeta.badge}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <div className="truncate max-w-[140px]">
                          {report.reporter?.name || report.reporterEmail || 'Scholar'}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">{report.reporterRole}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage Detail Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-space-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-space-950/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  ISSUE #{selectedReport.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {updateSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Triage updates successfully saved.</span>
                </div>
              )}

              {/* Title & Route */}
              <div>
                <h3 className="text-lg font-bold text-white">{selectedReport.title}</h3>
                {selectedReport.route && (
                  <p className="text-xs font-mono text-cyan-400 mt-1">Route: {selectedReport.route}</p>
                )}
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </div>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              {/* Reproduction Steps */}
              {selectedReport.stepsToReproduce && (
                <div className="p-4 rounded-xl bg-space-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Steps to Reproduce
                  </div>
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {selectedReport.stepsToReproduce}
                  </pre>
                </div>
              )}

              {/* Expected vs Actual */}
              {(selectedReport.expectedBehavior || selectedReport.actualBehavior) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReport.expectedBehavior && (
                    <div className="p-3 rounded-xl bg-space-950 border border-slate-800 text-xs">
                      <span className="font-semibold text-emerald-400 block mb-1">Expected:</span>
                      <span className="text-slate-300">{selectedReport.expectedBehavior}</span>
                    </div>
                  )}
                  {selectedReport.actualBehavior && (
                    <div className="p-3 rounded-xl bg-space-950 border border-slate-800 text-xs">
                      <span className="font-semibold text-rose-400 block mb-1">Actual:</span>
                      <span className="text-slate-300">{selectedReport.actualBehavior}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Screenshot Link */}
              {selectedReport.screenshotUrl && (
                <div className="p-3 rounded-xl bg-space-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Attached Evidence Screenshot</span>
                  <a
                    href={selectedReport.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-semibold"
                  >
                    <span>Open Evidence</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Triage Form */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Triage & Status Control
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Lifecycle Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {Object.keys(STATUS_CONFIG).map((k) => (
                        <option key={k} value={k}>
                          {STATUS_CONFIG[k].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Severity</label>
                    <select
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {Object.keys(SEVERITY_CONFIG).map((k) => (
                        <option key={k} value={k}>
                          {SEVERITY_CONFIG[k].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Internal Engineering Notes (Private)
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Staff notes on root cause, assigned developer, or reproduction branch..."
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Public Resolution Summary
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Fix details visible to reporter upon resolution..."
                    className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              {/* Audit Trail Timeline */}
              {selectedReport.auditTrail && (
                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Audit Trail History
                  </div>
                  <div className="space-y-1.5">
                    {JSON.parse(selectedReport.auditTrail).map((entry: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-[11px] p-2 rounded-lg bg-space-950 border border-slate-800/80 text-slate-300 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-cyan-400">{entry.event}: </span>
                          <span>{entry.details || `${entry.from} ➔ ${entry.to}`}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-space-950/60">
              <Button
                variant="outline"
                onClick={() => setSelectedReport(null)}
                className="text-xs border-slate-800 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                onClick={handleSaveTriage}
                disabled={isUpdating}
                className="btn-cyan px-5 py-2 text-xs font-semibold flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Triage Updates</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
