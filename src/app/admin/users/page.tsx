'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Shield,
  GraduationCap,
  Briefcase,
  Building2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Edit,
  X,
  Save,
  User,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string; code: string } | null;
  student?: {
    id: string;
    rollNumber: string;
    batch: string;
    section: string;
    headline?: string | null;
    bio?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    skills?: string | null;
  } | null;
  faculty?: {
    id: string;
    name?: string | null;
    designation: string;
    roleCategory?: string | null;
    degrees?: string | null;
    experience?: string | null;
    cabin?: string | null;
    specialization?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    googleScholar?: string | null;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<Array<{ id: string; name: string; code: string }>>([]);

  // Form state for creating a user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STUDENT',
    rollNumber: '',
    departmentId: '',
    designation: '',
    batch: '2022-2026',
    section: 'A',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    userId: '',
    name: '',
    email: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    departmentId: '',
    avatarUrl: '',
    headline: '',
    bio: '',
    phone: '',
    student: {
      rollNumber: '',
      batch: '2022-2026',
      section: 'A',
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: '',
    },
    faculty: {
      designation: '',
      roleCategory: 'ASSISTANT_PROFESSOR',
      degrees: '',
      experience: '',
      cabin: '',
      specialization: '',
      googleScholar: '',
    },
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        role: roleFilter,
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (data.departments) {
          setDepartmentsList(data.departments);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: nextStatus }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleOpenEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditFormData({
      userId: u.id,
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'STUDENT',
      status: u.status || 'ACTIVE',
      departmentId: u.departmentId || u.department?.id || '',
      avatarUrl: u.avatarUrl || u.student?.avatarUrl || u.faculty?.avatarUrl || '',
      headline: u.headline || u.student?.headline || '',
      bio: u.bio || u.student?.bio || u.faculty?.bio || '',
      phone: u.phone || u.student?.phone || '',
      student: {
        rollNumber: u.student?.rollNumber || '',
        batch: u.student?.batch || '2022-2026',
        section: u.student?.section || 'A',
        githubUrl: u.student?.githubUrl || '',
        linkedinUrl: u.student?.linkedinUrl || '',
        portfolioUrl: u.student?.portfolioUrl || '',
      },
      faculty: {
        designation: u.faculty?.designation || (u.role === 'HOD' ? 'Professor & Head of Department' : 'Assistant Professor'),
        roleCategory: u.faculty?.roleCategory || (u.role === 'HOD' ? 'HOD' : 'ASSISTANT_PROFESSOR'),
        degrees: u.faculty?.degrees || '',
        experience: u.faculty?.experience || '',
        cabin: u.faculty?.cabin || '',
        specialization: u.faculty?.specialization || '',
        googleScholar: u.faculty?.googleScholar || '',
      },
    });
    setEditFormError(null);
    setEditSuccessMsg(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditFormError(null);
    setEditSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditFormError(data.error || 'Failed to update user details');
      } else {
        setEditSuccessMsg('User record updated successfully across the platform!');
        setTimeout(() => {
          setShowEditModal(false);
          setEditingUser(null);
          fetchUsers();
        }, 800);
      }
    } catch (err: any) {
      setEditFormError(err.message || 'Network error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create user');
      } else {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          role: 'STUDENT',
          rollNumber: '',
          departmentId: '',
          designation: '',
          batch: '2022-2026',
          section: 'A',
        });
        fetchUsers();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrashUser = async (u: UserItem) => {
    if (!confirm(`Are you sure you want to move user "${u.name || u.email}" to Trash? Their account will be deactivated and hidden from directories.`)) return;
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRASH', type: 'USER', id: u.id }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to move user to trash');
      }
    } catch (err: any) {
      alert(err.message || 'Error trashing user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            Institutional User Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage student scholars, faculty members, and administrative staff across departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/bulk-upload">
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-700 bg-slate-900/40 text-slate-300 hover:text-white">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Bulk Ingestion</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Pre-Provision User</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or JNTUA roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-xs rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="FACULTY">Faculty</option>
                <option value="HOD">HODs</option>
                <option value="WEB_MANAGER">Web Managers</option>
                <option value="ADMIN">Admins</option>
                <option value="SUPER_ADMIN">Super Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-xs rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="shrink-0 text-xs py-2">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Identifier / Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading directory records...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    No users found matching query criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (u.name || 'U').substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate max-w-[180px] sm:max-w-xs">
                            {u.name || 'Unnamed User'}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px] sm:max-w-xs">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.role === 'SUPER_ADMIN' ? 'amber' :
                          u.role === 'HOD' ? 'brand' :
                          u.role === 'FACULTY' ? 'cyan' :
                          u.role === 'WEB_MANAGER' ? 'violet' : 'slate'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.student?.rollNumber ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                          {u.student.rollNumber}
                        </span>
                      ) : u.faculty?.designation ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                          {u.faculty.designation}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {u.department?.name || u.department?.code || 'Institutional'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="text-xs py-1 px-2.5 h-auto flex items-center gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          title="Super Admin: Edit Any Details of this User"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant={u.status === 'ACTIVE' ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                          className="text-xs py-1 px-2.5 h-auto"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleTrashUser(u)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/80 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} total users)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Super Admin Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-2xl max-h-[92vh] flex flex-col border-border shadow-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border pb-3.5 flex flex-row items-center justify-between shrink-0 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Super Admin: Edit User & Academic Profile
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Modifying record for <span className="font-mono text-foreground font-semibold">{editingUser.email}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
                {editFormError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {editFormError}
                  </div>
                )}
                {editSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-semibold">
                    {editSuccessMsg}
                  </div>
                )}

                {/* 1. Account & System Role */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Account & System Role
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. Dr. Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="user@srecnandyal.edu.in"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">System Role</label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="HOD">HOD</option>
                        <option value="WEB_MANAGER">WEB_MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">Account Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">Department</label>
                      <select
                        value={editFormData.departmentId}
                        onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">No Department Assigned</option>
                        {departmentsList.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.code} — {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">Profile Avatar URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={editFormData.avatarUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="https://..."
                      />
                      {editFormData.avatarUrl && (
                        <div className="w-8 h-8 rounded-full border border-border overflow-hidden shrink-0">
                          <img src={editFormData.avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Statement */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Contact & Statement
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="user-headline" className="block text-xs font-semibold mb-1 text-foreground">Headline</label>
                      <input
                        id="user-headline"
                        type="text"
                        value={editFormData.headline}
                        onChange={(e) => setEditFormData({ ...editFormData, headline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="e.g. Edge AI Specialist • Professor"
                      />
                    </div>
                    <div>
                      <label htmlFor="user-phone" className="block text-xs font-semibold mb-1 text-foreground">Phone Number</label>
                      <input
                        id="user-phone"
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="user-bio" className="block text-xs font-semibold mb-1 text-foreground">Bio Statement</label>
                    <textarea
                      id="user-bio"
                      rows={3}
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      placeholder="Academic biography, accomplishments, research interests..."
                    />
                  </div>
                </div>

                {/* 3. Student Credentials (shown for Student role or users with Student record) */}
                {(editFormData.role === 'STUDENT' || editingUser.student) && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-secondary/30 border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-border/60 pb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Student Academic Credentials
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Roll Number *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.student.rollNumber}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            student: { ...editFormData.student, rollNumber: e.target.value.toUpperCase() }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background font-mono uppercase text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="e.g. 22091A3205"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Academic Batch</label>
                        <input
                          type="text"
                          value={editFormData.student.batch}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            student: { ...editFormData.student, batch: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="2022-2026"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Section</label>
                        <input
                          type="text"
                          value={editFormData.student.section}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            student: { ...editFormData.student, section: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="A"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">GitHub URL</label>
                        <input
                          type="url"
                          value={editFormData.student.githubUrl}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            student: { ...editFormData.student, githubUrl: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">LinkedIn URL</label>
                        <input
                          type="url"
                          value={editFormData.student.linkedinUrl}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            student: { ...editFormData.student, linkedinUrl: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Portfolio URL</label>
                        <input
                          type="url"
                          value={editFormData.student.portfolioUrl}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            student: { ...editFormData.student, portfolioUrl: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Faculty / HOD Credentials (shown for Faculty/HOD role or users with Faculty record) */}
                {(editFormData.role === 'FACULTY' || editFormData.role === 'HOD' || editingUser.faculty) && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-secondary/30 border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-border/60 pb-1 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Faculty & Institutional Credentials
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Official Designation *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.faculty.designation}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, designation: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Professor & Head of Department"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Role Category</label>
                        <select
                          value={editFormData.faculty.roleCategory}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, roleCategory: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="HOD">Head of Department (HOD)</option>
                          <option value="PROFESSOR">Professor</option>
                          <option value="ASSOCIATE_PROFESSOR">Associate Professor</option>
                          <option value="ASSISTANT_PROFESSOR">Assistant Professor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Degrees & Qualifications</label>
                        <input
                          type="text"
                          value={editFormData.faculty.degrees}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, degrees: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Ph.D., M.Tech"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Total Experience</label>
                        <input
                          type="text"
                          value={editFormData.faculty.experience}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, experience: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="15+ Years"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Office / Cabin</label>
                        <input
                          type="text"
                          value={editFormData.faculty.cabin}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, cabin: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Room 204, AIML Wing"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Research Specializations</label>
                        <input
                          type="text"
                          value={editFormData.faculty.specialization}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, specialization: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Edge AI, Distributed Computing, Deep Learning"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-foreground">Google Scholar URL</label>
                        <input
                          type="url"
                          value={editFormData.faculty.googleScholar}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            faculty: { ...editFormData.faculty, googleScholar: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="https://scholar.google.com/..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-border flex items-center justify-between shrink-0 bg-secondary/30">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSavingEdit} className="gap-2">
                  <Save className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Saving All Changes...' : 'Save All Changes'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Pre-Provision User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg border-border shadow-2xl bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Pre-Provision Institutional Account
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  {formError}
                </div>
              )}
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">Institutional Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="user@srecnandyal.edu.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="HOD">HOD</option>
                      <option value="WEB_MANAGER">Web Manager</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>

                  {formData.role === 'STUDENT' ? (
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">JNTUA Roll Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 22091A3205"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-foreground">Designation</label>
                      <input
                        type="text"
                        placeholder="Assistant Professor"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Provisioning...' : 'Confirm Provisioning'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
