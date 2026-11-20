'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bug,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Info,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { value: 'UI_VISUAL', label: '🎨 UI & Visual Layout' },
  { value: 'LOGIN_AUTH', label: '🔐 Login & Authentication' },
  { value: 'PERMISSION_ACCESS', label: '🛡️ Permissions & Access Control' },
  { value: 'DATA_DATABASE', label: '💾 Data & Database Records' },
  { value: 'GOOGLE_DRIVE', label: '📁 Google Drive Integration' },
  { value: 'UPLOAD_DOWNLOAD', label: '📤 File Upload & Download' },
  { value: 'EVENTS', label: '📅 Campus Events & Attendance' },
  { value: 'COMPLAINTS', label: '⚖️ Grievances & Discipline' },
  { value: 'PROFILE', label: '👤 Profile & Credentials' },
  { value: 'PERFORMANCE', label: '⚡ Performance & Slow Load' },
  { value: 'MOBILE', label: '📱 Mobile Responsiveness' },
  { value: 'OTHER', label: '⚙️ Other Technical Problem' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low', desc: 'Minor cosmetic flaw' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Non-blocking glitch' },
  { value: 'HIGH', label: 'High', desc: 'Feature unusable' },
  { value: 'CRITICAL', label: 'Critical', desc: 'System crash or security' },
];

export default function ReportBugPage() {
  const { data: session } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI_VISUAL');
  const [severity, setSeverity] = useState('MEDIUM');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [route, setRoute] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      setError('Please provide a title of at least 5 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim() || undefined,
        route: route.trim() || '/',
        screenshotUrl: screenshotUrl.trim() || undefined,
        deviceInfo: typeof window !== 'undefined'
          ? `Screen: ${window.innerWidth}x${window.innerHeight}, UserAgent: ${navigator.userAgent}`
          : undefined,
      };

      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit bug report.');
      }

      setSubmittedReportId(data.reportId);
    } catch (err: any) {
      console.error('[Bug Report Submit Error]', err);
      setError(err.message || 'Network error occurred while submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SREC Connect</span>
        </Link>

        {/* Card */}
        <div className="bg-space-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                SREC CONNECT Issue & Bug Reporting
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Direct conduit to the production reliability and engineering team.
              </p>
            </div>
          </div>

          {submittedReportId ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Report Successfully Logged</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Thank you for bringing this to our attention. Our team has received your report and will investigate promptly.
              </p>
              <div className="inline-block p-4 rounded-xl bg-space-950 border border-slate-800 text-sm font-mono text-cyan-400">
                Tracking Reference: {submittedReportId}
              </div>
              <div className="pt-6">
                <Link href="/" className="btn-cyan px-6 py-2.5 inline-block text-sm font-semibold">
                  Return to Campus Feed
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Issue Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken navigation link on faculty dashboard"
                  className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              {/* Category & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEVERITIES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value)}
                        className={`px-2 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          severity === s.value
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                            : 'bg-space-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Route */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Affected URL / Route
                </label>
                <input
                  type="text"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  placeholder="e.g. /dashboard/faculty/submit"
                  className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide full context on what occurred, what was expected, and any error message displayed..."
                  className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  required
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Steps to Reproduce (Optional)
                </label>
                <textarea
                  rows={3}
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Step one&#10;2. Step two&#10;3. See error"
                  className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Expected Behavior
                  </label>
                  <input
                    type="text"
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="e.g. Submit button processes achievement"
                    className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Actual Behavior
                  </label>
                  <input
                    type="text"
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    placeholder="e.g. Nothing happens or 500 error"
                    className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Screenshot URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Screenshot / Evidence URL (Optional)
                </label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or image link"
                  className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="p-4 rounded-xl bg-space-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  SREC CONNECT maintains strict privacy standards. No passwords, tokens, or confidential student records are ever collected.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-cyan w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Bug Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Bug Report to Engineering Team</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
