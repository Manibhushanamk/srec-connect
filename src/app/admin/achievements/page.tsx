'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AchievementCard } from '@/components/cards/AchievementCard';
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  Save,
  Check,
  Filter,
} from 'lucide-react';

function AdminAchievementsContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status')?.toUpperCase() as any) || 'PENDING';
  const [achievements, setAchievements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PUBLISHED' | 'REJECTED'>(
    ['ALL', 'PENDING', 'PUBLISHED', 'REJECTED'].includes(initialStatus) ? initialStatus : 'PENDING'
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const urlStatus = searchParams.get('status')?.toUpperCase();
    if (urlStatus && ['ALL', 'PENDING', 'PUBLISHED', 'REJECTED'].includes(urlStatus)) {
      setStatusFilter(urlStatus as any);
    }
  }, [searchParams]);

  // Editing modal state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchAchievements = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/achievements?status=${statusFilter === 'ALL' ? '' : statusFilter}`);
    const data = await res.json();
    setAchievements(data.achievements || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAchievements();
    fetch('/api/categories')
      .then((res) => res.json())
      .then((d) => setCategories(d.categories || []));
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: string, rejectionReason?: string) => {
    const res = await fetch('/api/admin/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, rejectionReason }),
    });
    if (res.ok) {
      fetchAchievements();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    const res = await fetch('/api/admin/achievements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchAchievements();
    }
  };

  const handleSaveEdit = async (publishImmediately: boolean = false) => {
    if (!editingItem) return;
    setSavingEdit(true);

    const res = await fetch('/api/admin/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingItem,
        status: publishImmediately ? 'PUBLISHED' : editingItem.status,
      }),
    });

    setSavingEdit(false);
    if (res.ok) {
      setEditingItem(null);
      fetchAchievements();
    } else {
      alert('Failed to save changes.');
    }
  };

  const filtered = achievements.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.title?.toLowerCase().includes(term) ||
      a.personName?.toLowerCase().includes(term) ||
      a.primaryStudentRoll?.toLowerCase().includes(term) ||
      a.organizationEventName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-1">
            Moderation Cluster
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Edit & Approve Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review student and faculty achievement submissions with in-place inline editing and approval.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['PENDING', 'PUBLISHED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Title, Recipient, Roll Number, Event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {filtered.length} Records Listed
        </span>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-xs font-mono text-cyan-400 py-12 text-center animate-pulse">
          Synchronizing Moderation Desk...
        </p>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/20">
          <Award className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No achievements in this view</h3>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilter === 'PENDING'
              ? 'Great job! The pending review queue is completely clear.'
              : 'Try selecting a different status filter above.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filtered.map((ach) => (
            <div
              key={ach.id}
              className="bg-card rounded-3xl border border-border overflow-hidden shadow-subtle flex flex-col justify-between"
            >
              {/* High-Fidelity Card Preview */}
              <div className="p-3">
                <AchievementCard
                  id={ach.id}
                  title={ach.title}
                  description={ach.description}
                  categoryName={ach.category?.name || 'Honor'}
                  level={ach.level || 'NATIONAL'}
                  positionRank={ach.positionRank}
                  participationType={ach.participationType || 'SOLO'}
                  organizationEventName={ach.organizationEventName}
                  academicYear={ach.academicYear || '2025-2026'}
                  achievementDate={ach.achievementDate ? String(ach.achievementDate) : new Date().toISOString()}
                  personName={ach.personName}
                  personType={ach.personType || 'STUDENT'}
                  rollNumber={ach.primaryStudentRoll}
                  departmentName={ach.department?.name || 'Computer Science & Engineering (AI & ML)'}
                  googleDriveUrl={ach.googleDriveUrl}
                  status={ach.status}
                />
              </div>

              {/* Moderation & Editing Action Bar */}
              <div className="p-4 bg-secondary/30 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                      ach.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : ach.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ach.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
                    {ach.status === 'PUBLISHED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {ach.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-400" />}
                    <span>{ach.status}</span>
                  </span>

                  {ach.googleDriveUrl && (
                    <a
                      href={ach.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Proof Doc</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="cyan"
                    size="sm"
                    onClick={() => setEditingItem({ ...ach })}
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                  >
                    Edit Details
                  </Button>

                  {ach.status !== 'PUBLISHED' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleStatusChange(ach.id, 'PUBLISHED')}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve & Publish
                    </Button>
                  )}

                  {ach.status !== 'REJECTED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason !== null) {
                          handleStatusChange(ach.id, 'REJECTED', reason);
                        }
                      }}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ach.id)}
                    className="text-muted-foreground hover:text-destructive"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IN-REVIEW EDIT MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="In-Review Honor Editor"
        description="Modify fields directly before publishing to campus registry."
        size="xl"
      >
        {editingItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit(false);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Achievement Title</label>
              <input
                type="text"
                required
                value={editingItem.title || ''}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.personName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, personName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Student Roll Number</label>
                <input
                  type="text"
                  value={editingItem.primaryStudentRoll || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, primaryStudentRoll: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Category</label>
                <select
                  value={editingItem.categoryId || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Award / Rank</label>
                <input
                  type="text"
                  value={editingItem.positionRank || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, positionRank: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Host Organization</label>
                <input
                  type="text"
                  value={editingItem.organizationEventName || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, organizationEventName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Competition Level</label>
                <select
                  value={editingItem.level || 'COLLEGE'}
                  onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="COLLEGE">College Level</option>
                  <option value="DISTRICT">District Level</option>
                  <option value="STATE">State Level</option>
                  <option value="NATIONAL">National Level</option>
                  <option value="INTERNATIONAL">International Level</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Description</label>
              <textarea
                rows={3}
                value={editingItem.description || ''}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={savingEdit}
                onClick={() => handleSaveEdit(false)}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                loading={savingEdit}
                onClick={() => handleSaveEdit(true)}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Save & Publish Immediately
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function AdminAchievementsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 max-w-7xl mx-auto py-8">
          <div className="h-10 w-48 bg-card rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-card rounded-2xl animate-pulse border border-border/80" />
            <div className="h-64 bg-card rounded-2xl animate-pulse border border-border/80" />
            <div className="h-64 bg-card rounded-2xl animate-pulse border border-border/80" />
          </div>
        </div>
      }
    >
      <AdminAchievementsContent />
    </React.Suspense>
  );
}
