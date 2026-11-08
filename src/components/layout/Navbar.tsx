'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Shield, Award, Users, BookOpen, Calendar, LayoutDashboard, LogOut, Sun, Moon, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/achievements', label: 'Achievements', icon: Award },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/faculty', label: 'Faculty', icon: BookOpen },
  { href: '/students', label: 'Students', icon: Users },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('light', !isDarkMode);
  }, [isDarkMode, mounted]);

  const userRole = (session?.user as any)?.role;
  const userAdminType = (session?.user as any)?.adminType;
  const isRoot = (session?.user as any)?.isRoot;
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const userAvatar = session?.user?.image;

  const getDashboardHref = () => {
    if (isRoot || userRole === 'ADMIN') return '/admin';
    if (userRole === 'FACULTY') return '/dashboard/faculty';
    if (userRole === 'STUDENT') return '/dashboard/student';
    return '/';
  };

  const getDashboardLabel = () => {
    if (isRoot) return 'Root Admin Dashboard';
    if (userRole === 'ADMIN') {
      if (userAdminType === 'DEPARTMENT') return 'Department Admin Dashboard';
      if (userAdminType === 'MANAGER') return 'Sub-Admin Dashboard';
      return 'Admin Dashboard';
    }
    if (userRole === 'FACULTY') return 'Faculty Dashboard';
    if (userRole === 'STUDENT') return 'Student Dashboard';
    return 'Dashboard';
  };

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-space-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full" />
      </header>
    );
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-300',
        isScrolled
          ? 'bg-space-950/95 backdrop-blur-md border-b border-slate-800/50 shadow-glass'
          : 'bg-space-950/80 backdrop-blur-md border-b border-slate-800/50'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full" aria-label="Main navigation">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2" aria-label="SREC Connect Home">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
              <Shield className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500/30 via-cyan-500/20 to-emerald-500/30 blur-xl opacity-50 animate-pulse" />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400">
              SREC Connect
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300',
                  'hover:text-white hover:bg-space-800/50 transition-all duration-200'
                )}
              >
                <link.icon className="w-4 h-4" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-space-800/50 transition-all duration-200"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {status === 'loading' ? (
              <div className="w-20 h-10 bg-space-800/50 rounded-xl animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href={getDashboardHref()}
                  className={cn(
                    'btn-cyan px-4 py-2 text-sm',
                    'shadow-neon-cyan/20'
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{getDashboardLabel()}</span>
                </Link>
              </>
            ) : (
              <Link href="/auth/signin" className="btn-primary px-4 py-2 text-sm">
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-space-800/50 transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800/50 animate-slide-up">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-space-800/50 transition-all duration-200"
                >
                  <link.icon className="w-5 h-5" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-space-800/50 transition-all duration-200 w-full"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
              {session ? (
                <div className="pt-4 space-y-2">
                  <Link
                    href={getDashboardHref()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-cyan w-full justify-center"
                  >
                    <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                    {getDashboardLabel()}
                  </Link>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary w-full justify-center mt-4"
                >
                  <Shield className="w-4 h-4" aria-hidden="true" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {session && (
        <div className="fixed top-16 right-4 z-50 md:hidden">
          <div className="absolute right-0 w-56">
            <div className="bg-space-800/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-glass overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                    {userAvatar ? (
                      <img src={userAvatar} alt="" className="w-10 h-10 rounded-xl" />
                    ) : (
                      <span className="text-white font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="brand" size="sm" glow>{userRole}</Badge>
                  {userAdminType && <Badge variant="cyan" size="sm">{userAdminType}</Badge>}
                  {isRoot && <Badge variant="amber" size="sm" glow>ROOT</Badge>}
                </div>
              </div>
              <Link
                href={getDashboardHref()}
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-space-700/50 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                {getDashboardLabel()}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:text-neon-rose hover:bg-space-700/50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {session && !isMobileMenuOpen && (
        <div
          className="fixed top-16 right-4 z-50 hidden md:block"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="absolute right-0 w-64">
            <div className="bg-space-800/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-glass overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                    {userAvatar ? (
                      <img src={userAvatar} alt="" className="w-10 h-10 rounded-xl" />
                    ) : (
                      <span className="text-white font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="brand" size="sm" glow>{userRole}</Badge>
                  {userAdminType && <Badge variant="cyan" size="sm">{userAdminType}</Badge>}
                  {isRoot && <Badge variant="amber" size="sm" glow>ROOT</Badge>}
                </div>
              </div>
              <Link
                href={getDashboardHref()}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-space-700/50 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                {getDashboardLabel()}
              </Link>
              <Link
                href="/dashboard/student/settings"
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-space-700/50 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Profile Settings
              </Link>
              <hr className="my-2 border-slate-700/30 mx-2" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 w-full px-4 py-3 text-neon-rose hover:bg-neon-rose/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}