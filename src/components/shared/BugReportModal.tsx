'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Bug,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreatableSelect } from '@/components/ui/CreatableSelect';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoute?: string;
}

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
  { value: 'LOW', label: 'Low', desc: 'Minor cosmetic flaw', color: 'border-slate-700 hover:border-slate-500' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Non-blocking glitch', color: 'border-amber-500/40 hover:border-amber-500' },
  { value: 'HIGH', label: 'High', desc: 'Feature unusable', color: 'border-orange-500/60 hover:border-orange-500' },
  { value: 'CRITICAL', label: 'Critical', desc: 'System crash or security', color: 'border-rose-500 hover:border-rose-400' },
];

export function BugReportModal({ isOpen, onClose, defaultRoute }: BugReportModalProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI_VISUAL');
  const [severity, setSeverity] = useState('MEDIUM');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeRoute = defaultRoute || pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
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
        route: activeRoute,
        screenshotUrl: screenshotUrl.trim() || undefined,
        deviceInfo: includeDiagnostics
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('UI_VISUAL');
    setSeverity('MEDIUM');
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setScreenshotUrl('');
    setError(null);
    setSubmittedReportId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0E12]/70 overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-sheet liquid-sheet-enter rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Report an Issue or Bug
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Engineering Hotline
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Help us keep SREC CONNECT resilient, accessible, and fast.
              </p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close bug report modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submittedReportId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">Bug Report Successfully Logged</h4>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Thank you for contributing to campus quality. Your report has been dispatched to the Super Admin and development team.
            </p>
            <div className="inline-block p-3 rounded-xl bg-space-950 border border-slate-800 text-xs font-mono text-cyan-400">
              Reference ID: {submittedReportId}
            </div>
            <div className="pt-4">
              <Button onClick={resetForm} className="btn-cyan px-6 py-2">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Short Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Bug Summary / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Google Drive certificate viewer link returns 404"
                className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            {/* Category & Severity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <CreatableSelect
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES}
                  customOptionLabel="+ Custom Bug Category..."
                  customPlaceholder="Type custom category..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSeverity(s.value)}
                      className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        severity === s.value
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-space-950 text-slate-400 ' + s.color
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened, what went wrong, and any error message you saw..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                required
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Steps to Reproduce (Optional)
              </label>
              <textarea
                rows={2}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Go to achievements submit&#10;2. Click upload&#10;3. See error"
                className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none font-mono text-xs"
              />
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Expected Behavior
                </label>
                <input
                  type="text"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="e.g. File uploads to Google Drive"
                  className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Actual Behavior
                </label>
                <input
                  type="text"
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="e.g. Error 401 Unauthorized"
                  className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Screenshot or Proof URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Screenshot URL or Drive Attachment (Optional)
              </label>
              <input
                type="url"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://drive.google.com/... or image link"
                className="w-full px-3.5 py-2 rounded-xl bg-space-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Diagnostics Auto-Capture Notice */}
            <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800/80 flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>
                  Automatically capturing active route <code className="text-cyan-300">{activeRoute}</code>.
                  No passwords or sensitive personal records are ever collected.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="btn-cyan px-5 py-2 text-xs font-semibold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Bug Report</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
