import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/rbac';
import { IncidentStatus } from '@prisma/client';

export async function GET(
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

    // Confidentiality and Access Isolation Check:
    // Disciplinary complaints given to a student by faculty/HOD are strictly restricted to HOD, Super Admin, and the issuing faculty.
    const isReporter = incident.reporterId === currentUser.id;
    const isSubjectStudent = incident.studentId && currentUser.student?.id === incident.studentId;
    const isHOD = currentUser.role === 'HOD';
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    if (currentUser.role === 'STUDENT') {
      if (!isReporter && !isSubjectStudent) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to view this case dossier' },
          { status: 403 }
        );
      }
    } else if (currentUser.role === 'FACULTY') {
      if (!isReporter && !isHOD && !isSuperAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: Student disciplinary records and complaints are strictly restricted to HOD and the issuing faculty' },
          { status: 403 }
        );
      }
    } else if (incident.isConfidentialHOD && !isHOD && !isSuperAdmin && !isReporter) {
      return NextResponse.json(
        { error: 'Forbidden: Confidential case restricted to HOD' },
        { status: 403 }
      );
    }

    return NextResponse.json({ incident });
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

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

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
    const session = await getServerSession(authOptions);
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
