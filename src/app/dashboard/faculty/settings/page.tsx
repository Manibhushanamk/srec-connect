'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Lock, Save, MapPin, BookOpen, ExternalLink, User, Sparkles, Phone, Github, Linkedin } from 'lucide-react';
import { GoogleDriveCard } from '@/components/dashboard/GoogleDriveCard';

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
        headline: profile?.faculty?.headline || profile?.headline,
        skills: profile?.faculty?.skills || profile?.skills,
        bio: profile?.faculty?.bio,
        phone: profile?.faculty?.phone || profile?.phone,
        linkedinUrl: profile?.faculty?.linkedinUrl || profile?.linkedinUrl,
        githubUrl: profile?.faculty?.githubUrl || profile?.githubUrl,
        avatarUrl: profile?.avatarUrl || profile?.faculty?.avatarUrl,
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

        {/* Google Drive Integration Card */}
        <GoogleDriveCard className="mb-6" />

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
            <h3 className="text-sm font-bold text-white">Academic Details &amp; Customization</h3>

            {/* Profile Avatar Image URL */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Faculty Avatar Image (HTTPS URL)</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.avatarUrl || fac?.avatarUrl ? (
                    <img
                      src={profile?.avatarUrl || fac?.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <input
                  type="url"
                  value={profile?.avatarUrl || fac?.avatarUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      avatarUrl: e.target.value,
                      faculty: { ...profile.faculty, avatarUrl: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Professional Headline */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Professional Academic Headline / Title</label>
              <input
                type="text"
                value={fac?.headline || profile?.headline || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    headline: e.target.value,
                    faculty: { ...profile.faculty, headline: e.target.value },
                  })
                }
                placeholder="e.g. Associate Professor & Lead AI Systems Researcher | Ph.D."
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

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

            {/* Technical Skills & Competencies */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-400">Technical Skills, Tools &amp; Competencies (Comma-separated)</label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {(fac?.skills || profile?.skills || fac?.specialization || '').split(/[,;&•]/).map((s: string) => s.trim()).filter(Boolean).length} skills
                </span>
              </div>
              <input
                type="text"
                value={fac?.skills || profile?.skills || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value,
                    faculty: { ...profile.faculty, skills: e.target.value },
                  })
                }
                placeholder="e.g. Python, PyTorch, TensorFlow, Docker, Kubernetes, NLP, Linux, LLMs"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              {/* Quick-add suggestions */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Quick-add suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Python', 'PyTorch', 'TensorFlow', 'Computer Vision', 'Deep Learning', 'NLP', 'Docker', 'Linux', 'LaTeX', 'CUDA', 'Cloud Computing'].map((badge) => {
                    const currentSkills = (fac?.skills || profile?.skills || '').split(/[,;&•]/).map((s: string) => s.trim().toLowerCase());
                    const isAdded = currentSkills.includes(badge.toLowerCase());
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => {
                          if (isAdded) return;
                          const prev = fac?.skills || profile?.skills || '';
                          const next = prev.trim() ? `${prev.trim()}, ${badge}` : badge;
                          setProfile({
                            ...profile,
                            skills: next,
                            faculty: { ...profile.faculty, skills: next },
                          });
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          isAdded
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold cursor-default'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        {isAdded ? `✓ ${badge}` : `+ ${badge}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Chips */}
              {(fac?.skills || profile?.skills) && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  {(fac?.skills || profile?.skills || '').split(/[,;&•]/).map((s: string) => s.trim()).filter(Boolean).map((skill: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              )}
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

            {/* Social & Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </label>
                <input
                  type="text"
                  value={fac?.phone || profile?.phone || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      phone: e.target.value,
                      faculty: { ...profile.faculty, phone: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-slate-400" /> LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={fac?.linkedinUrl || profile?.linkedinUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      linkedinUrl: e.target.value,
                      faculty: { ...profile.faculty, linkedinUrl: e.target.value },
                    })
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-400" /> GitHub Profile
                </label>
                <input
                  type="url"
                  value={fac?.githubUrl || profile?.githubUrl || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      githubUrl: e.target.value,
                      faculty: { ...profile.faculty, githubUrl: e.target.value },
                    })
                  }
                  placeholder="https://github.com/..."
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
