'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function GlobalNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBackdrop, setShowBackdrop] = useState(false);

  // Complete progress whenever the route changes
  useEffect(() => {
    setIsLoading(false);
    setShowBackdrop(false);
    setProgress(100);
    const timeout = setTimeout(() => {
      setProgress(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Intercept click on internal navigation links for instant 0ms response
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let backdropTimer: NodeJS.Timeout;

    const handleLinkClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Ignore external, hash, or target="_blank" links
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || targetAttr === '_blank') {
        return;
      }

      // Check if it's the exact same URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Start visible loading bar immediately
      setIsLoading(true);
      setProgress(25);

      progressTimer = setTimeout(() => {
        setProgress(65);
      }, 100);

      backdropTimer = setTimeout(() => {
        setShowBackdrop(true);
        setProgress(85);
      }, 250);
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      clearTimeout(progressTimer);
      clearTimeout(backdropTimer);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* 1. Sleek Top Progress Bar (Option 4 Sunset Coral -> Solar Gold) */}
      <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FACC15] shadow-[0_0_12px_rgba(249,115,22,0.75)] transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 ? 'width 200ms ease-out, opacity 300ms 150ms' : 'width 300ms ease-out',
          }}
        />
      </div>

      {/* 2. Floating Quick Response Indicator when transition takes > 250ms */}
      {showBackdrop && (
        <div className="fixed bottom-6 right-6 z-[99998] pointer-events-none flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-popover liquid-sheet-enter border-primary/30 shadow-2xl">
          <img src="/images/srec-logo.png" alt="SREC Loading" className="w-6 h-6 object-contain animate-spin" />
          <div className="text-left">
            <p className="text-xs font-bold text-foreground">Loading SREC Connect...</p>
            <p className="text-[10px] text-muted-foreground">Fetching records from server</p>
          </div>
        </div>
      )}
    </>
  );
}
