import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessIncident, sanitizeIncidentForViewer } from '@/lib/incident-auth';
import { IncidentStatus } from '@prisma/client';
import { IncidentPatchSchema, parseJsonBody } from '@/lib/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { student: true, faculty: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, role: true, email: true, avatarUrl: true },
        },
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            departmentName: true,
            batch: true,
            section: true,
          },
        },
        responses: {
          include: {
            author: {
              select: { id: true, name: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        actions: {
          include: {
            actor: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!incident || incident.deletedAt !== null) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Confidentiality and fail-closed department isolation check
    const decision = canAccessIncident(currentUser, incident);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.reason || 'Forbidden' },
        { status: 403 }
      );
    }

    if (decision.logConfidentialRead) {
      await prisma.auditLog.create({
        data: {
          actorId: currentUser.id,
          actorEmail: currentUser.email,
          actorRole: currentUser.role,
          action: 'CONFIDENTIAL_INCIDENT_READ',
          entityType: 'Incident',
          entityId: incident.id,
          metadata: JSON.stringify({ isConfidentialHOD: true }),
        },
      });
    }

    return NextResponse.json({ incident: sanitizeIncidentForViewer(currentUser, incident) });
  } catch (error: any) {
    console.error('[Incident Detail GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { student: true },
    });

    if (!currentUser || !['FACULTY', 'HOD', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing || existing.deletedAt !== null) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const decision = canAccessIncident(currentUser, existing);
    if (!decision.allowed) {
      return NextResponse.json({ error: decision.reason || 'Forbidden' }, { status: 403 });
    }

    const parsed = await parseJsonBody(req, IncidentPatchSchema);
    if (!parsed.success) return parsed.response;
    const { status } = parsed.data;

    const updated = await prisma.incident.update({
      where: { id },
      data: { status: status as IncidentStatus },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'INCIDENT_STATUS_UPDATED',
        entityType: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ newStatus: status }),
      },
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    console.error('[Incident Detail PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'INCIDENT_MOVED_TO_TRASH',
        entityType: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ title: updated.title }),
      },
    });

    return NextResponse.json({ success: true, message: 'Incident moved to trash' });
  } catch (error: any) {
    console.error('[Incident Detail DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
