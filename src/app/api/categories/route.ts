import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ categories });
}
