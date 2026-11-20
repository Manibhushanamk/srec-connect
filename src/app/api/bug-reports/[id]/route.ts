import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BugStatus, BugSeverity, Role } from '@prisma/client';

export const runtime = 'nodejs';

/**
 * GET /api/bug-reports/[id]
 * Fetch a single bug report by ID.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    const report = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!report || report.deletedAt) {
      return NextResponse.json({ error: 'Bug report not found.' }, { status: 404 });
    }

    const isStaff =
      currentUser?.role === Role.SUPER_ADMIN ||
      currentUser?.role === Role.WEB_MANAGER ||
      currentUser?.role === Role.HOD;

    // Non-staff can only view their own report
    if (!isStaff && report.reporterId !== currentUser?.id) {
      return NextResponse.json({ error: 'Forbidden. Access denied.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('[Bug Report Detail GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bug report details.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bug-reports/[id]
 * Triage bug report: update status, assign staff, adjust severity, add notes.
 * Restricted to SUPER_ADMIN, WEB_MANAGER, and HOD.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;
    const userRole = currentUser?.role;

    const isStaff =
      userRole === Role.SUPER_ADMIN ||
      userRole === Role.WEB_MANAGER ||
      userRole === Role.HOD;

    if (!session?.user || !isStaff) {
      return NextResponse.json(
        { error: 'Forbidden. Administrative authorization required for bug triage.' },
        { status: 403 }
      );
    }

    const report = await prisma.bugReport.findUnique({ where: { id } });
    if (!report || report.deletedAt) {
      return NextResponse.json({ error: 'Bug report not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { status, severity, assignedToId, internalNotes, resolutionNotes } = body;

    const updateData: any = {};
    const auditEntries: any[] = report.auditTrail ? JSON.parse(report.auditTrail) : [];

    if (status && Object.values(BugStatus).includes(status) && status !== report.status) {
      updateData.status = status;
      auditEntries.push({
        event: 'STATUS_CHANGED',
        from: report.status,
        to: status,
        actor: currentUser.email,
        timestamp: new Date().toISOString(),
      });
    }

    if (severity && Object.values(BugSeverity).includes(severity) && severity !== report.severity) {
      updateData.severity = severity;
      auditEntries.push({
        event: 'SEVERITY_CHANGED',
        from: report.severity,
        to: severity,
        actor: currentUser.email,
        timestamp: new Date().toISOString(),
      });
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
      auditEntries.push({
        event: 'ASSIGNMENT_UPDATED',
        assignedToId: assignedToId || 'UNASSIGNED',
        actor: currentUser.email,
        timestamp: new Date().toISOString(),
      });
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes?.trim() || null;
    }

    if (resolutionNotes !== undefined) {
      updateData.resolutionNotes = resolutionNotes?.trim() || null;
      if (resolutionNotes) {
        auditEntries.push({
          event: 'RESOLUTION_NOTE_ADDED',
          actor: currentUser.email,
          timestamp: new Date().toISOString(),
        });
      }
    }

    updateData.auditTrail = JSON.stringify(auditEntries);

    const updated = await prisma.bugReport.update({
      where: { id },
      data: updateData,
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Record in system audit log
    await prisma.auditLog.create({
      data: {
        action: 'BUG_REPORT_TRIAGED',
        entityType: 'BUG_REPORT',
        entityId: updated.id,
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        actorRole: String(currentUser.role),
        metadata: JSON.stringify({
          updatedFields: Object.keys(updateData),
          newStatus: updated.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bug report successfully triaged and updated.',
      report: updated,
    });
  } catch (error: any) {
    console.error('[Bug Report PATCH Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update bug report.' },
      { status: 500 }
    );
  }
}
