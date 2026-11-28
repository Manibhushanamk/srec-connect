import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getUserDriveTokens } from '@/lib/drive';
import { SubmissionStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ authenticated: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: {
        department: { select: { id: true, code: true, name: true } },
        student: {
          select: {
            id: true,
            rollNumber: true,
            batch: true,
            section: true,
            departmentName: true,
          },
        },
        faculty: {
          select: {
            id: true,
            designation: true,
            departmentName: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ authenticated: false });
    }

    const achWhere: any = {
      deletedAt: null,
      OR: [
        { createdById: user.id },
        ...(user.student?.id ? [{ primaryStudentId: user.student.id }] : []),
        ...(user.faculty?.id ? [{ facultyId: user.faculty.id }] : []),
      ],
    };

    const [achievements, driveTokens] = await Promise.all([
      prisma.achievement.findMany({
        where: achWhere,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          organizationEventName: true,
          status: true,
          rejectionReason: true,
          achievementDate: true,
          updatedAt: true,
        },
      }),
      getUserDriveTokens(user.id).catch(() => null),
    ]);

    const pipeline = {
      submitted: achievements.filter(
        (a) => a.status === SubmissionStatus.DRAFT || a.status === SubmissionStatus.PENDING
      ).length,
      underFacultyReview: achievements.filter(
        (a) => a.status === SubmissionStatus.UNDER_REVIEW
      ).length,
      awaitingHod: 0,
      resubmissionRequired: achievements.filter(
        (a) => a.status === SubmissionStatus.RESUBMISSION_REQUIRED
      ).length,
      rejected: achievements.filter(
        (a) => a.status === SubmissionStatus.REJECTED || a.status === SubmissionStatus.WITHDRAWN
      ).length,
      approvedPublished: achievements.filter(
        (a) => a.status === SubmissionStatus.APPROVED || a.status === SubmissionStatus.PUBLISHED
      ).length,
    };

    return NextResponse.json({
      authenticated: true,
      identity: {
        id: user.id,
        name: user.name || 'Campus Member',
        email: user.email,
        role: user.role,
        rollNumber: user.student?.rollNumber || null,
        batch: user.student?.batch || null,
        section: user.student?.section || null,
        designation: user.faculty?.designation || null,
        department:
          user.department?.name ||
          user.student?.departmentName ||
          user.faculty?.departmentName ||
          'CSE (AI & ML)',
      },
      pipeline,
      pendingSubmissions: achievements.filter(
        (a) =>
          a.status === SubmissionStatus.PENDING ||
          a.status === SubmissionStatus.UNDER_REVIEW ||
          a.status === SubmissionStatus.RESUBMISSION_REQUIRED ||
          a.status === SubmissionStatus.DRAFT
      ),
      driveConnected: Boolean(driveTokens?.access_token || driveTokens?.refresh_token),
    });
  } catch (error: any) {
    console.error('[Workspace API GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load workspace' }, { status: 500 });
  }
}
