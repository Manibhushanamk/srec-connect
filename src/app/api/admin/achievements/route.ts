import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import { SubmissionStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { faculty: true },
    });

    if (!user || (!canAccessAdmin(user) && user.role !== 'FACULTY')) {
      return NextResponse.json({ error: 'Forbidden: Admin or Faculty reviewer access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const where: any = { deletedAt: null };
    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as SubmissionStatus;
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        primaryStudent: {
          select: {
            id: true,
            rollNumber: true,
            name: true,
            departmentName: true,
            batch: true,
            section: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
            designation: true,
            departmentName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        media: true,
      },
    });

    return NextResponse.json({ achievements });
  } catch (error: any) {
    console.error('[Admin Achievements GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user || (!canAccessAdmin(user) && user.role !== 'FACULTY')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, rejectionReason, title, description, categoryId, level } = body;

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status as SubmissionStatus;
      if (status === 'PUBLISHED' || status === 'APPROVED') {
        updateData.publishedAt = new Date();
      }
      if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason || 'Requirements not met.';
      }
    }

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId) updateData.categoryId = categoryId;
    if (level) updateData.level = level;

    const updated = await prisma.$transaction(async (tx) => {
      const ach = await tx.achievement.update({
        where: { id },
        data: updateData,
        include: { category: true, primaryStudent: true, faculty: true },
      });

      // Record audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: `ACHIEVEMENT_${status || 'UPDATE'}`,
          entityType: 'Achievement',
          entityId: id,
          metadata: JSON.stringify({
            previousStatus: existing.status,
            newStatus: status || existing.status,
            rejectionReason,
          }),
        },
      });

      // Dispatch in-app notification to the submitter on verification state change
      if (existing.createdById && status && ['APPROVED', 'PUBLISHED', 'REJECTED', 'RESUBMISSION_REQUIRED'].includes(status)) {
        const notifTitle = status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED'
          ? '⚠️ Achievement Status Update'
          : '🏆 Honor Verified & Published!';

        const notifMsg = status === 'REJECTED'
          ? `Your submission "${existing.title}" was rejected: ${rejectionReason || 'Requirements not met.'}`
          : status === 'RESUBMISSION_REQUIRED'
          ? `Your submission "${existing.title}" requires revisions: ${rejectionReason || 'Please review and resubmit.'}`
          : `Congratulations! Your achievement "${existing.title}" has been verified and published!`;

        await tx.notification.create({
          data: {
            userId: existing.createdById,
            title: notifTitle,
            message: notifMsg,
            link: '/profile',
          },
        }).catch(() => null);
      }

      return ach;
    });

    return NextResponse.json({ success: true, achievement: updated });
  } catch (error: any) {
    console.error('[Admin Achievements PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update achievement' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user || !canAccessAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD required to delete records' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.achievement.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'ACHIEVEMENT_MOVED_TO_TRASH',
          entityType: 'Achievement',
          entityId: id,
          metadata: JSON.stringify({ deletedAt: new Date().toISOString() }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Achievements DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
  }
}
