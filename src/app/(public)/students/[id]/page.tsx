import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { ProfileHeader } from '@/components/portfolio/ProfileHeader';
import { AchievementCard } from '@/components/cards/AchievementCard';
import { formatDate } from '@/lib/utils';
import {
  Award,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Edit,
  CheckCircle,
} from 'lucide-react';

interface StudentProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StudentProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id }, { rollNumber: id }],
    },
    include: { department: true },
  });

  if (!student) {
    return { title: 'Student Not Found | SREC Connect' };
  }

  return {
    title: `${student.name} (${student.rollNumber}) | SREC Connect Portfolio`,
    description: `${student.name}'s verified academic portfolio and achievements in ${student.department?.name || 'CSE - AIML'} at SREC Nandyal.`,
  };
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id }, { rollNumber: id }],
    },
    include: {
      department: true,
      user: true,
      primaryAchievements: {
        where: {
          status: { in: ['APPROVED', 'PUBLISHED'] },
        },
        include: { category: true, media: true },
        orderBy: { achievementDate: 'desc' },
      },
      teamAchievements: {
        include: {
          achievement: {
            include: { category: true, media: true },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const isOwner = Boolean(
    session?.user?.email &&
      student.user?.email &&
      session.user.email.toLowerCase() === student.user.email.toLowerCase()
  );

  const viewerEmail = session?.user?.email?.toLowerCase().trim();
  let viewerRole = '';
  let isStaffOrAdmin = false;
  if (viewerEmail) {
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail },
      select: { role: true },
    });
    if (viewer) {
      viewerRole = viewer.role;
      isStaffOrAdmin = ['SUPER_ADMIN', 'HOD', 'FACULTY'].includes(viewer.role);
    }
  }

  let studentIncidents: any[] = [];
  if (viewerRole === 'HOD' || viewerRole === 'SUPER_ADMIN') {
    studentIncidents = await prisma.incident.findMany({
      where: { studentId: student.id, deletedAt: null },
      include: {
        reporter: { select: { name: true, role: true } },
        actions: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  const verifiedAchievements = student.primaryAchievements || [];
  const teamVerifiedAchievements = (student.teamAchievements || [])
    .map((ta) => ta.achievement)
    .filter((a) => a.status === 'APPROVED' || a.status === 'PUBLISHED');
  const allAchievements = [...verifiedAchievements, ...teamVerifiedAchievements];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students Directory
        </Link>
        <div className="flex items-center gap-2">
          {isStaffOrAdmin && (
            <Link href={`/grievances?action=file_incident&studentRoll=${student.rollNumber}`}>
              <Button size="sm" variant="outline" className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                Report Incident
              </Button>
            </Link>
          )}
          {isOwner && (
            <Link href="/profile">
              <Button size="sm" variant="outline" className="gap-2">
                <Edit className="w-3.5 h-3.5" />
                Edit Portfolio
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Header (Instagram & LinkedIn Hybrid) */}
      <ProfileHeader
        name={student.name}
        rollNumber={student.rollNumber}
        role="STUDENT"
        department={student.department?.name || 'Computer Science & Engineering (AI & ML)'}
        batch={student.batch || undefined}
        section={student.section || undefined}
        avatarUrl={student.avatarUrl || student.user?.avatarUrl || undefined}
        headline={student.headline || `Undergraduate Student | Roll: ${student.rollNumber}`}
        bio={student.bio || undefined}
        email={student.email || student.user?.email || undefined}
        githubUrl={student.githubUrl || undefined}
        linkedinUrl={student.linkedinUrl || undefined}
        isVerified={student.isActive}
        isOwner={isOwner}
        stats={{
          postsCount: 0,
          verifiedAchievementsCount: allAchievements.length,
          eventsCount: 0,
          skillsCount: 6,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Official Institutional Academic Record */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Institutional Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  JNTUA Roll Number
                </span>
                <span className="font-mono font-bold text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                  {student.rollNumber}
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Department
                </span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {student.department?.name || 'CSE - Artificial Intelligence & Machine Learning'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Batch
                  </span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    {student.batch || '2022-2026'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Section
                  </span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    Section {student.section || 'A'}
                  </span>
                </div>
              </div>

              {student.email && (
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Campus Email
                  </span>
                  <span className="font-mono text-muted-foreground mt-0.5 block truncate">
                    {student.email}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-border/50">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SREC Official Academic Identity
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verified Achievements & Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Award className="w-4 h-4 text-primary" />
                Verified Achievements & Certifications ({allAchievements.length})
              </CardTitle>
              {isOwner && (
                <Link href="/dashboard/student/submit">
                  <Button size="sm" variant="ghost" className="text-xs text-primary">
                    + Submit New
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {allAchievements.length === 0 ? (
                <EmptyStatePreset
                  type="achievements"
                  title="No Verified Achievements Yet"
                  description="Achievements submitted by this student will appear here once verified by faculty and HOD."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allAchievements.map((achievement: any) => (
                    <AchievementCard
                      key={achievement.id}
                      id={achievement.id}
                      title={achievement.title}
                      description={achievement.description}
                      categoryName={achievement.category?.name || 'Academic Honor'}
                      level={achievement.level || 'NATIONAL'}
                      positionRank={achievement.positionRank}
                      participationType={achievement.participationType || 'SOLO'}
                      organizationEventName={achievement.organizationEventName || 'Institutional Body'}
                      academicYear={achievement.academicYear || '2025-2026'}
                      achievementDate={achievement.achievementDate instanceof Date ? achievement.achievementDate.toISOString() : String(achievement.achievementDate)}
                      personName={student.name}
                      personType="STUDENT"
                      rollNumber={student.rollNumber}
                      departmentName={student.department?.name || 'CSE (AI & ML)'}
                      googleDriveUrl={achievement.googleDriveUrl}
                      certificateUrl={achievement.certificateUrl || achievement.googleDriveUrl}
                      tags={achievement.tags}
                      href={`/achievements/${achievement.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidential Conduct & Disciplinary Record (HOD / Admin Eyes Only) */}
          {(viewerRole === 'HOD' || viewerRole === 'SUPER_ADMIN') && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-rose-500/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-500">
                  <ShieldAlert className="w-4 h-4" />
                  Confidential Conduct & Disciplinary Record ({studentIncidents.length})
                </CardTitle>
                <Link href={`/grievances?action=file_incident&studentRoll=${student.rollNumber}`}>
                  <Button size="sm" variant="outline" className="text-xs border-rose-500/40 text-rose-500 hover:bg-rose-500/10">
                    + Record Incident
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {studentIncidents.length === 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Clean Disciplinary Record — Zero infractions recorded against this scholar.
                  </p>
                ) : (
                  studentIncidents.map((inc) => (
                    <div key={inc.id} className="p-3.5 rounded-xl border border-rose-500/20 bg-background/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{inc.title}</span>
                          <Badge variant={inc.status === 'RESOLVED' ? 'emerald' : 'rose'} size="sm">
                            {inc.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground uppercase">{inc.category}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Reported by {inc.reporter?.name} ({inc.reporter?.role}) • {formatDate(inc.createdAt)}
                        </p>
                      </div>
                      <Link href={`/admin/discipline/${inc.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs text-primary">
                          Assess Case &rarr;
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
