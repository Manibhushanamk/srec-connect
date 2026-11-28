import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';
import { sanitizeText } from '@/lib/sanitize';
import { AchievementPatchSchema, parseJsonBody } from '@/lib/schemas';
import { resolveOrCreateCategoryId } from '@/lib/category-batch-helpers';
import { parseRollNumber } from '@/lib/studentHelper';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        primaryStudent: {
          select: {
            id: true,
            rollNumber: true,
            name: true,
            batch: true,
            section: true,
            departmentName: true,
          },
        },
        teamMembers: {
          select: {
            id: true,
            rollNumber: true,
            studentName: true,
            studentId: true,
            isLeader: true,
          },
        },
        media: true,
      },
    });

    if (!achievement || achievement.deletedAt) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    return NextResponse.json({ achievement });
  } catch (err: any) {
    console.error('[Achievement GET Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch achievement' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email.toLowerCase().trim() },
      include: { student: true, faculty: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.achievement.findUnique({
      where: { id },
      include: { teamMembers: true, primaryStudent: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Achievement record not found' }, { status: 404 });
    }

    // Ownership & Authorization Check
    const isOwner =
      existing.createdById === dbUser.id ||
      (dbUser.studentId && existing.primaryStudentId === dbUser.studentId) ||
      (dbUser.student?.rollNumber && existing.primaryStudentRoll === dbUser.student.rollNumber) ||
      (dbUser.facultyId && existing.facultyId === dbUser.facultyId);

    const isModerator = dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'HOD';

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own submitted achievements.' },
        { status: 403 }
      );
    }

    // STRICT LOCKOUT: Approved & Published achievements are permanent and CANNOT be edited by students
    const isApprovedOrPublished =
      existing.status === SubmissionStatus.APPROVED || existing.status === SubmissionStatus.PUBLISHED;

    if (isApprovedOrPublished && !isModerator) {
      return NextResponse.json(
        {
          error:
            'Approved achievements are locked and cannot be edited. After institutional verification, records are permanently preserved to guarantee academic audit integrity. Please contact your department HOD or administrator if a correction is needed.',
          isLocked: true,
          code: 'ACHIEVEMENT_APPROVED_LOCKED',
        },
        { status: 403 }
      );
    }

    const parsed = await parseJsonBody(req, AchievementPatchSchema);
    if (!parsed.success) return parsed.response;

    const {
      title,
      description,
      categoryId,
      customCategoryName,
      level,
      positionRank,
      organizationEventName,
      academicYear,
      achievementDate,
      googleDriveUrl,
      certificateUrl,
      teamMembers,
    } = parsed.data;

    const resolvedCategoryId =
      customCategoryName || categoryId
        ? await resolveOrCreateCategoryId({
            categoryId,
            customCategoryName,
            type: 'ACHIEVEMENT',
          })
        : undefined;

    const updateData: any = {};
    if (title !== undefined) updateData.title = sanitizeText(title);
    if (description !== undefined) updateData.description = description ? sanitizeText(description) : null;
    if (organizationEventName !== undefined) updateData.organizationEventName = sanitizeText(organizationEventName);
    if (positionRank !== undefined) updateData.positionRank = positionRank ? sanitizeText(positionRank) : null;
    if (level !== undefined) updateData.level = level;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (achievementDate !== undefined) updateData.achievementDate = new Date(achievementDate);
    if (resolvedCategoryId) updateData.categoryId = resolvedCategoryId;

    const fileUrl = googleDriveUrl || certificateUrl;
    if (fileUrl !== undefined) {
      if (fileUrl) {
        const trimmedUrl = String(fileUrl).trim();
        updateData.googleDriveUrl = trimmedUrl;
        updateData.certificateUrl = trimmedUrl;
      } else {
        updateData.googleDriveUrl = null;
        updateData.certificateUrl = null;
      }
    }

    if (existing.status === SubmissionStatus.RESUBMISSION_REQUIRED) {
      updateData.status = SubmissionStatus.PENDING;
      updateData.rejectionReason = null;
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
      include: { category: true, teamMembers: true },
    });

    if (teamMembers !== undefined && Array.isArray(teamMembers)) {
      await prisma.achievementTeamMember.deleteMany({ where: { achievementId: id } });

      for (const member of teamMembers) {
        if (member.rollNumber?.trim()) {
          const parsed = parseRollNumber(member.rollNumber);
          let studentRecord = member.studentId
            ? await prisma.student.findUnique({ where: { id: member.studentId } })
            : null;
          if (!studentRecord && parsed.normalized) {
            studentRecord = await prisma.student.findUnique({
              where: { rollNumber: parsed.normalized },
            });
          }

          await prisma.achievementTeamMember.create({
            data: {
              achievementId: id,
              studentId: studentRecord?.id || member.studentId || null,
              rollNumber: parsed.normalized || member.rollNumber.trim(),
              studentName: member.studentName || studentRecord?.name || parsed.normalized,
              isLeader: false,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      achievement: updated,
      message: 'Achievement request updated successfully.',
    });
  } catch (err: any) {
    console.error('[Achievement ID PATCH Error]:', err);
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email.toLowerCase().trim() },
      include: { student: true, faculty: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.achievement.findUnique({
      where: { id },
      include: { primaryStudent: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Achievement record not found' }, { status: 404 });
    }

    const isOwner =
      existing.createdById === dbUser.id ||
      (dbUser.studentId && existing.primaryStudentId === dbUser.studentId) ||
      (dbUser.student?.rollNumber && existing.primaryStudentRoll === dbUser.student.rollNumber) ||
      (dbUser.facultyId && existing.facultyId === dbUser.facultyId);

    const isModerator = dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'HOD';

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: 'Forbidden: You can only remove your own achievements.' },
        { status: 403 }
      );
    }

    // STRICT LOCKOUT: Approved & Published achievements are permanent and CANNOT be deleted by students
    const isApprovedOrPublished =
      existing.status === SubmissionStatus.APPROVED || existing.status === SubmissionStatus.PUBLISHED;

    if (isApprovedOrPublished && !isModerator) {
      return NextResponse.json(
        {
          error:
            'Approved achievements cannot be removed or deleted. After institutional approval, records are permanent to preserve institutional audit integrity.',
          isLocked: true,
          code: 'ACHIEVEMENT_APPROVED_LOCKED',
        },
        { status: 403 }
      );
    }

    await prisma.achievement.update({
      where: { id },
      data: {
        status: SubmissionStatus.WITHDRAWN,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Achievement request successfully withdrawn.',
    });
  } catch (err: any) {
    console.error('[Achievement ID DELETE Error]:', err);
    return NextResponse.json({ error: 'Failed to withdraw achievement' }, { status: 500 });
  }
}
