import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

          // Soft delete user and related student/faculty profile
          await prisma.$transaction([
            prisma.user.update({ where: { id }, data: { deletedAt: now, status: 'SUSPENDED' } }),
            ...(user.student ? [prisma.student.update({ where: { id: user.student.id }, data: { deletedAt: now, isActive: false } })] : []),
            ...(user.faculty ? [prisma.faculty.update({ where: { id: user.faculty.id }, data: { deletedAt: now, isActive: false } })] : []),
          ]);
          break;
        }

        case 'STUDENT':
          await prisma.student.update({ where: { id }, data: { deletedAt: now, isActive: false } });
          break;

        case 'FACULTY':
          await prisma.faculty.update({ where: { id }, data: { deletedAt: now, isActive: false } });
          break;

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
          ]);
          break;
        }

        case 'STUDENT':
          await prisma.student.update({ where: { id }, data: { deletedAt: null, isActive: true } });
          break;

        case 'FACULTY':
          await prisma.faculty.update({ where: { id }, data: { deletedAt: null, isActive: true } });
          break;

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
        case 'USER':
          await prisma.user.delete({ where: { id } });
          break;

        case 'STUDENT':
          await prisma.student.delete({ where: { id } });
          break;

        case 'FACULTY':
          await prisma.faculty.delete({ where: { id } });
          break;

        case 'ACHIEVEMENT':
          await prisma.achievement.delete({ where: { id } });
          break;

        case 'EVENT':
          await prisma.event.delete({ where: { id } });
          break;

        case 'POST':
          await prisma.post.delete({ where: { id } });
          break;

        case 'INCIDENT':
          await prisma.incident.delete({ where: { id } });
          break;

        case 'ANNOUNCEMENT':
          await prisma.announcement.delete({ where: { id } });
          break;

        default:
          return NextResponse.json({ error: `Unsupported entity type: ${type}` }, { status: 400 });
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
      if (!type || type === 'ALL' || type === 'ACHIEVEMENT') {
        const res = await prisma.achievement.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }
      if (!type || type === 'ALL' || type === 'EVENT') {
        const res = await prisma.event.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }
      if (!type || type === 'ALL' || type === 'POST') {
        const res = await prisma.post.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }
      if (!type || type === 'ALL' || type === 'INCIDENT') {
        const res = await prisma.incident.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
      }
      if (!type || type === 'ALL' || type === 'ANNOUNCEMENT') {
        const res = await prisma.announcement.deleteMany({ where: { deletedAt: { not: null } } });
        purgedTotal += res.count;
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
