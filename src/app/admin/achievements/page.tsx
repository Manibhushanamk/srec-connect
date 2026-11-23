'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AchievementCard } from '@/components/cards/AchievementCard';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';
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
  Users,
  Plus,
  Image as ImageIcon,
  Loader2,
  Share2,
  X,
  Calendar,
} from 'lucide-react';

function AdminAchievementsContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status')?.toUpperCase() as any) || 'PENDING';
  const [achievements, setAchievements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
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

  // Teammate search & feed photo upload states in edit modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [uploadingFeedImg, setUploadingFeedImg] = useState(false);

  // Debounced search for student collaborators in directory
  useEffect(() => {
    if (!memberSearchQuery.trim() || memberSearchQuery.trim().length < 2) {
      setMemberSearchResults([]);
      setShowMemberDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(memberSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const students = (data.members || []).filter((m: any) => m.role === 'STUDENT' || m.rollNumber);
          setMemberSearchResults(students);
          setShowMemberDropdown(true);
        }
      } catch (err) {
        console.error('Failed to search students:', err);
      } finally {
        setMemberSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  const handleOpenEdit = (ach: any) => {
    const existingPost = ach.posts?.[0];
    const postMedia = existingPost?.media?.[0]?.url;
    setEditingItem({
      ...ach,
      departmentId: ach.departmentId || ach.department?.id || '',
      status: ach.status || 'PENDING',
      rejectionReason: ach.rejectionReason || '',
      title: ach.title || '',
      personName: ach.personName || ach.student?.user?.name || '',
      primaryStudentRoll: ach.primaryStudentRoll || ach.student?.rollNumber || '',
      categoryId: ach.categoryId || (categories[0]?.id || ''),
      positionRank: ach.positionRank || '',
      organizationEventName: ach.organizationEventName || '',
      level: ach.level || 'COLLEGE',
      achievementDate: ach.achievementDate ? new Date(ach.achievementDate).toISOString().split('T')[0] : '',
      academicYear: ach.academicYear || '2024-2025',
      participationType: ach.participationType || (ach.teamMembers && ach.teamMembers.length > 0 ? 'TEAM' : 'INDIVIDUAL'),
      teamName: ach.teamName || '',
      description: ach.description || '',
      googleDriveUrl: ach.googleDriveUrl || ach.certificateUrl || '',
      certificateUrl: ach.certificateUrl || ach.googleDriveUrl || '',
      teamMembers: Array.isArray(ach.teamMembers)
        ? ach.teamMembers.map((m: any) => ({
            studentId: m.studentId || '',
            rollNumber: m.rollNumber || m.student?.rollNumber || '',
            studentName: m.studentName || m.student?.user?.name || '',
            detail: m.detail || m.student?.department?.code || '',
          }))
        : [],
      postToFeed: !!existingPost,
      feedCaption: existingPost?.content || '',
      feedImageUrl: postMedia || '',
    });
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setShowMemberDropdown(false);
  };

  const handleAddTeamMember = (student: any) => {
    if (!editingItem) return;
    const currentMembers = editingItem.teamMembers || [];
    if (currentMembers.some((m: any) => m.rollNumber?.toUpperCase() === student.rollNumber?.toUpperCase())) {
      alert(`${student.name} (${student.rollNumber}) is already added to team members.`);
      return;
    }
    setEditingItem({
      ...editingItem,
      teamMembers: [
        ...currentMembers,
        {
          studentId: student.studentId,
          userId: student.userId,
          rollNumber: student.rollNumber,
          studentName: student.name,
          detail: student.detail || student.departmentName || '',
        },
      ],
      participationType: 'TEAM',
    });
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setShowMemberDropdown(false);
  };

  const handleRemoveTeamMember = (index: number) => {
    if (!editingItem) return;
    const currentMembers = editingItem.teamMembers || [];
    setEditingItem({
      ...editingItem,
      teamMembers: currentMembers.filter((_: any, i: number) => i !== index),
    });
  };

  const handleFeedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    setUploadingFeedImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditingItem({ ...editingItem, feedImageUrl: data.url });
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadingFeedImg(false);
    }
  };

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
    fetch('/api/departments?all=true')
      .then((res) => res.json())
      .then((d) => setDepartments(d.departments || []));
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
                    onClick={() => handleOpenEdit(ach)}
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
        description="Modify all honor fields, proof documents, teammates, and feed broadcast before publishing."
        size="xl"
      >
        {editingItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit(false);
            }}
            className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1"
          >
            {/* Verification Status & Department Scope */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Institutional Verification & Governance</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    editingItem.status === 'PUBLISHED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : editingItem.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {editingItem.status || 'PENDING'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Review Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editingItem.status || 'PENDING'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PENDING">⏳ In-Review / Pending Department Verification</option>
                    <option value="PUBLISHED">✅ Approved & Published to Campus Wall</option>
                    <option value="REJECTED">❌ Rejected / Evidence Incomplete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Assigned Academic Department
                  </label>
                  <select
                    value={editingItem.departmentId || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Default (CSE - AI & ML)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} — {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingItem.status === 'REJECTED' && (
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-rose-400 mb-1 font-medium">
                    Rejection Feedback / Deficiency Notice
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Certificate missing participant name or verification QR link."
                    value={editingItem.rejectionReason || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, rejectionReason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}
            </div>

            {/* Primary Achievement Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Achievement Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place in National Web3 Hackathon"
                  value={editingItem.title || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Recipient Name <span className="text-rose-400">*</span>
                  </label>
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
                    placeholder="e.g. 22091A3205"
                    value={editingItem.primaryStudentRoll || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, primaryStudentRoll: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Category <span className="text-rose-400">*</span>
                  </label>
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
                  <label className="block text-slate-300 mb-1 font-medium">Award / Position / Rank</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Prize, Winner, Finalist"
                    value={editingItem.positionRank || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, positionRank: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Host Organization / Event Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shaastra 2025, IIT Madras"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Achievement Date</label>
                  <input
                    type="date"
                    value={editingItem.achievementDate || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, achievementDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Academic Year</label>
                  <select
                    value={editingItem.academicYear || '2024-2025'}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, academicYear: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2021-2022">2021-2022</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description / Abstract</label>
                <textarea
                  rows={3}
                  placeholder="Details of the project, competition scope, technologies used..."
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Certificate Proof Document */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <DriveFileUploader
                value={editingItem.googleDriveUrl || editingItem.certificateUrl || ''}
                onChange={(url) =>
                  setEditingItem({
                    ...editingItem,
                    googleDriveUrl: url,
                    certificateUrl: url,
                  })
                }
                label="Certificate Proof Document"
                documentType="STUDENT_CERTIFICATE"
                helpText="Upload certificate directly to Google Drive, or paste existing Drive link. Shared automatically with view access for verification."
              />

              {(editingItem.googleDriveUrl || editingItem.certificateUrl) && (
                <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Attached Certificate Document
                    </span>
                    <a
                      href={editingItem.googleDriveUrl || editingItem.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <span>Open Document ↗</span>
                    </a>
                  </div>
                  {/* Visual Preview if direct image or streaming URL */}
                  {((editingItem.googleDriveUrl || editingItem.certificateUrl).match(/\.(png|jpe?g|webp|gif)$/i) ||
                    (editingItem.googleDriveUrl || editingItem.certificateUrl).includes('googleusercontent') ||
                    (editingItem.googleDriveUrl || editingItem.certificateUrl).startsWith('/api/drive/file/') ||
                    (editingItem.googleDriveUrl || editingItem.certificateUrl).startsWith('/uploads/')) && (
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-black/40 max-h-52 flex items-center justify-center p-1">
                      <img
                        src={editingItem.googleDriveUrl || editingItem.certificateUrl}
                        alt="Attached Certificate"
                        className="max-h-48 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team Members & Collaborators */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Team Members & Student Collaborators</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    When verified, this honor is automatically credited to each student's personal portfolio.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        participationType: editingItem.participationType === 'TEAM' ? 'INDIVIDUAL' : 'TEAM',
                      })
                    }
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                      editingItem.participationType === 'TEAM'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {editingItem.participationType === 'TEAM' ? 'Team Honor' : 'Solo Honor'}
                  </button>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {(editingItem.teamMembers || []).length} Selected
                  </span>
                </div>
              </div>

              {editingItem.participationType === 'TEAM' && (
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Team Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ByteForce Innovators"
                    value={editingItem.teamName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, teamName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Student Lookup Search */}
              <div className="relative">
                <label className="block text-slate-400 mb-1 text-[11px]">
                  Lookup & Add Student by Roll Number or Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type roll number (e.g. 22091A3202) or student name..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onFocus={() => memberSearchResults.length > 0 && setShowMemberDropdown(true)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {memberSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                </div>

                {showMemberDropdown && memberSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    <div className="p-2 border-b border-slate-800 text-[10px] font-semibold text-slate-400">
                      Matching Students ({memberSearchResults.length})
                    </div>
                    {memberSearchResults.map((s) => (
                      <button
                        key={s.id || s.rollNumber}
                        type="button"
                        onClick={() => handleAddTeamMember(s)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors border-b border-slate-800/50 last:border-none"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{s.name}</span>
                            {s.rollNumber && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {s.rollNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{s.detail || s.departmentName}</p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Teammates List */}
              {(editingItem.teamMembers || []).length === 0 ? (
                <div className="p-3 border border-dashed border-slate-800 rounded-xl text-center bg-slate-950/40">
                  <p className="text-[11px] text-slate-400">No additional team members added (Solo achievement)</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(editingItem.teamMembers || []).map((m: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{m.studentName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {m.rollNumber}
                        </span>
                        {m.detail && <span className="text-[10px] text-slate-400">({m.detail})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(i)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Broadcast to Campus Community Feed */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Broadcast to Campus Community Feed</h4>
                    <p className="text-[11px] text-slate-400">
                      Share this verified milestone with peers and faculty on the live campus feed.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingItem.postToFeed}
                    onChange={(e) => setEditingItem({ ...editingItem, postToFeed: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-white">Post to Feed</span>
                </label>
              </div>

              {editingItem.postToFeed && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">
                      Feed Post Description / Story (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share what inspired this project, highlights of the event, or congratulations to your teammates..."
                      value={editingItem.feedCaption || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, feedCaption: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">
                      Post Photo / Celebration Picture (Optional)
                    </label>
                    {editingItem.feedImageUrl ? (
                      <div className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                          <img src={editingItem.feedImageUrl} alt="Feed Post" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white">Attached Celebration Photo</p>
                          <p className="text-[10px] text-slate-400 truncate">{editingItem.feedImageUrl}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, feedImageUrl: '' })}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/40 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFeedImageUpload}
                          disabled={uploadingFeedImg}
                          className="hidden"
                        />
                        {uploadingFeedImg ? (
                          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading celebration photo...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium py-1">
                            <ImageIcon className="w-4 h-4" />
                            <span>Click to attach ceremony or project photo for the feed</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Mark this achievement as REJECTED?')) {
                      setEditingItem({ ...editingItem, status: 'REJECTED' });
                      handleStatusChange(editingItem.id, 'REJECTED', editingItem.rejectionReason || 'Requirements not met.');
                      setEditingItem(null);
                    }
                  }}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Reject Honor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              </div>

              <div className="flex items-center gap-2">
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
