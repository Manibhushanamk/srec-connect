'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
    { label: 'Academic Departments', href: '/departments', icon: Building2 },
    { label: 'About College', href: '/about', icon: Info },
  ];

  const adminLinks = [
    { label: 'Admin Console', href: '/admin', icon: Shield },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Bulk Ingestion', href: '/admin/bulk-upload', icon: FileSpreadsheet },
    { label: 'Verify Achievements', href: '/admin/achievements', icon: Award },
    { label: 'Campus Events', href: '/admin/events', icon: Calendar },
    { label: 'Discipline & Grievances', href: '/admin/discipline', icon: ShieldAlert },
    { label: 'Notices & Circulars', href: '/admin/notices', icon: Bell },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar pb-6">
      {/* 1. User Quick Mini Card (LinkedIn Style) */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4 shadow-subtle">
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
      <div className="bg-card rounded-2xl border border-border p-3 mb-4 shadow-subtle">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
          Explore
        </div>
        <nav className="space-y-1">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Academic Departments & College Info */}
      <div className="bg-card rounded-2xl border border-border p-3 mb-4 shadow-subtle">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
          Campus Information
        </div>
        <nav className="space-y-1">
          {exploreLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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

          {/* Admin Management Links */}
          {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HOD' || userRole === 'WEB_MANAGER' || !userRole) && (
            <>
              <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-primary uppercase tracking-wider">
                Administration
              </div>
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
            </>
          )}
        </nav>
      </div>

      {/* 4. Footer credits */}
      <div className="px-3 text-[11px] text-muted-foreground">
        <p>© 2026 Santhiram Engineering College</p>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">CSE (AI & ML) Department Platform</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
