'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Lock, Save, MapPin, BookOpen, ExternalLink } from 'lucide-react';

export default function FacultySettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.user);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio: profile?.faculty?.bio,
        cabin: profile?.faculty?.cabin,
        specialization: profile?.faculty?.specialization,
        googleScholar: profile?.faculty?.googleScholar,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMsg('Faculty profile updated successfully!');
    } else {
      setMsg('Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-cyan-400 animate-pulse">Loading Faculty Profile...</p>
        </main>
      </div>
    );
  }

  const fac = profile?.faculty;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link
          href="/dashboard/faculty"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Faculty Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Faculty Profile & Research Settings
          </h1>
          <p className="text-xs text-slate-400">
            Customize your academic cabin, research domains, and Google Scholar profile.
          </p>
        </div>

        {msg && (
          <div className="p-3 mb-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
            {msg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* LOCKED ACADEMIC INTEGRITY FIELDS */}
          <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Lock className="w-4 h-4" />
              <span>Immutable Institutional Designation (Locked)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Academic Designation</label>
                <input
                  type="text"
                  disabled
                  value={fac?.designation || 'Faculty Member'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  disabled
                  value={profile?.department?.name || fac?.departmentName || 'SREC'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* EDITABLE PROFILE FIELDS */}
          <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-sm font-bold text-white">Academic Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Cabin / Office Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI-ML Block, 2nd Floor, Cabin #204"
                  value={fac?.cabin || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      faculty: { ...profile.faculty, cabin: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Google Scholar Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://scholar.google.com/citations?user=..."
                  value={fac?.googleScholar || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      faculty: { ...profile.faculty, googleScholar: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Research Specializations
              </label>
              <input
                type="text"
                placeholder="e.g. Deep Learning, Explainable AI, Computer Vision, Cloud Infrastructure"
                value={fac?.specialization || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    faculty: { ...profile.faculty, specialization: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Faculty Bio / Statement</label>
              <textarea
                rows={3}
                placeholder="Write your research interests, teaching philosophy, and academic background..."
                value={fac?.bio || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    faculty: { ...profile.faculty, bio: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="cyan"
                size="md"
                loading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Faculty Settings
              </Button>
            </div>
          </Card>
        </form>
      </main>

      <Footer />
    </div>
  );
}
