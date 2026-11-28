import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageCategories } from '@/lib/admin-auth';
import {
  CategoryCreateSchema,
  CategoryDeleteSchema,
  CategoryPatchSchema,
  parseJsonBody,
} from '@/lib/schemas';
import { resolveOrCreateCategoryId } from '@/lib/category-batch-helpers';
import { sanitizeText } from '@/lib/sanitize';

function safeRevalidateCategories() {
  try {
    revalidatePath('/achievements');
    revalidatePath('/events');
  } catch {
    // Non-HTTP execution (unit tests)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type')?.toUpperCase();

    const where: any = { isActive: true, deletedAt: null };
    if (type === 'ACHIEVEMENT' || type === 'EVENT') {
      where.type = { in: [type, 'BOTH'] };
    }

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        displayOrder: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('[Categories API GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required to create custom categories' }, { status: 401 });
    }

    const parsed = await parseJsonBody(req, CategoryCreateSchema);
    if (!parsed.success) return parsed.response;

    const categoryId = await resolveOrCreateCategoryId({
      customCategoryName: parsed.data.name,
      type: parsed.data.type,
    });

    if (!categoryId) {
      return NextResponse.json({ error: 'Valid category name is required' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, description: true, type: true, displayOrder: true },
    });

    safeRevalidateCategories();
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('[Categories API POST] Error:', error);
    return NextResponse.json({ error: 'Failed to save custom category' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!actor || actor.status !== 'ACTIVE' || !canManageCategories(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Web Managers and Administrative Officers can modify categories' },
        { status: 403 }
      );
    }

    const parsed = await parseJsonBody(req, CategoryPatchSchema);
    if (!parsed.success) return parsed.response;

    const existing = await prisma.category.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (parsed.data.name) updateData.name = sanitizeText(parsed.data.name).slice(0, 80);
    if (parsed.data.type) updateData.type = parsed.data.type;
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description ? sanitizeText(parsed.data.description) : null;
    }
    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
      updateData.deletedAt = parsed.data.isActive ? null : new Date();
    }

    const updated = await prisma.category.update({
      where: { id: parsed.data.id },
      data: updateData,
      select: { id: true, name: true, description: true, type: true, displayOrder: true, isActive: true },
    });

    safeRevalidateCategories();
    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error('[Categories API PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
      select: { id: true, email: true, role: true, status: true },
    });

    if (!actor || actor.status !== 'ACTIVE' || !canManageCategories(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Web Managers and Administrative Officers can remove categories' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');
    const queryName = searchParams.get('name');
    const queryPermanent = searchParams.get('permanent') === 'true';

    let payload: unknown = { id: queryId, name: queryName, permanent: queryPermanent };
    if (!queryId && !queryName) {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    }

    const parsed = CategoryDeleteSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Category id or name is required' },
        { status: 400 }
      );
    }

    const existing = parsed.data.id
      ? await prisma.category.findUnique({
          where: { id: parsed.data.id },
          include: { _count: { select: { achievements: true, events: true } } },
        })
      : await prisma.category.findFirst({
          where: { name: { equals: parsed.data.name!, mode: 'insensitive' }, deletedAt: null },
          include: { _count: { select: { achievements: true, events: true } } },
        });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const hasReferences = existing._count.achievements > 0 || existing._count.events > 0;
    const canHardDelete = parsed.data.permanent && (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN') && !hasReferences;

    if (canHardDelete) {
      await prisma.category.delete({ where: { id: existing.id } });
    } else {
      await prisma.category.update({
        where: { id: existing.id },
        data: { isActive: false, deletedAt: new Date() },
      });
    }

    await prisma.auditLog
      .create({
        data: {
          action: canHardDelete ? 'CATEGORY_PURGED' : 'CATEGORY_REMOVED',
          entityType: 'Category',
          entityId: existing.id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          metadata: JSON.stringify({
            name: existing.name,
            type: existing.type,
            linkedAchievements: existing._count.achievements,
            linkedEvents: existing._count.events,
          }),
        },
      })
      .catch(() => null);

    safeRevalidateCategories();
    return NextResponse.json({
      success: true,
      removedId: existing.id,
      removedName: existing.name,
      mode: canHardDelete ? 'PERMANENT' : 'DEACTIVATED',
    });
  } catch (error: any) {
    console.error('[Categories API DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 });
  }
}
