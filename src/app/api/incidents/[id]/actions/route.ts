import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { IncidentOutcome } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params;
    const session = await getServerSession(authOptions);

    let actorUser = null;
    if (session?.user?.email) {
      actorUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    const body = await req.json();
    const { outcome, notes, actorEmail } = body;

    if (!actorUser && actorEmail) {
      actorUser = await prisma.user.findUnique({
        where: { email: actorEmail.toLowerCase().trim() },
      });
    }

    if (!actorUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only Faculty, HOD, and Super Admin can record disciplinary actions
    if (actorUser.role !== 'FACULTY' && actorUser.role !== 'HOD' && actorUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    if (!outcome) {
      return NextResponse.json({ error: 'Outcome is required' }, { status: 400 });
    }

    // Formal action restriction: ONLY HOD and SUPER_ADMIN can issue FORMAL_ACTION
    if (outcome === 'FORMAL_ACTION' && actorUser.role !== 'HOD' && actorUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Final formal disciplinary actions can only be resolved by the HOD or Super Admin' },
        { status: 403 }
      );
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const action = await prisma.incidentAction.create({
      data: {
        incidentId,
        actorId: actorUser.id,
        outcome: outcome as IncidentOutcome,
        notes: notes?.trim() || null,
        createdAt: new Date(),
      },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
    });

    // Update incident status according to action outcome
    const newStatus = outcome === 'HOD_REVIEW' ? 'ESCALATED_TO_HOD' : 'RESOLVED';
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorEmail: actorUser.email,
        actorRole: actorUser.role,
        action: 'DISCIPLINARY_ACTION_RECORDED',
        entityType: 'IncidentAction',
        entityId: action.id,
        metadata: JSON.stringify({
          incidentId,
          outcome,
          resolvedStatus: newStatus,
        }),
      },
    });

    return NextResponse.json({ success: true, action, newStatus });
  } catch (error: any) {
    console.error('[Incident Action POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
