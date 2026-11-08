import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        fullName: true,
        description: true,
      },
    });

    return NextResponse.json({ departments });
  } catch (error: any) {
    console.error('[API Departments GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments', departments: [] }, { status: 500 });
  }
}
