import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ProfileRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    include: { student: true, faculty: true },
  });

  if (!user) {
    redirect('/signin');
  }

  if (user.student?.rollNumber) {
    redirect(`/students/${user.student.rollNumber}`);
  }

  if (user.studentId) {
    redirect(`/students/${user.studentId}`);
  }

  if (user.facultyId) {
    redirect(`/faculty/${user.facultyId}`);
  }

  if (user.role === 'SUPER_ADMIN' || user.role === 'HOD' || user.role === 'WEB_MANAGER') {
    redirect('/admin');
  }

  redirect('/');
}
