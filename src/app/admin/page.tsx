import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { canAccessAdmin } from '@/lib/rbac';
import { resolveScopedDepartmentId } from '@/lib/admin-auth';
import { HodPendingApprovalsWidget } from '@/components/admin/HodPendingApprovalsWidget';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  Calendar,
  GraduationCap,
  BookOpen,
  Upload,
  FileText,
  Search,
  BarChart3,
  Download,
  History,
  Settings,
  Shield,
  Zap,
  Crown,
  Database,
  AlertTriangle,
  TrendingUp,
  Target,
  Brain,
  Code,
  Globe,
  Briefcase,
  ArrowRight,
  ChevronRight,
  Plus,
  Eye,
  Filter,
  Clock,
  MapPin,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Command Center',
  description: 'SREC Connect Admin Dashboard - Sovereign control panel for managing achievements, events, users, and departments.',
};

const QUICK_STATS = [
  { label: 'Total Users', icon: Users, color: 'brand', href: '/admin/users', getValue: (stats: any) => stats.users },
  { label: '11 Departments', icon: Building2, color: 'cyan', href: '/admin/departments', getValue: (stats: any) => stats.departments },
  { label: 'Published Achievements', icon: Award, color: 'emerald', href: '/admin/achievements', getValue: (stats: any) => stats.achievements },
  { label: 'Upcoming Events', icon: Calendar, color: 'amber', href: '/admin/events', getValue: (stats: any) => stats.events },
];

const MODULES = [
  { key: 'departments', label: '11 Departments Registry', icon: Building2, href: '/admin/departments', description: 'Institutional directory across SREC academic departments', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'users', label: 'User Management', icon: Users, href: '/admin/users', description: 'Manage faculty & students within department scope', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'bulk-upload', label: 'Bulk Ingestion', icon: Upload, href: '/admin/bulk-upload', description: 'Excel/CSV student & faculty provisioning (Dept-scoped)', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'achievements', label: 'Verification Desk', icon: Award, href: '/admin/achievements', description: 'Split-screen 6-state verification & moderation desk', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'events', label: 'Events & Attendance', icon: Calendar, href: '/admin/events', description: 'Symposiums, waitlists & QR check-in', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'discipline', label: 'Discipline & Grievances', icon: Shield, href: '/admin/discipline', description: 'Confidential HOD dossiers & timelines', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'notices', label: 'Notices & Circulars', icon: Zap, href: '/admin/notices', description: 'Audience announcements & broadcasts', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'analytics', label: 'Analytics Hub', icon: BarChart3, href: '/admin/analytics', description: 'Momentum, trends & department metrics', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'students', label: 'Student Portfolios', icon: GraduationCap, href: '/students', description: 'Verified academic portfolios', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'faculty', label: 'Faculty Directory', icon: Briefcase, href: '/faculty', description: 'Faculty profiles & research areas', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'trash', label: 'Trash & System Recovery', icon: Trash2, href: '/admin/trash', description: 'Soft-deleted entities, recovery & hard purge', roles: ['ROOT'] },
  { key: 'settings', label: 'Backups & System Settings', icon: Crown, href: '/admin/settings', description: 'AES-256-GCM backups, Drive & restoration', roles: ['ROOT'] },
];

