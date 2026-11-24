import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { AdminShell } from '@/components/layout/AdminShell';
import { StudentEditAchievementForm } from './StudentEditAchievementForm';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Edit Achievement Request',
  description: 'Edit pending student achievement submission',
};

export default async function StudentEditAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/dashboard/student/edit/${id}`);
  }

  const userRole = (session.user as any).role;
  const studentId = (session.user as any).studentId;
  const userId = (session.user as any).id;

  if (userRole !== Role.STUDENT && userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
    redirect('/auth/access-denied');
  }

  const achievement = await prisma.achievement.findUnique({
    where: { id },
    include: {
      category: true,
      teamMembers: true,
      primaryStudent: true,
    },
  });

  if (!achievement || achievement.deletedAt) {
    notFound();
  }

  // Ownership verification
  const isOwner =
    achievement.createdById === userId ||
    (studentId && achievement.primaryStudentId === studentId) ||
    achievement.primaryStudentRoll === (session.user as any)?.rollNumber;

  const isModerator = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

  if (!isOwner && !isModerator) {
    redirect('/auth/access-denied');
  }

  // STRICT LOCKOUT: Approved achievements cannot be modified
  const isLocked = achievement.status === 'APPROVED' || achievement.status === 'PUBLISHED';

  if (isLocked && !isModerator) {
    return (
      <AdminShell
        title="Official Academic Record Locked"
        description="Verified institutional honor cannot be modified"
        roleScope="STUDENT"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/student' },
          { label: 'Achievement', href: `/achievements/${id}` },
          { label: 'Locked Record', href: '#' },
        ]}
      >
        <div className="max-w-2xl mx-auto py-12">
          <Card variant="glass" className="p-8 text-center border-emerald-500/30 bg-emerald-950/10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Approved Record (Permanent & Locked)
            </h2>

            <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
              <strong>"{achievement.title}"</strong> has already been officially verified and approved
              by the department. To guarantee institutional audit integrity and accredited ranking records,
              approved achievements cannot be edited or removed.
            </p>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto mb-8 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Official Status:</span>
                <span className="text-emerald-400 font-semibold">{achievement.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verified Category:</span>
                <span className="text-slate-200">{achievement.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event / Body:</span>
                <span className="text-slate-200">{achievement.organizationEventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Need corrections?</span>
                <span className="text-brand-400">Contact HOD / Admin Office</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard/student">
                <Button variant="primary" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Student Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </AdminShell>
    );
  }

  // Fetch all categories for edit dropdown
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <AdminShell
      title="Edit Pending Achievement"
      description="Update your submission details while in the department review queue"
      roleScope="STUDENT"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/student' },
        { label: 'Edit Request', href: `/dashboard/student/edit/${id}` },
      ]}
    >
      <div className="max-w-3xl mx-auto py-6">
        <StudentEditAchievementForm
          achievement={{
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            categoryId: achievement.categoryId,
            level: achievement.level,
            positionRank: achievement.positionRank,
            organizationEventName: achievement.organizationEventName,
            academicYear: achievement.academicYear,
            achievementDate: achievement.achievementDate.toISOString().split('T')[0],
            googleDriveUrl: achievement.googleDriveUrl || achievement.certificateUrl || '',
            teamMembers: achievement.teamMembers.map((m) => ({
              rollNumber: m.rollNumber,
              studentName: m.studentName,
              studentId: m.studentId || undefined,
            })),
            status: achievement.status,
            rejectionReason: achievement.rejectionReason,
          }}
          categories={categories}
        />
      </div>
    </AdminShell>
  );
}
