import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { canAccessAdmin, isSuperAdmin } from '@/lib/rbac';
import { DepartmentCreateSchema, parseJsonBody } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const actorEmail = session?.user?.email?.toLowerCase().trim();
    let actor = null;
    if (actorEmail) {
      actor = await prisma.user.findUnique({
        where: { email: actorEmail },
        select: { id: true, role: true, departmentId: true },
      });
    }

    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get('all') === 'true';

    // Non-super-admins only see active departments
    const where: any = {};
    if (!includeAll || !actor || !isSuperAdmin(actor.role)) {
      where.isActive = true;
    }

    const departments = await prisma.department.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      include: {
        _count: {
          select: {
            students: true,
            faculty: true,
            achievements: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json({
      departments,
      currentActor: {
        isSuperAdmin: actor ? isSuperAdmin(actor.role) : false,
        role: actor?.role || 'ANONYMOUS',
        departmentId: actor?.departmentId || null,
      },
    });
  } catch (error: any) {
    console.error('[API Departments GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments', departments: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!actor || !isSuperAdmin(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Super Administrator authority required to create academic departments.' },
        { status: 403 }
      );
    }

    const parsed = await parseJsonBody(req, DepartmentCreateSchema);
    if (!parsed.success) return parsed.response;
    const {
      code,
      name,
      fullName,
      shortName,
      description,
      icon,
      hodName,
      hodEmail,
      hodPhone,
      vision,
      mission,
      intake,
      established,
      displayOrder,
    } = parsed.data;

    const normalizedCode = code.trim().toUpperCase();

    // Check code collision
    const existing = await prisma.department.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A department with code "${normalizedCode}" already exists (${existing.name}).` },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        code: normalizedCode,
        name: name.trim(),
        fullName: (fullName || `Department of ${name}`).trim(),
        shortName: shortName?.trim() || normalizedCode,
        description: description?.trim() || null,
        icon: icon?.trim() || 'BookOpen',
        hodName: hodName?.trim() || null,
        hodEmail: hodEmail?.toLowerCase().trim() || null,
        hodPhone: hodPhone?.trim() || null,
        vision: vision?.trim() || null,
        mission: mission?.trim() || null,
        intake: intake ? parseInt(String(intake), 10) : 60,
        established: established ? parseInt(String(established), 10) : new Date().getFullYear(),
        displayOrder: displayOrder ? parseInt(String(displayOrder), 10) : 0,
        isActive: true,
      },
    });

    // Record immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'DEPARTMENT_CREATED',
        entityType: 'Department',
        entityId: department.id,
        metadata: JSON.stringify({
          code: department.code,
          name: department.name,
          intake: department.intake,
          established: department.established,
        }),
      },
    });

    try {
      revalidatePath('/admin/departments');
      revalidatePath('/admin/users');
      revalidatePath('/admin/bulk-upload');
      revalidatePath('/students');
      revalidatePath('/faculty');
      revalidatePath('/');
    } catch (e) {
      console.warn('[API Departments POST] revalidatePath warning:', e);
    }

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error: any) {
    console.error('[API Departments POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create department' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!actor || !canAccessAdmin(actor as any)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      name,
      fullName,
      shortName,
      description,
      icon,
      hodName,
      hodEmail,
      hodPhone,
      vision,
      mission,
      intake,
      established,
      displayOrder,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const targetDept = await prisma.department.findUnique({
      where: { id },
    });

    if (!targetDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Role authority check: HOD can only update their own department's info
    if (!isSuperAdmin(actor.role)) {
      if (actor.role !== 'HOD' || actor.departmentId !== id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update information for your own assigned department.' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (shortName !== undefined) updateData.shortName = shortName.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon?.trim() || 'BookOpen';
    if (hodName !== undefined) updateData.hodName = hodName?.trim() || null;
    if (hodEmail !== undefined) updateData.hodEmail = hodEmail?.toLowerCase().trim() || null;
    if (hodPhone !== undefined) updateData.hodPhone = hodPhone?.trim() || null;
    if (vision !== undefined) updateData.vision = vision?.trim() || null;
    if (mission !== undefined) updateData.mission = mission?.trim() || null;
    if (intake !== undefined) updateData.intake = parseInt(String(intake), 10);
    if (established !== undefined) updateData.established = parseInt(String(established), 10);
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(String(displayOrder), 10);

    // Only Super Admin can change active status
    if (isSuperAdmin(actor.role) && isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      if (!isActive) {
        updateData.deletedAt = new Date();
      } else {
        updateData.deletedAt = null;
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: updateData,
    });

    // Record immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'DEPARTMENT_UPDATED',
        entityType: 'Department',
        entityId: id,
        metadata: JSON.stringify({
          code: targetDept.code,
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    try {
      revalidatePath('/admin/departments');
      revalidatePath('/admin/users');
      revalidatePath('/admin/bulk-upload');
      revalidatePath('/students');
      revalidatePath('/faculty');
      revalidatePath('/');
    } catch (e) {
      console.warn('[API Departments PATCH] revalidatePath warning:', e);
    }

    return NextResponse.json({ success: true, department: updatedDepartment });
  } catch (error: any) {
    console.error('[API Departments PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!actor || !isSuperAdmin(actor.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Super Administrator authority required to remove academic departments.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            faculty: true,
            achievements: true,
            users: true,
          },
        },
      },
    });

    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const hasLinkedRecords =
      dept._count.students > 0 ||
      dept._count.faculty > 0 ||
      dept._count.achievements > 0 ||
      dept._count.users > 0;

    if (permanent && !hasLinkedRecords) {
      // Safe hard delete only when zero records exist
      await prisma.department.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'DEPARTMENT_PERMANENTLY_DELETED',
          entityType: 'Department',
          entityId: id,
          metadata: JSON.stringify({ code: dept.code, name: dept.name }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Department ${dept.code} (${dept.name}) permanently deleted.`,
      });
    }

    // Default: Safe soft-deactivation to preserve historical records, transcripts & portfolios
    const deactivatedDept = await prisma.department.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'DEPARTMENT_DEACTIVATED',
        entityType: 'Department',
        entityId: id,
        metadata: JSON.stringify({
          code: dept.code,
          name: dept.name,
          preservedStudents: dept._count.students,
          preservedFaculty: dept._count.faculty,
          preservedAchievements: dept._count.achievements,
        }),
      },
    });

    try {
      revalidatePath('/admin/departments');
      revalidatePath('/admin/users');
      revalidatePath('/admin/bulk-upload');
      revalidatePath('/students');
      revalidatePath('/faculty');
      revalidatePath('/');
    } catch (e) {
      console.warn('[API Departments DELETE] revalidatePath warning:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Department ${dept.code} deactivated. Historical portfolios and records preserved.`,
      department: deactivatedDept,
    });
  } catch (error: any) {
    console.error('[API Departments DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove department' }, { status: 500 });
  }
}
