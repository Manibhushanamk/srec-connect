import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface TrashedItem {
  id: string;
  type: 'USER' | 'STUDENT' | 'FACULTY' | 'ACHIEVEMENT' | 'EVENT' | 'POST' | 'INCIDENT' | 'ANNOUNCEMENT';
  title: string;
  subtitle?: string;
  meta?: Record<string, any>;
  deletedAt: string;
}

/**
 * Super Admin check helper
 */
async function getSuperAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== 'ACTIVE' || user.role !== 'SUPER_ADMIN') {
    return null;
  }
  return user;
}

/**
 * GET: Retrieve all trashed items across all models
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getSuperAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'ALL';

    const [
      trashedUsers,
      trashedStudents,
      trashedFaculty,
      trashedAchievements,
      trashedEvents,
      trashedPosts,
      trashedIncidents,
      trashedAnnouncements,
    ] = await Promise.all([
      filterType === 'ALL' || filterType === 'USER'
        ? prisma.user.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, name: true, email: true, role: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'STUDENT'
        ? prisma.student.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, name: true, rollNumber: true, batch: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'FACULTY'
        ? prisma.faculty.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, name: true, designation: true, departmentName: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'ACHIEVEMENT'
        ? prisma.achievement.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, title: true, personName: true, level: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'EVENT'
        ? prisma.event.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, title: true, venue: true, startDate: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'POST'
        ? prisma.post.findMany({
            where: { deletedAt: { not: null } },
            select: {
              id: true,
              content: true,
              deletedAt: true,
              author: { select: { name: true, email: true } },
            },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'INCIDENT'
        ? prisma.incident.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, title: true, category: true, priority: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),

      filterType === 'ALL' || filterType === 'ANNOUNCEMENT'
        ? prisma.announcement.findMany({
            where: { deletedAt: { not: null } },
            select: { id: true, title: true, targetRole: true, deletedAt: true },
            orderBy: { deletedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const items: TrashedItem[] = [
      ...trashedUsers.map((u) => ({
        id: u.id,
        type: 'USER' as const,
        title: u.name || u.email,
        subtitle: `Role: ${u.role} • ${u.email}`,
        deletedAt: u.deletedAt!.toISOString(),
      })),
      ...trashedStudents.map((s) => ({
        id: s.id,
        type: 'STUDENT' as const,
        title: s.name,
        subtitle: `Roll: ${s.rollNumber} • Batch: ${s.batch || 'N/A'}`,
        deletedAt: s.deletedAt!.toISOString(),
      })),
      ...trashedFaculty.map((f) => ({
        id: f.id,
        type: 'FACULTY' as const,
        title: f.name,
        subtitle: `${f.designation || 'Faculty'} • ${f.departmentName || 'Engineering'}`,
        deletedAt: f.deletedAt!.toISOString(),
      })),
      ...trashedAchievements.map((a) => ({
        id: a.id,
        type: 'ACHIEVEMENT' as const,
        title: a.title,
        subtitle: `Recipient: ${a.personName} • Level: ${a.level}`,
        deletedAt: a.deletedAt!.toISOString(),
      })),
      ...trashedEvents.map((e) => ({
        id: e.id,
        type: 'EVENT' as const,
        title: e.title,
        subtitle: `Venue: ${e.venue} • Date: ${new Date(e.startDate).toLocaleDateString()}`,
        deletedAt: e.deletedAt!.toISOString(),
      })),
      ...trashedPosts.map((p) => ({
        id: p.id,
        type: 'POST' as const,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? '...' : ''),
        subtitle: `Author: ${p.author?.name || p.author?.email || 'Unknown'}`,
        deletedAt: p.deletedAt!.toISOString(),
      })),
      ...trashedIncidents.map((i) => ({
        id: i.id,
        type: 'INCIDENT' as const,
        title: i.title,
        subtitle: `Category: ${i.category} • Priority: ${i.priority}`,
        deletedAt: i.deletedAt!.toISOString(),
      })),
      ...trashedAnnouncements.map((an) => ({
        id: an.id,
        type: 'ANNOUNCEMENT' as const,
        title: an.title,
        subtitle: `Audience: ${an.targetRole}`,
        deletedAt: an.deletedAt!.toISOString(),
      })),
    ];

    // Sort all by deletedAt desc
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    const counts = {
      all: items.length,
      users: trashedUsers.length,
      students: trashedStudents.length,
      faculty: trashedFaculty.length,
      achievements: trashedAchievements.length,
      events: trashedEvents.length,
      posts: trashedPosts.length,
      incidents: trashedIncidents.length,
      announcements: trashedAnnouncements.length,
    };

    return NextResponse.json({ success: true, items, counts });
  } catch (error: any) {
    console.error('[Admin Trash GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Execute TRASH (soft delete), RESTORE (undelete), PURGE (hard delete), or EMPTY_TRASH
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getSuperAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, type, id } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // 1. ACTION: TRASH (Soft delete an active item)
    if (action === 'TRASH') {
      if (!type || !id) {
        return NextResponse.json({ error: 'Type and ID required for TRASH action' }, { status: 400 });
      }

      const now = new Date();

      switch (type) {
        case 'USER': {
          const user = await prisma.user.findUnique({
            where: { id },
            include: { student: true, faculty: true },
          });
          if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

          // Soft delete user, student/faculty, posts, and achievements
          await prisma.$transaction([
            prisma.user.update({ where: { id }, data: { deletedAt: now, status: 'SUSPENDED' } }),
            ...(user.student ? [prisma.student.update({ where: { id: user.student.id }, data: { deletedAt: now, isActive: false } })] : []),
            ...(user.faculty ? [prisma.faculty.update({ where: { id: user.faculty.id }, data: { deletedAt: now, isActive: false } })] : []),
            prisma.post.updateMany({ where: { authorId: id, deletedAt: null }, data: { deletedAt: now } }),
            prisma.achievement.updateMany({
              where: {
                OR: [
                  { createdById: id },
                  ...(user.student ? [{ primaryStudentId: user.student.id }, { primaryStudentRoll: user.student.rollNumber }] : []),
                  ...(user.faculty ? [{ facultyId: user.faculty.id }] : []),
                ],
                deletedAt: null,
              },
              data: { deletedAt: now },
            }),
            prisma.postCollaborator.deleteMany({ where: { userId: id } }),
          ]);
          break;
        }

        case 'STUDENT': {
          const student = await prisma.student.findUnique({
            where: { id },
            include: { user: true },
          });
          if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

          await prisma.$transaction([
            prisma.student.update({ where: { id }, data: { deletedAt: now, isActive: false } }),
            ...(student.user ? [prisma.user.update({ where: { id: student.user.id }, data: { deletedAt: now, status: 'SUSPENDED' } })] : []),
            ...(student.user ? [prisma.post.updateMany({ where: { authorId: student.user.id, deletedAt: null }, data: { deletedAt: now } })] : []),
            prisma.achievement.updateMany({
              where: {
                OR: [
                  { primaryStudentId: id },
                  { primaryStudentRoll: student.rollNumber },
                  ...(student.user ? [{ createdById: student.user.id }] : []),
                ],
                deletedAt: null,
              },
              data: { deletedAt: now },
            }),
          ]);
          break;
        }

        case 'FACULTY': {
          const faculty = await prisma.faculty.findUnique({
            where: { id },
            include: { user: true },
          });
          if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

          await prisma.$transaction([
            prisma.faculty.update({ where: { id }, data: { deletedAt: now, isActive: false } }),
            ...(faculty.user ? [prisma.user.update({ where: { id: faculty.user.id }, data: { deletedAt: now, status: 'SUSPENDED' } })] : []),
            ...(faculty.user ? [prisma.post.updateMany({ where: { authorId: faculty.user.id, deletedAt: null }, data: { deletedAt: now } })] : []),
            prisma.achievement.updateMany({
              where: {
                OR: [
                  { facultyId: id },
                  ...(faculty.user ? [{ createdById: faculty.user.id }] : []),
                ],
                deletedAt: null,
              },
              data: { deletedAt: now },
            }),
          ]);
          break;
        }

        case 'ACHIEVEMENT':
          await prisma.achievement.update({ where: { id }, data: { deletedAt: now } });
          break;

        case 'EVENT':
          await prisma.event.update({ where: { id }, data: { deletedAt: now, status: 'CANCELLED' } });
          break;

        case 'POST':
          await prisma.post.update({ where: { id }, data: { deletedAt: now } });
          break;

        case 'INCIDENT':
          await prisma.incident.update({ where: { id }, data: { deletedAt: now } });
          break;

        case 'ANNOUNCEMENT':
          await prisma.announcement.update({ where: { id }, data: { deletedAt: now } });
          break;

        default:
          return NextResponse.json({ error: `Unsupported entity type: ${type}` }, { status: 400 });
      }

      try {
        revalidatePath('/');
        revalidatePath('/students');
        revalidatePath('/faculty');
        revalidatePath('/achievements');
      } catch (revErr) {
        console.warn('Revalidation warning:', revErr);
      }

      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.role,
          action: 'MOVED_TO_TRASH',
          entityType: type,
          entityId: id,
          metadata: JSON.stringify({ action: 'TRASH', movedAt: now.toISOString() }),
        },
      });

      return NextResponse.json({ success: true, message: `${type} moved to trash successfully` });
    }

    // 2. ACTION: RESTORE (Recover from trash)
    if (action === 'RESTORE') {
      if (!type || !id) {
        return NextResponse.json({ error: 'Type and ID required for RESTORE action' }, { status: 400 });
      }

      switch (type) {
        case 'USER': {
          const user = await prisma.user.findUnique({
            where: { id },
            include: { student: true, faculty: true },
          });
          if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

          await prisma.$transaction([
            prisma.user.update({ where: { id }, data: { deletedAt: null, status: 'ACTIVE' } }),
            ...(user.student ? [prisma.student.update({ where: { id: user.student.id }, data: { deletedAt: null, isActive: true } })] : []),
            ...(user.faculty ? [prisma.faculty.update({ where: { id: user.faculty.id }, data: { deletedAt: null, isActive: true } })] : []),
            prisma.post.updateMany({ where: { authorId: id, deletedAt: { not: null } }, data: { deletedAt: null } }),
            prisma.achievement.updateMany({
              where: {
                OR: [
                  { createdById: id },
                  ...(user.student ? [{ primaryStudentId: user.student.id }, { primaryStudentRoll: user.student.rollNumber }] : []),
                  ...(user.faculty ? [{ facultyId: user.faculty.id }] : []),
                ],
                deletedAt: { not: null },
              },
              data: { deletedAt: null },
            }),
          ]);
          break;
        }

        case 'STUDENT': {
          const student = await prisma.student.findUnique({
            where: { id },
            include: { user: true },
          });
          if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

          await prisma.$transaction([
            prisma.student.update({ where: { id }, data: { deletedAt: null, isActive: true } }),
            ...(student.user ? [prisma.user.update({ where: { id: student.user.id }, data: { deletedAt: null, status: 'ACTIVE' } })] : []),
            ...(student.user ? [prisma.post.updateMany({ where: { authorId: student.user.id, deletedAt: { not: null } }, data: { deletedAt: null } })] : []),
            prisma.achievement.updateMany({
              where: {
                OR: [
                  { primaryStudentId: id },
                  { primaryStudentRoll: student.rollNumber },
                  ...(student.user ? [{ createdById: student.user.id }] : []),
                ],
                deletedAt: { not: null },
              },
              data: { deletedAt: null },
            }),
          ]);
          break;
        }

        case 'FACULTY': {
          const faculty = await prisma.faculty.findUnique({
            where: { id },
            include: { user: true },
          });
          if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

          await prisma.$transaction([
            prisma.faculty.update({ where: { id }, data: { deletedAt: null, isActive: true } }),
            ...(faculty.user ? [prisma.user.update({ where: { id: faculty.user.id }, data: { deletedAt: null, status: 'ACTIVE' } })] : []),
            ...(faculty.user ? [prisma.post.updateMany({ where: { authorId: faculty.user.id, deletedAt: { not: null } }, data: { deletedAt: null } })] : []),
            prisma.achievement.updateMany({
              where: {
                OR: [
                  { facultyId: id },
                  ...(faculty.user ? [{ createdById: faculty.user.id }] : []),
                ],
                deletedAt: { not: null },
              },
              data: { deletedAt: null },
            }),
          ]);
          break;
        }

        case 'ACHIEVEMENT':
          await prisma.achievement.update({ where: { id }, data: { deletedAt: null } });
          break;

        case 'EVENT':
          await prisma.event.update({ where: { id }, data: { deletedAt: null, status: 'UPCOMING' } });
          break;

        case 'POST':
          await prisma.post.update({ where: { id }, data: { deletedAt: null } });
          break;

        case 'INCIDENT':
          await prisma.incident.update({ where: { id }, data: { deletedAt: null } });
          break;

        case 'ANNOUNCEMENT':
          await prisma.announcement.update({ where: { id }, data: { deletedAt: null } });
          break;

        default:
          return NextResponse.json({ error: `Unsupported entity type: ${type}` }, { status: 400 });
      }

      try {
        revalidatePath('/');
        revalidatePath('/students');
        revalidatePath('/faculty');
        revalidatePath('/achievements');
      } catch (revErr) {
        console.warn('Revalidation warning:', revErr);
      }

      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.role,
          action: 'RESTORED_FROM_TRASH',
          entityType: type,
          entityId: id,
          metadata: JSON.stringify({ action: 'RESTORE', restoredAt: new Date().toISOString() }),
        },
      });

      return NextResponse.json({ success: true, message: `${type} restored successfully` });
    }

    // 3. ACTION: PURGE (Permanently delete from database)
    if (action === 'PURGE') {
      if (!type || !id) {
        return NextResponse.json({ error: 'Type and ID required for PURGE action' }, { status: 400 });
      }

      switch (type) {
        case 'USER': {
          const user = await prisma.user.findUnique({
            where: { id },
            include: { student: true, faculty: true },
          });
          if (user) {
            await prisma.$transaction([
              prisma.postMedia.deleteMany({ where: { post: { authorId: id } } }),
              prisma.postComment.deleteMany({ where: { authorId: id } }),
              prisma.postLike.deleteMany({ where: { userId: id } }),
              prisma.postBookmark.deleteMany({ where: { userId: id } }),
              prisma.postCollaborator.deleteMany({ where: { userId: id } }),
              prisma.post.deleteMany({ where: { authorId: id } }),
              prisma.achievementMedia.deleteMany({
                where: {
                  achievement: {
                    OR: [
                      { createdById: id },
                      ...(user.student ? [{ primaryStudentId: user.student.id }] : []),
                      ...(user.faculty ? [{ facultyId: user.faculty.id }] : []),
                    ],
                  },
                },
              }),
              prisma.achievementTeamMember.deleteMany({
                where: {
                  OR: [
                    ...(user.student ? [{ studentId: user.student.id }] : []),
                    {
                      achievement: {
                        OR: [
                          { createdById: id },
                          ...(user.student ? [{ primaryStudentId: user.student.id }] : []),
                          ...(user.faculty ? [{ facultyId: user.faculty.id }] : []),
                        ],
                      },
                    },
                  ],
                },
              }),
              prisma.achievement.deleteMany({
                where: {
                  OR: [
                    { createdById: id },
                    ...(user.student ? [{ primaryStudentId: user.student.id }, { primaryStudentRoll: user.student.rollNumber }] : []),
                    ...(user.faculty ? [{ facultyId: user.faculty.id }] : []),
                  ],
                },
              }),
              prisma.notification.deleteMany({ where: { userId: id } }),
              prisma.eventAttendance.deleteMany({ where: { userId: id } }),
              prisma.eventRegistration.deleteMany({ where: { userId: id } }),
              prisma.user.delete({ where: { id } }),
              ...(user.student ? [prisma.student.delete({ where: { id: user.student.id } })] : []),
              ...(user.faculty ? [prisma.faculty.delete({ where: { id: user.faculty.id } })] : []),
            ]);
          }
          break;
        }

        case 'STUDENT': {
          const student = await prisma.student.findUnique({
            where: { id },
            include: { user: true },
          });
          if (student) {
            await prisma.$transaction([
              prisma.achievementTeamMember.deleteMany({ where: { studentId: id } }),
              prisma.achievementMedia.deleteMany({ where: { achievement: { primaryStudentId: id } } }),
              prisma.achievement.deleteMany({
                where: {
                  OR: [
                    { primaryStudentId: id },
                    { primaryStudentRoll: student.rollNumber },
                    ...(student.user ? [{ createdById: student.user.id }] : []),
                  ],
                },
              }),
              ...(student.user ? [
                prisma.postMedia.deleteMany({ where: { post: { authorId: student.user.id } } }),
                prisma.postComment.deleteMany({ where: { authorId: student.user.id } }),
                prisma.postLike.deleteMany({ where: { userId: student.user.id } }),
                prisma.postBookmark.deleteMany({ where: { userId: student.user.id } }),
                prisma.postCollaborator.deleteMany({ where: { userId: student.user.id } }),
                prisma.post.deleteMany({ where: { authorId: student.user.id } }),
                prisma.user.delete({ where: { id: student.user.id } }),
              ] : []),
              prisma.student.delete({ where: { id } }),
            ]);
          }
          break;
        }

        case 'FACULTY': {
          const faculty = await prisma.faculty.findUnique({
            where: { id },
            include: { user: true },
          });
          if (faculty) {
            await prisma.$transaction([
              prisma.achievementMedia.deleteMany({ where: { achievement: { facultyId: id } } }),
              prisma.achievement.deleteMany({
                where: {
                  OR: [
                    { facultyId: id },
                    ...(faculty.user ? [{ createdById: faculty.user.id }] : []),
                  ],
                },
              }),
              ...(faculty.user ? [
                prisma.postMedia.deleteMany({ where: { post: { authorId: faculty.user.id } } }),
                prisma.postComment.deleteMany({ where: { authorId: faculty.user.id } }),
                prisma.postLike.deleteMany({ where: { userId: faculty.user.id } }),
                prisma.postBookmark.deleteMany({ where: { userId: faculty.user.id } }),
                prisma.postCollaborator.deleteMany({ where: { userId: faculty.user.id } }),
                prisma.post.deleteMany({ where: { authorId: faculty.user.id } }),
                prisma.user.delete({ where: { id: faculty.user.id } }),
              ] : []),
              prisma.faculty.delete({ where: { id } }),
            ]);
          }
          break;
        }

        case 'ACHIEVEMENT':
          await prisma.$transaction([
            prisma.achievementMedia.deleteMany({ where: { achievementId: id } }),
            prisma.achievementTeamMember.deleteMany({ where: { achievementId: id } }),
            prisma.post.updateMany({ where: { achievementId: id }, data: { achievementId: null } }),
            prisma.achievement.delete({ where: { id } }),
          ]);
          break;

        case 'EVENT':
          await prisma.$transaction([
            prisma.eventMedia.deleteMany({ where: { eventId: id } }),
            prisma.eventAttendance.deleteMany({ where: { eventId: id } }),
            prisma.eventRegistration.deleteMany({ where: { eventId: id } }),
            prisma.event.delete({ where: { id } }),
          ]);
          break;

        case 'POST':
          await prisma.$transaction([
            prisma.postMedia.deleteMany({ where: { postId: id } }),
            prisma.postComment.deleteMany({ where: { postId: id } }),
            prisma.postLike.deleteMany({ where: { postId: id } }),
            prisma.postBookmark.deleteMany({ where: { postId: id } }),
            prisma.postCollaborator.deleteMany({ where: { postId: id } }),
            prisma.post.delete({ where: { id } }),
          ]);
          break;

        case 'INCIDENT':
          await prisma.$transaction([
            prisma.incidentResponse.deleteMany({ where: { incidentId: id } }),
            prisma.incidentAction.deleteMany({ where: { incidentId: id } }),
            prisma.incident.delete({ where: { id } }),
          ]);
          break;

        case 'ANNOUNCEMENT':
          await prisma.announcement.delete({ where: { id } });
          break;

        default:
          return NextResponse.json({ error: `Unsupported entity type: ${type}` }, { status: 400 });
      }

      try {
        revalidatePath('/');
        revalidatePath('/students');
        revalidatePath('/faculty');
        revalidatePath('/achievements');
      } catch (revErr) {
        console.warn('Revalidation warning:', revErr);
      }

      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.role,
          action: 'PURGED_PERMANENTLY',
          entityType: type,
          entityId: id,
          metadata: JSON.stringify({ action: 'PURGE', purgedAt: new Date().toISOString() }),
        },
      });

      return NextResponse.json({ success: true, message: `${type} permanently deleted` });
    }

    // 4. ACTION: EMPTY_TRASH (Purge all trashed items across models or specific type)
    if (action === 'EMPTY_TRASH') {
      let purgedTotal = 0;

      if (!type || type === 'ALL' || type === 'POST') {
        await prisma.postMedia.deleteMany({ where: { post: { deletedAt: { not: null } } } });
        await prisma.postComment.deleteMany({ where: { post: { deletedAt: { not: null } } } });
        await prisma.postLike.deleteMany({ where: { post: { deletedAt: { not: null } } } });
        await prisma.postBookmark.deleteMany({ where: { post: { deletedAt: { not: null } } } });
        await prisma.postCollaborator.deleteMany({ where: { post: { deletedAt: { not: null } } } });
        const res = await prisma.post.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'ACHIEVEMENT') {
        await prisma.achievementMedia.deleteMany({ where: { achievement: { deletedAt: { not: null } } } });
        await prisma.achievementTeamMember.deleteMany({ where: { achievement: { deletedAt: { not: null } } } });
        await prisma.post.updateMany({ where: { achievement: { deletedAt: { not: null } } }, data: { achievementId: null } });
        const res = await prisma.achievement.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'EVENT') {
        await prisma.eventMedia.deleteMany({ where: { event: { deletedAt: { not: null } } } });
        await prisma.eventAttendance.deleteMany({ where: { event: { deletedAt: { not: null } } } });
        await prisma.eventRegistration.deleteMany({ where: { event: { deletedAt: { not: null } } } });
        const res = await prisma.event.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'INCIDENT') {
        await prisma.incidentResponse.deleteMany({ where: { incident: { deletedAt: { not: null } } } });
        await prisma.incidentAction.deleteMany({ where: { incident: { deletedAt: { not: null } } } });
        const res = await prisma.incident.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'ANNOUNCEMENT') {
        const res = await prisma.announcement.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'USER') {
        const res = await prisma.user.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'STUDENT') {
        const res = await prisma.student.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      if (!type || type === 'ALL' || type === 'FACULTY') {
        const res = await prisma.faculty.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }

      try {
        revalidatePath('/');
        revalidatePath('/students');
        revalidatePath('/faculty');
        revalidatePath('/achievements');
      } catch (revErr) {
        console.warn('Revalidation warning:', revErr);
      }

      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          actorRole: admin.role,
          action: 'TRASH_EMPTIED',
          entityType: type || 'ALL',
          metadata: JSON.stringify({ count: purgedTotal, emptiedAt: new Date().toISOString() }),
        },
      });

      return NextResponse.json({ success: true, count: purgedTotal, message: `Purged ${purgedTotal} items permanently` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Trash POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
