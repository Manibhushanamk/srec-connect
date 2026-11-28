'use client';

import { useState, useEffect } from 'react';
import { Shield, Award, Sparkles } from 'lucide-react';

const statusMessages = [
  'Connecting to SREC Institutional Database...',
  'Synchronizing Multi-Department Honors & Milestones...',
  'Verifying Student Achievement Records...',
  'Loading Faculty Research Publications...',
  'Initializing Secure Administrative Workflows...',
  'Connecting to Institutional Google Drive Storage...',
  'Calibrating Apple Liquid Glass Interface...',
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

  const clampedProgress = Math.min(Math.round(progress), 100);
  const circumference = 2 * Math.PI * 45;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading SREC Connect"
    >
      {/* Option 4 Ambient Coral / Rose / Solar Gold Mesh + Grain behind glass sheet */}
      <div aria-hidden="true" className="liquid-ambient-mesh" />
      <div aria-hidden="true" className="liquid-ambient-grain" />

      {/* Centered Spatial Apple Liquid Glass Card (zero nested backdrop-blur inside) */}
      <div className="relative z-10 w-full max-w-md glass-sheet liquid-sheet-enter rounded-3xl p-7 sm:p-8 flex flex-col items-center gap-6">
        {/* Progress Ring & Framed SREC Emblem */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="srecLiquidRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="48%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FACC15" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                className="text-border/70"
                strokeWidth="3.5"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#srecLiquidRing)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - Math.min(progress, 100) / 100)}
                className="transition-all duration-300 ease-out"
                style={{ filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.45))' }}
              />
            </svg>

            {/* Emblem Crest — crisp ivory crest plate so PNG never shows a harsh mismatched box */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/95 border border-black/10 dark:border-white/30 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.35)] flex items-center justify-center p-1.5">
                <img
                  src="/images/srec-logo.png"
                  alt="SREC Connect Emblem"
                  width={48}
                  height={48}
                  className="w-11 h-11 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Warm Coral -> Solar Gold Activity Indicator Dots */}
          <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse motion-reduce:animate-none" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse motion-reduce:animate-none"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse motion-reduce:animate-none"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>

        {/* Institutional Title & Identity */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#CA8A04] dark:from-[#F97316] dark:via-[#FB923C] dark:to-[#FACC15]">
            SREC Connect
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Santhiram Engineering College (Autonomous), Nandyal
          </p>
        </div>

        {/* Liquid Progress Track */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Initializing Institutional Platform
            </span>
            <span className="font-mono font-bold text-[#C2410C] dark:text-[#F97316]">
              {clampedProgress}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full liquid-chip overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FACC15] transition-all duration-300 ease-out"
              style={{
                width: `${clampedProgress}%`,
                boxShadow: '0 0 12px rgba(249, 115, 22, 0.45)',
              }}
            />
          </div>
        </div>

        {/* Live Verification Message */}
        <div className="w-full min-h-[2.75rem] flex flex-col items-center justify-center text-center">
          <p
            className={`text-xs font-mono tracking-wide transition-opacity duration-300 ${
              isComplete
                ? 'text-[#92400E] dark:text-[#FACC15] font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            {isComplete
              ? 'All systems operational. Welcome to SREC Connect.'
              : statusMessages[currentMessageIndex]}
          </p>
        </div>

        {/* WCAG AA Institutional Trust Bar (no nested blur) */}
        <div className="w-full pt-4 border-t border-border/80 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#C2410C] dark:text-[#F97316]" aria-hidden="true" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" aria-hidden="true" />
            <span>NAAC Accredited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#FB923C]" aria-hidden="true" />
            <span>Neon PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
