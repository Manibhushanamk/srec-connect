'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Lock, Save, User, Globe, Github, Linkedin, Phone } from 'lucide-react';

export default function StudentSettingsPage() {
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
        bio: profile?.student?.bio,
        phone: profile?.student?.phone,
        githubUrl: profile?.student?.githubUrl,
        linkedinUrl: profile?.student?.linkedinUrl,
        portfolioUrl: profile?.student?.portfolioUrl,
        avatarUrl: profile?.avatarUrl,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMsg('Profile customized successfully!');
    } else {
      setMsg('Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-cyan-400 animate-pulse">Loading Profile...</p>
        </main>
      </div>
    );
  }

  const stu = profile?.student;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Student Profile Customization
          </h1>
          <p className="text-xs text-slate-400">
            Personalize your portfolio details and social profiles. Core academic credentials are locked to prevent tampering.
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
              <span>Immutable Institutional Credentials (Locked)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">JNTUA Roll Number</label>
                <input
                  type="text"
                  disabled
                  value={stu?.rollNumber || 'N/A'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Academic Department</label>
                <input
                  type="text"
                  disabled
                  value={profile?.department?.name || stu?.departmentName || 'N/A'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Academic Batch</label>
                <input
                  type="text"
                  disabled
                  value={stu?.batch || '2022-2026'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* EDITABLE PORTFOLIO CUSTOMIZATION */}
          <Card className="p-6 border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-sm font-bold text-white">Portfolio Customization</h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Personal Bio</label>
              <textarea
                rows={3}
                value={stu?.bio || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    student: { ...profile.student, bio: e.target.value },
                  })
                }
                placeholder="Passionate about AI, full stack engineering, and competitive coding..."
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </label>
                <input
                  type="text"
                  value={stu?.phone || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      student: { ...profile.student, phone: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-400" /> GitHub Profile URL
                </label>
                <input
                  type="text"
                  value={stu?.githubUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      student: { ...profile.student, githubUrl: e.target.value },
                    })
                  }
                  placeholder="https://github.com/yourhandle"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-slate-400" /> LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={stu?.linkedinUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      student: { ...profile.student, linkedinUrl: e.target.value },
                    })
                  }
                  placeholder="https://linkedin.com/in/yourhandle"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Personal Portfolio URL
                </label>
                <input
                  type="text"
                  value={stu?.portfolioUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      student: { ...profile.student, portfolioUrl: e.target.value },
                    })
                  }
                  placeholder="https://yourportfolio.dev"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="cyan"
                size="md"
                loading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Portfolio Customization
              </Button>
            </div>
          </Card>
        </form>
      </main>

      <Footer />
    </div>
  );
}
