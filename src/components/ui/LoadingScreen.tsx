'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, Award, Sparkles } from 'lucide-react';

const statusMessages = [
  'Connecting to SREC Institutional Database...',
  'Synchronizing Multi-Department Honors & Milestones...',
  'Verifying Student Achievement Records...',
  'Loading Faculty Research Publications...',
  'Initializing Secure Administrative Workflows...',
  'Connecting to Institutional Google Drive Storage...',
  'Calibrating Deep Space Glassmorphism Interface...',
  'Ready to Empower Excellence!',
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsComplete(true);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-space-950"
      style={{ background: 'radial-gradient(ellipse at center, #0c1324 0%, #020617 100%)' }}
      role="status"
      aria-label="Loading SREC Connect"
    >
      <div className="relative flex flex-col items-center gap-8 max-w-md w-full px-6">
        <div className="relative">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 * (1 - progress / 100)}
                className="transition-all duration-300 ease-out"
                style={{ filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.6))' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-space-800 to-space-900 border border-slate-700/50 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] p-2">
                <img src="/images/srec-logo.png" alt="SREC Logo" className="w-10 h-10 object-contain drop-shadow" />
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-brand-500/30 via-cyan-500/20 to-emerald-500/30 blur-2xl opacity-50 animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-500/50"
                style={{
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400">
            SREC Connect v3.0
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium">
            Santhiram Engineering College (Autonomous), Nandyal
          </p>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Initializing Sovereign Systems</span>
            <span className="font-mono text-brand-400">{Math.min(Math.round(progress), 100)}%</span>
          </div>
          <div className="h-2 bg-space-800/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-cyan-500 to-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%`, boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)' }}
            />
          </div>
        </div>

        <div className="w-full">
          <p
            className="text-center text-sm text-slate-500 font-mono tracking-wide transition-opacity duration-500"
            style={{ opacity: isComplete ? 0 : 1 }}
          >
            {statusMessages[currentMessageIndex]}
          </p>
          <p className="text-center text-sm text-emerald-400 font-mono tracking-wide animate-pulse" style={{ opacity: isComplete ? 1 : 0 }}>
            All systems operational. Welcome to SREC Connect.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pt-4 border-t border-slate-800/50 w-full">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>NAAC Accredited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span>Neon PostgreSQL</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}