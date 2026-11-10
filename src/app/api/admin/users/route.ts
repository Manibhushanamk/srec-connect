import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { canAccessAdmin, hasPermission } from '@/lib/rbac';
import { Role, UserStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (role && role !== 'ALL') {
      where.role = role as Role;
    }
    if (status && status !== 'ALL') {
      where.status = status as UserStatus;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          student: { select: { id: true, rollNumber: true, batch: true, section: true } },
          faculty: { select: { id: true, designation: true, specialization: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[API Users GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role, departmentId, rollNumber, designation, batch, section } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, Name, and Role are mandatory' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Ensure default department if missing
    let targetDeptId = departmentId;
    if (!targetDeptId) {
      const aimlDept = await prisma.department.findFirst({
        where: { OR: [{ code: 'AIML' }, { code: 'CSE(AI&ML)' }] },
      });
      if (aimlDept) targetDeptId = aimlDept.id;
    }

    // Roll number uniqueness check for student
    let studentRecord = null;
    if (role === 'STUDENT') {
      const emailRollCandidate = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0].toUpperCase() : '';
      const cleanedRoll = (rollNumber || emailRollCandidate).trim().toUpperCase();

      if (!cleanedRoll) {
        return NextResponse.json({ error: 'Roll number is required for student accounts' }, { status: 400 });
      }

      const existingRoll = await prisma.student.findUnique({
        where: { rollNumber: cleanedRoll },
      });
      if (existingRoll) {
        return NextResponse.json({ error: `Roll number ${cleanedRoll} is already registered` }, { status: 409 });
      }

      studentRecord = await prisma.student.create({
        data: {
          rollNumber: cleanedRoll,
          name,
          email: normalizedEmail,
          departmentId: targetDeptId || null,
          batch: batch || '2022-2026',
          section: section || 'A',
        },
      });
    }

    // Faculty record creation
    let facultyRecord = null;
    if (role === 'FACULTY' || role === 'HOD') {
      facultyRecord = await prisma.faculty.create({
        data: {
          name,
          email: normalizedEmail,
          designation: designation || (role === 'HOD' ? 'Professor & HOD' : 'Assistant Professor'),
          roleCategory: role === 'HOD' ? 'HOD' : 'ASSISTANT_PROFESSOR',
          departmentId: targetDeptId || null,
        },
      });
    }

    // Create user in v3_production
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        role: role as Role,
        status: 'ACTIVE',
        departmentId: targetDeptId || null,
        studentId: studentRecord?.id || null,
        facultyId: facultyRecord?.id || null,
      },
      include: {
        department: true,
        student: true,
        faculty: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error('[API Users POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canAccessAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, status, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status as UserStatus;
    if (role) data.role = role as Role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        department: true,
        student: true,
        faculty: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('[API Users PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}
