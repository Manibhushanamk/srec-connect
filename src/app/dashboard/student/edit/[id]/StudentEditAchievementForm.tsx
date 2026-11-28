'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { createCustomCategoryOption } from '@/lib/client-creatable';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Users,
  Search,
  Clock,
  Info,
} from 'lucide-react';

interface TeamMember {
  studentId?: string;
  userId?: string;
  rollNumber: string;
  studentName: string;
}

interface StudentEditAchievementFormProps {
  achievement: {
    id: string;
    title: string;
    description: string | null;
    categoryId: string;
    level: string;
    positionRank: string | null;
    organizationEventName: string;
    academicYear: string;
    achievementDate: string;
    googleDriveUrl: string;
    teamMembers: TeamMember[];
    status: string;
    rejectionReason?: string | null;
  };
  categories: { id: string; name: string }[];
}

export function StudentEditAchievementForm({
  achievement,
  categories: initialCategories,
}: StudentEditAchievementFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [formData, setFormData] = useState({
    title: achievement.title,
    description: achievement.description || '',
    categoryId: achievement.categoryId,
    level: achievement.level,
    positionRank: achievement.positionRank || '',
    organizationEventName: achievement.organizationEventName,
    academicYear: achievement.academicYear,
    achievementDate: achievement.achievementDate,
    googleDriveUrl: achievement.googleDriveUrl,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(achievement.teamMembers || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Search debounced query for students in directory
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const students = (data.members || []).filter((m: any) => m.role === 'STUDENT' || m.rollNumber);
          setSearchResults(students);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Failed to search students:', err);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (student: any) => {
    if (teamMembers.some((m) => m.rollNumber.toUpperCase() === student.rollNumber.toUpperCase())) {
      alert(`${student.name} (${student.rollNumber}) is already in team members.`);
      return;
    }
    setTeamMembers([
      ...teamMembers,
      {
        studentId: student.studentId,
        userId: student.userId,
        rollNumber: student.rollNumber,
        studentName: student.name,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.organizationEventName.trim() || !formData.categoryId) {
      setError('Title, Category, and Event Name are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/achievements/submit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: achievement.id,
          ...formData,
          teamMembers: teamMembers.filter((m) => m.rollNumber.trim().length > 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update achievement');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/student');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error('[Student Edit Form Error]:', err);
      setError(err.message || 'Error saving changes.');
      setLoading(false);
    }
  };

  return (
    <Card variant="glass" className="p-6 md:p-8">
      {/* Status banner */}
      {achievement.status === 'RESUBMISSION_REQUIRED' && achievement.rejectionReason && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm">Reviewer Requested Resubmission:</span>
            <p className="leading-relaxed">{achievement.rejectionReason}</p>
            <p className="text-slate-400 pt-1">
              Saving updates will automatically move this record back to <strong>PENDING</strong> for review.
            </p>
          </div>
        </div>
      )}

      {achievement.status === 'PENDING' && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Clock className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            This submission is currently <strong>in review</strong>. You can update details until it is approved.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Updates saved successfully! Redirecting to dashboard...</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Achievement / Honor Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. First Prize in National Level AI Hackathon"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Category & Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Category *</label>
            <CreatableSelect
              required
              value={formData.categoryId}
              onChange={(val) => setFormData({ ...formData, categoryId: val })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select Category"
              customOptionLabel="+ Custom Category..."
              customPlaceholder="Type custom category..."
              onCreateCustom={async (name) => {
                const created = await createCustomCategoryOption(name, 'ACHIEVEMENT');
                if (created) {
                  setCategories((prev) =>
                    prev.some((c) => c.id === created.value) ? prev : [...prev, { id: created.value, name: created.label }]
                  );
                }
                return created;
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Level *</label>
            <CreatableSelect
              required
              value={formData.level}
              onChange={(val) => setFormData({ ...formData, level: val })}
              options={[
                { value: 'COLLEGE', label: 'College / Intra-Campus' },
                { value: 'INTER_COLLEGE', label: 'Inter-College' },
                { value: 'STATE', label: 'State Level' },
                { value: 'NATIONAL', label: 'National Level' },
                { value: 'INTERNATIONAL', label: 'International Level' },
              ]}
              customOptionLabel="+ Custom Level..."
              customPlaceholder="Type custom level..."
            />
          </div>
        </div>

        {/* Event Name & Position Rank */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Organizing Event / Body *
            </label>
            <input
              type="text"
              required
              value={formData.organizationEventName}
              onChange={(e) =>
                setFormData({ ...formData, organizationEventName: e.target.value })
              }
              placeholder="e.g. Smart India Hackathon / IIT Bombay"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Position / Rank / Award
            </label>
            <input
              type="text"
              value={formData.positionRank}
              onChange={(e) => setFormData({ ...formData, positionRank: e.target.value })}
              placeholder="e.g. 1st Place, Finalist, Special Mention"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Date & Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Achievement Date *
            </label>
            <input
              type="date"
              required
              value={formData.achievementDate}
              onChange={(e) => setFormData({ ...formData, achievementDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Academic Year *
            </label>
            <CreatableSelect
              required
              value={formData.academicYear}
              onChange={(val) => setFormData({ ...formData, academicYear: val })}
              options={[
                { value: '2026-2027', label: '2026-2027' },
                { value: '2025-2026', label: '2025-2026' },
                { value: '2024-2025', label: '2024-2025' },
                { value: '2023-2024', label: '2023-2024' },
                { value: '2022-2023', label: '2022-2023' },
              ]}
              customOptionLabel="+ Custom Academic Year..."
              customPlaceholder="e.g. 2027-2028"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description / Summary
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Summarize project problem statement, technology stack, and outcomes..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Certificate Upload with Google Drive */}
        <div className="pt-2">
          <DriveFileUploader
            value={formData.googleDriveUrl}
            onChange={(url) => setFormData({ ...formData, googleDriveUrl: url })}
            label="Certificate / Proof Document"
            helpText="Upload new certificate directly to your Google Drive folder or provide link."
          />
        </div>

        {/* Team Members Section */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Team Members / Co-Authors (Optional)
          </label>

          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by roll number or name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-xs focus:border-brand-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searching && (
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin absolute right-3 top-2.5" />
            )}

            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                {searchResults.map((s) => (
                  <button
                    key={s.id || s.rollNumber}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center justify-between border-b border-slate-700/50 last:border-0"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{s.name}</span>
                      <span className="text-slate-400 ml-2">({s.rollNumber})</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-brand-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {teamMembers.length > 0 && (
            <div className="space-y-2">
              {teamMembers.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-brand-400" />
                    <span className="font-semibold text-slate-200">{m.studentName}</span>
                    <span className="text-slate-400">({m.rollNumber})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTeamMember(idx)}
                    className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <Link href="/dashboard/student">
            <Button variant="ghost" size="sm" type="button" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={loading}
            className="gap-2 px-6 shadow-lg shadow-brand-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save & Update Request
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
