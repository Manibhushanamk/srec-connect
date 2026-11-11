import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ members: [] });
    }

    const upperQ = q.toUpperCase();
    const lowerQ = q.toLowerCase();

    // 1. Query active users with their student/faculty profiles
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
            id: true,
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

    const seenIds = new Set<string>();
    const members: any[] = [];

    for (const u of users) {
      seenIds.add(u.id);
      members.push({
        id: u.id,
        userId: u.id,
        studentId: u.student?.id || null,
        name: u.name || 'Scholar',
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        rollNumber: u.student?.rollNumber || null,
        designation: u.faculty?.designation || null,
        departmentName: u.departmentName || 'CSE (AI & ML)',
        detail: u.student?.rollNumber
          ? `Roll: ${u.student.rollNumber} • Sec ${u.student.section || 'A'} • Batch ${u.student.batch || '2022-2026'}`
          : u.faculty?.designation || u.role.replace(/_/g, ' '),
      });
    }

    // 2. Also search Student directory to guarantee every student with a roll number matches
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { user: null },
              { user: { deletedAt: null, status: 'ACTIVE' } },
            ],
          },
        ],
        OR: [
          { rollNumber: { contains: upperQ } },
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: lowerQ } },
        ],
      },
      include: {
        user: true,
      },
      take: 10,
    });

    for (const s of students) {
      const targetUserId = s.user?.id || s.id;
      if (!seenIds.has(targetUserId)) {
        seenIds.add(targetUserId);
        members.push({
          id: targetUserId,
          userId: s.user?.id || null,
          studentId: s.id,
          name: s.name,
          email: s.email,
          role: 'STUDENT',
          avatarUrl: s.avatarUrl || s.user?.avatarUrl || null,
          rollNumber: s.rollNumber,
          designation: null,
          departmentName: 'CSE (AI & ML)',
          detail: `Roll: ${s.rollNumber} • Sec ${s.section || 'A'} • Batch ${s.batch || '2022-2026'}`,
        });
      }
    }

    return NextResponse.json({ members: members.slice(0, 10) });
  } catch (error: any) {
    console.error('[Members Search API Error]:', error);
    return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
  }
}
