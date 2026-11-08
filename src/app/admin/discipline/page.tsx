'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/AdminShell';
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

export default function AdminDisciplinePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      const res = await fetch(
        `/api/incidents?status=${statusFilter === 'ALL' ? '' : statusFilter}&category=${
          categoryFilter === 'ALL' ? '' : categoryFilter
        }`
      );
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
  }, [statusFilter, categoryFilter]);

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
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="rose" size="sm" className="mb-1">
            Student Affairs & Ethics
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Complaints & Discipline Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Confidential student grievances, academic disciplinary tracking, and immutable response timelines.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto bg-rose-600 hover:bg-rose-500 shadow-rose-950/40"
        >
          <Plus className="w-4 h-4" />
          File Incident / Grievance
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case title, roll number, or student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-stretch sm:self-auto overflow-x-auto text-xs">
          {['ALL', 'REPORTED', 'UNDER_REVIEW', 'ESCALATED_TO_HOD', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
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
          <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-xs text-slate-400">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No incidents or grievances recorded</h3>
          <p className="text-xs text-slate-400 mt-1">Cases reported by faculty or students will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((inc) => (
            <Link key={inc.id} href={`/admin/discipline/${inc.id}`} className="block group">
              <Card className="p-5 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
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
                      {inc.isConfidentialHOD && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/60">
                          <Lock className="w-3 h-3" />
                          HOD Confidential
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                      {inc.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {inc.student && (
                        <span className="flex items-center gap-1.5 font-mono text-cyan-300">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                          {inc.student.name} ({inc.student.rollNumber})
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Reported by {inc.reporter?.name} ({inc.reporter?.role})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(inc.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                        {inc._count?.responses || 0} responses
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button variant="secondary" size="sm" className="text-xs group-hover:bg-slate-800">
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
              <label className="block text-slate-300 font-medium mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              >
                <option value="CLASSROOM_DISCIPLINE">Classroom Discipline</option>
                <option value="ATTENDANCE_LATE_ARRIVAL">Attendance / Late Arrival</option>
                <option value="MOBILE_PHONE_USAGE">Mobile Phone Usage</option>
                <option value="EXAMINATION_ISSUES">Examination Irregularities</option>
                <option value="INCOMPLETE_ASSIGNMENTS">Incomplete Assignments</option>
                <option value="STUDENT_TO_STUDENT">Student-to-Student Conflict</option>
                <option value="FACULTY_GRIEVANCE">Faculty Grievance (Student to Staff)</option>
                <option value="INFRASTRUCTURE">Infrastructure Concern</option>
                <option value="MISCONDUCT">General Misconduct</option>
                <option value="OTHER">Other Issue</option>
              </select>
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
            <label className="block text-slate-300 font-medium mb-1">
              Student Roll Number (if disciplinary report against student)
            </label>
            <input
              type="text"
              placeholder="e.g. 22091A3201"
              value={form.studentRollNumber}
              onChange={(e) => setForm({ ...form, studentRollNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
    </AdminShell>
  );
}
