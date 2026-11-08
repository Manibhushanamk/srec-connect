import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminShell } from '@/components/layout/AdminShell';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { canAccessAdmin } from '@/lib/rbac';
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
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Command Center',
  description: 'SREC Connect Admin Dashboard - Sovereign control panel for managing achievements, events, users, and departments.',
};

const QUICK_STATS = [
  { label: 'Total Users', icon: Users, color: 'brand', getValue: (stats: any) => stats.users },
  { label: 'Departments', icon: Building2, color: 'cyan', getValue: (stats: any) => stats.departments },
  { label: 'Published Achievements', icon: Award, color: 'emerald', getValue: (stats: any) => stats.achievements },
  { label: 'Upcoming Events', icon: Calendar, color: 'amber', getValue: (stats: any) => stats.events },
];

const MODULES = [
  { key: 'overview', label: 'Command Center', icon: LayoutDashboard, href: '/admin', description: 'System overview & telemetry', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'users', label: 'User Management', icon: Users, href: '/admin/users', description: 'Manage admins, faculty & students', roles: ['ROOT'] },
  { key: 'departments', label: 'Departments', icon: Building2, href: '/admin/departments', description: 'Manage 11 academic departments', roles: ['ROOT'] },
  { key: 'achievements', label: 'Achievements', icon: Award, href: '/admin/achievements', description: 'Review & publish honors', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'events', label: 'Events', icon: Calendar, href: '/admin/events', description: 'Manage symposiums & workshops', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'students', label: 'Students', icon: GraduationCap, href: '/admin/students', description: 'Student directory & bulk import', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'faculty', label: 'Faculty', icon: Briefcase, href: '/admin/faculty', description: 'Faculty profiles & research', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'categories', label: 'Categories', icon: Award, href: '/admin/categories', description: 'Achievement & event categories', roles: ['ROOT'] },
  { key: 'bulk-upload', label: 'Bulk Upload', icon: Upload, href: '/admin/bulk-upload', description: 'Excel/CSV bulk ingestion', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'bulk-review', label: 'Bulk Review', icon: Search, href: '/admin/bulk-review', description: 'Review staged batches', roles: ['ROOT', 'DEPARTMENT', 'MANAGER'] },
  { key: 'deduplication', label: 'Deduplication', icon: AlertTriangle, href: '/admin/deduplication', description: 'Collision detection & merge', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin/analytics', description: 'Insights & trends', roles: ['ROOT'] },
  { key: 'export', label: 'Export Data', icon: Download, href: '/admin/export', description: 'Multi-format data export', roles: ['ROOT', 'DEPARTMENT'] },
  { key: 'audit-logs', label: 'Audit Logs', icon: History, href: '/admin/audit-logs', description: 'System activity logs', roles: ['ROOT'] },
  { key: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings', description: 'System configuration', roles: ['ROOT'] },
];

async function getStats(userId: string, isSuperAdmin: boolean, departmentId: string | null) {
  const where = isSuperAdmin ? {} : { departmentId };

  const [users, departments, achievements, events, pendingAchievements, upcomingEvents] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.achievement.count({ where: { ...where, status: 'PUBLISHED' } }),
    prisma.event.count({ where: { ...where, status: 'UPCOMING' } }),
    prisma.achievement.count({ where: { ...where, status: 'PENDING' } }),
    prisma.event.count({ where: { ...where, status: 'UPCOMING', startDate: { gte: new Date() } } }),
  ]);

  return { users, departments, achievements, events, pendingAchievements, upcomingEvents };
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
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || Boolean(user.isRoot);
  const isRoot = isSuperAdmin;
  const userDepartmentId = user.departmentId;
  const userAdminType = userRole === 'HOD' ? 'DEPARTMENT' : userRole === 'WEB_MANAGER' ? 'MANAGER' : 'ROOT';
  const userName = session.user?.name || 'Admin';
  const userEmail = session.user?.email || '';

  const stats = await getStats(user.id, isSuperAdmin, userDepartmentId);

  const accessibleModules = MODULES.filter((m) => {
    if (isRoot) return true;
    if (userAdminType === 'DEPARTMENT') return m.roles.includes('DEPARTMENT');
    if (userAdminType === 'MANAGER') return m.roles.includes('MANAGER');
    return false;
  });

  return (
    <AdminShell
      title="Command Center"
      description={isRoot ? 'Sovereign control across all 11 departments' : `Scoped to your department • ${userAdminType}`}
      breadcrumbs={[]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {QUICK_STATS.map((stat) => (
          <Card key={stat.label} variant="bento" hover>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `bg-${stat.color}-500/20 text-${stat.color}-400`)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <Badge variant={stat.color as any} size="sm" glow>{stat.getValue(stats)}</Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-100">{stat.getValue(stats)}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Pending Review Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/achievements?status=PENDING" className="flex items-center justify-between p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">Pending Achievements</p>
                    <p className="text-sm text-slate-400">{stats.pendingAchievements} awaiting review</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </Link>
              <Link href="/admin/events?status=UPCOMING" className="flex items-center justify-between p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">Upcoming Events</p>
                    <p className="text-sm text-slate-400">{stats.upcomingEvents} scheduled</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </Link>
              <Link href="/admin/bulk-review" className="flex items-center justify-between p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">Bulk Review Queue</p>
                    <p className="text-sm text-slate-400">Check staged batches</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/achievements?status=PENDING" className="p-4 rounded-xl bg-space-800/50 border border-slate-700/30 hover:bg-space-700/50 hover:border-brand-500/30 transition-all text-center group">
                <Award className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-100">Review Honors</p>
                <p className="text-xs text-slate-500">{stats.pendingAchievements} pending</p>
              </Link>
              <Link href="/admin/bulk-upload" className="p-4 rounded-xl bg-space-800/50 border border-slate-700/30 hover:bg-space-700/50 hover:border-cyan-500/30 transition-all text-center group">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-100">Bulk Upload</p>
                <p className="text-xs text-slate-500">Excel/CSV import</p>
              </Link>
              <Link href="/admin/export" className="p-4 rounded-xl bg-space-800/50 border border-slate-700/30 hover:bg-space-700/50 hover:border-emerald-500/30 transition-all text-center group">
                <Download className="w-8 h-8 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-100">Export Data</p>
                <p className="text-xs text-slate-500">Multi-format</p>
              </Link>
              <Link href="/admin/deduplication" className="p-4 rounded-xl bg-space-800/50 border border-slate-700/30 hover:bg-space-700/50 hover:border-rose-500/30 transition-all text-center group">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-100">Deduplication</p>
                <p className="text-xs text-slate-500">Collision radar</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}