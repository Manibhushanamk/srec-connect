'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Users,
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  ArrowRight,
  Shield,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  fullName: string;
  shortName?: string | null;
  description?: string | null;
  icon?: string | null;
  hodName?: string | null;
  hodEmail?: string | null;
  hodPhone?: string | null;
  intake?: number | null;
  established?: number | null;
  displayOrder?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
    faculty: number;
    achievements: number;
    users: number;
  };
}

export default function AdminDepartmentsPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isSuperAdmin = sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ADMIN';

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add Department Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [addFormData, setAddFormData] = useState({
    code: '',
    name: '',
    fullName: '',
    shortName: '',
    description: '',
    icon: 'BookOpen',
    hodName: '',
    hodEmail: '',
    hodPhone: '',
    intake: 60,
    established: 2024,
    displayOrder: 12,
  });

  // Edit Department Modal
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/departments?all=true');
      const data = await res.json();
      if (data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    setAddFormError(null);

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddFormError(data.error || 'Failed to create department');
        return;
      }

      setShowAddModal(false);
      setAddFormData({
        code: '',
        name: '',
        fullName: '',
        shortName: '',
        description: '',
        icon: 'BookOpen',
        hodName: '',
        hodEmail: '',
        hodPhone: '',
        intake: 60,
        established: 2024,
        displayOrder: 12,
      });
      fetchDepartments();
    } catch (err: any) {
      setAddFormError(err.message || 'Network error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setIsSubmittingEdit(true);
    setEditFormError(null);

    try {
      const res = await fetch('/api/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDept),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditFormError(data.error || 'Failed to update department');
        return;
      }

      setEditingDept(null);
      fetchDepartments();
    } catch (err: any) {
      setEditFormError(err.message || 'Network error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleToggleActive = async (dept: DepartmentItem) => {
    const nextActive = !dept.isActive;
    const actionLabel = nextActive ? 'Reactivate' : 'Deactivate / Remove';
    const warningMsg = nextActive
      ? `Reactivate department "${dept.name}" (${dept.code})? It will become visible across student registrations and honors.`
      : `Deactivate department "${dept.name}" (${dept.code})? It has ${dept._count?.students || 0} students and ${dept._count?.faculty || 0} faculty. Historical student portfolios will remain fully intact.`;

    if (!confirm(warningMsg)) return;

    try {
      const res = await fetch('/api/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dept.id, isActive: nextActive }),
      });

      if (res.ok) {
        fetchDepartments();
      } else {
        const err = await res.json();
        alert(err.error || `Failed to ${actionLabel.toLowerCase()} department`);
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.code.toLowerCase().includes(search.toLowerCase()) ||
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (dept.hodName && dept.hodName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? dept.isActive
        : !dept.isActive;

    return matchesSearch && matchesStatus;
  });

  const totalStudentsCount = departments.reduce((acc, d) => acc + (d._count?.students || 0), 0);
  const totalFacultyCount = departments.reduce((acc, d) => acc + (d._count?.faculty || 0), 0);
  const activeCount = departments.filter((d) => d.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-cyan-400" />
              Academic Department Registry
            </h1>
            <Badge variant="cyan" size="sm">
              All 11 Departments
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            College-wide governance: add, modify, configure, or remove academic departments across Santhiram Engineering College.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Command Center</span>
            </Button>
          </Link>
          {isSuperAdmin && (
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 shadow-lg shadow-cyan-500/20">
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sovereign Authority Scope Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Sovereign College-Wide Department Control</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Super Admin Only
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Super Administrators can add new engineering/management branches or safely deactivate existing departments while preserving all historical student portfolios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono">
          <span>Active: <strong className="text-emerald-400">{activeCount}</strong> / {departments.length}</span>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="border-slate-800 bg-slate-950/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Total Branches</p>
              <p className="text-lg font-extrabold text-white">{departments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 uppercase font-bold">Active Branches</p>
              <p className="text-lg font-extrabold text-emerald-300">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-slate-800 bg-slate-950/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Enrolled Students</p>
              <p className="text-lg font-extrabold text-white">{totalStudentsCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-slate-800 bg-slate-950/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Faculty Members</p>
              <p className="text-lg font-extrabold text-white">{totalFacultyCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card variant="glass" className="border-slate-800 bg-slate-950/60">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search departments by code, name, or HOD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses ({departments.length})</option>
                <option value="ACTIVE">Active Only ({activeCount})</option>
                <option value="INACTIVE">Deactivated Only ({departments.length - activeCount})</option>
              </select>

              <Button variant="secondary" size="sm" onClick={fetchDepartments} className="text-xs py-2">
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-xs text-slate-400">Loading college departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card variant="glass" className="border-slate-800 p-8 text-center bg-slate-950/40">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Departments Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new department.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <Card
              key={dept.id}
              variant="glass"
              className={`border transition-all flex flex-col justify-between ${
                dept.isActive
                  ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  : 'border-rose-500/20 bg-rose-950/10 opacity-70'
              }`}
            >
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{dept.icon || '🏛️'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 text-sm">{dept.code}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            dept.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {dept.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{dept.name}</h3>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingDept(dept)}
                        className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Edit Department"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(dept)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          dept.isActive
                            ? 'border-slate-700 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={dept.isActive ? 'Deactivate / Remove' : 'Restore Department'}
                      >
                        {dept.isActive ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-3 pb-4 space-y-3 text-xs">
                {/* HOD Information */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Head of Department:</span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {dept.hodName || 'Not Appointed'}
                    </span>
                  </div>
                  {dept.hodEmail && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{dept.hodEmail}</span>
                    </div>
                  )}
                  {dept.hodPhone && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{dept.hodPhone}</span>
                    </div>
                  )}
                </div>

                {/* Academic Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Annual Intake</span>
                    <span className="font-bold text-white font-mono">{dept.intake || 60} Seats</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Established</span>
                    <span className="font-bold text-white font-mono">{dept.established || 2022}</span>
                  </div>
                </div>

                {/* Enrolled Counts Bar */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    <strong className="text-white font-mono">{dept._count?.students || 0}</strong> Students
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                    <strong className="text-white font-mono">{dept._count?.faculty || 0}</strong> Faculty
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <strong className="text-white font-mono">{dept._count?.achievements || 0}</strong> Honors
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Academic Department"
        description="Provision a new college department with permanent sovereign code and HOD oversight."
        size="lg"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
          {addFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {addFormError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Department Code * <span className="text-slate-500 font-mono">(e.g. AIDS, CSBS, ROBO)</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AIDS"
                value={addFormData.code}
                onChange={(e) => setAddFormData({ ...addFormData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Short Name</label>
              <input
                type="text"
                placeholder="e.g. AI & DS"
                value={addFormData.shortName}
                onChange={(e) => setAddFormData({ ...addFormData, shortName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Artificial Intelligence & Data Science"
              value={addFormData.name}
              onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Full Institutional Name</label>
            <input
              type="text"
              placeholder="e.g. Department of Artificial Intelligence & Data Science"
              value={addFormData.fullName}
              onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">HOD Name</label>
              <input
                type="text"
                placeholder="Dr. Full Name"
                value={addFormData.hodName}
                onChange={(e) => setAddFormData({ ...addFormData, hodName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">HOD Email</label>
              <input
                type="email"
                placeholder="hod.dept@srec.ac.in"
                value={addFormData.hodEmail}
                onChange={(e) => setAddFormData({ ...addFormData, hodEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">HOD Phone</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={addFormData.hodPhone}
                onChange={(e) => setAddFormData({ ...addFormData, hodPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Annual Intake Seats</label>
              <input
                type="number"
                min={10}
                max={480}
                value={addFormData.intake}
                onChange={(e) => setAddFormData({ ...addFormData, intake: parseInt(e.target.value, 10) || 60 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Established Year</label>
              <input
                type="number"
                min={2000}
                max={2030}
                value={addFormData.established}
                onChange={(e) => setAddFormData({ ...addFormData, established: parseInt(e.target.value, 10) || 2024 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Icon / Emoji</label>
              <input
                type="text"
                placeholder="🤖, 💻, or BookOpen"
                value={addFormData.icon}
                onChange={(e) => setAddFormData({ ...addFormData, icon: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Department Description / Overview</label>
            <textarea
              rows={2}
              placeholder="Academic goals, lab facilities, and industry alignments..."
              value={addFormData.description}
              onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>{isSubmittingAdd ? 'Provisioning Department...' : 'Create Department'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEPARTMENT MODAL */}
      <Modal
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        title={editingDept ? `Configure Department: ${editingDept.code}` : 'Edit Department'}
        description="Update department metadata, HOD appointment, intake capacity, and status."
        size="lg"
      >
        {editingDept && (
          <form onSubmit={handleUpdateDepartment} className="space-y-4 text-xs">
            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {editFormError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Department Code (Immutable Anchor)</label>
                <input
                  type="text"
                  disabled
                  value={editingDept.code}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Short Name</label>
                <input
                  type="text"
                  value={editingDept.shortName || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, shortName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Department Name *</label>
              <input
                type="text"
                required
                value={editingDept.name}
                onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Full Institutional Name</label>
              <input
                type="text"
                value={editingDept.fullName || ''}
                onChange={(e) => setEditingDept({ ...editingDept, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">HOD Name</label>
                <input
                  type="text"
                  value={editingDept.hodName || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, hodName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">HOD Email</label>
                <input
                  type="email"
                  value={editingDept.hodEmail || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, hodEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">HOD Phone</label>
                <input
                  type="tel"
                  value={editingDept.hodPhone || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, hodPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Annual Intake Seats</label>
                <input
                  type="number"
                  value={editingDept.intake || 60}
                  onChange={(e) =>
                    setEditingDept({ ...editingDept, intake: parseInt(e.target.value, 10) || 60 })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Established Year</label>
                <input
                  type="number"
                  value={editingDept.established || 2022}
                  onChange={(e) =>
                    setEditingDept({ ...editingDept, established: parseInt(e.target.value, 10) || 2022 })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Display Order</label>
                <input
                  type="number"
                  value={editingDept.displayOrder || 0}
                  onChange={(e) =>
                    setEditingDept({ ...editingDept, displayOrder: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Department Description</label>
              <textarea
                rows={2}
                value={editingDept.description || ''}
                onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant={editingDept.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  handleToggleActive(editingDept);
                  setEditingDept(null);
                }}
              >
                {editingDept.isActive ? 'Deactivate Branch' : 'Reactivate Branch'}
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingDept(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmittingEdit} className="gap-2">
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingEdit ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
