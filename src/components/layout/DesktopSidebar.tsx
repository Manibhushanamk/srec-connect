'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isWebManagerRestrictedRoute } from '@/lib/admin-auth';
import {
  Home,
  Calendar,
  Award,
  Users,
  BookOpen,
  Building2,
  Info,
  Shield,
  ShieldAlert,
  Bell,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Plus,
  Trash2,
  Settings,
  Download,
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role;
  const roleBadgeText =
    userRole === 'SUPER_ADMIN' ? '👑 Super Admin' :
    userRole === 'HOD' ? '🏛️ HOD (AIML)' :
    userRole === 'FACULTY' ? '🎓 Faculty' :
    userRole === 'WEB_MANAGER' ? '🌐 Web Ops' :
    userRole === 'STUDENT' ? '🎒 Student' : null;

  const defaultDisplayName =
    userRole === 'SUPER_ADMIN' ? 'Super Administrator' :
    userRole === 'HOD' ? 'Head of Department' :
    userRole === 'FACULTY' ? 'Faculty Member' :
    userRole === 'STUDENT' ? 'Student Scholar' : 'Campus Member';

  const mainLinks = [
    { label: 'Community Feed', href: '/', icon: Home },
    { label: 'Department Events', href: '/events', icon: Calendar },
    { label: 'Achievements', href: '/achievements', icon: Award },
    { label: 'Faculty Directory', href: '/faculty', icon: BookOpen },
    { label: 'Student Directory', href: '/students', icon: Users },
    { label: 'Grievances & Conduct', href: '/grievances', icon: ShieldAlert },
  ];

  const exploreLinks = [
    { label: 'About College', href: '/about', icon: Info },
  ];

  const adminLinks = [
    { label: 'Admin Console', href: '/admin', icon: Shield },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Bulk Ingestion', href: '/admin/bulk-upload', icon: FileSpreadsheet },
    { label: 'Verify Achievements', href: '/admin/achievements', icon: Award },
    { label: 'Export Achievements', href: '/admin/export', icon: Download },
    { label: 'Campus Events', href: '/admin/events', icon: Calendar },
    { label: 'Discipline & Grievances', href: '/admin/discipline', icon: ShieldAlert },
    { label: 'Notices & Circulars', href: '/admin/notices', icon: Bell },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-60 xl:w-64 flex-shrink-0 sticky top-20 max-h-[calc(100dvh-5.75rem)] overflow-y-auto no-scrollbar pb-4">
      {/* 1. User Quick Mini Card (Apple Liquid Glass Tier 1) */}
      <div className="glass-card p-3.5 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base overflow-hidden">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="User"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              (session?.user?.name || 'SREC').substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-foreground truncate">
                {session?.user?.name || defaultDisplayName}
              </h4>
              {roleBadgeText && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                  {roleBadgeText}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email || 'CSE (AI & ML)'}
            </p>
          </div>
        </div>

        <Link
          href="/profile"
          className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
        >
          View Full Profile <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Main Navigation Links */}
      <div className="glass-card p-3 mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
          Explore
        </div>
        <nav className="space-y-0.5">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} aria-hidden="true" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Campus Information — merged section */}
          <div className="border-t border-border/60 mt-1.5 pt-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1">
              Campus
            </div>
          </div>
          {exploreLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} aria-hidden="true" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Student Workspace */}
          {userRole === 'STUDENT' && (
            <>
              <div className="border-t border-border/60 mt-1.5 pt-1.5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider px-3 py-1">
                  Student Workspace
                </div>
              </div>
              <Link
                href="/dashboard/student"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  pathname === '/dashboard/student'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${pathname === '/dashboard/student' ? 'text-white' : 'text-muted-foreground'}`} />
                <span>My Dashboard</span>
              </Link>
              <Link
                href="/dashboard/student/submit"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  pathname === '/dashboard/student/submit'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Plus className={`w-4 h-4 ${pathname === '/dashboard/student/submit' ? 'text-white' : 'text-muted-foreground'}`} />
                <span>Submit Achievement</span>
              </Link>
            </>
          )}

          {/* Faculty Portal */}
          {userRole === 'FACULTY' && (
            <>
              <div className="border-t border-border/60 mt-1.5 pt-1.5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider px-3 py-1">
                  Faculty Portal
                </div>
              </div>
              <Link
                href="/dashboard/faculty"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  pathname === '/dashboard/faculty'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${pathname === '/dashboard/faculty' ? 'text-white' : 'text-muted-foreground'}`} />
                <span>Faculty Dashboard</span>
              </Link>
              <Link
                href="/admin/achievements"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  pathname === '/admin/achievements'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Award className={`w-4 h-4 ${pathname === '/admin/achievements' ? 'text-white' : 'text-muted-foreground'}`} />
                <span>Verify Achievements</span>
              </Link>
              <Link
                href="/dashboard/faculty/submit"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  pathname === '/dashboard/faculty/submit'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Plus className={`w-4 h-4 ${pathname === '/dashboard/faculty/submit' ? 'text-white' : 'text-muted-foreground'}`} />
                <span>Submit Record</span>
              </Link>
            </>
          )}

          {/* Admin Management Links */}
          {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HOD' || userRole === 'WEB_MANAGER') && (
            <>
              <div className="border-t border-border/60 mt-1.5 pt-1.5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider px-3 py-1">
                  Administration
                </div>
              </div>
              {adminLinks
                .filter((link) => !(userRole === 'WEB_MANAGER' && isWebManagerRestrictedRoute(link.href)))
                .map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
                <Link
                  href="/admin/trash"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    pathname === '/admin/trash'
                      ? 'bg-primary text-white font-semibold'
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Trash2 className={`w-4 h-4 ${pathname === '/admin/trash' ? 'text-white' : 'text-muted-foreground'}`} />
                  <span>Trash Recovery</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>

      {/* 3. Footer credits */}
      <div className="px-3 text-[10px] text-muted-foreground space-y-0.5">
        <p>© 2026 Santhiram Engineering College</p>
        <p className="text-muted-foreground/80">CSE (AI & ML) Department Platform</p>
        <div className="flex items-center gap-2 pt-0.5 text-muted-foreground/80">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <span>•</span>
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
