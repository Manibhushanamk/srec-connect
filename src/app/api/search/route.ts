import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        students: [],
        faculty: [],
        events: [],
        posts: [],
      });
    }

    const [students, faculty, events, posts] = await Promise.all([
      // 1. Search Students
      prisma.student.findMany({
        where: {
          isActive: true,
          OR: [
            { rollNumber: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { departmentName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          rollNumber: true,
          name: true,
          departmentName: true,
          batch: true,
          section: true,
          avatarUrl: true,
        },
        take: 5,
      }),

      // 2. Search Faculty
      prisma.faculty.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { designation: { contains: query, mode: 'insensitive' } },
            { departmentName: { contains: query, mode: 'insensitive' } },
            { specialization: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          designation: true,
          departmentName: true,
          avatarUrl: true,
        },
        take: 5,
      }),

      // 3. Search Events
      prisma.event.findMany({
        where: {
          deletedAt: null,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { venue: { contains: query, mode: 'insensitive' } },
            { speaker: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          venue: true,
          status: true,
        },
        take: 5,
      }),

      // 4. Search Posts
      prisma.post.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      query,
      results: {
        students: students.map((s) => ({
          id: s.id,
          title: `${s.name} (${s.rollNumber})`,
          subtitle: `${s.departmentName || 'Engineering'} | Batch ${s.batch || ''}`,
          url: `/students/${s.rollNumber}`,
          type: 'STUDENT',
        })),
        faculty: faculty.map((f) => ({
          id: f.id,
          title: f.name,
          subtitle: `${f.designation} - ${f.departmentName || 'Department'}`,
          url: `/faculty/${f.id}`,
          type: 'FACULTY',
        })),
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          subtitle: `${e.venue} | ${e.status}`,
          url: `/events/${e.id}`,
          type: 'EVENT',
        })),
        posts: posts.map((p) => ({
          id: p.id,
          title: p.content.slice(0, 60),
          subtitle: `By ${p.author.name} (${p.author.role})`,
          url: `/#post-${p.id}`,
          type: 'POST',
        })),
      },
    });
  } catch (error: any) {
    console.error('[Search API GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
