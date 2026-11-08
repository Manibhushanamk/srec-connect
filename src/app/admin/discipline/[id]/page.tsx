'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  Lock,
  MessageSquare,
  ArrowLeft,
  Clock,
  User,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  FileCheck,
  FileText,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { OfficialActionLetter } from '@/components/discipline/OfficialActionLetter';

export default function AdminIncidentDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();

  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Response Form
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Action Form
  const [actionOutcome, setActionOutcome] = useState('VERBAL_WARNING');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [activeLetterAction, setActiveLetterAction] = useState<any>(null);

  const fetchIncident = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIncident(data.incident);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load case dossier');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching dossier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseMessage.trim()) return;

    setSendingResponse(true);
    try {
      const res = await fetch(`/api/incidents/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseMessage.trim() }),
      });
      if (res.ok) {
        setResponseMessage('');
        fetchIncident();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to submit response');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleRecordAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/incidents/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: actionOutcome,
          notes: actionNotes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotes('');
        fetchIncident();
      } else {
        alert(data.error || 'Failed to record disciplinary action');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400">{error || 'Case dossier could not be found or you do not have permission.'}</p>
        <Link href="/admin/discipline">
          <Button variant="secondary" size="sm">Back to Cases</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/discipline"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Disciplinary Cases
        </Link>
      </div>

      {/* Case Header Dossier */}
      <div className="border border-slate-800 bg-slate-900/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="rose" size="sm">{incident.priority} PRIORITY</Badge>
            <Badge variant="slate" size="sm">{incident.category.replace(/_/g, ' ')}</Badge>
            <Badge variant={incident.status === 'RESOLVED' ? 'emerald' : 'cyan'} size="sm">
              {incident.status.replace(/_/g, ' ')}
            </Badge>
            {incident.isConfidentialHOD && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/60">
                <Lock className="w-3 h-3" />
                Confidential HOD Bypass
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Filed on {formatDate(incident.createdAt)}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-white">{incident.title}</h1>

        {/* Reporter & Subject Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Reporting Party</p>
              <p className="font-semibold text-white">{incident.reporter?.name}</p>
              <p className="text-[10px] text-slate-400">{incident.reporter?.email} ({incident.reporter?.role})</p>
            </div>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Subject Student</p>
              {incident.student ? (
                <>
                  <p className="font-semibold text-white">{incident.student.name}</p>
                  <p className="text-[10px] font-mono text-cyan-300">
                    Roll: {incident.student.rollNumber} | {incident.student.departmentName}
                  </p>
                </>
              ) : (
                <p className="font-medium text-slate-400">General / Institutional Issue</p>
              )}
            </div>
          </div>
        </div>

        {/* Incident Narrative */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Incident Narrative</h4>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
            {incident.description}
          </div>
        </div>
      </div>

      {/* Grid: Left Immutable Response Timeline & Right Resolution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Immutable Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Immutable Response Timeline & Right-to-Respond
              </h3>
              <span className="text-[11px] text-slate-500">
                {incident.responses?.length || 0} formal statements
              </span>
            </div>

            {incident.responses?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No official statements recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {incident.responses.map((resp: any) => (
                  <div
                    key={resp.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{resp.author?.name}</span>
                        <Badge variant="slate" size="sm">{resp.author?.role}</Badge>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {formatDateTime(resp.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                      {resp.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Response Submission Input */}
            <form onSubmit={handleSendResponse} className="pt-3 border-t border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Add Official Statement / Right-to-Respond Message
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter formal response or clarification..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  type="submit"
                  size="sm"
                  disabled={sendingResponse || !responseMessage.trim()}
                  className="flex items-center gap-1.5"
                >
                  {sendingResponse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Statement
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Formal Actions & Disciplinary Resolution */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Recorded Actions & Outcomes
            </h3>

            {incident.actions?.length === 0 ? (
              <p className="text-xs text-slate-500">No disciplinary outcomes recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {incident.actions.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">
                        {act.outcome.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatDate(act.createdAt)}</span>
                    </div>
                    {act.notes && <p className="text-slate-400 text-[11px]">{act.notes}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-slate-500">By {act.actor?.name} ({act.actor?.role})</p>
                      <button
                        type="button"
                        onClick={() => setActiveLetterAction(act)}
                        className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Print Official Letter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Form (For Faculty & HOD) */}
            <form onSubmit={handleRecordAction} className="pt-4 border-t border-slate-800 space-y-3 text-xs">
              <h4 className="font-semibold text-slate-200">Record Action Outcome</h4>

              <div>
                <label className="block text-slate-400 mb-1">Select Outcome</label>
                <select
                  value={actionOutcome}
                  onChange={(e) => setActionOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="VERBAL_WARNING">Verbal Warning</option>
                  <option value="WRITTEN_WARNING">Written Warning</option>
                  <option value="COUNSELLING">Academic / Personal Counselling</option>
                  <option value="CORRECTIVE_TASK">Corrective Task / Community Service</option>
                  <option value="HOD_REVIEW">Escalate to HOD Formal Review</option>
                  <option value="FORMAL_ACTION">Formal Institutional Disciplinary Action (HOD Only)</option>
                  <option value="NO_ACTION">No Action / Case Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Resolution Notes</label>
                <textarea
                  rows={2}
                  placeholder="Official outcome notes and instructions to student..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                size="sm"
                disabled={submittingAction}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-xs"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Record Action & Update Case
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Official Action Letter Print / Preview Modal */}
      {activeLetterAction && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-4 flex justify-center items-start pt-10">
          <div className="w-full max-w-3xl">
            <OfficialActionLetter
              letterRef={activeLetterAction.letterRef || `SREC/CSE-AIML/DISC/2026/${activeLetterAction.id?.substring(0, 4)}`}
              incidentTitle={incident.title}
              category={incident.category}
              outcome={activeLetterAction.outcome}
              notes={activeLetterAction.notes}
              issuedAt={activeLetterAction.createdAt}
              student={{
                name: incident.student?.name || 'Student Scholar',
                rollNumber: incident.student?.rollNumber || '22091A3201',
                departmentName: incident.student?.departmentName || 'CSE (AI & ML)',
                currentYear: incident.student?.currentYear,
                section: incident.student?.section,
                batch: incident.student?.batch,
              }}
              reporter={{
                name: incident.reporter?.name || 'Department Faculty',
                role: incident.reporter?.role || 'FACULTY',
              }}
              onClose={() => setActiveLetterAction(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
