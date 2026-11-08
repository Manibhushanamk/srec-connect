'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, BookOpen, Send, CheckCircle2 } from 'lucide-react';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';

export default function FacultySubmitRecordPage() {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      description: [
        formData.description,
        formData.doiOrIsbn ? `DOI / ISBN: ${formData.doiOrIsbn}` : null,
        formData.grantAmount ? `Sanctioned Grant: ₹${formData.grantAmount}` : null,
        formData.collaboratorStudents ? `Student Co-Authors: ${formData.collaboratorStudents}` : null,
      ].filter(Boolean).join('\n\n'),
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
        <Navbar />
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
      <Navbar />

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
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="level" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Scope / Impact Level *
                </label>
                <select
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="INTERNATIONAL">International (Scopus / SCI / IEEE)</option>
                  <option value="NATIONAL">National (UGC Care / DST / AICTE)</option>
                  <option value="STATE">State / Regional Level</option>
                  <option value="COLLEGE">Institutional / College Level</option>
                </select>
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
                <select
                  id="academicYear"
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

            <div>
              <label htmlFor="collaboratorStudents" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Student Scholars Guided / Co-Authors <span className="text-muted-foreground font-normal">(Optional roll numbers or names)</span>
              </label>
              <input
                type="text"
                id="collaboratorStudents"
                value={formData.collaboratorStudents}
                onChange={(e) => setFormData({ ...formData, collaboratorStudents: e.target.value })}
                placeholder="e.g. 22091A3201 (K. V. Naveen Kumar), 22091A3202 (P. Sai Kumar)"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
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
