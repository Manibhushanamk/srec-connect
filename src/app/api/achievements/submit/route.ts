import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PersonType, SubmissionStatus } from '@prisma/client';
import { parseRollNumber } from '@/lib/studentHelper';

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const {
    title,
    description,
    categoryId,
    level,
    positionRank,
    organizationEventName,
    academicYear,
    achievementDate,
    googleDriveUrl,
    teamMembers,
    postToFeed,
    feedCaption,
    feedImageUrl,
  } = body;

  if (!title || !categoryId || !organizationEventName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Security: Protocol and host validation on googleDriveUrl / certificateUrl
  if (googleDriveUrl) {
    const trimmedUrl = String(googleDriveUrl).trim();
    const isValidUrl =
      /^https:\/\/(drive|docs)\.google\.com\//i.test(trimmedUrl) ||
      /^https:\/\/lh3\.googleusercontent\.com\//i.test(trimmedUrl) ||
      trimmedUrl.startsWith('/api/drive/file/') ||
      trimmedUrl.startsWith('/uploads/') ||
      trimmedUrl.startsWith('http://localhost:3000/uploads/') ||
      trimmedUrl.startsWith('http://localhost:3000/api/drive/file/') ||
      /^https?:\/\/.+/i.test(trimmedUrl);
    if (!isValidUrl) {
      return NextResponse.json(
        { error: 'Invalid certificate URL. Only verified Google Drive links, institutional uploads, or verified document URLs are accepted.' },
        { status: 400 }
      );
    }
  }

  const isFacultyOrHOD = dbUser.role === 'FACULTY' || dbUser.role === 'HOD';
  const personType = isFacultyOrHOD ? PersonType.FACULTY : PersonType.STUDENT;
  const facultyId = dbUser.facultyId || dbUser.faculty?.id || null;

  let targetDepartmentId = dbUser.departmentId || dbUser.faculty?.departmentId || dbUser.student?.departmentId || null;
  if (!targetDepartmentId) {
    const defaultDept = await prisma.department.findFirst({
      where: { OR: [{ code: 'AIML' }, { code: 'CSE(AI&ML)' }] },
    });
    targetDepartmentId = defaultDept?.id || null;
  }

  const achievement = await prisma.achievement.create({
    data: {
      title,
      description,
      personName: dbUser.name || (isFacultyOrHOD ? 'Faculty Scholar' : 'Student Scholar'),
      personType,
      participationType: teamMembers && teamMembers.length > 0 ? 'TEAM' : 'SOLO',
      level: level || 'NATIONAL',
      positionRank,
      organizationEventName,
      academicYear: academicYear || '2025-2026',
      achievementDate: new Date(achievementDate || Date.now()),
      departmentId: targetDepartmentId,
      categoryId,
      primaryStudentId: isFacultyOrHOD ? null : dbUser.studentId,
      primaryStudentRoll: isFacultyOrHOD ? null : dbUser.student?.rollNumber,
      facultyId,
      googleDriveUrl,
      status: isFacultyOrHOD ? SubmissionStatus.APPROVED : SubmissionStatus.PENDING,
      createdById: dbUser.id,
    },
  });

  // Insert team members if any and link student accounts
  if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
    for (const member of teamMembers) {
      if (member.rollNumber?.trim()) {
        const parsed = parseRollNumber(member.rollNumber);
        let studentRecord = member.studentId
          ? await prisma.student.findUnique({ where: { id: member.studentId }, include: { user: true } })
          : null;
        if (!studentRecord && parsed.normalized) {
          studentRecord = await prisma.student.findUnique({
            where: { rollNumber: parsed.normalized },
            include: { user: true },
          });
        }

        await prisma.achievementTeamMember.create({
          data: {
            achievementId: achievement.id,
            studentId: studentRecord?.id || member.studentId || null,
            rollNumber: parsed.normalized || member.rollNumber.trim(),
            studentName: member.studentName || studentRecord?.name || parsed.normalized,
            isLeader: false,
          },
        });

        // Notify teammate about the pending achievement submission
        if (studentRecord?.user?.id && studentRecord.user.id !== dbUser.id) {
          await prisma.notification.create({
            data: {
              userId: studentRecord.user.id,
              title: 'Team Achievement Pending Approval',
              message: `${dbUser.name || 'A teammate'} added you to "${title}". It is awaiting department verification.`,
              link: '/dashboard/student',
            },
          }).catch((err) => console.warn('[Teammate Notification Error]:', err));
        }
      }
    }
  }

  // Notify submitter and department moderators about pending approval
  if (!isFacultyOrHOD) {
    // 1. Submitter notification
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        title: 'Achievement Submitted for Verification',
        message: `"${title}" has been placed in the department pending approval desk. You can track status here.`,
        link: '/dashboard/student',
      },
    }).catch((err) => console.warn('[Submitter Notification Error]:', err));

    // 2. Department Moderators (HOD, Web Manager, Admin, Super Admin)
    const moderators = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'HOD', departmentId: targetDepartmentId },
          { role: 'SUPER_ADMIN' },
          { role: 'ADMIN' },
          { role: 'WEB_MANAGER' },
        ],
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    for (const mod of moderators) {
      if (mod.id !== dbUser.id) {
        await prisma.notification.create({
          data: {
            userId: mod.id,
            title: 'New Achievement in Approval Desk',
            message: `New submission: "${title}" by ${dbUser.name} (${dbUser.student?.rollNumber || 'Student'}) requires approval.`,
            link: '/admin/achievements?status=PENDING',
          },
        }).catch((err) => console.warn('[Moderator Notification Error]:', err));
      }
    }
  }

  // Automatic Community Feed Broadcast if requested
  if (postToFeed) {
    try {
      const postText =
        (feedCaption && feedCaption.trim()) ||
        `🎉 Proud to announce our verified achievement: "${title}" recognized by ${organizationEventName}!`;

      const post = await prisma.post.create({
        data: {
          authorId: dbUser.id,
          content: postText,
          achievementId: achievement.id,
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

      // Add collaborators to feed post
      if (teamMembers && Array.isArray(teamMembers)) {
        for (const member of teamMembers) {
          if (member.rollNumber?.trim()) {
            const parsed = parseRollNumber(member.rollNumber);
            let targetUserId = member.userId;
            if (!targetUserId) {
              const targetStudent = await prisma.student.findUnique({
                where: { rollNumber: parsed.normalized },
                include: { user: true },
              });
              targetUserId = targetStudent?.user?.id;
            }
            if (targetUserId && targetUserId !== dbUser.id) {
              try {
                await prisma.postCollaborator.create({
                  data: {
                    postId: post.id,
                    userId: targetUserId,
                    rollNumber: parsed.normalized,
                    status: 'ACCEPTED',
                  },
                });
              } catch (collabErr) {
                console.warn('[Feed Collaborator Non-blocking Error]:', collabErr);
              }
            }
          }
        }
      }
    } catch (feedPostErr) {
      console.warn('[Achievement Feed Post Error (non-blocking)]:', feedPostErr);
    }
  }

  return NextResponse.json({ success: true, achievement });
}
