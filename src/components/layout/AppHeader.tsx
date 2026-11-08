'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Bell, Shield, GraduationCap, LogIn, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export const AppHeader: React.FC = () => {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full bg-card/85 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Department Emblem */}
        <Link href="/" className="flex items-center gap-3 focus:outline-none group">
          {/* Authentic Crest Placeholder */}
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-serif">SREC</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                SREC CONNECT
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                v3.0
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground leading-none">
              CSE — Artificial Intelligence & Machine Learning
            </span>
          </div>
        </Link>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students, faculty, research, events..."
              className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-secondary/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Actions (Notifications, Theme, User) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          <button
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-card" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile or Sign-in */}
          {session?.user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs overflow-hidden">
                {session.user.image ? (
                  <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                  (session.user.name || 'U').substring(0, 2).toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-foreground max-w-[100px] truncate">
                {session.user.name}
              </span>
            </Link>
          ) : (
            <Link
              href="/signin"
              className="btn-primary text-xs py-2 px-3.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
