'use client';

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
  Zap,
  ChevronRight,
  ChevronDown,
  Crown,
  Briefcase,
  Database,
  AlertTriangle,
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
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  users: {
    label: 'User Management',
    icon: Users,
    items: [
      { href: '/admin/users', label: 'All Users', icon: Users },
      { href: '/admin/users/department-admins', label: 'Department Admins', icon: Briefcase },
      { href: '/admin/users/sub-admins', label: 'Sub-Admins', icon: UserCheck },
      { href: '/admin/whitelist', label: 'Whitelist Management', icon: Shield },
    ],
  },
  departments: {
    label: 'Departments',
    icon: Building2,
    items: [
      { href: '/admin/departments', label: 'All Departments', icon: Building2 },
      { href: '/admin/departments/categories', label: 'Categories', icon: Tag },
    ],
  },
  achievements: {
    label: 'Achievements',
    icon: Award,
    items: [
      { href: '/admin/achievements', label: 'All Achievements', icon: Award },
      { href: '/admin/achievements/pending', label: 'Pending Review', icon: AlertTriangle },
      { href: '/admin/achievements/published', label: 'Published', icon: Zap },
    ],
  },
  events: {
    label: 'Events',
    icon: Calendar,
    items: [
      { href: '/admin/events', label: 'All Events', icon: Calendar },
      { href: '/admin/events/upcoming', label: 'Upcoming', icon: Zap },
      { href: '/admin/events/completed', label: 'Completed', icon: Award },
    ],
  },
  discipline: {
    label: 'Discipline & Cases',
    icon: ShieldAlert,
    items: [
      { href: '/admin/discipline', label: 'All Cases', icon: ShieldAlert },
    ],
  },
  students: {
    label: 'Students',
    icon: GraduationCap,
    items: [
      { href: '/admin/students', label: 'Student Directory', icon: GraduationCap },
      { href: '/admin/students/bulk', label: 'Bulk Import', icon: Upload },
    ],
  },
  faculty: {
    label: 'Faculty',
    icon: Briefcase,
    items: [
      { href: '/admin/faculty', label: 'Faculty Directory', icon: Briefcase },
      { href: '/admin/faculty/bulk', label: 'Bulk Import', icon: Upload },
    ],
  },
  categories: {
    label: 'Categories',
    icon: Tag,
    items: [
      { href: '/admin/categories', label: 'Manage Categories', icon: Tag },
    ],
  },
  'bulk-upload': {
    label: 'Bulk Upload',
    icon: Upload,
    items: [
      { href: '/admin/bulk-upload', label: 'Upload Center', icon: Upload },
      { href: '/admin/bulk-upload/templates', label: 'Download Templates', icon: FileText },
    ],
  },
  'bulk-review': {
    label: 'Bulk Review',
    icon: Search,
    items: [
      { href: '/admin/bulk-review', label: 'Pending Batches', icon: Search },
      { href: '/admin/bulk-review/history', label: 'Review History', icon: History },
    ],
  },
  deduplication: {
    label: 'Deduplication',
    icon: AlertTriangle,
    items: [
      { href: '/admin/deduplication', label: 'Collision Radar', icon: AlertTriangle },
      { href: '/admin/deduplication/rules', label: 'Match Rules', icon: Settings },
    ],
  },
  analytics: {
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { href: '/admin/analytics', label: 'Dashboard', icon: BarChart3 },
      { href: '/admin/analytics/departments', label: 'Department Comparison', icon: Building2 },
      { href: '/admin/analytics/trends', label: 'Trends', icon: Zap },
    ],
  },
  export: {
    label: 'Export Data',
    icon: Download,
    items: [
      { href: '/admin/export', label: 'Export Center', icon: Download },
      { href: '/admin/export/snapshots', label: 'Snapshots', icon: Database },
    ],
  },
  'audit-logs': {
    label: 'Audit Logs',
    icon: History,
    items: [
      { href: '/admin/audit-logs', label: 'All Logs', icon: History },
      { href: '/admin/audit-logs/export', label: 'Export Logs', icon: Download },
    ],
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    items: [
      { href: '/admin/settings', label: 'System Settings', icon: Settings },
      { href: '/admin/settings/root-transfer', label: 'Root Transfer', icon: Crown },
      { href: '/admin/settings/backup', label: 'Backup & Restore', icon: Database },
    ],
  },
} as const;

type MenuGroupKey = keyof typeof MENU_GROUPS;

interface MenuGroupProps {
  key: MenuGroupKey;
  group: typeof MENU_GROUPS[MenuGroupKey];
  pathname: string;
  visibleGroups: Set<MenuGroupKey>;
  isRoot: boolean;
  adminType: AdminType | null;
  departmentId: string | null;
  menuKey: MenuGroupKey;
}

function MenuGroup({
  key,
  group,
  pathname,
  visibleGroups,
  isRoot,
  adminType,
  departmentId,
  menuKey,
}: MenuGroupProps) {
  if (!visibleGroups.has(menuKey)) return null;

  const isActive = group.items.some((item) => pathname.startsWith(item.href));
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <details className={cn('group', isOpen && 'open')} open={isActive}>
      <summary
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
          'text-slate-300 hover:text-white hover:bg-space-700/50',
          isActive && 'text-brand-400 bg-brand-500/10'
        )}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        <group.icon className={cn('w-5 h-5 flex-shrink-0 transition-transform duration-200', isOpen && 'rotate-90')} aria-hidden="true" />
        <span className="font-medium text-sm flex-1 truncate">{group.label}</span>
        <ChevronRight className={cn('w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0', isOpen && 'rotate-90')} aria-hidden="true" />
      </summary>
      <ul className="mt-1 space-y-1 pl-8 animate-slide-up" role="list">
        {group.items.map((item) => {
          const isItemActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                  isItemActive
                    ? 'text-brand-400 bg-brand-500/10'
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
    </details>
  );
}

import { useState } from 'react';

export function AdminSidebar() {
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
      className="fixed left-0 top-16 bottom-0 w-72 bg-space-900/95 backdrop-blur-2xl border-r border-slate-800/50 z-30 overflow-y-auto scrollbar-thin"
      aria-label="Admin navigation"
    >
      <nav className="p-4 space-y-6" aria-label="Admin menu">
        {(Object.entries(MENU_GROUPS) as [MenuGroupKey, typeof MENU_GROUPS[MenuGroupKey]][]).map(([key, group]) => (
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

        <div className="pt-6 border-t border-slate-800/50">
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="space-y-2">
            <Link
              href="/admin/achievements?status=PENDING"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Review Pending</span>
            </Link>
            <Link
              href="/admin/bulk-upload"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Bulk Upload</span>
            </Link>
            <Link
              href="/admin/export"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-space-700/50 transition-all duration-200"
            >
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Export Data</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50 bg-space-900/95 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-space-800/50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-100 truncate">SREC Connect v3.0</p>
            <p className="text-[10px] text-slate-500">Sovereign Admin Portal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}