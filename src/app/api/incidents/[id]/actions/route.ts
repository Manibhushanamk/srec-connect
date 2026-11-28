import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canAccessIncident } from '@/lib/incident-auth';
import { IncidentOutcome } from '@prisma/client';
import { IncidentActionSchema, parseJsonBody } from '@/lib/schemas';

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

    const actorUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { student: true },
    });

    if (!actorUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, IncidentActionSchema);
    if (!parsed.success) return parsed.response;
    const { outcome, notes } = parsed.data;

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

    if (!incident || incident.deletedAt !== null) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const decision = canAccessIncident(actorUser, incident);
    if (!decision.allowed) {
      return NextResponse.json({ error: decision.reason || 'Forbidden' }, { status: 403 });
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
