import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { AdminShell } from '@/components/layout/AdminShell';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import { GoogleDriveCard } from '@/components/dashboard/GoogleDriveCard';
import {
  Award,
  Medal,
  Trophy,
  Star,
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Shield,
  GraduationCap,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Dashboard',
  description: 'Your personal achievement portfolio and submission center.',
};

async function getStudentData(studentId: string) {
  const [student, achievements, pendingCount] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true, user: true },
    }),
    prisma.achievement.findMany({
      where: { primaryStudentId: studentId, deletedAt: null },
      include: { category: true, department: true, media: { where: { isCover: true }, take: 1 } },
      orderBy: { achievementDate: 'desc' },
    }),
    prisma.achievement.count({ where: { primaryStudentId: studentId, status: 'PENDING', deletedAt: null } }),
  ]);

  return { student, achievements, pendingCount };
}

export default async function StudentDashboardPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard/student');
  }

  const userRole = (session.user as any).role;
  const studentId = (session.user as any).studentId;

  if (userRole !== Role.STUDENT || !studentId) {
    redirect('/auth/access-denied');
  }

  const data = await getStudentData(studentId);
  const { student, achievements, pendingCount } = data;

  if (!student) {
    redirect('/auth/access-denied');
  }

  const publishedAchievements = achievements.filter(a => a.status === 'PUBLISHED');
  const pendingAchievements = achievements.filter(a => a.status === 'PENDING');
  const rejectedAchievements = achievements.filter(a => a.status === 'REJECTED');
  const draftAchievements = achievements.filter(a => a.status === 'DRAFT');

  return (
    <AdminShell
      title="Student Dashboard"
      description="Your personal achievement portfolio & submission center"
      roleScope="STUDENT"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/student' }]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Medal className="w-5 h-5" />
              </div>
              <Badge variant="emerald" size="sm" glow>{publishedAchievements.length}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">{publishedAchievements.length}</div>
              <div className="text-sm text-slate-400">Published Honors</div>
            </div>
          </CardContent>
        </Card>
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <Badge variant="amber" size="sm" glow>{pendingCount}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">{pendingCount}</div>
              <div className="text-sm text-slate-400">Pending Review</div>
            </div>
          </CardContent>
        </Card>
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <Badge variant="brand" size="sm">
                {achievements.filter(a => a.level === 'INTERNATIONAL' || a.level === 'NATIONAL').length}
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">
                {achievements.filter(a => a.level === 'INTERNATIONAL' || a.level === 'NATIONAL').length}
              </div>
              <div className="text-sm text-slate-400">Top Tier Awards</div>
            </div>
          </CardContent>
        </Card>
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <Badge variant="cyan" size="sm">
                {achievements.filter(a => a.participationType === 'TEAM').length}
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">
                {achievements.filter(a => a.participationType === 'TEAM').length}
              </div>
              <div className="text-sm text-slate-400">Team Achievements</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Your Achievements</h2>
              <p className="text-sm text-slate-400">{achievements.length} total submissions</p>
            </div>
            <Link href="/dashboard/student/submit">
              <Button variant="primary" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Submit New
              </Button>
            </Link>
          </div>

          {achievements.length === 0 ? (
            <EmptyStatePreset 
              type="achievements" 
              action={{ label: 'Submit Your First Achievement', href: '/dashboard/student/submit', variant: 'primary' }}
            />
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <Link key={achievement.id} href={`/achievements/${achievement.id}`} className="group">
                  <Card variant="glass" hover className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-100 truncate">{achievement.title}</h3>
                        <StatusBadge status={achievement.status} size="sm" />
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        <span>{achievement.category.name}</span>
                        <span>•</span>
                        <span>{achievement.level}</span>
                        <span>•</span>
                        <span>{formatDate(achievement.achievementDate)}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Dedicated Google Drive Cloud Storage & Permission Card */}
          <GoogleDriveCard />

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} alt="" className="w-16 h-16 rounded-xl" />
                  ) : (
                    <span className="text-white text-2xl font-bold">{student.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{student.name}</h3>
                  <p className="text-sm text-slate-400 font-mono">{student.rollNumber}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department</span>
                  <span className="text-slate-100">{student.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch</span>
                  <span className="text-slate-100">{student.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Section</span>
                  <span className="text-slate-100">{student.section}</span>
                </div>
                {student.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-100 truncate max-w-[150px]">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone</span>
                    <span className="text-slate-100">{student.phone}</span>
                  </div>
                )}
              </div>
              <Link href="/dashboard/student/settings" className="btn-secondary w-full justify-center text-sm">
                Edit Profile
              </Link>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/student/submit" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Submit Achievement</p>
                  <p className="text-xs text-slate-500">Add new honor or award</p>
                </div>
              </Link>
              <Link href="/achievements" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Browse All Achievements</p>
                  <p className="text-xs text-slate-500">Explore campus honors</p>
                </div>
              </Link>
              <Link href="/events" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Upcoming Events</p>
                  <p className="text-xs text-slate-500">Register for events</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

