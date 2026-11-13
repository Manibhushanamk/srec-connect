'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Plus,
  Lock,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  FileCheck,
  FileText,
  User,
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Upload,
  File,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { OfficialActionLetter } from '@/components/discipline/OfficialActionLetter';
import { formatDate, formatDateTime } from '@/lib/utils';

function StudentGrievancesContent() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'MY_CASES' | 'FILE_GRIEVANCE'>('MY_CASES');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [activeLetterAction, setActiveLetterAction] = useState<any>(null);

  const searchParams = useSearchParams();

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    studentRollNumber: '',
    category: 'FACULTY_GRIEVANCE',
    priority: 'MEDIUM',
    isConfidentialHOD: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Evidence Attachment State
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setAttachmentUrl(data.url);
        setAttachmentName(file.name);
      } else {
        alert(data.error || 'Failed to upload document');
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Response message state
  const [responseMsg, setResponseMsg] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    const studentRoll = searchParams.get('studentRoll');
    if (action === 'file_incident' || studentRoll) {
      setActiveTab('FILE_GRIEVANCE');
      if (studentRoll) {
        setForm((prev) => ({
          ...prev,
          studentRollNumber: studentRoll.toUpperCase(),
          category: 'CLASSROOM_DISCIPLINE',
          title: `Disciplinary Incident Report — ${studentRoll.toUpperCase()}`,
        }));
      }
    }
  }, [searchParams]);

  const fetchMyCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
        if (data.incidents?.length > 0 && !selectedIncident) {
          setSelectedIncident(data.incidents[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchMyCases();
    }
  }, [session]);

  const handleCreateGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          attachmentUrl: attachmentUrl || undefined,
        }),
      });

      if (res.ok) {
        setFormSuccess(true);
        setForm({
          title: '',
          description: '',
          studentRollNumber: '',
          category: 'FACULTY_GRIEVANCE',
          priority: 'MEDIUM',
          isConfidentialHOD: false,
        });
        setAttachmentUrl('');
        setAttachmentName('');
        await fetchMyCases();
        setTimeout(() => {
          setFormSuccess(false);
          setActiveTab('MY_CASES');
        }, 1500);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to submit grievance');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !responseMsg.trim()) return;

    setSendingResponse(true);
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseMsg.trim() }),
      });

      if (res.ok) {
        setResponseMsg('');
        // Refresh single incident
        const refRes = await fetch(`/api/incidents/${selectedIncident.id}`);
        if (refRes.ok) {
          const refData = await refRes.json();
          setSelectedIncident(refData.incident);
        }
        fetchMyCases();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingResponse(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Sign In Required</h1>
        <p className="text-xs text-muted-foreground">
          You must sign in with your college account to view or file confidential academic grievances.
        </p>
        <Link href="/signin" className="btn-primary inline-flex text-xs py-2.5 px-6">
          Sign In with College Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Department Grievance & Disciplinary Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Student Complaints & Conduct Records</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Submit academic or facility concerns with optional confidential HOD bypass, and exercise your formal right-to-respond on recorded departmental matters.
          </p>
        </div>

        {/* Tab & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {(session?.user && ((session.user as any).role === 'HOD' || (session.user as any).role === 'SUPER_ADMIN')) && (
            <Link
              href="/admin/discipline"
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Assessment & Conduct Desk</span>
            </Link>
          )}

          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('MY_CASES')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'MY_CASES'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Cases ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('FILE_GRIEVANCE')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'FILE_GRIEVANCE'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              File Report
            </button>
          </div>
        </div>
      </div>

      {/* Official Letter Modal */}
      {activeLetterAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex justify-center items-start pt-10">
          <div className="w-full max-w-3xl">
            <OfficialActionLetter
              letterRef={activeLetterAction.letterRef || `SREC/CSE-AIML/DISC/2026/${activeLetterAction.id?.substring(0, 4)}`}
              incidentTitle={selectedIncident?.title || 'Departmental Incident'}
              category={selectedIncident?.category || 'CLASSROOM_DISCIPLINE'}
              outcome={activeLetterAction.outcome}
              notes={activeLetterAction.notes}
              issuedAt={activeLetterAction.createdAt}
              student={{
                name: session.user.name || 'Student Scholar',
                rollNumber: (session.user as any).studentId || (session.user as any).rollNumber || '22091A3201',
                departmentName: 'CSE (AI & ML)',
              }}
              reporter={{
                name: selectedIncident?.reporter?.name || 'Department Faculty',
                role: selectedIncident?.reporter?.role || 'FACULTY',
              }}
              onClose={() => setActiveLetterAction(null)}
            />
          </div>
        </div>
      )}

      {/* Tab 1: File Grievance */}
      {activeTab === 'FILE_GRIEVANCE' && (
        <Card className="max-w-2xl mx-auto border-border">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-bold text-foreground">Submit a Departmental Grievance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                All submissions are encrypted and handled under institutional confidentiality guidelines.
              </p>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Grievance submitted successfully. Routing to assigned authority...
              </div>
            )}

            <form onSubmit={handleCreateGrievance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Subject / Title</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue (e.g. Lab workstation malfunction)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Target Student University Roll Number <span className="text-muted-foreground font-normal">(Required if filing disciplinary report; leave blank for general campus grievances)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 22091A3201"
                  value={form.studentRollNumber}
                  onChange={(e) => setForm({ ...form, studentRollNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="FACULTY_GRIEVANCE">Faculty-Related Grievance</option>
                    <option value="CLASSROOM_DISCIPLINE">Classroom Academic Issue</option>
                    <option value="ATTENDANCE_LATE">Attendance / Timetable Issue</option>
                    <option value="INCOMPLETE_ASSIGNMENTS">Lab / Assignment Clarification</option>
                    <option value="EXAMINATION_ISSUES">Exam / Evaluation Query</option>
                    <option value="STUDENT_TO_STUDENT">Student-to-Student Dispute</option>
                    <option value="INFRASTRUCTURE">Infrastructure & Lab Facilities</option>
                    <option value="MOBILE_PHONE">Digital Policy / Device Issue</option>
                    <option value="OTHER">Other Academic Concern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Urgency / Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="LOW">Low (Routine academic inquiry)</option>
                    <option value="MEDIUM">Medium (Standard grievance)</option>
                    <option value="HIGH">High (Impacts examinations / grades)</option>
                    <option value="CRITICAL">Critical (Immediate safety / harassment)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide precise details, dates, and context..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Supporting Document / Evidence Attachment */}
              <div className="space-y-2">
                <label className="block font-semibold text-foreground text-xs">
                  Supporting Evidence / Document Attachment (Optional)
                </label>
                <div className="border border-dashed border-border rounded-xl p-4 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  {attachmentUrl ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {attachmentName || 'Evidence Attached'}
                          </p>
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                          >
                            <span>Preview Uploaded File</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentUrl('');
                          setAttachmentName('');
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleAttachmentUpload}
                        disabled={uploadingAttachment}
                        className="hidden"
                      />
                      {uploadingAttachment ? (
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading evidence document...</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                            <Upload className="w-4 h-4" />
                            <span>Click to upload supporting photo, PDF, or evidence file</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Accepted formats: PDF, PNG, JPG, JPEG, DOCX (Up to 20 MB)
                          </p>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Confidential HOD Bypass Toggle */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isConfidentialHOD}
                    onChange={(e) => setForm({ ...form, isConfidentialHOD: e.target.checked })}
                    className="mt-0.5 rounded border-amber-600 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-amber-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Confidential HOD Bypass
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      If enabled, this grievance strictly bypasses regular departmental faculty and is delivered solely to the Head of Department.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  size="sm"
                  onClick={() => setActiveTab('MY_CASES')}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Official Grievance
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: My Cases */}
      {activeTab === 'MY_CASES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Case List Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3 lg:sticky lg:top-24">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Recorded Dossiers
            </h2>

            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-2 bg-card">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-foreground">Clean Record</p>
                <p className="text-[11px] text-muted-foreground">
                  No disciplinary incidents or complaints on file.
                </p>
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                    selectedIncident?.id === inc.id
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-card border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground truncate">{inc.title}</span>
                    <Badge variant={inc.status === 'RESOLVED' ? 'emerald' : 'rose'} size="sm">
                      {inc.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{inc.category.replace(/_/g, ' ')}</span>
                    <span>{formatDate(inc.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dossier Detail Area */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 min-w-0">
            {selectedIncident ? (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="rose" size="sm">{selectedIncident.priority} PRIORITY</Badge>
                      <Badge variant="slate" size="sm">{selectedIncident.category.replace(/_/g, ' ')}</Badge>
                      {selectedIncident.reporter?.role !== 'STUDENT' ? (
                        <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Faculty Conduct Notice • HOD Confidential
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                          Student Grievance
                        </span>
                      )}
                      {selectedIncident.student && (
                        <span className="text-[10px] font-mono font-medium text-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                          Sec {selectedIncident.student.section || 'A'} • Batch {selectedIncident.student.batch || '2022-2026'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{selectedIncident.title}</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Filed {formatDate(selectedIncident.createdAt)}
                  </span>
                </div>

                {/* Case Description & Attached Evidence */}
                {(() => {
                  const attachmentMatch = selectedIncident.description?.match(/\[Attachment:\s*([^\]]+)\]/);
                  const attachedUrl = attachmentMatch ? attachmentMatch[1].trim() : null;
                  const cleanDesc = selectedIncident.description?.replace(/\[Attachment:\s*([^\]]+)\]/, '').trim();
                  const isImage = attachedUrl && /\.(png|jpe?g|webp|gif)$/i.test(attachedUrl);

                  return (
                    <div className="space-y-3">
                      <div className="text-xs text-foreground/90 bg-secondary/40 p-4 rounded-xl border border-border/60 leading-relaxed whitespace-pre-line">
                        {cleanDesc || selectedIncident.description}
                      </div>

                      {attachedUrl && (
                        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-primary" />
                            <span>Attached Supporting Evidence</span>
                          </h4>
                          {isImage ? (
                            <div className="space-y-2">
                              <div className="max-w-md max-h-60 rounded-xl overflow-hidden border border-border bg-slate-950">
                                <img
                                  src={attachedUrl}
                                  alt="Evidence Attachment"
                                  width={600}
                                  height={400}
                                  loading="lazy"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <a
                                href={attachedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                              >
                                <span>Open Full-Resolution Evidence Image</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                              <div className="flex items-center gap-2">
                                <File className="w-4 h-4 text-primary" />
                                <span className="text-xs font-mono font-medium text-foreground truncate max-w-xs">
                                  {attachedUrl.split('/').pop()}
                                </span>
                              </div>
                              <a
                                href={attachedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                              >
                                <span>View Document</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Official Actions & Letters Section */}
                {selectedIncident.actions?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        Formal Action Determination
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(selectedIncident.actions[0].createdAt)}
                      </span>
                    </div>

                    {selectedIncident.actions.map((act: any) => (
                      <div key={act.id} className="text-xs space-y-2">
                        <p className="font-bold text-foreground">
                          Outcome: <span className="text-primary">{act.outcome.replace(/_/g, ' ')}</span>
                        </p>
                        {act.notes && (
                          <p className="text-muted-foreground text-[11px]">{act.notes}</p>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveLetterAction(act)}
                          className="mt-2 text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white border-none shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View & Print Official Action Letter
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Response Timeline & Right to Respond */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    Formal Right-to-Respond Timeline
                  </h4>

                  {selectedIncident.responses?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No response statements recorded yet. You may submit your formal explanation below.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedIncident.responses?.map((r: any) => (
                        <div key={r.id} className="p-3 bg-secondary/50 rounded-xl border border-border text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{r.author?.name} ({r.author?.role})</span>
                            <span className="text-[10px] text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-line">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Right-to-Respond Statement */}
                  <form onSubmit={handleSendResponse} className="space-y-2 pt-2">
                    <label className="block text-[11px] font-semibold text-foreground">
                      Submit Your Official Written Statement
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Enter clarification or response statement..."
                      value={responseMsg}
                      onChange={(e) => setResponseMsg(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        type="submit"
                        size="sm"
                        disabled={sendingResponse || !responseMsg.trim()}
                        className="text-xs flex items-center gap-1.5"
                      >
                        {sendingResponse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Submit Statement
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl bg-card">
                Select a dossier from the list to view timeline and official letters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentGrievancesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-6xl mx-auto py-12 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <StudentGrievancesContent />
    </React.Suspense>
  );
}
