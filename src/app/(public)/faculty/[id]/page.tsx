import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStatePreset } from '@/components/ui/EmptyState';
import { ProfileHeader } from '@/components/portfolio/ProfileHeader';
import { AchievementCard } from '@/components/cards/AchievementCard';
import { FeedCard } from '@/components/social/FeedCard';
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
  MessageSquare,
} from 'lucide-react';

interface FacultyProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FacultyProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const faculty = await prisma.faculty.findFirst({
    where: {
      OR: [{ id }, { user: { id } }],
      deletedAt: null,
      isActive: true,
    },
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

  const faculty = await prisma.faculty.findFirst({
    where: {
      OR: [{ id }, { user: { id } }],
    },
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

  // Hide trashed or suspended faculty from public view
  if (faculty.deletedAt !== null || !faculty.isActive || faculty.user?.deletedAt !== null || faculty.user?.status === 'SUSPENDED') {
    const viewerEmail = session?.user?.email?.toLowerCase().trim();
    if (!viewerEmail) notFound();
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail },
      select: { role: true },
    });
    const isAdmin = viewer?.role === 'SUPER_ADMIN' || viewer?.role === 'ADMIN' || viewer?.role === 'HOD';
    if (!isAdmin) notFound();
  }

  const isOwner = Boolean(
    session?.user?.email &&
      faculty.user?.email &&
      session.user.email.toLowerCase() === faculty.user.email.toLowerCase()
  );

  const viewerEmail = session?.user?.email?.toLowerCase().trim();
  let isSuperAdminOrAdmin = false;
  if (viewerEmail) {
    const viewer = await prisma.user.findUnique({
      where: { email: viewerEmail },
      select: { role: true },
    });
    if (viewer && ['SUPER_ADMIN', 'ADMIN'].includes(viewer.role)) {
      isSuperAdminOrAdmin = true;
    }
  }

  const role = faculty.roleCategory === 'HOD' ? 'HOD' : 'FACULTY';
  const achievements = faculty.achievements || [];

  const currentUserId = (session?.user as any)?.id;

  // Query faculty public community posts
  const userPosts = faculty.user?.id
    ? await prisma.post.findMany({
        where: {
          authorId: faculty.user.id,
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              headline: true,
              student: { select: { rollNumber: true } },
              faculty: { select: { designation: true } },
            },
          },
          achievement: {
            include: { category: true },
          },
          media: { orderBy: { order: 'asc' } },
          likes: true,
          comments: {
            include: {
              author: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          collaborators: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const formattedPosts = userPosts.map((post) => ({
    id: post.id,
    author: {
      id: post.author.id,
      name: post.author.name || faculty.name,
      role: post.author.role,
      avatarUrl: post.author.avatarUrl || faculty.avatarUrl || undefined,
      headline: post.author.headline || faculty.designation || undefined,
      designation: post.author.faculty?.designation || faculty.designation,
      isVerified: true,
      department: faculty.department?.name || 'CSE (AI & ML)',
    },
    content: post.content,
    images: post.media.map((m) => m.url),
    createdAt: post.createdAt.toISOString(),
    likesCount: post.likes.length,
    commentsCount: post.comments.length,
    isLiked: currentUserId ? post.likes.some((l) => l.userId === currentUserId) : false,
    achievement: post.achievement
      ? {
          id: post.achievement.id,
          title: post.achievement.title,
          category: post.achievement.category?.name || 'Achievement',
          issuer: post.achievement.organizationEventName,
          date: post.achievement.achievementDate.toISOString(),
          isVerified: post.achievement.status === 'APPROVED' || post.achievement.status === 'PUBLISHED',
          certificateUrl: post.achievement.googleDriveUrl || post.achievement.certificateUrl || undefined,
        }
      : undefined,
  }));

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
        {isOwner ? (
          <Link href="/profile">
            <Button size="sm" variant="outline" className="gap-2">
              <Edit className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </Link>
        ) : isSuperAdminOrAdmin ? (
          <Link href={`/admin/users?search=${encodeURIComponent(faculty.name)}`}>
            <Button size="sm" variant="primary" className="gap-2">
              <Edit className="w-3.5 h-3.5" />
              Edit as Admin
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Profile Header (Instagram & LinkedIn Hybrid) */}
      {(() => {
        const facultySkills = faculty.skills
          ? faculty.skills.split(/[,;&•]/).map((s: string) => s.trim()).filter(Boolean)
          : faculty.specialization
          ? faculty.specialization.split(/[,;&•]/).map((s: string) => s.trim()).filter(Boolean)
          : ['Deep Learning', 'Neural Networks', 'Academic Research', 'Curriculum Design'];

        return (
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
              postsCount: formattedPosts.length,
              verifiedAchievementsCount: achievements.length,
              eventsCount: 0,
              skillsCount: facultySkills.length,
            }}
            skills={facultySkills}
          />
        );
      })()}

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
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
                  {achievements.map((achievement: any) => (
                    <AchievementCard
                      key={achievement.id}
                      id={achievement.id}
                      title={achievement.title}
                      description={achievement.description}
                      categoryName={achievement.category?.name || 'Research Publication'}
                      level={achievement.level || 'NATIONAL'}
                      positionRank={achievement.positionRank || 'Faculty Research'}
                      participationType={achievement.participationType || 'SOLO'}
                      organizationEventName={achievement.organizationEventName || 'Publisher / Body'}
                      academicYear={achievement.academicYear || '2025-2026'}
                      achievementDate={achievement.achievementDate instanceof Date ? achievement.achievementDate.toISOString() : String(achievement.achievementDate)}
                      personName={faculty.name}
                      personType="FACULTY"
                      rollNumber={null}
                      departmentName={faculty.department?.name || faculty.departmentName || 'CSE (AI & ML)'}
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

          {/* Community Posts & Research Updates */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4 text-primary" />
                Community Posts &amp; Research Updates ({formattedPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {formattedPosts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-foreground">No Community Posts Yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Research notes and department updates shared by {faculty.name} will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formattedPosts.map((post) => (
                    <FeedCard key={post.id} {...post} />
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
