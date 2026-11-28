import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageCategories } from '@/lib/admin-auth';
import { BatchCreateSchema, parseJsonBody } from '@/lib/schemas';
import { ensureBatchesRegistered, getAllAvailableBatches } from '@/lib/category-batch-helpers';
import { parseBatchYearRange } from '@/lib/studentHelper';

export async function GET() {
  try {
    const batches = await getAllAvailableBatches();
    return NextResponse.json({ batches });
  } catch (error: any) {
    console.error('[Batches API GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load academic batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, BatchCreateSchema);
    if (!parsed.success) return parsed.response;

    const range = parseBatchYearRange(parsed.data.name);
    await ensureBatchesRegistered([range.name]);
    const batches = await getAllAvailableBatches();

    return NextResponse.json({ success: true, batch: range, batches }, { status: 201 });
  } catch (error: any) {
    console.error('[Batches API POST] Error:', error);
    return NextResponse.json({ error: 'Failed to register custom batch' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== 'ACTIVE' || !canManageCategories(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Web Managers and Admins can remove custom batches' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name')?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Batch name is required' }, { status: 400 });
    }

    const existing = await prisma.batch.findUnique({ where: { name } });
    if (!existing) {
      return NextResponse.json({ error: 'Batch not found in custom registry' }, { status: 404 });
    }

    await prisma.batch.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    const batches = await getAllAvailableBatches();
    return NextResponse.json({ success: true, removedName: name, batches });
  } catch (error: any) {
    console.error('[Batches API DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to remove custom batch' }, { status: 500 });
  }
}
