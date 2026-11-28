import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessIncident } from '@/lib/incident-auth';
import { IncidentResponseSchema, parseJsonBody } from '@/lib/schemas';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params;
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { student: true, faculty: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, IncidentResponseSchema);
    if (!parsed.success) return parsed.response;
    const { message } = parsed.data;

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident || incident.deletedAt !== null) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const decision = canAccessIncident(currentUser, incident);
    if (!decision.allowed) {
      return NextResponse.json({ error: decision.reason || 'Forbidden' }, { status: 403 });
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
