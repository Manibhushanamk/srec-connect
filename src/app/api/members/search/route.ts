import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ members: [] });
    }

    const upperQ = q.toUpperCase();
    const lowerQ = q.toLowerCase();

    // Query active users with their student/faculty profiles
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: lowerQ } },
          { student: { rollNumber: { contains: upperQ } } },
          { faculty: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        departmentName: true,
        student: {
          select: {
            rollNumber: true,
            section: true,
            batch: true,
          },
        },
        faculty: {
          select: {
            designation: true,
            roleCategory: true,
          },
        },
      },
      take: 10,
    });

    const members = users.map((u) => ({
      id: u.id,
      name: u.name || 'Anonymous User',
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      rollNumber: u.student?.rollNumber || null,
      designation: u.faculty?.designation || null,
      departmentName: u.departmentName || 'CSE (AI & ML)',
      detail: u.student?.rollNumber
        ? `${u.student.rollNumber} • ${u.student.batch || 'AIML'}`
        : u.faculty?.designation || u.role.replace(/_/g, ' '),
    }));

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('[Members Search API Error]:', error);
    return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
  }
}
