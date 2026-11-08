import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AppShell } from '@/components/layout/AppShell';
import { ProfileWorkspace } from '@/components/profile/ProfileWorkspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile & Account Customization | SREC Connect',
  description: 'Manage your SREC Connect academic profile, headline, bio, and customizations.',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    include: {
      department: true,
      student: {
        include: {
          primaryAchievements: {
            where: { status: { in: ['APPROVED', 'PUBLISHED'] } },
            include: { category: true, media: true },
            orderBy: { achievementDate: 'desc' },
          },
        },
      },
      faculty: {
        include: {
          achievements: {
            where: { status: { in: ['APPROVED', 'PUBLISHED'] } },
            include: { category: true, media: true },
            orderBy: { achievementDate: 'desc' },
          },
        },
      },
      posts: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          posts: true,
          eventRegistrations: true,
        },
      },
    },
  });

  if (!user) {
    redirect('/signin?callbackUrl=/profile');
  }

  const serializedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    bio: user.bio,
    phone: user.phone,
    linkedinUrl: user.linkedinUrl,
    githubUrl: user.githubUrl,
    department: user.department ? { name: user.department.name, code: user.department.code } : null,
    departmentName: user.departmentName,
    counts: {
      posts: user._count.posts,
      eventRegistrations: user._count.eventRegistrations,
    },
    student: user.student
      ? {
          id: user.student.id,
          rollNumber: user.student.rollNumber,
          batch: user.student.batch,
          section: user.student.section,
          headline: user.student.headline,
          bio: user.student.bio,
          phone: user.student.phone,
          linkedinUrl: user.student.linkedinUrl,
          githubUrl: user.student.githubUrl,
          portfolioUrl: user.student.portfolioUrl,
          avatarUrl: user.student.avatarUrl,
          achievements: (user.student.primaryAchievements || []).map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            categoryName: a.category?.name || 'Honor',
            organizationEventName: a.organizationEventName,
            level: a.level,
            positionRank: a.positionRank,
            participationType: a.participationType,
            academicYear: a.academicYear,
            achievementDate: a.achievementDate.toISOString(),
            personName: user.name,
            personType: 'STUDENT' as const,
            rollNumber: user.student?.rollNumber,
            departmentName: user.department?.name || user.departmentName || 'Computer Science & Engineering (AI & ML)',
            googleDriveUrl: a.googleDriveUrl || a.certificateUrl,
            certificateUrl: a.certificateUrl || a.googleDriveUrl,
            tags: a.tags,
          })),
        }
      : null,
    faculty: user.faculty
      ? {
          id: user.faculty.id,
          designation: user.faculty.designation,
          degrees: user.faculty.degrees,
          experience: user.faculty.experience,
          specialization: user.faculty.specialization,
          cabin: user.faculty.cabin,
          bio: user.faculty.bio,
          googleScholar: user.faculty.googleScholar,
          linkedinUrl: user.linkedinUrl,
          avatarUrl: user.faculty.avatarUrl,
          achievements: (user.faculty.achievements || []).map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            categoryName: a.category?.name || 'Research Publication',
            organizationEventName: a.organizationEventName,
            level: a.level,
            positionRank: a.positionRank,
            participationType: a.participationType,
            academicYear: a.academicYear,
            achievementDate: a.achievementDate.toISOString(),
            personName: user.name,
            personType: 'FACULTY' as const,
            rollNumber: null,
            departmentName: user.department?.name || user.departmentName || 'Computer Science & Engineering (AI & ML)',
            googleDriveUrl: a.googleDriveUrl || a.certificateUrl,
            certificateUrl: a.certificateUrl || a.googleDriveUrl,
            tags: a.tags,
          })),
        }
      : null,
    posts: (user.posts || []).map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
    })),
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <AppShell>
      <ProfileWorkspace initialUser={serializedUser} />
    </AppShell>
  );
}
