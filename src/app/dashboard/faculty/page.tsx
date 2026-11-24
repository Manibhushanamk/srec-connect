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
  BookOpen,
  Calendar,
  Users,
  ArrowRight,
  Plus,
  Eye,
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  Building2,
  FileText,
  Pen,
  ExternalLink,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Faculty Dashboard',
  description: 'Your research portfolio, publications, and academic achievements.',
};

async function getFacultyData(facultyId: string) {
  const [faculty, achievements, pendingCount] = await Promise.all([
    prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true, user: true },
    }),
    prisma.achievement.findMany({
      where: { facultyId, deletedAt: null },
      include: { category: true, department: true, media: { where: { isCover: true }, take: 1 } },
      orderBy: { achievementDate: 'desc' },
    }),
    prisma.achievement.count({ where: { facultyId, status: 'PENDING', deletedAt: null } }),
  ]);

  return { faculty, achievements, pendingCount };
}

export default async function FacultyDashboardPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard/faculty');
  }

  const userRole = (session.user as any).role;
  const facultyId = (session.user as any).facultyId;

  if (userRole !== Role.FACULTY || !facultyId) {
    redirect('/auth/access-denied');
  }

  const data = await getFacultyData(facultyId);
  const { faculty, achievements, pendingCount } = data;

  if (!faculty) {
    redirect('/auth/access-denied');
  }

  const publishedAchievements = achievements.filter(a => a.status === 'PUBLISHED');
  const pendingAchievements = achievements.filter(a => a.status === 'PENDING');
  const rejectedAchievements = achievements.filter(a => a.status === 'REJECTED');
  const draftAchievements = achievements.filter(a => a.status === 'DRAFT');

  const publications = publishedAchievements.filter(a => a.category.name.toLowerCase().includes('research') || a.category.name.toLowerCase().includes('publication') || a.category.name.toLowerCase().includes('paper'));
  const patents = publishedAchievements.filter(a => a.category.name.toLowerCase().includes('patent'));

  return (
    <AdminShell
      title="Faculty Dashboard"
      description="Your research portfolio, publications & academic achievements"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/faculty' }]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <Badge variant="brand" size="sm" glow>{publications.length}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">{publications.length}</div>
              <div className="text-sm text-slate-400">Publications</div>
            </div>
          </CardContent>
        </Card>
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Medal className="w-5 h-5" />
              </div>
              <Badge variant="amber" size="sm" glow>{patents.length}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">{patents.length}</div>
              <div className="text-sm text-slate-400">Patents</div>
            </div>
          </CardContent>
        </Card>
        <Card variant="bento" hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <Badge variant="emerald" size="sm" glow>{pendingCount}</Badge>
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
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <Badge variant="cyan" size="sm">
                {achievements.filter(a => a.participationType === 'TEAM').length}
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-100">
                {achievements.filter(a => a.participationType === 'TEAM').length}
              </div>
              <div className="text-sm text-slate-400">Guided Projects</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Research & Achievements</h2>
              <p className="text-sm text-slate-400">{achievements.length} total records</p>
            </div>
            <Link href="/dashboard/faculty/submit">
              <Button variant="primary" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Record
              </Button>
            </Link>
          </div>

          {achievements.length === 0 ? (
            <EmptyStatePreset 
              type="achievements" 
              title="No Research Records Yet"
              description="Start building your academic portfolio by adding publications, patents, and guided projects."
              action={{ label: 'Add Your First Record', href: '/dashboard/faculty/submit', variant: 'primary' }}
            />
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <Link key={achievement.id} href={`/achievements/${achievement.id}`} className="group">
                  <Card variant="glass" hover className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
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
                <Briefcase className="w-5 h-5 text-brand-400" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                  {faculty.avatarUrl ? (
                    <img src={faculty.avatarUrl} alt="" className="w-16 h-16 rounded-xl" />
                  ) : (
                    <span className="text-white text-2xl font-bold">{faculty.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{faculty.name}</h3>
                  <p className="text-sm text-slate-400">{faculty.designation}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department</span>
                  <span className="text-slate-100">{faculty.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Role</span>
                  <Badge variant="brand" size="sm">{faculty.roleCategory?.replace(/_/g, ' ') || 'N/A'}</Badge>
                </div>
                {faculty.degrees && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Degrees</span>
                    <span className="text-slate-100">{faculty.degrees}</span>
                  </div>
                )}
                {faculty.experience && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience</span>
                    <span className="text-slate-100">{faculty.experience}</span>
                  </div>
                )}
                {faculty.cabin && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cabin</span>
                    <span className="text-slate-100">{faculty.cabin}</span>
                  </div>
                )}
                {faculty.googleScholar && (
                  <a href={faculty.googleScholar} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300">
                    <ExternalLink className="w-4 h-4" />
                    Google Scholar Profile
                  </a>
                )}
              </div>
              <Link href="/dashboard/faculty/settings" className="btn-secondary w-full justify-center text-sm">
                Edit Profile
              </Link>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pen className="w-5 h-5 text-cyan-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/faculty/submit" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Add Publication</p>
                  <p className="text-xs text-slate-500">New research paper</p>
                </div>
              </Link>
              <Link href="/dashboard/faculty/submit?type=patent" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Medal className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Add Patent</p>
                  <p className="text-xs text-slate-500">New patent filing</p>
                </div>
              </Link>
              <Link href="/dashboard/faculty/submit?type=project" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Guided Project</p>
                  <p className="text-xs text-slate-500">Student project record</p>
                </div>
              </Link>
              <Link href="/faculty" className="flex items-center gap-3 p-3 rounded-xl bg-space-800/50 hover:bg-space-700/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100 text-sm">Browse Faculty</p>
                  <p className="text-xs text-slate-500">View colleagues</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

