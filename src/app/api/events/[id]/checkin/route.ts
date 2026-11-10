import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await getServerSession(authOptions);

    let operatorUser = null;
    if (session?.user?.email) {
      operatorUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        include: { faculty: true },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { rollNumber, userId, checkInMethod = 'QR_SCAN', operatorEmail } = body;

    // If operator session is not present, allow authorized operator email in body (e.g. CLI/tests)
    if (!operatorUser && operatorEmail) {
      operatorUser = await prisma.user.findUnique({
        where: { email: operatorEmail.toLowerCase().trim() },
      });
    }

    if (!operatorUser || (!canAccessAdmin(operatorUser) && operatorUser.role !== 'FACULTY')) {
      return NextResponse.json(
        { error: 'Forbidden: Faculty or Organizer credentials required for check-in' },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Resolve attendee user
    let attendeeUser: any = null;
    let resolvedRollNumber: string | null = null;
    if (rollNumber) {
      const student = await prisma.student.findUnique({
        where: { rollNumber: rollNumber.toUpperCase().trim() },
        include: { user: true },
      });
      if (student?.user) {
        attendeeUser = student.user;
        attendeeUser.student = student;
        resolvedRollNumber = student.rollNumber;
      }
    } else if (userId) {
      attendeeUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { student: true },
      });
      if (attendeeUser?.student) {
        resolvedRollNumber = attendeeUser.student.rollNumber;
      }
    }

    if (!attendeeUser) {
      return NextResponse.json(
        { error: `Attendee with ${rollNumber ? `roll number ${rollNumber}` : `ID ${userId}`} not found` },
        { status: 404 }
      );
    }

    // Verify confirmed registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: attendeeUser.id,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        {
          error: 'Attendee is not registered for this event',
          registrationStatus: 'NOT_REGISTERED',
        },
        { status: 400 }
      );
    }

    if (registration.status === 'WAITLISTED') {
      return NextResponse.json(
        {
          error: 'Cannot check in: Attendee is currently on the WAITLIST, not confirmed',
          registrationStatus: 'WAITLISTED',
        },
        { status: 400 }
      );
    }

    if (registration.status === 'CANCELLED') {
      return NextResponse.json(
        {
          error: 'Cannot check in: Registration was previously cancelled',
          registrationStatus: 'CANCELLED',
        },
        { status: 400 }
      );
    }

    // Check if already checked in
    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: attendeeUser.id,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        attendance: existingAttendance,
        message: `${attendeeUser.name} is already checked in at ${existingAttendance.checkedInAt.toISOString()}`,
      });
    }

    // Record check-in
    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId,
        userId: attendeeUser.id,
        checkInMethod: checkInMethod === 'MANUAL' ? 'MANUAL' : 'QR_SCAN',
        checkedInAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: operatorUser.id,
        actorEmail: operatorUser.email,
        actorRole: operatorUser.role,
        action: 'EVENT_ATTENDANCE_CHECKIN',
        entityType: 'EventAttendance',
        entityId: attendance.id,
        metadata: JSON.stringify({
          eventId,
          eventTitle: event.title,
          attendeeId: attendeeUser.id,
          attendeeName: attendeeUser.name,
          checkInMethod: attendance.checkInMethod,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      attendance,
      attendee: {
        id: attendeeUser.id,
        name: attendeeUser.name,
        email: attendeeUser.email,
        rollNumber: resolvedRollNumber || (attendeeUser as any).student?.rollNumber || null,
      },
      message: `Verified and checked in: ${attendeeUser.name}`,
    });
  } catch (error: any) {
    console.error('[Event Checkin POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Check-in failed' }, { status: 500 });
  }
}
