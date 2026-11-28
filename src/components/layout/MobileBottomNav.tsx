'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Award, Plus, Calendar, User } from 'lucide-react';
import { DualActionSheet } from '@/components/ui/DualActionSheet';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const createBtnRef = useRef<HTMLButtonElement>(null);

  const isAuthenticated = Boolean(session?.user);
  const profileHref = isAuthenticated ? '/profile' : '/login';

  const leftItems = [
    { label: 'Feed', href: '/', icon: Home },
    { label: 'Honors', href: '/achievements', icon: Award },
  ];

  const rightItems = [
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'Profile', href: profileHref, icon: User },
  ];

  const renderLink = (item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive =
      item.href === '/'
        ? pathname === '/'
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        href={item.href}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-h-[44px] min-w-[44px] flex-1 transition-colors duration-150 ${
          isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} aria-hidden="true" />
        <span className="text-[10px] mt-0.5 leading-tight truncate max-w-full">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] left-3 right-3 max-w-md mx-auto z-50 glass-nav rounded-2xl border px-2 py-1.5 shadow-2xl"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 items-center">
          {leftItems.map(renderLink)}

          {/* Center Create (+) Button opening Dual Action Sheet */}
          <div className="flex items-center justify-center">
            <button
              ref={createBtnRef}
              type="button"
              onClick={() => setIsSheetOpen(true)}
              aria-label="Create post or submit achievement"
              aria-haspopup="dialog"
              aria-expanded={isSheetOpen}
              className="flex items-center justify-center p-1 -mt-5 min-h-[48px] min-w-[48px] rounded-full focus:outline-none focus:ring-2 focus:ring-primary group"
            >
              <span className="w-12 h-12 rounded-full bg-[#EA580C] dark:bg-[#F97316] text-white flex items-center justify-center shadow-[0_6px_22px_rgba(234,88,12,0.42)] dark:shadow-[0_6px_24px_rgba(249,115,22,0.45)] border-2 border-white/40 dark:border-white/25 group-active:scale-95 transition-transform motion-reduce:transition-none">
                <Plus className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
              </span>
            </button>
          </div>

          {rightItems.map(renderLink)}
        </div>
      </nav>

      <DualActionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        isAuthenticated={isAuthenticated}
        triggerRef={createBtnRef}
      />
    </>
  );
};

export default MobileBottomNav;
