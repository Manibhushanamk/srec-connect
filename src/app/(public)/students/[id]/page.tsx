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
import { formatDate } from '@/lib/utils';
import {
  Award,
  Calendar,
  ExternalLink,
  ShieldCheck,
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

  const verifiedAchievements = student.primaryAchievements || [];
  const teamVerifiedAchievements = (student.teamAchievements || [])
    .map((ta) => ta.achievement)
    .filter((a) => a.status === 'APPROVED' || a.status === 'PUBLISHED');
  const allAchievements = [...verifiedAchievements, ...teamVerifiedAchievements];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students Directory
        </Link>
        {isOwner && (
          <Link href="/dashboard/student/settings">
            <Button size="sm" variant="outline" className="gap-2">
              <Edit className="w-3.5 h-3.5" />
              Edit Portfolio
            </Button>
          </Link>
        )}
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
                <div className="space-y-3">
                  {allAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {achievement.title}
                          </span>
                          {achievement.category && (
                            <Badge variant="cyan" className="text-[10px]">
                              {achievement.category.name}
                            </Badge>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                        {achievement.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(achievement.achievementDate)}
                          </span>
                          {achievement.organizationEventName && (
                            <span>Organized by: {achievement.organizationEventName}</span>
                          )}
                        </div>
                      </div>

                      {(achievement.certificateUrl || achievement.googleDriveUrl) && (
                        <a
                          href={achievement.certificateUrl || achievement.googleDriveUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
