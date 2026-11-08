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
  MapPin,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

interface FacultyProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FacultyProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const faculty = await prisma.faculty.findUnique({
    where: { id },
    include: { department: true },
  });

  if (!faculty) {
    return { title: 'Faculty Not Found | SREC Connect' };
  }

  return {
    title: `${faculty.name} - ${faculty.designation} | SREC Connect Faculty`,
    description: `${faculty.name}'s profile, publications, research specialization, and achievements at SREC Nandyal.`,
  };
}

export default async function FacultyProfilePage({ params }: FacultyProfilePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const faculty = await prisma.faculty.findUnique({
    where: { id },
    include: {
      department: true,
      user: true,
      achievements: {
        where: {
          status: { in: ['APPROVED', 'PUBLISHED'] },
        },
        include: { category: true },
        orderBy: { achievementDate: 'desc' },
      },
    },
  });

  if (!faculty) {
    notFound();
  }

  const isOwner = Boolean(
    session?.user?.email &&
      faculty.user?.email &&
      session.user.email.toLowerCase() === faculty.user.email.toLowerCase()
  );

  const role = faculty.roleCategory === 'HOD' ? 'HOD' : 'FACULTY';
  const achievements = faculty.achievements || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/faculty"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Faculty Directory
        </Link>
        {isOwner && (
          <Link href="/dashboard/faculty/settings">
            <Button size="sm" variant="outline" className="gap-2">
              <Edit className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Header (Instagram & LinkedIn Hybrid) */}
      <ProfileHeader
        name={faculty.name}
        designation={faculty.designation}
        role={role}
        department={faculty.department?.name || 'Computer Science & Engineering (AI & ML)'}
        avatarUrl={faculty.avatarUrl || faculty.user?.avatarUrl || undefined}
        headline={`${faculty.designation} | ${faculty.degrees || 'Faculty'} | Department of CSE (AI & ML)`}
        bio={faculty.bio || undefined}
        email={faculty.email || faculty.user?.email || undefined}
        location="SREC Campus, Nandyal"
        isVerified={faculty.isActive}
        isOwner={isOwner}
        stats={{
          postsCount: 0,
          verifiedAchievementsCount: achievements.length,
          eventsCount: 0,
          skillsCount: 8,
        }}
        skills={
          faculty.specialization
            ? faculty.specialization.split(',').map((s) => s.trim())
            : ['Deep Learning', 'Neural Networks', 'Academic Research', 'Curriculum Design']
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Academic Credentials & Department Office */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Academic Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Designation
                </span>
                <span className="font-semibold text-sm text-foreground mt-0.5 block">
                  {faculty.designation}
                </span>
              </div>

              {faculty.degrees && (
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Qualifications & Degrees
                  </span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    {faculty.degrees}
                  </span>
                </div>
              )}

              {faculty.experience && (
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Teaching & Research Experience
                  </span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    {faculty.experience}
                  </span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Department
                </span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {faculty.department?.name || 'CSE - Artificial Intelligence & Machine Learning'}
                </span>
              </div>

              {faculty.cabin && (
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Campus Office / Cabin
                  </span>
                  <span className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {faculty.cabin}
                  </span>
                </div>
              )}

              {faculty.email && (
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Institutional Email
                  </span>
                  <span className="font-mono text-muted-foreground mt-0.5 block truncate">
                    {faculty.email}
                  </span>
                </div>
              )}

              {faculty.googleScholar && (
                <div className="pt-2 border-t border-border/50">
                  <a
                    href={faculty.googleScholar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors w-full justify-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Google Scholar Profile
                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Research Publications & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Award className="w-4 h-4 text-primary" />
                Research, Publications & Recognitions ({achievements.length})
              </CardTitle>
              {isOwner && (
                <Link href="/dashboard/faculty/submit">
                  <Button size="sm" variant="ghost" className="text-xs text-primary">
                    + Submit Recognition
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {achievements.length === 0 ? (
                <EmptyStatePreset
                  type="achievements"
                  title="No Publications Recorded"
                  description="Publications, patents, and faculty development achievements will be listed here once recorded and verified."
                />
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
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
                            <span>Publisher/Body: {achievement.organizationEventName}</span>
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
                          View Paper
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
