import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12', 10), 1), 50);
    const skip = (page - 1) * limit;

    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');

    const where: any = { deletedAt: null };

    if (status && status !== 'ALL' && status !== 'all') {
      where.status = status;
    }
    if (categoryId && categoryId !== 'ALL' && categoryId !== 'all') {
      where.categoryId = categoryId;
    }
    if (departmentId && departmentId !== 'ALL' && departmentId !== 'all') {
      where.departmentId = departmentId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { speaker: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          department: { select: { id: true, code: true, name: true, shortName: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          _count: {
            select: {
              registrations: { where: { status: 'REGISTERED' } },
              attendances: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        registeredCount: e._count.registrations,
        attendedCount: e._count.attendances,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[Events API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { faculty: true },
    });

    if (!currentUser || (!canAccessAdmin(currentUser) && currentUser.role !== 'FACULTY')) {
      return NextResponse.json(
        { error: 'Forbidden: Only Faculty and Administrators can create events' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      categoryId,
      departmentId,
      startDate,
      endDate,
      venue,
      organizer,
      speaker,
      speakerResourcePerson,
      capacity = 100,
      registrationDeadline,
      whatsappGroupUrl,
      posterUrl,
      academicYear = '2025-2026',
    } = body;

    if (!title?.trim() || !categoryId || !startDate || !endDate || !venue?.trim()) {
      return NextResponse.json(
        { error: 'Title, category, startDate, endDate, and venue are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return NextResponse.json({ error: 'Invalid start or end date' }, { status: 400 });
    }

    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        categoryId,
        departmentId: departmentId || currentUser.departmentId || null,
        startDate: start,
        endDate: end,
        venue: venue.trim(),
        organizer: organizer?.trim() || currentUser.name || 'SREC Faculty Organizer',
        speaker: speaker?.trim() || null,
        speakerResourcePerson: speakerResourcePerson?.trim() || null,
        capacity: Number(capacity) > 0 ? Number(capacity) : 100,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        whatsappGroupUrl: whatsappGroupUrl?.trim() || null,
        posterUrl: posterUrl?.trim() || null,
        academicYear,
        createdById: currentUser.id,
        status: 'UPCOMING',
      },
      include: {
        category: true,
        department: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'EVENT_CREATED',
        entityType: 'Event',
        entityId: newEvent.id,
        metadata: JSON.stringify({
          title: newEvent.title,
          capacity: newEvent.capacity,
          venue: newEvent.venue,
        }),
      },
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    console.error('[Events API POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
