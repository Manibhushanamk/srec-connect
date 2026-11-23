import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin, isSuperAdmin } from '@/lib/rbac';
import { SubmissionStatus } from '@prisma/client';
import { sanitizeText, sanitizeSafeUrl } from '@/lib/sanitize';

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

    // Enforce department boundary: HOD and Web Manager can only view their own department honors
    if (!isSuperAdmin(user.role)) {
      where.departmentId = user.departmentId || 'no_department_bound';
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        teamMembers: {
          select: {
            id: true,
            rollNumber: true,
            studentName: true,
            studentId: true,
            isLeader: true,
          },
        },
        posts: {
          include: {
            media: true,
          },
        },
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
    const {
      id,
      status,
      rejectionReason,
      departmentId,
      title,
      description,
      categoryId,
      level,
      positionRank,
      organizationEventName,
      personName,
      personType,
      facultyDesignation,
      primaryStudentRoll,
      academicYear,
      achievementDate,
      participationType,
      teamName,
      googleDriveUrl,
      certificateUrl,
      teamMembers,
      postToFeed,
      feedCaption,
      feedImageUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    const existing = await prisma.achievement.findUnique({
      where: { id },
      include: { teamMembers: true, posts: { include: { media: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Department boundary check: HOD and Web Manager can only modify achievements in their own department
    if (!isSuperAdmin(user.role) && existing.departmentId && existing.departmentId !== user.departmentId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only modify honors belonging to your own department.' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status as SubmissionStatus;
      if (status === 'PUBLISHED' || status === 'APPROVED') {
        updateData.publishedAt = new Date();
        updateData.rejectionReason = null;
      }
      if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason ? sanitizeText(rejectionReason) : 'Requirements not met.';
      }
    } else if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason ? sanitizeText(rejectionReason) : null;
    }

    if (title) updateData.title = sanitizeText(title);
    if (description !== undefined) updateData.description = sanitizeText(description);
    if (categoryId) updateData.categoryId = categoryId;
    if (level) updateData.level = level;
    if (positionRank !== undefined) updateData.positionRank = sanitizeText(positionRank);
    if (organizationEventName) updateData.organizationEventName = sanitizeText(organizationEventName);
    if (personName) updateData.personName = sanitizeText(personName);
    if (personType) updateData.personType = personType;
    if (facultyDesignation !== undefined) updateData.facultyDesignation = sanitizeText(facultyDesignation);
    if (academicYear) updateData.academicYear = academicYear;
    if (achievementDate) {
      const parsedDate = new Date(achievementDate);
      if (!isNaN(parsedDate.getTime())) {
        updateData.achievementDate = parsedDate;
      }
    }
    if (googleDriveUrl !== undefined) {
      updateData.googleDriveUrl = googleDriveUrl ? (sanitizeSafeUrl(googleDriveUrl) || googleDriveUrl) : null;
    }
    if (certificateUrl !== undefined) {
      updateData.certificateUrl = certificateUrl ? (sanitizeSafeUrl(certificateUrl) || certificateUrl) : null;
    }
    if (participationType) updateData.participationType = participationType;
    if (teamName !== undefined) updateData.teamName = sanitizeText(teamName);
    if (departmentId !== undefined && isSuperAdmin(user.role)) {
      updateData.departmentId = departmentId || null;
      if (departmentId) {
        const d = await prisma.department.findUnique({ where: { id: departmentId } });
        if (d) updateData.departmentName = d.name;
      } else {
        updateData.departmentName = null;
      }
    }

    // Anchor student identity if roll number is modified
    if (primaryStudentRoll !== undefined) {
      const cleanRoll = primaryStudentRoll.trim().toUpperCase();
      updateData.primaryStudentRoll = cleanRoll;
      if (cleanRoll) {
        const student = await prisma.student.findUnique({ where: { rollNumber: cleanRoll } });
        if (student) {
          updateData.primaryStudentId = student.id;
          if (!personName) updateData.personName = student.name;
        }
      } else {
        updateData.primaryStudentId = null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Sync team members if provided
      if (Array.isArray(teamMembers)) {
        await tx.achievementTeamMember.deleteMany({
          where: { achievementId: id },
        });

        for (const member of teamMembers) {
          if (member.rollNumber?.trim()) {
            const cleanRoll = member.rollNumber.trim().toUpperCase();
            let studentRecord = member.studentId
              ? await tx.student.findUnique({ where: { id: member.studentId } })
              : null;
            if (!studentRecord) {
              studentRecord = await tx.student.findUnique({ where: { rollNumber: cleanRoll } });
            }

            await tx.achievementTeamMember.create({
              data: {
                achievementId: id,
                studentId: studentRecord?.id || member.studentId || null,
                rollNumber: cleanRoll,
                studentName: member.studentName || studentRecord?.name || cleanRoll,
                isLeader: member.isLeader || false,
              },
            });
          }
        }
        updateData.participationType = teamMembers.length > 0 ? 'TEAM' : 'SOLO';
      }

      // 2. Update achievement core record
      const ach = await tx.achievement.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          primaryStudent: true,
          faculty: true,
          teamMembers: true,
          posts: { include: { media: true } },
        },
      });

      // 3. Sync or create linked Feed Post if requested
      if (postToFeed || feedCaption || feedImageUrl) {
        const existingPost = await tx.post.findFirst({
          where: { achievementId: id },
          include: { media: true },
        });

        const postText =
          (feedCaption && feedCaption.trim()) ||
          `🎉 Proud to announce our verified achievement: "${ach.title}" recognized by ${ach.organizationEventName}!`;

        if (existingPost) {
          await tx.post.update({
            where: { id: existingPost.id },
            data: { content: postText },
          });

          if (feedImageUrl !== undefined) {
            await tx.postMedia.deleteMany({ where: { postId: existingPost.id } });
            if (feedImageUrl) {
              await tx.postMedia.create({
                data: {
                  postId: existingPost.id,
                  url: feedImageUrl,
                  order: 0,
                },
              });
            }
          }
        } else if (postToFeed) {
          await tx.post.create({
            data: {
              authorId: existing.createdById || user.id,
              content: postText,
              achievementId: id,
              visibility: 'PUBLIC',
              media: feedImageUrl
                ? {
                    create: [
                      {
                        url: feedImageUrl,
                        order: 0,
                      },
                    ],
                  }
                : undefined,
            },
          });
        }
      }

      // 4. Record audit log
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
            fieldsUpdated: Object.keys(updateData),
          }),
        },
      });

      // 5. Dispatch in-app notification to the submitter on verification state change
      if (existing.createdById && status && ['APPROVED', 'PUBLISHED', 'REJECTED', 'RESUBMISSION_REQUIRED'].includes(status)) {
        const notifTitle = status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED'
          ? '⚠️ Achievement Status Update'
          : '🏆 Honor Verified & Published!';

        const notifMsg = status === 'REJECTED'
          ? `Your submission "${ach.title}" was rejected: ${rejectionReason || 'Requirements not met.'}`
          : status === 'RESUBMISSION_REQUIRED'
          ? `Your submission "${ach.title}" requires revisions: ${rejectionReason || 'Please review and resubmit.'}`
          : `Congratulations! Your achievement "${ach.title}" has been verified and published!`;

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

    if (!user || (!isSuperAdmin(user.role) && user.role !== 'HOD')) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD authority required to delete records' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 });
    }

    const existing = await prisma.achievement.findUnique({
      where: { id },
      select: { id: true, departmentId: true, title: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    if (!isSuperAdmin(user.role) && existing.departmentId && existing.departmentId !== user.departmentId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete honors belonging to your own department.' }, { status: 403 });
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
