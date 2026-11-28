'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  BookOpen,
  Send,
  CheckCircle2,
  Search,
  Users,
  Image as ImageIcon,
  Sparkles,
  X,
  Share2,
  Upload,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';
import { useSession } from 'next-auth/react';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { createCustomCategoryOption, removeCategoryOption } from '@/lib/client-creatable';
import { canManageCategories } from '@/lib/admin-auth';

export default function FacultySubmitRecordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const canDeleteCategory = canManageCategories((session?.user as any)?.role);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    level: 'INTERNATIONAL',
    positionRank: 'First Author',
    organizationEventName: '',
    academicYear: '2025-2026',
    achievementDate: new Date().toISOString().split('T')[0],
    googleDriveUrl: '',
    doiOrIsbn: '',
    grantAmount: '',
    collaboratorStudents: '',
  });

  // Guided student collaborators
  const [teamMembers, setTeamMembers] = useState<{
    studentId?: string;
    userId?: string;
    rollNumber: string;
    studentName: string;
    detail?: string;
  }[]>([]);

  // Search state for students
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Broadcast to Community Feed State
  const [postToFeed, setPostToFeed] = useState(true);
  const [feedCaption, setFeedCaption] = useState('');
  const [feedImageUrl, setFeedImageUrl] = useState('');
  const [uploadingFeedImg, setUploadingFeedImg] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

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
      alert(`${student.name} (${student.rollNumber}) is already added.`);
      return;
    }
    setTeamMembers([
      ...teamMembers,
      {
        studentId: student.studentId,
        userId: student.userId,
        rollNumber: student.rollNumber,
        studentName: student.name,
        detail: student.detail,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleFeedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        setFeedImageUrl(data.url);
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setUploadingFeedImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const studentSummary = teamMembers.map((m) => `${m.rollNumber} (${m.studentName})`).join(', ');

    const payload = {
      ...formData,
      description: [
        formData.description,
        formData.doiOrIsbn ? `DOI / ISBN: ${formData.doiOrIsbn}` : null,
        formData.grantAmount ? `Sanctioned Grant: ₹${formData.grantAmount}` : null,
        studentSummary ? `Student Co-Authors & Research Scholars: ${studentSummary}` : null,
      ].filter(Boolean).join('\n\n'),
      teamMembers: teamMembers.map((m) => ({
        studentId: m.studentId,
        userId: m.userId,
        rollNumber: m.rollNumber,
        studentName: m.studentName,
      })),
      postToFeed,
      feedCaption: feedCaption || undefined,
      feedImageUrl: feedImageUrl || undefined,
    };

    const res = await fetch('/api/achievements/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to submit faculty record. Please verify all fields.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <AppHeader />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8 border-emerald-500/30 bg-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Academic Record Submitted!</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Your research publication, patent, or academic record has been successfully logged. It is now published directly to your institutional profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/profile">
                <Button variant="primary" size="md" className="w-full">
                  View My Profile
                </Button>
              </Link>
              <Link href="/achievements">
                <Button variant="secondary" size="md" className="w-full">
                  View Verified Achievements
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <Link
            href="/achievements"
            className="text-xs text-primary hover:underline font-medium"
          >
            View Achievements Directory &rarr;
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" /> HOD & Faculty Research Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Record Research Paper, Patent, Grant or Honor
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Submit peer-reviewed publications, intellectual property, sanctioned grants, or guided student accomplishments to your institutional profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-card border-border space-y-5">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Record Title / Paper Title / Patent Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Deep Learning Approaches in Precision Agriculture (IEEE Access)"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryId" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Category *
                </label>
                <CreatableSelect
                  id="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={(val) => setFormData({ ...formData, categoryId: val })}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select category..."
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
                  onRemoveOption={
                    canDeleteCategory
                      ? async (opt) => {
                          const ok = await removeCategoryOption(opt);
                          if (ok) {
                            setCategories((prev) => prev.filter((c) => c.id !== opt.value));
                          }
                          return ok;
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label htmlFor="level" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Scope / Impact Level *
                </label>
                <CreatableSelect
                  id="level"
                  required
                  value={formData.level}
                  onChange={(val) => setFormData({ ...formData, level: val })}
                  options={[
                    { value: 'INTERNATIONAL', label: 'International (Scopus / SCI / IEEE)' },
                    { value: 'NATIONAL', label: 'National (UGC Care / DST / AICTE)' },
                    { value: 'STATE', label: 'State / Regional Level' },
                    { value: 'COLLEGE', label: 'Institutional / College Level' },
                  ]}
                  customOptionLabel="+ Custom Level..."
                  customPlaceholder="Type custom scope level..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="positionRank" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Designation / Role in Work
                </label>
                <input
                  type="text"
                  id="positionRank"
                  value={formData.positionRank}
                  onChange={(e) => setFormData({ ...formData, positionRank: e.target.value })}
                  placeholder="e.g. Principal Investigator, First Author, Co-Author"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label htmlFor="organizationEventName" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Publisher / Journal / Grant Agency *
                </label>
                <input
                  type="text"
                  id="organizationEventName"
                  required
                  value={formData.organizationEventName}
                  onChange={(e) => setFormData({ ...formData, organizationEventName: e.target.value })}
                  placeholder="e.g. IEEE Transactions on Neural Networks, DST SERB"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="achievementDate" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Publication / Grant Date *
                </label>
                <input
                  type="date"
                  id="achievementDate"
                  required
                  value={formData.achievementDate}
                  onChange={(e) => setFormData({ ...formData, achievementDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label htmlFor="academicYear" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Academic Year *
                </label>
                <CreatableSelect
                  id="academicYear"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doiOrIsbn" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  DOI / ISBN / Patent Number
                </label>
                <input
                  type="text"
                  id="doiOrIsbn"
                  value={formData.doiOrIsbn}
                  onChange={(e) => setFormData({ ...formData, doiOrIsbn: e.target.value })}
                  placeholder="e.g. 10.1109/ICAIVC.2026.104231 or 202641012345"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              <div>
                <label htmlFor="grantAmount" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Sanctioned Grant Amount (₹) <span className="text-muted-foreground font-normal">(If funded project)</span>
                </label>
                <input
                  type="text"
                  id="grantAmount"
                  value={formData.grantAmount}
                  onChange={(e) => setFormData({ ...formData, grantAmount: e.target.value })}
                  placeholder="e.g. 15,00,000 (DST-SERB / AICTE RPS)"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Student Co-Authors & Research Scholars with Student Directory Lookup */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                    Student Scholars Guided / Co-Authors
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Select students from the directory. This publication/honor will automatically be credited to each student&apos;s verified portfolio.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-auto">
                  {teamMembers.length} Linked
                </span>
              </div>

              {/* Student Search Input & Dropdown */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search student by roll number (e.g. 22091A3201) or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-border/40 text-[11px] font-semibold text-muted-foreground">
                      Matching Enrolled Students ({searchResults.length})
                    </div>
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-muted flex items-center justify-between gap-3 transition-colors border-b border-border/20 last:border-none"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate">{s.name}</span>
                            {s.rollNumber && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {s.rollNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{s.detail || s.departmentName}</p>
                        </div>
                        <Plus className="w-4 h-4 text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Student Co-Authors */}
              {teamMembers.length > 0 && (
                <div className="space-y-2 pt-1">
                  {teamMembers.map((member, i) => (
                    <div
                      key={member.rollNumber}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border hover:border-border/80 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {member.studentName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground truncate">
                              {member.studentName}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {member.rollNumber}
                            </span>
                          </div>
                          {member.detail && (
                            <p className="text-[11px] text-muted-foreground truncate">{member.detail}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(i)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                        title="Remove student co-author"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Abstract / Research Summary
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key contributions, methodology, impact factor, journal volume, and conference highlights..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <DriveFileUploader
              value={formData.googleDriveUrl}
              onChange={(url) => setFormData({ ...formData, googleDriveUrl: url })}
              label="Manuscript / Proof Document"
              documentType="FACULTY_PUBLICATION"
              helpText="Upload paper, patent proof, or certificate directly to Google Drive. Automatically shared with view access."
            />
          </Card>

          {/* Broadcast to Campus Community Feed Card */}
          <Card className="p-6 bg-card border-border space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-500" />
                  <span>Broadcast to Campus Community Feed</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Publish this academic milestone directly to the department social feed for faculty and student visibility.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={postToFeed}
                  onChange={(e) => setPostToFeed(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-semibold text-foreground">Post to Feed</span>
              </label>
            </div>

            {postToFeed && (
              <div className="space-y-4 pt-1">
                <div>
                  <label htmlFor="feedCaption" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Feed Post Caption / Announcement (Optional)
                  </label>
                  <textarea
                    id="feedCaption"
                    rows={3}
                    placeholder="Briefly describe the key milestone, practical impact, or acknowledge student co-authors..."
                    value={feedCaption}
                    onChange={(e) => setFeedCaption(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Post Photo / Certificate Cover (Optional)
                  </label>
                  {feedImageUrl ? (
                    <div className="flex items-center gap-4 p-3 bg-secondary/30 border border-border rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-slate-950 shrink-0">
                        <img src={feedImageUrl} alt="Feed Post" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">Attached Photo Ready</p>
                        <p className="text-[11px] text-muted-foreground truncate">{feedImageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedImageUrl('')}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/20 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFeedImageUpload}
                        disabled={uploadingFeedImg}
                        className="hidden"
                      />
                      {uploadingFeedImg ? (
                        <div className="flex items-center gap-2 text-xs text-primary font-medium py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading post photo...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-primary font-medium py-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>Click to attach publication cover, ceremony, or research photo for the feed</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/faculty">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit Faculty Record
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
