import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import { AnnouncementPriority, AnnouncementTargetRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    let userRole: string | null = null;
    let userBatch: string | null = null;
    let userSection: string | null = null;
    let userDepartmentId: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        include: { student: true, faculty: true },
      });
      if (user) {
        userRole = user.role;
        userDepartmentId = user.departmentId;
        if (user.student) {
          userBatch = user.student.batch;
          userSection = user.student.section;
        }
      }
    }

    // Filter announcements targeting the user or global announcements
    const orConditions: any[] = [
      { targetRole: 'ALL' },
    ];

    if (userRole === 'STUDENT') {
      orConditions.push({
        targetRole: 'STUDENT',
        AND: [
          userBatch ? { OR: [{ batch: null }, { batch: userBatch }] } : { batch: null },
          userSection ? { OR: [{ section: null }, { section: userSection }] } : { section: null },
        ],
      });
    } else if (userRole === 'FACULTY' || userRole === 'HOD') {
      orConditions.push({ targetRole: 'FACULTY' });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        deletedAt: null,
        OR: orConditions,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ],
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        department: { select: { id: true, code: true, name: true, shortName: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('[Announcements API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let currentUser = null;

    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    const body = await req.json();
    const {
      title,
      content,
      priority = 'NORMAL',
      targetRole = 'ALL',
      batch,
      section,
      departmentId,
      expiresAt,
      authorEmail,
    } = body;

    if (!currentUser && authorEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: authorEmail.toLowerCase().trim() },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessAdmin(currentUser) && currentUser.role !== 'FACULTY') {
      return NextResponse.json(
        { error: 'Forbidden: Faculty or Administrator credentials required to publish notices' },
        { status: 403 }
      );
    }

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Default expiration: 30 days from now if not specified
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        priority: priority as AnnouncementPriority,
        targetRole: targetRole as AnnouncementTargetRole,
        batch: batch || null,
        section: section || null,
        departmentId: departmentId || currentUser.departmentId || null,
        authorId: currentUser.id,
        expiresAt: expirationDate,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        department: true,
      },
    });

    // Fan-out notifications to targeted audience
    const userWhere: any = { status: 'ACTIVE' };
    if (targetRole === 'STUDENT') {
      userWhere.role = 'STUDENT';
      if (batch || section) {
        userWhere.student = {
          ...(batch ? { batch } : {}),
          ...(section ? { section } : {}),
        };
      }
    } else if (targetRole === 'FACULTY') {
      userWhere.role = { in: ['FACULTY', 'HOD'] };
    }

    if (departmentId) {
      userWhere.departmentId = departmentId;
    }

    const targetUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
      take: 500, // safety batch limit
    });

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          announcementId: announcement.id,
          title: `Announcement: ${announcement.title}`,
          message: announcement.content.slice(0, 140),
          link: '/',
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'ANNOUNCEMENT_CREATED',
        entityType: 'Announcement',
        entityId: announcement.id,
        metadata: JSON.stringify({
          title: announcement.title,
          targetRole: announcement.targetRole,
          priority: announcement.priority,
          notifiedCount: targetUsers.length,
        }),
      },
    });

    return NextResponse.json({ success: true, announcement, notifiedCount: targetUsers.length }, { status: 201 });
  } catch (error: any) {
    console.error('[Announcements API POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
