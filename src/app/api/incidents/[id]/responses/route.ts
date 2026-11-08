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
    const { id: incidentId } = await params;
    const session = await getServerSession(authOptions);

    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        include: { student: true, faculty: true },
      });
    }

    const body = await req.json();
    const { message, authorEmail } = body;

    if (!currentUser && authorEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: authorEmail.toLowerCase().trim() },
        include: { student: true, faculty: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Access authorization
    const isReporter = incident.reporterId === currentUser.id;
    const isSubjectStudent = incident.studentId && currentUser.student?.id === incident.studentId;
    const isHOD = currentUser.role === 'HOD';
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isFacultyStaff = currentUser.role === 'FACULTY';

    if (incident.isConfidentialHOD) {
      if (!isHOD && !isSuperAdmin && !isReporter) {
        return NextResponse.json({ error: 'Forbidden: Confidential case' }, { status: 403 });
      }
    } else {
      if (!isReporter && !isSubjectStudent && !isHOD && !isSuperAdmin && !isFacultyStaff) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Append to immutable response timeline
    const response = await prisma.incidentResponse.create({
      data: {
        incidentId,
        authorId: currentUser.id,
        message: message.trim(),
        createdAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
    });

    // Automatically transition to UNDER_REVIEW if currently in REPORTED
    if (incident.status === 'REPORTED') {
      await prisma.incident.update({
        where: { id: incidentId },
        data: { status: 'UNDER_REVIEW' },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'INCIDENT_RESPONSE_RECORDED',
        entityType: 'IncidentResponse',
        entityId: response.id,
        metadata: JSON.stringify({
          incidentId,
          authorRole: currentUser.role,
        }),
      },
    });

    return NextResponse.json({ success: true, response }, { status: 201 });
  } catch (error: any) {
    console.error('[Incident Response POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
