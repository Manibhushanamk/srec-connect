'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Award,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Users,
  Image as ImageIcon,
  Sparkles,
  X,
  Share2,
  Upload,
  Loader2,
} from 'lucide-react';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';

export default function StudentSubmitAchievementPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    level: 'COLLEGE',
    positionRank: '',
    organizationEventName: '',
    academicYear: '2024-2025',
    achievementDate: new Date().toISOString().split('T')[0],
    certificateUrl: '',
    googleDriveUrl: '',
  });

  // Team members with student identity anchor
  const [teamMembers, setTeamMembers] = useState<{
    studentId?: string;
    userId?: string;
    rollNumber: string;
    studentName: string;
    detail?: string;
  }[]>([]);

  // Search state for team members
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
      alert(`${student.name} (${student.rollNumber}) is already added to team members.`);
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

    const res = await fetch('/api/achievements/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        teamMembers: teamMembers.filter((m) => m.rollNumber.trim().length > 0),
        postToFeed,
        feedCaption: feedCaption || undefined,
        feedImageUrl: feedImageUrl || undefined,
      }),
    });

    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to submit achievement. Please check all fields.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8 border-emerald-500/30 bg-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Achievement Submitted!</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Your achievement has been submitted to your Department Moderator. Once reviewed and verified, it will be published to the official campus honors repository.
            </p>
            <Link href="/dashboard/student">
              <Button variant="primary" size="md" className="w-full">
                Return to Student Dashboard
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-1">
            Submit Honor or Competition Award
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Submit your hackathon wins, research paper presentations, sports awards, and certifications for department verification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-card border-border space-y-5">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Achievement Title *
              </label>
              <input
                type="text"
                id="title"
                required
                placeholder="e.g. 1st Place in National Web3 Hackathon"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="level" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Competition Level *
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
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
                <label htmlFor="rank" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Position / Rank / Prize
                </label>
                <input
                  type="text"
                  id="rank"
                  placeholder="e.g. 1st Prize, Winner, Finalist"
                  value={formData.positionRank}
                  onChange={(e) => setFormData({ ...formData, positionRank: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label htmlFor="org" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Host Organization / Event Name *
                </label>
                <input
                  type="text"
                  id="org"
                  required
                  placeholder="e.g. Shaastra 2025, IIT Madras"
                  value={formData.organizationEventName}
                  onChange={(e) => setFormData({ ...formData, organizationEventName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="achDate" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Achievement Date *
                </label>
                <input
                  type="date"
                  id="achDate"
                  required
                  value={formData.achievementDate}
                  onChange={(e) => setFormData({ ...formData, achievementDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label htmlFor="acadYear" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Academic Year *
                </label>
                <select
                  id="acadYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2022-2023">2022-2023</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="desc" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Description / Abstract
              </label>
              <textarea
                id="desc"
                rows={3}
                placeholder="Details of your project, competition scope, technologies used..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <DriveFileUploader
              value={formData.googleDriveUrl}
              onChange={(url) => setFormData({ ...formData, googleDriveUrl: url })}
              label="Certificate Proof Document"
              documentType="STUDENT_CERTIFICATE"
              helpText="Upload certificate directly to Google Drive. It is automatically shared with view access for verification."
            />
          </Card>

          {/* Team Members Section with Student Directory Lookup */}
          <Card className="p-6 bg-card border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Team Members & Student Collaborators</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select enrolled students from the directory. Once verified, this honor is automatically credited to each student&apos;s personal portfolio.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-auto">
                {teamMembers.length} Selected
              </span>
            </div>

            {/* Student Search Input & Dropdown */}
            <div className="relative">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Lookup & Add Student by Roll Number or Name
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Type roll number (e.g. 22091A3202) or student name..."
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
                    Matching Students ({searchResults.length})
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

            {/* Selected Members List */}
            {teamMembers.length === 0 ? (
              <div className="p-5 border border-dashed border-border rounded-xl text-center bg-secondary/10">
                <Users className="w-7 h-7 text-muted-foreground mx-auto mb-1 opacity-50" />
                <p className="text-xs font-medium text-foreground">No additional team members added</p>
                <p className="text-[11px] text-muted-foreground">
                  Leave empty if this was a solo achievement.
                </p>
              </div>
            ) : (
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
                      title="Remove team member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  Share this verified win with department peers and faculty on the live campus feed.
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
                    Feed Post Description / Story (Optional)
                  </label>
                  <textarea
                    id="feedCaption"
                    rows={3}
                    placeholder="Share what inspired this project, highlights of the event, or congratulations to your teammates..."
                    value={feedCaption}
                    onChange={(e) => setFeedCaption(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Post Photo / Celebration Picture (Optional)
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
                          <span>Click to attach ceremony or project photo for the feed</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/student">
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
              Submit for Department Verification
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
