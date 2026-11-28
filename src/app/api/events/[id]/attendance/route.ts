import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import { EventAttendanceDeleteSchema, parseJsonBody } from '@/lib/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);

    let user = null;
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    if (!user || (!canAccessAdmin(user) && user.role !== 'FACULTY')) {
      return NextResponse.json(
        { error: 'Forbidden: Faculty or Administrator access required' },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        category: true,
        department: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            student: {
              select: {
                id: true,
                rollNumber: true,
                batch: true,
                section: true,
                departmentName: true,
              },
            },
            faculty: {
              select: {
                id: true,
                designation: true,
                departmentName: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { registeredAt: 'asc' }],
    });

    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
    });

    const attendanceMap = new Map<string, (typeof attendances)[0]>();
    attendances.forEach((att) => {
      attendanceMap.set(att.userId, att);
    });

    const attendees = registrations.map((reg) => {
      const att = attendanceMap.get(reg.userId);
      return {
        registrationId: reg.id,
        userId: reg.userId,
        name: reg.user.name,
        email: reg.user.email,
        role: reg.user.role,
        avatarUrl: reg.user.avatarUrl,
        rollNumber: reg.user.student?.rollNumber || null,
        batch: reg.user.student?.batch || null,
        section: reg.user.student?.section || null,
        department: reg.user.student?.departmentName || reg.user.faculty?.departmentName || null,
        registrationStatus: reg.status,
        registeredAt: reg.registeredAt,
        isCheckedIn: Boolean(att),
        checkedInAt: att?.checkedInAt || null,
        checkInMethod: att?.checkInMethod || null,
      };
    });

    const confirmedCount = attendees.filter((a) => a.registrationStatus === 'REGISTERED').length;
    const waitlistedCount = attendees.filter((a) => a.registrationStatus === 'WAITLISTED').length;
    const checkedInCount = attendees.filter((a) => a.isCheckedIn).length;

    return NextResponse.json({
      event,
      stats: {
        capacity: event.capacity,
        confirmedCount,
        waitlistedCount,
        checkedInCount,
        attendanceRate: confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0,
      },
      attendees,
    });
  } catch (error: any) {
    console.error('[Event Attendance GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);

    let user = null;
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    if (!user || (!canAccessAdmin(user) && user.role !== 'FACULTY')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = await parseJsonBody(req, EventAttendanceDeleteSchema);
    if (!parsed.success) return parsed.response;
    const { userId } = parsed.data;

    await prisma.eventAttendance.deleteMany({
      where: { eventId, userId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'EVENT_ATTENDANCE_REVERTED',
        entityType: 'EventAttendance',
        entityId: `${eventId}_${userId}`,
        metadata: JSON.stringify({ eventId, targetUserId: userId }),
      },
    });

    return NextResponse.json({ success: true, message: 'Attendance status reset' });
  } catch (error: any) {
    console.error('[Event Attendance DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
