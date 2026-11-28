import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import { EventPatchSchema, parseJsonBody } from '@/lib/schemas';
import { resolveOrCreateCategoryId } from '@/lib/category-batch-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUserEmail = session?.user?.email?.toLowerCase().trim();

    const event = await prisma.event.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        department: true,
        createdBy: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
        _count: {
          select: {
            registrations: { where: { status: 'REGISTERED', user: { deletedAt: null, status: 'ACTIVE' } } },
            attendances: { where: { user: { deletedAt: null, status: 'ACTIVE' } } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check user registration & attendance if signed in
    let userRegistration = null;
    let userAttendance = null;
    let isOrganizerOrAdmin = false;

    if (currentUserEmail) {
      const user = await prisma.user.findUnique({
        where: { email: currentUserEmail },
        select: { id: true, role: true, email: true, status: true },
      });

      if (user) {
        if (canAccessAdmin(user) || user.role === 'FACULTY' || event.createdById === user.id) {
          isOrganizerOrAdmin = true;
        }

        userRegistration = await prisma.eventRegistration.findUnique({
          where: {
            eventId_userId: {
              eventId: id,
              userId: user.id,
            },
          },
        });

        userAttendance = await prisma.eventAttendance.findUnique({
          where: {
            eventId_userId: {
              eventId: id,
              userId: user.id,
            },
          },
        });
      }
    }

    const registeredCount = event._count.registrations;
    const isRegistered = userRegistration?.status === 'REGISTERED';
    const isWaitlisted = userRegistration?.status === 'WAITLISTED';

    // Anti-spam rule: WhatsApp group link is ONLY revealed post-registration or to organizers
    const sanitizedWhatsappGroupUrl =
      isRegistered || isOrganizerOrAdmin ? event.whatsappGroupUrl : null;

    return NextResponse.json({
      event: {
        ...event,
        whatsappGroupUrl: sanitizedWhatsappGroupUrl,
        hasWhatsappGroup: Boolean(event.whatsappGroupUrl),
        registeredCount,
        attendedCount: event._count.attendances,
        availableSeats: Math.max(0, event.capacity - registeredCount),
        isFull: registeredCount >= event.capacity,
      },
      userRegistration,
      userAttendance,
      isOrganizerOrAdmin,
    });
  } catch (error: any) {
    console.error('[Event API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!currentUser || (!canAccessAdmin(currentUser) && currentUser.role !== 'FACULTY')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const parsed = await parseJsonBody(req, EventPatchSchema);
    if (!parsed.success) return parsed.response;
    const body = parsed.data;
    const updateData: any = {};

    if (body.customCategoryName || body.categoryId) {
      const resolvedCatId = await resolveOrCreateCategoryId({
        categoryId: body.categoryId,
        customCategoryName: body.customCategoryName,
        type: 'EVENT',
      });
      if (resolvedCatId) updateData.categoryId = resolvedCatId;
    }

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.organizer !== undefined) updateData.organizer = body.organizer;
    if (body.speaker !== undefined) updateData.speaker = body.speaker || null;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.academicYear !== undefined) updateData.academicYear = body.academicYear;
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId || null;
    if (body.posterUrl !== undefined) updateData.posterUrl = body.posterUrl || null;
    if (body.whatsappGroupUrl !== undefined) updateData.whatsappGroupUrl = body.whatsappGroupUrl || null;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.registrationDeadline !== undefined) {
      updateData.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : null;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'EVENT_UPDATED',
        entityType: 'Event',
        entityId: id,
        metadata: JSON.stringify({ changes: Object.keys(updateData) }),
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('[Event API PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!currentUser || !canAccessAdmin(currentUser)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const deleted = await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'EVENT_DELETED',
        entityType: 'Event',
        entityId: id,
        metadata: JSON.stringify({ title: deleted.title }),
      },
    });

    return NextResponse.json({ success: true, message: 'Event cancelled and removed' });
  } catch (error: any) {
    console.error('[Event API DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