async function getStats(userRole: string, isSuperAdmin: boolean, departmentId: string | null) {
  const scopedDeptId = resolveScopedDepartmentId(userRole, departmentId);
  const where = scopedDeptId ? { departmentId: scopedDeptId, deletedAt: null } : { deletedAt: null };
  const userWhere = scopedDeptId
    ? { status: 'ACTIVE' as const, deletedAt: null, departmentId: scopedDeptId }
    : { status: 'ACTIVE' as const, deletedAt: null };
  const isolateGrievances = userRole === 'WEB_MANAGER' || userRole === 'FACULTY';

  const [
    users,
    departments,
    achievements,
    events,
    pendingAchievements,
    upcomingEvents,
    departmentGrievances,
    hodApprovalQueue,
    deptInfo,
  ] = await Promise.all([
    userRole === 'WEB_MANAGER' ? Promise.resolve(0) : prisma.user.count({ where: userWhere }),
    prisma.department.count({
      where: scopedDeptId ? { id: scopedDeptId, isActive: true } : { isActive: true },
    }),
    prisma.achievement.count({ where: { ...where, status: 'PUBLISHED' } }),
    prisma.event.count({ where: { ...where, status: 'UPCOMING' } }),
    prisma.achievement.count({
      where: { ...where, status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] } },
    }),
    prisma.event.count({ where: { ...where, status: 'UPCOMING', startDate: { gte: new Date() } } }),
    isolateGrievances
      ? Promise.resolve(0)
      : prisma.incident.count({
          where: scopedDeptId
            ? {
                deletedAt: null,
                status: {
                  in: [
                    'REPORTED',
                    'UNDER_REVIEW',
                    'AWAITING_STUDENT_RESPONSE',
                    'ACTION_REQUIRED',
                    'ESCALATED_TO_HOD',
                  ],
                },
                OR: [
                  { student: { departmentId: scopedDeptId } },
                  { reporter: { departmentId: scopedDeptId } },
                ],
              }
            : {
                deletedAt: null,
                status: {
                  in: [
                    'REPORTED',
                    'UNDER_REVIEW',
                    'AWAITING_STUDENT_RESPONSE',
                    'ACTION_REQUIRED',
                    'ESCALATED_TO_HOD',
                  ],
                },
              },
        }),
    prisma.achievement.findMany({
      where: {
        ...where,
        status: { in: ['APPROVED', 'UNDER_REVIEW', 'PENDING'] },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        title: true,
        personName: true,
        primaryStudentRoll: true,
        status: true,
        level: true,
        createdById: true,
        organizationEventName: true,
      },
    }),
    scopedDeptId
      ? prisma.department.findUnique({
          where: { id: scopedDeptId },
          select: { name: true, code: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    users,
    departments,
    achievements,
    events,
    pendingAchievements,
    upcomingEvents,
    departmentGrievances,
    hodApprovalQueue,
    departmentLabel: deptInfo ? `${deptInfo.name} (${deptInfo.code})` : 'All 11 Departments',
  };
}

function ModuleCard({ module, isAccessible, isRoot, userDepartmentId }: { module: typeof MODULES[0]; isAccessible: boolean; isRoot: boolean; userDepartmentId: string | null }) {
  if (!isAccessible) return null;

  return (
    <Link href={module.href} className="group">
      <Card variant="bento" hover className="h-full">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-500/30 transition-all duration-300">
              <module.icon className="w-6 h-6" />
            </div>
            <Badge variant="cyan" size="sm">{module.key.toUpperCase()}</Badge>
          </div>
          <h3 className="font-semibold text-slate-100 mb-1">{module.label}</h3>
          <p className="text-sm text-slate-400 mb-4 flex-1">{module.description}</p>
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
            <span className="text-sm font-medium text-brand-400 flex items-center gap-1">
              Access
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function AdminPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/signin?callbackUrl=/admin');
  }

  const user = session.user as any;
  if (!canAccessAdmin(user)) {
    redirect('/access-denied');
  }

  const userRole = user.role;
  if (userRole === 'FACULTY') {
    redirect('/admin/achievements');
  }
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || Boolean(user.isRoot);
  const isRoot = isSuperAdmin;
  const userDepartmentId = user.departmentId;
  const userAdminType = userRole === 'HOD' ? 'DEPARTMENT' : userRole === 'WEB_MANAGER' ? 'MANAGER' : 'ROOT';
  const userName = session.user?.name || 'Admin';
  const userEmail = session.user?.email || '';

  const stats = await getStats(userRole, isSuperAdmin, userDepartmentId);

  const visibleQuickStats =
    userRole === 'WEB_MANAGER'
      ? QUICK_STATS.filter((s) => s.href !== '/admin/users')
      : QUICK_STATS;

  const accessibleModules = MODULES.filter((m) => {
    if (isRoot) return true;
    if (userAdminType === 'DEPARTMENT') return m.roles.includes('DEPARTMENT');
    if (userAdminType === 'MANAGER') return m.roles.includes('MANAGER');
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {userAdminType === 'DEPARTMENT'
            ? 'HOD Department Command Center'
            : userAdminType === 'MANAGER'
            ? 'Web Manager Communications Console'
            : 'Executive Command Center'}
        </h1>
        <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
          {isRoot
            ? 'Sovereign institutional oversight across all 11 departments'
            : `Strictly scoped to ${stats.departmentLabel} • ${userAdminType}`}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {visibleQuickStats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block group">
            <Card variant="bento" hover className="h-full group-hover:border-primary/40 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105', `bg-${stat.color}-500/20 text-${stat.color}-400`)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <Badge variant={stat.color as any} size="sm">{stat.getValue(stats)}</Badge>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-foreground">{stat.getValue(stats)}</div>
                  <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>
                      {stat.href === '/admin/departments' && !isRoot
                        ? 'Bound Department'
                        : stat.label}
                    </span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(userRole === 'HOD' || isRoot) && (
        <HodPendingApprovalsWidget
          items={stats.hodApprovalQueue}
          currentUserId={String(user.id || '')}
          currentUserRole={userRole}
          departmentLabel={stats.departmentLabel}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {accessibleModules.map((module) => (
          <ModuleCard
            key={module.key}
            module={module}
            isAccessible={true}
            isRoot={isRoot}
            userDepartmentId={userDepartmentId}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Pending Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/achievements?status=SUBMITTED" className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pending Achievements</p>
                    <p className="text-sm text-muted-foreground">{stats.pendingAchievements} awaiting review</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link href="/admin/events?status=UPCOMING" className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Upcoming Events</p>
                    <p className="text-sm text-muted-foreground">{stats.upcomingEvents} scheduled</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              {userRole !== 'WEB_MANAGER' && (
                <Link href="/admin/discipline" className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Active Department Grievances</p>
                      <p className="text-sm text-muted-foreground">{stats.departmentGrievances} open / investigating</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="bento">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/achievements?status=SUBMITTED" className="p-4 rounded-xl bg-background border border-border hover:border-primary/40 transition-all text-center group">
                <Award className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-foreground">Verification Desk</p>
                <p className="text-xs text-muted-foreground">{stats.pendingAchievements} pending</p>
              </Link>
              <Link href="/admin/bulk-upload" className="p-4 rounded-xl bg-background border border-border hover:border-primary/40 transition-all text-center group">
                <Upload className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-foreground">Bulk Upload</p>
                <p className="text-xs text-muted-foreground">Excel/CSV import</p>
              </Link>
              <Link href="/admin/export" className="p-4 rounded-xl bg-background border border-border hover:border-emerald-500/40 transition-all text-center group">
                <Download className="w-8 h-8 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-xs text-muted-foreground">Multi-format</p>
              </Link>
              {userRole === 'WEB_MANAGER' ? (
                <Link href="/admin/notices" className="p-4 rounded-xl bg-background border border-border hover:border-primary/40 transition-all text-center group">
                  <Zap className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-foreground">Broadcast Notice</p>
                  <p className="text-xs text-muted-foreground">Circulars &amp; Updates</p>
                </Link>
              ) : (
                <Link href="/admin/deduplication" className="p-4 rounded-xl bg-background border border-border hover:border-rose-500/40 transition-all text-center group">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-foreground">Deduplication</p>
                  <p className="text-xs text-muted-foreground">Collision radar</p>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}