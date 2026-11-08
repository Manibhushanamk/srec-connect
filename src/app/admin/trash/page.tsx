'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Users,
  GraduationCap,
  Briefcase,
  Award,
  Calendar,
  MessageSquare,
  AlertCircle,
  Megaphone,
  Search,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatTimeAgo } from '@/lib/utils';

interface TrashedItem {
  id: string;
  type: 'USER' | 'STUDENT' | 'FACULTY' | 'ACHIEVEMENT' | 'EVENT' | 'POST' | 'INCIDENT' | 'ANNOUNCEMENT';
  title: string;
  subtitle?: string;
  deletedAt: string;
}

interface TrashCounts {
  all: number;
  users: number;
  students: number;
  faculty: number;
  achievements: number;
  events: number;
  posts: number;
  incidents: number;
  announcements: number;
}

export default function AdminTrashPage() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [counts, setCounts] = useState<TrashCounts>({
    all: 0,
    users: 0,
    students: 0,
    faculty: 0,
    achievements: 0,
    events: 0,
    posts: 0,
    incidents: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [itemToPurge, setItemToPurge] = useState<TrashedItem | null>(null);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trash?type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (e) {
      console.error('Failed to load trash:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [activeTab]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRestore = async (item: TrashedItem) => {
    setActionInProgress(item.id);
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', type: item.type, id: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Restored "${item.title}" back to active status.`);
        fetchTrash();
      } else {
        alert(data.error || 'Failed to restore item');
      }
    } catch (e: any) {
      alert(e.message || 'Error restoring item');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmPurge = async () => {
    if (!itemToPurge) return;
    setActionInProgress(itemToPurge.id);
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PURGE', type: itemToPurge.type, id: itemToPurge.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Permanently deleted "${itemToPurge.title}".`);
        setItemToPurge(null);
        fetchTrash();
      } else {
        alert(data.error || 'Failed to permanently delete item');
      }
    } catch (e: any) {
      alert(e.message || 'Error purging item');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmEmpty = async () => {
    setActionInProgress('empty-all');
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EMPTY_TRASH',
          type: activeTab === 'ALL' ? undefined : activeTab,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Trash emptied permanently.');
        setShowEmptyModal(false);
        fetchTrash();
      } else {
        alert(data.error || 'Failed to empty trash');
      }
    } catch (e: any) {
      alert(e.message || 'Error emptying trash');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.type.toLowerCase().includes(q)
    );
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'STUDENT':
        return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      case 'FACULTY':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'ACHIEVEMENT':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'POST':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'INCIDENT':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-sky-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'USER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'STUDENT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'FACULTY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ACHIEVEMENT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'EVENT':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'POST':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'INCIDENT':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'ANNOUNCEMENT':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/30 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground">{toastMessage}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin</span>
            </Link>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Super Admin Clearance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Trash2 className="w-7 h-7 text-rose-500" />
            <span>Trash &amp; System Recovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Soft-deleted items across the portal are safely staged here. Trashed records are immediately hidden from public directories, home feed, and search. Permanently deleting an item erases it forever from the institutional database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchTrash}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {counts.all > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowEmptyModal(true)}
              className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty {activeTab === 'ALL' ? 'All Trash' : activeTab}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total In Trash</span>
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{counts.all}</p>
          <span className="text-[11px] text-muted-foreground">Staged for purge</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Accounts</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {counts.users + counts.students + counts.faculty}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {counts.users} Users, {counts.students} Students, {counts.faculty} Faculty
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Academic Records</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {counts.achievements + counts.events}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {counts.achievements} Honors, {counts.events} Events
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Feed &amp; Governance</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {counts.posts + counts.incidents + counts.announcements}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {counts.posts} Posts, {counts.incidents} Complaints, {counts.announcements} Notices
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Category Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-secondary/40 border border-border rounded-2xl">
            {[
              { id: 'ALL', label: 'All Artifacts', count: counts.all },
              { id: 'USER', label: 'Users', count: counts.users },
              { id: 'STUDENT', label: 'Students', count: counts.students },
              { id: 'FACULTY', label: 'Faculty', count: counts.faculty },
              { id: 'ACHIEVEMENT', label: 'Achievements', count: counts.achievements },
              { id: 'EVENT', label: 'Events', count: counts.events },
              { id: 'POST', label: 'Feed Posts', count: counts.posts },
              { id: 'INCIDENT', label: 'Grievances', count: counts.incidents },
              { id: 'ANNOUNCEMENT', label: 'Notices', count: counts.announcements },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter trashed items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Trashed Items List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-primary animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">Scanning institutional trash registry...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Trash is Empty</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? 'No trashed artifacts matched your search query.'
                : 'All entities in this category are active. There are zero soft-deleted artifacts.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-secondary/60 border border-border flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeClass(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Deleted {formatTimeAgo(item.deletedAt)}</span>
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {item.title}
                    </h4>

                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Restore & Permanent Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={actionInProgress === item.id}
                    onClick={() => handleRestore(item)}
                    className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Restore item back to active campus portal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionInProgress === item.id}
                    onClick={() => setItemToPurge(item)}
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Delete permanently from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Forever</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Confirm Single Purge */}
      <Modal
        isOpen={!!itemToPurge}
        onClose={() => setItemToPurge(null)}
        title="Permanent Hard Deletion"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Irreversible Action</p>
              <p className="text-[11px] text-rose-400/90 mt-0.5">
                This item will be permanently wiped from the SREC PostgreSQL database. This action cannot be undone.
              </p>
            </div>
          </div>

          {itemToPurge && (
            <div className="p-3 rounded-xl border border-border bg-secondary/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Target {itemToPurge.type}:
              </span>
              <p className="text-xs font-bold text-foreground">{itemToPurge.title}</p>
              {itemToPurge.subtitle && (
                <p className="text-[11px] text-muted-foreground">{itemToPurge.subtitle}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setItemToPurge(null)}
              disabled={actionInProgress === itemToPurge?.id}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmPurge}
              disabled={actionInProgress === itemToPurge?.id}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {actionInProgress === itemToPurge?.id ? 'Purging...' : 'Yes, Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Confirm Empty Trash */}
      <Modal
        isOpen={showEmptyModal}
        onClose={() => setShowEmptyModal(false)}
        title="Empty Trash & Purge Staged Artifacts"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Warning: Wiping {activeTab === 'ALL' ? 'All' : activeTab} Trash</p>
              <p className="text-[11px] text-rose-400/90 mt-0.5">
                Are you sure you want to permanently erase all {counts.all} soft-deleted artifacts? They will be removed from all institutional audit logs and storage.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEmptyModal(false)}
              disabled={actionInProgress === 'empty-all'}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmEmpty}
              disabled={actionInProgress === 'empty-all'}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {actionInProgress === 'empty-all' ? 'Purging All...' : 'Yes, Empty Trash Now'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
