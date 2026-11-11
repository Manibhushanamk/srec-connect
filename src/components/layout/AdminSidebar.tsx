'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  Calendar,
  GraduationCap,
  UserCheck,
  Tag,
  Upload,
  FileText,
  Search,
  BarChart3,
  Download,
  History,
  Settings,
  Shield,
  ShieldAlert,
  Bell,
  Zap,
  ChevronRight,
  ChevronDown,
  Crown,
  Briefcase,
  Database,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getVisibleMenuGroups, PermissionContext } from '@/lib/rbac';
import { Role, AdminType } from '@prisma/client';

const MENU_GROUPS = {
  overview: {
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics Hub', icon: BarChart3 },
    ],
  },
  users: {
    label: 'User Management',
    icon: Users,
    items: [
      { href: '/admin/users', label: 'All Users', icon: Users },
      { href: '/admin/bulk-upload', label: 'Bulk Ingestion', icon: Upload },
    ],
  },
  achievements: {
    label: 'Achievements',
    icon: Award,
    items: [
      { href: '/admin/achievements', label: 'Verification Desk', icon: Award },
      { href: '/achievements', label: 'Honors Wall', icon: Zap },
    ],
  },
  events: {
    label: 'Events & Check-in',
    icon: Calendar,
    items: [
      { href: '/admin/events', label: 'Manage Events', icon: Calendar },
      { href: '/events', label: 'Public Events', icon: Zap },
    ],
  },
  discipline: {
    label: 'Discipline & Grievances',
    icon: ShieldAlert,
    items: [
      { href: '/admin/discipline', label: 'Incident Cases', icon: ShieldAlert },
    ],
  },
  notices: {
    label: 'Notices & Circulars',
    icon: Bell,
    items: [
      { href: '/admin/notices', label: 'Announcements', icon: Bell },
    ],
  },
  logs: {
    label: 'Security & Audit Logs',
    icon: History,
    items: [
      { href: '/admin/logs', label: 'Institutional Audit Logs', icon: History },
    ],
  },
  trash: {
    label: 'System Recovery',
    icon: Trash2,
    items: [
      { href: '/admin/trash', label: 'Trash Management', icon: Trash2 },
    ],
  },
  portals: {
    label: 'Campus Portals',
    icon: Building2,
    items: [
      { href: '/', label: 'Campus Feed', icon: LayoutDashboard },
      { href: '/students', label: 'Student Directory', icon: GraduationCap },
      { href: '/faculty', label: 'Faculty Directory', icon: Briefcase },
    ],
  },
  profile: {
    label: 'My Account',
    icon: Crown,
    items: [
      { href: '/profile', label: 'Profile & Customization', icon: Crown },
    ],
  },
} as const;

type MenuGroupKey = keyof typeof MENU_GROUPS;

interface MenuGroupProps {
  group: (typeof MENU_GROUPS)[MenuGroupKey];
  pathname: string;
  visibleGroups: Set<MenuGroupKey>;
  isRoot: boolean;
  adminType: AdminType | null;
  departmentId: string | null;
  menuKey: MenuGroupKey;
}

function MenuGroup({
  group,
  pathname,
  visibleGroups,
  menuKey,
}: MenuGroupProps) {
  const isVisible = visibleGroups.has(menuKey);
  const isActive = group.items.some(
    (item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
  );
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  if (!isVisible) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-left select-none',
          'text-slate-300 hover:text-white hover:bg-space-700/50',
          isActive && 'text-brand-400 bg-brand-500/10 font-semibold'
        )}
        aria-expanded={isOpen}
      >
        <group.icon
          className={cn(
            'w-5 h-5 flex-shrink-0 transition-colors duration-200',
            isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'
          )}
          aria-hidden="true"
        />
        <span className="font-medium text-sm flex-1 truncate">{group.label}</span>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0',
            isOpen && 'rotate-90 text-brand-400'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul className="mt-1 space-y-1 pl-7 animate-slide-up" role="list">
          {group.items.map((item) => {
            const isItemActive =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                    isItemActive
                      ? 'text-brand-400 bg-brand-500/10 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-space-700/30'
                  )}
                  aria-current={isItemActive ? 'page' : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AdminSidebar({ className }: { className?: string } = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role as Role | undefined;
  const userAdminType = (session?.user as any)?.adminType as AdminType | undefined;
  const isRoot = (session?.user as any)?.isRoot as boolean;
  const departmentId = (session?.user as any)?.departmentId as string | null;

  const context: PermissionContext = {
    userId: (session?.user as any)?.id || '',
    role: userRole || Role.STUDENT,
    adminType: userAdminType || null,
    isRoot: isRoot || false,
    departmentId,
  };

  const visibleGroupsArray = getVisibleMenuGroups(context);
  const visibleGroups = new Set(visibleGroupsArray as MenuGroupKey[]);

  return (
    <aside
      className={cn(
        'left-0 top-16 bottom-0 w-72 bg-space-900/95 backdrop-blur-2xl border-r border-slate-800/50 z-30 overflow-y-auto scrollbar-thin',
        className || 'fixed'
      )}
      aria-label="Admin navigation"
    >
      <nav className="p-4 space-y-4" aria-label="Admin menu">
        {(Object.entries(MENU_GROUPS) as [MenuGroupKey, (typeof MENU_GROUPS)[MenuGroupKey]][]).map(([key, group]) => (
          <MenuGroup
            key={key}
            group={group}
            pathname={pathname}
            visibleGroups={visibleGroups}
            isRoot={isRoot}
            adminType={userAdminType || null}
            departmentId={departmentId}
            menuKey={key}
          />
        ))}

        <div className="pt-5 border-t border-slate-800/50">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Quick Actions
          </p>
          <div className="space-y-1.5">
            {userRole === 'STUDENT' ? (
              <>
                <Link
                  href="/dashboard/student/submit"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Submit Achievement</span>
                </Link>
                <Link
                  href="/dashboard/student"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-400" />
                  <span>Student Dashboard</span>
                </Link>
                <Link
                  href="/students"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Student Directory</span>
                </Link>
              </>
            ) : userRole === 'FACULTY' ? (
              <>
                <Link
                  href="/admin/achievements"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Verification Desk</span>
                </Link>
                <Link
                  href="/dashboard/faculty/submit"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Submit Record</span>
                </Link>
                <Link
                  href="/dashboard/faculty"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-400" />
                  <span>Faculty Dashboard</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/admin/achievements?status=PENDING"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Review Pending</span>
                </Link>
                <Link
                  href="/admin/bulk-upload"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Bulk Upload</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>User Directory</span>
                </Link>
                <Link
                  href="/admin/trash"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Trash Recovery</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800/50 bg-space-900/95 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-space-800/50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-100 truncate">
              {userRole === 'STUDENT' ? 'Student Workspace' : userRole === 'FACULTY' ? 'Faculty Portal' : 'SREC Connect v3.0'}
            </p>
            <p className="text-[10px] text-slate-400">
              {userRole === 'STUDENT' ? 'Academic Honors Center' : userRole === 'FACULTY' ? 'Research & Review Desk' : 'Institutional Console'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
