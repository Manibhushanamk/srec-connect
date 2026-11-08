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
      student: true,
      faculty: true,
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
        }
      : null,
    faculty: user.faculty
      ? {
          id: user.faculty.id,
          designation: user.faculty.designation,
          specialization: user.faculty.specialization,
          cabin: user.faculty.cabin,
          bio: user.faculty.bio,
          googleScholar: user.faculty.googleScholar,
          linkedinUrl: user.linkedinUrl,
          avatarUrl: user.faculty.avatarUrl,
        }
      : null,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <AppShell>
      <ProfileWorkspace initialUser={serializedUser} />
    </AppShell>
  );
}
