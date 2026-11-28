import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin, isSuperAdmin } from '@/lib/rbac';
import { SubmissionStatus } from '@prisma/client';
import { sanitizeText, sanitizeSafeUrl } from '@/lib/sanitize';
import {
  resolveScopedDepartmentId,
  toPrivateDocumentUrl,
  validateAchievementTransition,
} from '@/lib/admin-auth';
import {
  AdminAchievementDeleteSchema,
  AdminAchievementPatchSchema,
  AdminAchievementsQuerySchema,
  parseJsonBody,
  parseQueryParams,
} from '@/lib/schemas';
import { resolveOrCreateCategoryId } from '@/lib/category-batch-helpers';
import { buildDateRangePrismaFilter, resolveTimelineDateRange } from '@/lib/timeline';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
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
    const parsedQuery = parseQueryParams(searchParams, AdminAchievementsQuerySchema);
    if (!parsedQuery.success) return parsedQuery.response;

    const {
      status: rawStatus,
      timeline,
      dateFrom,
      dateTo,
      categoryId,
      level,
      academicYear,
      departmentId: requestedDepartmentId,
      search,
    } = parsedQuery.data;
    const statusParam = rawStatus?.toUpperCase();

    const scopedDepartmentId = resolveScopedDepartmentId(
      user.role,
      user.departmentId,
      requestedDepartmentId
    );
    const baseWhere: any = { deletedAt: null };
    if (scopedDepartmentId) {
      baseWhere.departmentId = scopedDepartmentId;
    }

    const timelineInfo = resolveTimelineDateRange(timeline, dateFrom, dateTo);
    const dateRange = buildDateRangePrismaFilter(timeline, dateFrom, dateTo);
    if (dateRange) {
      baseWhere.achievementDate = dateRange;
    }
    if (categoryId && categoryId !== 'ALL') {
      baseWhere.categoryId = categoryId;
    }
    if (level && level !== 'ALL') {
      baseWhere.level = level;
    }
    if (academicYear && academicYear !== 'ALL') {
      baseWhere.academicYear = academicYear;
    }
    if (search) {
      baseWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { personName: { contains: search, mode: 'insensitive' } },
        { primaryStudentRoll: { contains: search, mode: 'insensitive' } },
        { organizationEventName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const where: any = { ...baseWhere };
    if (statusParam && statusParam !== 'ALL') {
      if (statusParam === 'SUBMITTED') {
        where.status = { in: [SubmissionStatus.DRAFT, SubmissionStatus.PENDING] };
      } else {
        where.status = statusParam as SubmissionStatus;
      }
    }

    const [achievements, groupedCounts, scopedDepartment] = await Promise.all([
      prisma.achievement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          department: {
            select: {
              id: true,
              code: true,
              name: true,
              shortName: true,
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
      }),
      prisma.achievement.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true },
      }),
      scopedDepartmentId
        ? prisma.department.findUnique({
            where: { id: scopedDepartmentId },
            select: { id: true, code: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    const achIds = achievements.map((a) => a.id);
    const auditLogs =
      achIds.length > 0
        ? await prisma.auditLog.findMany({
            where: {
              entityType: 'Achievement',
              entityId: { in: achIds },
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              entityId: true,
              action: true,
              actorEmail: true,
              actorRole: true,
              metadata: true,
              createdAt: true,
            },
          })
        : [];

    const auditMap = new Map<string, typeof auditLogs>();
    for (const entry of auditLogs) {
      if (!entry.entityId) continue;
      const list = auditMap.get(entry.entityId) || [];
      list.push(entry);
      auditMap.set(entry.entityId, list);
    }

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      PENDING: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      RESUBMISSION_REQUIRED: 0,
      REJECTED: 0,
      PUBLISHED: 0,
      ALL: 0,
    };

    for (const item of groupedCounts) {
      statusCounts[item.status] = item._count.id;
      statusCounts.ALL += item._count.id;
    }
    statusCounts.SUBMITTED = (statusCounts.DRAFT || 0) + (statusCounts.PENDING || 0);

    const enrichedAchievements = achievements.map((ach) => ({
      ...ach,
      privateCertificateUrl: toPrivateDocumentUrl(ach.certificateUrl || ach.googleDriveUrl),
      auditLogs: auditMap.get(ach.id) || [],
    }));

    return NextResponse.json({
      achievements: enrichedAchievements,
      statusCounts,
      actorRole: user.role,
      actorId: user.id,
      scopedDepartmentId,
      scopedDepartment,
      timelinePreset: timelineInfo.preset,
      timelineLabel: timelineInfo.label,
    });
  } catch (error: any) {
    console.error('[Admin Achievements GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user || (!canAccessAdmin(user) && user.role !== 'FACULTY')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const parsedBody = await parseJsonBody(req, AdminAchievementPatchSchema);
    if (!parsedBody.success) return parsedBody.response;
    const rawBody = await Promise.resolve(parsedBody.data as any);
    const {
      id,
      status,
      rejectionReason,
      title,
      description,
      categoryId: rawCategoryId,
      customCategoryName,
      level,
      positionRank,
      organizationEventName,
      personName,
      personType,
      academicYear,
    } = rawBody;
    const body = rawBody;
    const categoryId =
      customCategoryName || rawCategoryId
        ? await resolveOrCreateCategoryId({
            categoryId: rawCategoryId,
            customCategoryName,
            type: 'ACHIEVEMENT',
          })
        : undefined;
    const departmentId = body.departmentId;
    const facultyDesignation = body.facultyDesignation;
    const primaryStudentRoll = body.primaryStudentRoll;
    const achievementDate = body.achievementDate;
    const participationType = body.participationType;
    const teamName = body.teamName;
    const googleDriveUrl = body.googleDriveUrl;
    const certificateUrl = body.certificateUrl;
    const teamMembers = body.teamMembers;
    const postToFeed = body.postToFeed;
    const feedCaption = body.feedCaption;
    const feedImageUrl = body.feedImageUrl;

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

    // Fail-closed department boundary check: HOD, Web Manager, and Faculty require matching departmentId
    if (!isSuperAdmin(user.role)) {
      if (!user.departmentId || existing.departmentId !== user.departmentId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only modify honors belonging to your own department.' },
          { status: 403 }
        );
      }
    }

    const transition = validateAchievementTransition({
      status,
      rejectionReason,
      actorId: user.id,
      actorRole: user.role,
      createdById: existing.createdById,
    });

    if (!transition.valid) {
      return NextResponse.json(
        { error: transition.error },
        { status: transition.httpStatus }
      );
    }

    const updateData: any = {};
    if (transition.status) {
      updateData.status = transition.status;
      if (transition.status === 'PUBLISHED' || transition.status === 'APPROVED') {
        updateData.publishedAt = new Date();
        updateData.rejectionReason = null;
      }
      if (transition.status === 'REJECTED' || transition.status === 'RESUBMISSION_REQUIRED') {
        updateData.rejectionReason = sanitizeText(transition.sanitizedReason || '');
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

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: 'Achievement', entityId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        entityId: true,
        action: true,
        actorEmail: true,
        actorRole: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      achievement: {
        ...updated,
        privateCertificateUrl: toPrivateDocumentUrl(updated.certificateUrl || updated.googleDriveUrl),
        auditLogs,
      },
    });
  } catch (error: any) {
    console.error('[Admin Achievements PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update achievement' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user || (!isSuperAdmin(user.role) && user.role !== 'HOD')) {
      return NextResponse.json({ error: 'Forbidden: Super Admin or HOD authority required to delete records' }, { status: 403 });
    }

    const parsedDel = await parseJsonBody(req, AdminAchievementDeleteSchema);
    if (!parsedDel.success) return parsedDel.response;
    const { id } = parsedDel.data;

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
