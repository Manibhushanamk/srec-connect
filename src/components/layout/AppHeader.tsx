'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Search,
  LogIn,
  LogOut,
  Sparkles,
  Menu,
  X,
  Home,
  Calendar,
  Award,
  BookOpen,
  Users,
  ShieldAlert,
  Info,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Bell,
  Trash2,
  LayoutDashboard,
  Shield,
  GraduationCap,
  Briefcase,
  User,
  PlusCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/layout/NotificationBell';

export const AppHeader: React.FC = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || (session?.user as any)?.isRoot;
  const isHOD = userRole === 'HOD';
  const isFaculty = userRole === 'FACULTY' || isHOD;
  const isStudent = userRole === 'STUDENT';
  const isAdmin = isSuperAdmin || userRole === 'ADMIN' || isHOD;

  const roleBadgeText =
    isSuperAdmin ? '👑 Super Admin' :
    isHOD ? '🏛️ HOD (AIML)' :
    isFaculty ? '🎓 Faculty' :
    isStudent ? '🎒 Student Scholar' :
    userRole === 'WEB_MANAGER' ? '🌐 Web Ops' : 'Campus Member';

  const mainNavLinks = [
    { label: 'Community Feed', href: '/', icon: Home },
    { label: 'Department Events', href: '/events', icon: Calendar },
    { label: 'Achievements', href: '/achievements', icon: Award },
    { label: 'Faculty Directory', href: '/faculty', icon: BookOpen },
    { label: 'Student Directory', href: '/students', icon: Users },
    { label: 'Grievances & Conduct', href: '/grievances', icon: ShieldAlert },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-card/90 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand & Department Emblem */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 focus:outline-none group min-w-0">
            {/* Official SREC Emblem */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/images/srec-logo.png" alt="SREC Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-foreground truncate">
                  SREC CONNECT
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  v3.0
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground leading-none truncate max-w-[150px] sm:max-w-none">
                CSE — Artificial Intelligence & Machine Learning
              </span>
            </div>
          </Link>

          {/* Global Search Bar (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-6">
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

          {/* Actions (Notifications, Theme, User, Mobile Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notifications Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Pill (Desktop direct link, Mobile drawer opener) */}
            {session?.user ? (
              <>
                {/* Desktop Link */}
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-2 p-1 pr-2.5 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border transition-colors"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs overflow-hidden">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt="User"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      (session.user.name || 'U').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground max-w-[110px] truncate">
                    {session.user.name}
                  </span>
                </Link>

                {/* Mobile Profile / Menu Button (Toggles Drawer) */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden flex items-center gap-1.5 p-1 rounded-xl hover:bg-secondary/80 border border-border/60 transition-colors focus:outline-none"
                  aria-label="Open navigation menu"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-[11px] overflow-hidden">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt="User"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      (session.user.name || 'U').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <Menu className="w-4 h-4 text-foreground" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/signin"
                  className="btn-primary text-xs py-1.5 px-3 sm:py-2 sm:px-3.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  aria-label="Toggle navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end animate-fade-in" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-[320px] sm:max-w-xs bg-card/95 backdrop-blur-2xl border-l border-border h-full flex flex-col shadow-2xl z-10 overflow-hidden">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
              <div className="flex items-center gap-2">
                <img src="/images/srec-logo.png" alt="SREC" className="w-6 h-6 object-contain" />
                <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Navigation & Portals
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
              {/* User Identity Card */}
              {session?.user ? (
                <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                      {session.user.image ? (
                        <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        (session.user.name || 'U').substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {session.user.name || 'Campus Scholar'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                      {roleBadgeText && (
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {roleBadgeText}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>View & Edit Profile</span>
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-center space-y-2">
                  <p className="text-xs font-bold text-foreground">Welcome to SREC Connect</p>
                  <p className="text-[11px] text-muted-foreground">
                    Sign in with your approved institutional Google account.
                  </p>
                  <Link
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary w-full py-2 text-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In Now</span>
                  </Link>
                </div>
              )}

              {/* Main Campus Navigation */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
                  Campus Navigation
                </span>
                <nav className="space-y-1">
                  {mainNavLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Role-Specific Portals & Actions */}
              {session?.user && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
                    {isStudent ? 'Student Workspace' : isFaculty ? 'Faculty & HOD Desk' : 'Operations'}
                  </span>
                  <nav className="space-y-1">
                    {/* Student Options */}
                    {isStudent && (
                      <>
                        <Link
                          href="/dashboard/student"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/dashboard/student'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                          <span>Student Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/student/submit"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/dashboard/student/submit'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <PlusCircle className="w-4 h-4 text-cyan-500" />
                          <span>Submit Achievement</span>
                        </Link>
                      </>
                    )}

                    {/* Faculty Options */}
                    {isFaculty && (
                      <>
                        <Link
                          href="/dashboard/faculty"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/dashboard/faculty'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-400" />
                          <span>Faculty Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/faculty/submit"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/dashboard/faculty/submit'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-500" />
                          <span>Submit Record / Paper</span>
                        </Link>
                      </>
                    )}

                    {/* Admin / HOD Options */}
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>Admin Console</span>
                        </Link>
                        <Link
                          href="/admin/achievements"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/achievements'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <Award className="w-4 h-4 text-cyan-500" />
                          <span>Verify Achievements</span>
                        </Link>
                        <Link
                          href="/admin/events"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/events'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>Campus Events Desk</span>
                        </Link>
                        <Link
                          href="/admin/users"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/users'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <Users className="w-4 h-4 text-emerald-500" />
                          <span>User Directory</span>
                        </Link>
                        <Link
                          href="/admin/bulk-upload"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/bulk-upload'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                          <span>Bulk Data Ingestion</span>
                        </Link>
                        <Link
                          href="/admin/discipline"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/discipline'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                          <span>Discipline & Grievances</span>
                        </Link>
                        <Link
                          href="/admin/notices"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/notices'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <Bell className="w-4 h-4 text-amber-400" />
                          <span>Notices & Circulars</span>
                        </Link>
                        <Link
                          href="/admin/trash"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                            pathname === '/admin/trash'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
                          }`}
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                          <span>Trash Recovery</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              )}

              {/* Campus Information */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
                  Institutional Info
                </span>
                <nav className="space-y-1">
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span>About Santhiram College</span>
                  </Link>
                  <Link
                    href="/departments"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span>Departments</span>
                  </Link>
                </nav>
              </div>

              {/* Sign Out Action */}
              {session?.user && (
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut({ callbackUrl: '/signin' });
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
