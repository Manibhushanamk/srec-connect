'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { RightContextRail } from '@/components/layout/RightContextRail';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
  showRightRail?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, showRightRail }) => {
  const pathname = usePathname();
  const isFeedPage = pathname === '/';

  // Only show right context rail on home feed by default to leave full width for directories & portfolios
  const displayRightRail = showRightRail !== undefined ? showRightRail : isFeedPage;
  const mainMaxWidthClass = isFeedPage ? 'max-w-2xl' : 'w-full';

  return (
    <div className={`relative z-10 min-h-screen min-h-[100dvh] bg-transparent text-foreground flex flex-col transition-colors ${isFeedPage ? 'md:h-[100dvh] md:overflow-hidden' : ''}`}>
      {/* 1. Sticky Top Navigation */}
      <AppHeader />

      {/* 2. Main Responsive Content Grid */}
      <div className={`flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 ${isFeedPage ? 'md:min-h-0 md:overflow-hidden' : ''}`}>
        <div className={`flex gap-5 lg:gap-6 justify-center w-full max-w-full ${isFeedPage ? 'md:h-full' : ''}`}>
          {/* Left Sidebar (Desktop only) */}
          <DesktopSidebar />

          {/* Central Main Content Viewport */}
          <main className={`flex-1 ${mainMaxWidthClass} w-full min-w-0 max-w-full pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-8 ${isFeedPage ? 'md:min-h-0 md:overflow-y-auto md:overscroll-contain no-scrollbar md:pr-1' : ''}`}>
            {children}
          </main>

          {/* Right Context Rail (Shown on Feed) */}
          {displayRightRail && <RightContextRail />}
        </div>
      </div>

      {/* 3. Mobile Instagram-Style Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default AppShell;
