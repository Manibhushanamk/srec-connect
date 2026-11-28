'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldAlert,
  Plus,
  Lock,
  MessageSquare,
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Loader2,
  Clock,
  User,
  GraduationCap,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { MemberSelector, SelectedMember } from '@/components/shared/MemberSelector';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { ACADEMIC_BATCH_OPTIONS } from '@/lib/studentHelper';

export default function AdminDisciplinePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'STUDENT_GRIEVANCE' | 'FACULTY_DISCIPLINE'
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<SelectedMember[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    studentRollNumber: '',
    category: 'CLASSROOM_DISCIPLINE',
    priority: 'MEDIUM',
    isConfidentialHOD: false,
  });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (sectionFilter !== 'ALL') params.set('section', sectionFilter);
      if (batchFilter !== 'ALL') params.set('batch', batchFilter);

      const res = await fetch(`/api/incidents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, categoryFilter, typeFilter, sectionFilter, batchFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setForm({
          title: '',
          description: '',
          studentRollNumber: '',
          category: 'CLASSROOM_DISCIPLINE',
          priority: 'MEDIUM',
          isConfidentialHOD: false,
        });
        fetchIncidents();
      } else {
        alert(data.error || 'Failed to file incident');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating incident');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      inc.title.toLowerCase().includes(term) ||
      inc.student?.rollNumber?.toLowerCase().includes(term) ||
      inc.student?.name?.toLowerCase().includes(term) ||
      inc.reporter?.name?.toLowerCase().includes(term)
    );
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'rose';
      case 'HIGH':
        return 'amber';
      case 'MEDIUM':
        return 'brand';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Badge variant="rose" size="sm" className="mb-1">
            Student Affairs & Ethics
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Complaints & Discipline Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Confidential student grievances, academic disciplinary tracking, and immutable response timelines.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto bg-rose-600 hover:bg-rose-500 shadow-xs text-white"
        >
          <Plus className="w-4 h-4" />
          File Incident / Grievance
        </Button>
      </div>

      {/* Category Tabs: Specific Section Breakdown */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            typeFilter === 'ALL'
              ? 'bg-primary text-white shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          All Dossiers ({incidents.length})
        </button>
        <button
          onClick={() => setTypeFilter('STUDENT_GRIEVANCE')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            typeFilter === 'STUDENT_GRIEVANCE'
              ? 'bg-primary text-white shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Student Grievances (Filed by Students)
        </button>
        <button
          onClick={() => setTypeFilter('FACULTY_DISCIPLINE')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            typeFilter === 'FACULTY_DISCIPLINE'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Faculty Conduct Notices (HOD Only)
        </button>
      </div>

      {/* Filters Toolbar: Search, Section & Batch Selectors */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by case title, roll number, or student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <CreatableSelect
                value={sectionFilter === 'ALL' ? '' : sectionFilter}
                onChange={(val) => setSectionFilter(val || 'ALL')}
                options={[
                  { value: 'A', label: 'Section A' },
                  { value: 'B', label: 'Section B' },
                  { value: 'C', label: 'Section C' },
                  { value: 'D', label: 'Section D' },
                ]}
                placeholder="All Sections"
                customOptionLabel="+ Custom Sec..."
                customPlaceholder="Sec"
              />
            </div>

            <div className="w-52">
              <CreatableSelect
                value={batchFilter === 'ALL' ? '' : batchFilter}
                onChange={(val) => setBatchFilter(val || 'ALL')}
                options={ACADEMIC_BATCH_OPTIONS}
                placeholder="All Batches"
                customOptionLabel="+ Custom Batch..."
                customPlaceholder="e.g. 2026-2030"
              />
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-border text-xs">
          {['ALL', 'REPORTED', 'UNDER_REVIEW', 'ESCALATED_TO_HOD', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-secondary text-foreground font-bold border border-border shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Case List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-muted/20 text-xs text-muted-foreground">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No incidents or grievances recorded</h3>
          <p className="text-xs text-muted-foreground mt-1">Cases matching the selected filters will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((inc) => (
            <Link key={inc.id} href={`/admin/discipline/${inc.id}`} className="block group">
              <Card className="p-5 border-border bg-card hover:border-primary/50 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getPriorityBadgeVariant(inc.priority) as any} size="sm">
                        {inc.priority} PRIORITY
                      </Badge>
                      <Badge variant="slate" size="sm">
                        {inc.category.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={inc.status === 'RESOLVED' ? 'emerald' : 'cyan'} size="sm">
                        {inc.status.replace(/_/g, ' ')}
                      </Badge>
                      {inc.reporter?.role !== 'STUDENT' ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                          <Lock className="w-3 h-3" />
                          Faculty Notice • HOD Confidential
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-500 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                          Student Grievance
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {inc.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {inc.student && (
                        <span className="flex items-center gap-1.5 font-mono text-foreground font-semibold px-2 py-0.5 rounded bg-muted border border-border">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          {inc.student.name} ({inc.student.rollNumber})
                          <span className="text-[10px] text-muted-foreground font-normal">
                            • Sec {inc.student.section || 'A'} • {inc.student.batch || '2022-2026'}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        Reported by {inc.reporter?.name} ({inc.reporter?.role})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(inc.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                        {inc._count?.responses || 0} responses
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button variant="secondary" size="sm" className="text-xs group-hover:bg-muted">
                      Open Case Dossier
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* File Incident Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="File Incident or Grievance Report"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Case Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Unapproved Mobile Usage During Laboratory Assessment"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground font-medium mb-1">Category *</label>
              <CreatableSelect
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val })}
                options={[
                  { value: 'CLASSROOM_DISCIPLINE', label: 'Classroom Discipline' },
                  { value: 'ATTENDANCE_LATE_ARRIVAL', label: 'Attendance / Late Arrival' },
                  { value: 'MOBILE_PHONE_USAGE', label: 'Mobile Phone Usage' },
                  { value: 'EXAMINATION_ISSUES', label: 'Examination Irregularities' },
                  { value: 'INCOMPLETE_ASSIGNMENTS', label: 'Incomplete Assignments' },
                  { value: 'STUDENT_TO_STUDENT', label: 'Student-to-Student Conflict' },
                  { value: 'FACULTY_GRIEVANCE', label: 'Faculty Grievance (Student to Staff)' },
                  { value: 'INFRASTRUCTURE', label: 'Infrastructure Concern' },
                  { value: 'MISCONDUCT', label: 'General Misconduct' },
                  { value: 'OTHER', label: 'Other Issue' },
                ]}
                customOptionLabel="+ Custom Category..."
                customPlaceholder="Type custom category..."
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Priority Level *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical (Immediate HOD Review)</option>
              </select>
            </div>
          </div>

          <div>
            <MemberSelector
              label="Select Student Subject"
              placeholder="Search by student roll number (e.g. 22091A3201) or name..."
              max={1}
              selected={selectedStudent}
              onChange={(members) => {
                setSelectedStudent(members);
                setForm({
                  ...form,
                  studentRollNumber: members[0]?.rollNumber || members[0]?.name || '',
                });
              }}
            />
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-300">
              <input
                type="checkbox"
                checked={form.isConfidentialHOD}
                onChange={(e) => setForm({ ...form, isConfidentialHOD: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <Lock className="w-3.5 h-3.5" />
              Direct Confidential HOD Bypass
            </label>
            <p className="text-[11px] text-amber-400/80 mt-1 pl-5">
              Restricts visibility strictly to the Head of Department and Super Admin. Bypasses regular faculty roster.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description & Evidence Details *</label>
            <textarea
              required
              rows={4}
              placeholder="Detailed explanation of the incident, location, witnesses, or grievance circumstances..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-500">
              {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Submit Case Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
