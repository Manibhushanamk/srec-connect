'use client';

import React from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { RightContextRail } from '@/components/layout/RightContextRail';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
  showRightRail?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, showRightRail = true }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* 1. Sticky Top Navigation */}
      <AppHeader />

      {/* 2. Main Responsive Content Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 justify-center">
          {/* Left Sidebar (Desktop only) */}
          <DesktopSidebar />

          {/* Central Main Content Viewport (Mobile & Desktop) */}
          <main className="flex-1 max-w-2xl w-full min-w-0 pb-20 md:pb-8">
            {children}
          </main>

          {/* Right Context Rail (Upcoming events & notices) */}
          {showRightRail && <RightContextRail />}
        </div>
      </div>

      {/* 3. Mobile Instagram-Style Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default AppShell;
