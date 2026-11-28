'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Award, Camera, LogIn, Sparkles, X } from 'lucide-react';

interface DualActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const DualActionSheet: React.FC<DualActionSheetProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  triggerRef,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const raf = requestAnimationFrame(() => {
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Scrim Backdrop (no full-screen blur to keep mobile INP < 200ms and avoid nested double-blur) */}
      <button
        type="button"
        aria-label="Close action sheet"
        onClick={onClose}
        className="fixed inset-0 bg-[#0D0E12]/70 transition-opacity motion-reduce:transition-none"
      />

      {/* Spatial Apple Liquid Glass Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dual-action-sheet-title"
        className="relative w-full sm:max-w-md glass-sheet liquid-sheet-enter border border-b-0 sm:border-b rounded-t-3xl sm:rounded-3xl p-5 pb-safe shadow-2xl motion-reduce:transition-none"
      >
        <div className="w-10 h-1 rounded-full bg-foreground/25 mx-auto mb-4 sm:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 id="dual-action-sheet-title" className="text-base font-bold text-foreground">
              {isAuthenticated ? 'Create & Submit' : 'Sign in to Continue'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAuthenticated
                ? 'Choose a social post or verified academic submission.'
                : 'Authenticate with your institutional Google account to share or submit.'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Dismiss create options"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl liquid-chip hover:bg-secondary text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-3 pb-2">
            <Link
              href="/signin"
              onClick={onClose}
              className="flex items-center justify-center gap-2.5 w-full min-h-[44px] py-3 px-4 rounded-2xl bg-[#EA580C] dark:bg-[#F97316] text-white font-semibold text-sm shadow-[0_6px_22px_rgba(234,88,12,0.35)] dark:shadow-[0_6px_22px_rgba(249,115,22,0.40)] hover:bg-[#C2410C] dark:hover:bg-[#FB923C] active:scale-[0.99] transition-all"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Continue with Google OAuth</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 pb-2">
            <Link
              href="/?compose=post"
              onClick={onClose}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl liquid-chip hover:border-primary/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-[#C2410C] dark:text-[#F97316] flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Share Campus Post</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Photos and campus moments (images-only, up to 2 photos).
                </p>
              </div>
            </Link>

            <Link
              href="/?compose=milestone"
              onClick={onClose}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl liquid-chip hover:border-primary/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-[#C2410C] dark:text-[#F97316] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Share Campus Milestone</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Highlight project demos, hackathons, and club breakthroughs.
                </p>
              </div>
            </Link>

            <Link
              href="/achievements/submit"
              onClick={onClose}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl liquid-chip border-[#CA8A04]/45 dark:border-[#FACC15]/45 hover:border-[#CA8A04] dark:hover:border-[#FACC15] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#CA8A04]/15 dark:bg-[#FACC15]/15 text-[#92400E] dark:text-[#FACC15] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">Submit Academic Achievement</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#CA8A04]/15 dark:bg-[#FACC15]/15 text-[#92400E] dark:text-[#FACC15] border border-[#CA8A04]/35 dark:border-[#FACC15]/35">
                    Faculty → HOD Verified
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official certificate review workflow for institutional honors.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DualActionSheet;
