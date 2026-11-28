'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  Users,
  Clock,
  Send,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { ACADEMIC_BATCH_OPTIONS } from '@/lib/studentHelper';

export default function AdminNoticesPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetRole: 'ALL',
    batch: '',
    section: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetRole: 'ALL',
    batch: '',
    section: '',
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setForm({
          title: '',
          content: '',
          priority: 'NORMAL',
          targetRole: 'ALL',
          batch: '',
          section: '',
        });
        fetchAnnouncements();
      } else {
        alert(data.error || 'Failed to publish notice');
      }
    } catch (err: any) {
      alert(err.message || 'Error publishing notice');
    } finally {
      setPublishing(false);
    }
  };

  const handleStartEdit = (a: any) => {
    setEditingId(a.id);
    setEditForm({
      title: a.title,
      content: a.content,
      priority: a.priority || 'NORMAL',
      targetRole: a.targetRole || 'ALL',
      batch: a.batch || '',
      section: a.section || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/announcements/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setEditingId(null);
        fetchAnnouncements();
      } else {
        alert(data.error || 'Failed to update notice');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating notice');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this notice?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAnnouncements();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete notice');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting notice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-1">
            Communication Dispatch
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Campus Notices & Announcements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Broadcast departmental circulars with audience targeting (batch, section, role) and automatic in-app notification dispatch.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Publish Notice
        </Button>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-xs text-slate-400">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No active announcements</h3>
          <p className="text-xs text-slate-400 mt-1">Broadcast official news or circulars to students and faculty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.priority === 'URGENT' ? 'rose' : 'slate'} size="sm">
                      {a.priority}
                    </Badge>
                    <Badge variant="cyan" size="sm">
                      Target: {a.targetRole} {a.batch ? `(${a.batch})` : ''} {a.section ? `Sec ${a.section}` : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Published {formatDate(a.createdAt)}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStartEdit(a)}
                      className="text-xs text-amber-300 border-amber-800/60 hover:bg-amber-950/40 py-1 px-2.5 h-auto"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(a.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 py-1 px-2.5 h-auto"
                      title="Remove Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{a.title}</h3>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Author: {a.author?.name || 'Department Authority'} ({a.author?.role || 'Admin'})</span>
                  <span>Expires: {a.expiresAt ? formatDate(a.expiresAt) : '30 days'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Publish Official Department Notice"
      >
        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Notice Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule for Mid-Term Lab Examinations & Project Submissions"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Audience *</label>
              <select
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Department (Students & Staff)</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty & Staff Only</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Priority Level *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="NORMAL">Normal Circular</option>
                <option value="URGENT">Urgent Notice</option>
              </select>
            </div>
          </div>

          {form.targetRole === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-secondary/40 rounded-xl border border-border">
              <div>
                <label className="block text-muted-foreground mb-1">Batch Filter (Optional)</label>
                <CreatableSelect
                  value={form.batch}
                  onChange={(val) => setForm({ ...form, batch: val })}
                  options={ACADEMIC_BATCH_OPTIONS}
                  placeholder="All Batches"
                  customOptionLabel="+ Custom Batch..."
                  customPlaceholder="e.g. 2026-2030"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Section Filter (Optional)</label>
                <CreatableSelect
                  value={form.section}
                  onChange={(val) => setForm({ ...form, section: val.toUpperCase() })}
                  options={[
                    { value: 'A', label: 'Section A' },
                    { value: 'B', label: 'Section B' },
                    { value: 'C', label: 'Section C' },
                    { value: 'D', label: 'Section D' },
                  ]}
                  placeholder="All Sections"
                  customOptionLabel="+ Custom Section..."
                  customPlaceholder="e.g. E"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notice Content *</label>
            <textarea
              required
              rows={4}
              placeholder="Detailed text of the announcement, instructions, deadlines, or venue details..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={publishing}>
              {publishing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Publish Notice & Send Alerts
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Notice Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingId(null);
        }}
        title="Modify Department Notice"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Notice Title *</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Audience *</label>
              <select
                value={editForm.targetRole}
                onChange={(e) => setEditForm({ ...editForm, targetRole: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Department (Students & Staff)</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty & Staff Only</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Priority Level *</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="NORMAL">Normal Circular</option>
                <option value="URGENT">Urgent Notice</option>
              </select>
            </div>
          </div>

          {editForm.targetRole === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Batch Filter (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2022-2026 (or blank for all)"
                  value={editForm.batch}
                  onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Section Filter (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. A (or blank for all)"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notice Content *</label>
            <textarea
              required
              rows={4}
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={updating}>
              {updating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
