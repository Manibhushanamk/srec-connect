'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Award, Send, Plus, Trash2, CheckCircle2 } from 'lucide-react';

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

  const [teamMembers, setTeamMembers] = useState<{ rollNumber: string; studentName: string }[]>([]);

  useEffect(() => {
    // Fetch categories
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

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { rollNumber: '', studentName: '' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: 'rollNumber' | 'studentName', value: string) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
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
      }),
    });

    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      alert('Failed to submit achievement. Please check all fields.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8 border-emerald-500/30 bg-slate-900/60 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Achievement Submitted!</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Your achievement has been submitted to your Department Moderator. Once reviewed and verified, it will be published to the official campus honors repository.
            </p>
            <Link href="/dashboard/student">
              <Button variant="cyan" size="md" className="w-full">
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
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Submit Honor or Competition Award
          </h1>
          <p className="text-xs text-slate-400">
            Submit your hackathon wins, research paper presentations, sports awards, and certifications for department verification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Achievement Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1st Place in National Web3 Hackathon"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Competition Level *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Position / Rank / Prize
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1st Prize, Winner, Finalist"
                  value={formData.positionRank}
                  onChange={(e) => setFormData({ ...formData, positionRank: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Host Organization / Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shaastra 2025, IIT Madras"
                  value={formData.organizationEventName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationEventName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Achievement Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.achievementDate}
                  onChange={(e) =>
                    setFormData({ ...formData, achievementDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Academic Year *
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2022-2023">2022-2023</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description / Abstract
              </label>
              <textarea
                rows={3}
                placeholder="Details of your project, competition scope, technologies used..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Certificate URL / Google Drive Document Link
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={formData.googleDriveUrl}
                onChange={(e) => setFormData({ ...formData, googleDriveUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </Card>

          {/* TEAM COLLABORATORS SECTION */}
          <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Team Members & Collaborators</h3>
                <p className="text-xs text-slate-400">
                  Add student team members who participated in this achievement with you.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addTeamMember} leftIcon={<Plus className="w-3 h-3" />}>
                Add Member
              </Button>
            </div>

            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Roll Number (e.g. 22091A3202)"
                  value={member.rollNumber}
                  onChange={(e) => updateTeamMember(i, 'rollNumber', e.target.value)}
                  className="w-1/2 px-3 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white uppercase font-mono"
                />
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={member.studentName}
                  onChange={(e) => updateTeamMember(i, 'studentName', e.target.value)}
                  className="w-1/2 px-3 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => removeTeamMember(i)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/dashboard/student">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="cyan"
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
